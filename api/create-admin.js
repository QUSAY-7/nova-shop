import { createClient } from "@supabase/supabase-js";

function generateTempPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase Service Role Key غير مضبوط في Vercel" });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { email, role } = req.body || {};

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanRole = role === "admin" ? "admin" : "moderator";

    if (!cleanEmail) {
      return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
    }

    const tempPassword = generateTempPassword(10);

    // 1. إنشاء المستخدم في Supabase Auth مباشرة
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const userId = authUser.user.id;

    // 2. تسجيل البروفايل وحالة إجبار تغيير كلمة المرور
    await supabaseAdmin.from("admin_profiles").upsert({
      user_id: userId,
      email: cleanEmail,
      role: cleanRole,
      must_change_password: true,
      temp_password_created_at: new Date().toISOString(),
    });

    // 3. مزامنة جدول admin_users
    await supabaseAdmin.from("admin_users").upsert({
      email: cleanEmail,
      role: cleanRole,
    });

    return res.status(200).json({
      success: true,
      email: cleanEmail,
      role: cleanRole,
      tempPassword,
      userId,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}