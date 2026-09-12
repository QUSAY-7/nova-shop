// api/create-order.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Supabase URL or service‑role key missing");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Delivery fees map – keep in sync with src/libyaDeliveryData.js
const deliveryFees = {
  "طرابلس": 5,
  "بنغازي": 7,
  // Add other cities as needed
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const {
    items,
    customer_name,
    customer_phone,
    customer_address,
    payment_method,
    delivery_city,
    delivery_area,
  } = req.body;

  // Basic validation
  if (!items?.length || !customer_name || !customer_phone || !delivery_city) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Verify prices & stock, compute total
  let total = 0;
  for (const item of items) {
    // Fetch product (or variant) to get authoritative price & stock
    let price = 0;
    let stock = 0;

    if (item.variant_id) {
      const { data: variant, error: varErr } = await supabase
        .from("product_variants")
        .select("price, quantity")
        .eq("id", item.variant_id)
        .single();
      if (varErr) {
        return res.status(400).json({ error: `Variant ${item.variant_id} not found` });
      }
      price = variant.price;
      stock = variant.quantity;
    } else {
      const { data: product, error: prodErr } = await supabase
        .from("products")
        .select("price, stock")
        .eq("id", item.product_id)
        .single();
      if (prodErr) {
        return res.status(400).json({ error: `Product ${item.product_id} not found` });
      }
      price = product.price;
      stock = product.stock;
    }

    if (stock < item.qty) {
      return res.status(400).json({ error: `Insufficient stock for ${item.title}` });
    }
    total += price * item.qty;
  }

  // Add delivery fee
  const deliveryFee = deliveryFees[delivery_city] ?? 0;
  total += deliveryFee;

  const orderRecord = {
    items,
    total_price: total,
    payment_method,
    customer_name,
    customer_phone,
    customer_address,
    delivery_city,
    delivery_area: delivery_area || delivery_city,
    shipping_cost: deliveryFee,
  };

  const { data: inserted, error: insertErr } = await supabase
    .from("orders")
    .insert([orderRecord])
    .select()
    .single();

  if (insertErr) {
    console.error("Order insert error", insertErr);
    return res.status(500).json({ error: insertErr.message });
  }

  // Fire‑and‑forget stock deduction – do not block order response
  (async () => {
    for (const item of items) {
      if (item.variant_id) {
        const { data: variant } = await supabase
          .from("product_variants")
          .select("quantity")
          .eq("id", item.variant_id)
          .single();
        const newQty = Math.max(0, variant.quantity - item.qty);
        await supabase
          .from("product_variants")
          .update({ quantity: newQty })
          .eq("id", item.variant_id);
      } else {
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.product_id)
          .single();
        const newStock = Math.max(0, product.stock - item.qty);
        await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", item.product_id);
      }
    }
  })();

  // CORS for Vercel Edge
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  return res.status(200).json({ order: inserted, verified_total: total });
}
