// api/ezone-pay.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const { payload } = req.body || {};

    if (!payload) {
      return res.status(400).json({ success: false, error: "Missing payment payload" });
    }

    // المفتاح يُقرأ من السيرفر مباشرة (Vercel Environment Variables)
    const apiKey = process.env.EZONE_PAY_API_KEY || "";
    const baseUrl = (process.env.EZONE_PAY_BASE_URL || "https://api.ezonepay.ly").replace(/\/$/, "");

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "Server misconfiguration: missing EZONE_PAY_API_KEY",
      });
    }

    const ezoneRes = await fetch(`${baseUrl}/payment-link/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await ezoneRes.json().catch(() => ({}));

    return res.status(ezoneRes.ok ? 200 : 502).json({
      success: ezoneRes.ok,
      data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}