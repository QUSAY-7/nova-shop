export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const { payload, apiKey: bodyApiKey, apiBaseUrl: bodyBaseUrl } = req.body || {};

    const apiKey = bodyApiKey || process.env.EZONE_PAY_API_KEY;
    const baseUrl = (bodyBaseUrl || process.env.EZONE_PAY_BASE_URL || "https://test.ezonepay.ly").replace(/\/+$/, "");

    if (!apiKey) {
      return res.status(500).json({ success: false, error: "API key not configured" });
    }
    if (!payload) {
      return res.status(400).json({ success: false, error: "Missing payload" });
    }

    const response = await fetch(`${baseUrl}/payment-link/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch { return res.status(502).json({ success: false, error: "Invalid response", raw: text.substring(0, 500) }); }

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: data?.message || "Ezone Pay API error", details: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
}