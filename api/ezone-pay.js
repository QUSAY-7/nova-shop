export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const { payload, apiKey: bodyApiKey, apiBaseUrl: bodyBaseUrl } = req.body || {};

    const apiKey = (bodyApiKey || process.env.EZONE_PAY_API_KEY || "").trim();
    const baseUrl = (bodyBaseUrl || process.env.EZONE_PAY_BASE_URL || "https://test.ezonepay.ly").trim().replace(/\/+$/, "");

    if (!apiKey) {
      return res.status(500).json({ success: false, error: "مفتاح API غير مضبوط" });
    }
    if (!payload) {
      return res.status(400).json({ success: false, error: "Missing payload" });
    }

    const resp = await fetch(`${baseUrl}/payment-link/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-API-Key": apiKey,
        "User-Agent": "NovaShop/1.0",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await resp.text();
    let data;
    try { data = JSON.parse(responseText); }
    catch { data = { raw: responseText }; }

    if (resp.ok && (data.Link || data.link)) {
      return res.status(200).json({ success: true, data: { Link: data.Link || data.link, Id: data.Id || data.id } });
    } else {
      const errMsg = data.message || data.error || (typeof data === "string" ? data : "تعذر إنشاء رابط الدفع من بوابة إيزون باي");
      return res.status(resp.status || 400).json({ success: false, error: errMsg, details: data });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}