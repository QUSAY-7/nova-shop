// api/create-order.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ugeekzmtavxcfrhtfrjq.supabase.co";

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey || "");

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const {
      items,
      customer_name,
      customer_phone,
      customer_address,
      payment_method,
      delivery_city,
      delivery_area,
      shipping_cost,
    } = body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "السلة فارغة، يرجى إضافة منتجات" });
    }
    if (!customer_name || !customer_phone || !delivery_city) {
      return res.status(400).json({ error: "يرجى إكمال جميع بيانات الطلب (الاسم، الهاتف، المدينة)" });
    }

    // Verify prices & stock
    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      let authoritativePrice = 0;
      let stock = 999;

      if (item.variant_id) {
        const { data: variant } = await supabase
          .from("product_variants")
          .select("price, quantity")
          .eq("id", item.variant_id)
          .single();

        if (variant) {
          authoritativePrice = Number(variant.price || 0);
          stock = Number(variant.quantity ?? 999);
        }
      } else if (item.product_id) {
        const { data: product } = await supabase
          .from("products")
          .select("price, sale_price, stock")
          .eq("id", item.product_id)
          .single();

        if (product) {
          authoritativePrice = Number(product.sale_price || product.price || 0);
          stock = Number(product.stock ?? 999);
        }
      }

      // Fallback
      if (!authoritativePrice && item.price) {
        authoritativePrice = Number(item.price);
      }

      const qty = Number(item.qty || 1);

      if (stock < qty) {
        return res.status(400).json({
          error: `الكمية المطلوبة من (${item.title || "المنتج"}) غير متوفرة في المخزون (المتوفر: ${stock})`,
        });
      }

      subtotal += authoritativePrice * qty;

      verifiedItems.push({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        title: item.title,
        size: item.size || null,
        color: item.color || null,
        qty,
        price: authoritativePrice,
      });
    }

    const deliveryFee = Number(shipping_cost ?? 10);
    const total = subtotal + deliveryFee;

    const baseOrderRecord = {
      items: verifiedItems,
      total_price: total,
      payment_method:
        payment_method === "cash"
          ? "كاش"
          : payment_method === "bank"
          ? "تحويل بنكي"
          : payment_method === "ezone"
          ? "Ezone Pay (دفع إلكتروني)"
          : payment_method || "كاش",
      customer_name: String(customer_name).trim(),
      customer_phone: String(customer_phone).trim(),
      customer_address: customer_address || "",
    };

    const fullOrderRecord = {
      ...baseOrderRecord,
      subtotal,
      shipping_cost: deliveryFee,
      delivery_city,
      delivery_area: delivery_area || delivery_city,
    };

    let insertedOrder = null;
    let insertErr = null;

    const resFull = await supabase.from("orders").insert([fullOrderRecord]).select().single();
    if (!resFull.error && resFull.data) {
      insertedOrder = resFull.data;
    } else {
      insertErr = resFull.error;
      const resBase = await supabase.from("orders").insert([baseOrderRecord]).select().single();
      if (!resBase.error && resBase.data) {
        insertedOrder = resBase.data;
        insertErr = null;
      }
    }

    if (!insertedOrder) {
      console.error("Order insertion failed:", insertErr);
      return res.status(500).json({ error: insertErr?.message || "تعذر حفظ الطلب في قاعدة البيانات" });
    }

    // Fire-and-forget inventory deduction
    (async () => {
      try {
        for (const item of verifiedItems) {
          if (item.variant_id) {
            const { data: v } = await supabase
              .from("product_variants")
              .select("quantity")
              .eq("id", item.variant_id)
              .single();
            if (v && typeof v.quantity === "number") {
              await supabase
                .from("product_variants")
                .update({ quantity: Math.max(0, v.quantity - item.qty) })
                .eq("id", item.variant_id);
            }
          } else if (item.product_id) {
            const { data: p } = await supabase
              .from("products")
              .select("stock")
              .eq("id", item.product_id)
              .single();
            if (p && typeof p.stock === "number") {
              await supabase
                .from("products")
                .update({ stock: Math.max(0, p.stock - item.qty) })
                .eq("id", item.product_id);
            }
          }
        }
      } catch (stockErr) {
        console.warn("Background stock deduction error:", stockErr);
      }
    })();

    return res.status(200).json({
      order: insertedOrder,
      verified_total: total,
    });
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message || "حدث خطأ غير متوقع في الخادم" });
  }
}