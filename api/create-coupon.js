// api/create-coupon.js — يستخدم service role key لتجاوز RLS
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
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // GET — جلب قائمة الكوبونات
  if (req.method === "GET") {
    const store_id = req.query?.store_id;
    if (!store_id) return res.status(400).json({ error: "store_id required" });
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("store_id", store_id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ coupons: data || [] });
  }

  // POST — إنشاء كوبون جديد
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { store_id, code, percent, max_uses, expires_at, created_for_phone } = body;

    if (!code || !percent || !store_id) {
      return res.status(400).json({ error: "الحقول المطلوبة: store_id, code, percent" });
    }

    // التحقق من عدم وجود كود مكرر
    const { data: existing } = await supabase
      .from("coupons")
      .select("id")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: "هذا الكود موجود مسبقاً، جرب كوداً آخر" });
    }

    const { data, error } = await supabase
      .from("coupons")
      .insert([{
        store_id,
        code: code.trim().toUpperCase(),
        percent: Number(percent),
        max_uses: Number(max_uses) || 1,
        used_count: 0,
        is_active: true,
        created_for_phone: created_for_phone || null,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ coupon: data });
  } catch (err) {
    return res.status(500).json({ error: err.message || "خطأ غير متوقع" });
  }
}
