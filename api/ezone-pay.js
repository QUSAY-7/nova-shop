export default async function handler(req, res) {
  // تفعيل CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const apiKey = process.env.EZONE_PAY_API_KEY;
    const baseUrl = (process.env.EZONE_PAY_BASE_URL || "https://api.ezonepay.ly").replace(/\/+$/, "");

    if (!apiKey) {
      console.error("EZONE_PAY_API_KEY is not set");
      return res.status(500).json({ success: false, error: "API key not configured" });
    }

    const { payload } = req.body || {};

    if (!payload) {
      return res.status(400).json({ success: false, error: "Missing payload" });
    }

    console.log("Ezone Pay request:", JSON.stringify(payload));

    const response = await fetch(`${baseUrl}/payment-link/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log("Ezone Pay API response:", response.status, text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        success: false,
        error: "Invalid response from Ezone Pay",
        raw: text.substring(0, 500),
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data?.message || data?.error || "Ezone Pay API error",
        details: data,
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Ezone Pay handler error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}