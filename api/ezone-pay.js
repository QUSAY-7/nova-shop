// api/ezone-pay.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const { payload, apiKey, apiBaseUrl } = req.body || {};

    if (!payload || !apiKey) {
      return res.status(400).json({ success: false, error: "Missing payload or apiKey" });
    }

    const baseUrl = (apiBaseUrl || "https://api.ezonepay.ly").replace(/\/$/, "");

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
    return res.status(ezoneRes.ok ? 200 : 502).json({ success: ezoneRes.ok, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}