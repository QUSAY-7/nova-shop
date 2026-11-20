// api/track-cart.js — حفظ السلال المهجورة (يستخدم service role لتجاوز RLS)
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://ugeekzmtavxcfrhtfrjq.supabase.co";

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey || "");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { store_id, customer_name, customer_phone, customer_city, cart_items, cart_total } = body;

    if (!customer_phone || !store_id) {
      return res.status(400).json({ ok: false });
    }

    // تحقق إن كان هناك سجل موجود لنفس الهاتف في آخر 24 ساعة — نحدّثه بدل إضافة مكرر
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("abandoned_carts")
      .select("id")
      .eq("store_id", store_id)
      .eq("customer_phone", customer_phone)
      .eq("recovered", false)
      .gte("created_at", since)
      .maybeSingle();

    if (existing) {
      // تحديث السجل الموجود
      await supabase
        .from("abandoned_carts")
        .update({
          customer_name: customer_name || null,
          customer_city: customer_city || null,
          cart_items: cart_items || [],
          cart_total: cart_total || 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // إدراج سجل جديد
      await supabase.from("abandoned_carts").insert([{
        store_id,
        customer_name: customer_name || null,
        customer_phone,
        customer_city: customer_city || null,
        cart_items: cart_items || [],
        cart_total: cart_total || 0,
        recovered: false,
      }]);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("track-cart error:", err);
    return res.status(200).json({ ok: false }); // دائماً 200 لأنه fire-and-forget
  }
}
