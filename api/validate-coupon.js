// api/validate-coupon.js
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
    const { code, customer_phone, device_fingerprint, store_id } = body;

    if (!code) return res.status(400).json({ valid: false, message: "يرجى إدخال كود الخصم" });

    // جلب الكوبون من قاعدة البيانات
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .eq("store_id", store_id)
      .maybeSingle();

    if (error) {
      console.error("Coupon fetch error:", error);
      return res.status(500).json({ valid: false, message: "خطأ في التحقق من الكوبون" });
    }

    if (!coupon) {
      return res.status(200).json({ valid: false, message: "كود الخصم غير موجود أو غير صالح" });
    }

    if (!coupon.is_active) {
      return res.status(200).json({ valid: false, message: "هذا الكود غير مفعّل حالياً" });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(200).json({ valid: false, message: "انتهت صلاحية كود الخصم هذا" });
    }

    if (coupon.used_count >= coupon.max_uses) {
      return res.status(200).json({ valid: false, message: "تم استخدام هذا الكود بالحد الأقصى المسموح" });
    }

    // التحقق أن نفس الهاتف أو الجهاز لم يستخدمه من قبل
    const orFilters = [];
    if (customer_phone) orFilters.push(`customer_phone.eq.${customer_phone}`);
    if (device_fingerprint) orFilters.push(`device_fingerprint.eq.${device_fingerprint}`);

    if (orFilters.length > 0) {
      const { data: existingUse } = await supabase
        .from("coupon_uses")
        .select("id")
        .eq("coupon_id", coupon.id)
        .or(orFilters.join(","))
        .maybeSingle();

      if (existingUse) {
        return res.status(200).json({ valid: false, message: "لقد استخدمت هذا الكود من قبل، يُمنع الاستخدام مرتين" });
      }
    }

    return res.status(200).json({
      valid: true,
      percent: coupon.percent,
      coupon_id: coupon.id,
    });

  } catch (err) {
    console.error("validate-coupon error:", err);
    return res.status(500).json({ valid: false, message: err.message || "خطأ غير متوقع" });
  }
}
