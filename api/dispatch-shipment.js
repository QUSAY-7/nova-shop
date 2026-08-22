// api/dispatch-shipment.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const { order } = req.body || {};

    if (!order) {
      return res.status(400).json({ success: false, error: "Missing order data" });
    }

    // القيم الحساسة تُقرأ من متغيرات البيئة في Vercel، وليست مكتوبة داخل الكود
    const apiBaseUrl = (process.env.DARB_ASSABIL_BASE_URL || "https://v2.sabil.ly").replace(/\/$/, "");
    const rawKey = (process.env.DARB_ASSABIL_API_KEY || "").trim();
    const accountId = (process.env.DARB_ASSABIL_ACCOUNT_ID || "").trim();

    if (!rawKey || !accountId) {
      return res.status(500).json({
        success: false,
        error: "Server misconfiguration: missing DARB_ASSABIL_API_KEY or DARB_ASSABIL_ACCOUNT_ID environment variables",
      });
    }

    const authVal = rawKey.startsWith("Bearer ") || rawKey.startsWith("apikey ")
      ? rawKey
      : `apikey ${rawKey}`;

    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": authVal,
      "X-API-VERSION": "1.0.0",
      "X-ACCOUNT-ID": accountId,
    };

    // تحقق من وجود رقم هاتف الزبون فعليًا - لا نستخدم رقم افتراضي شخصي أبدًا
    if (!order.customer_phone) {
      return res.status(400).json({ success: false, error: "Missing customer phone number" });
    }

    // تنسيق الهاتف الدولي
    let phone = String(order.customer_phone).replace(/[^0-9+]/g, "");
    if (phone.startsWith("0")) phone = "+218" + phone.slice(1);
    else if (!phone.startsWith("+")) phone = "+218" + phone;

    // تحقق من صحة كل منتج قبل الإرسال - لا نستخدم سعر افتراضي وهمي أبدًا
    const items = order.items || [];
    if (items.length === 0) {
      return res.status(400).json({ success: false, error: "Order has no items" });
    }

    const products = [];
    for (const it of items) {
      const price = Number(it.price ?? it.unitPrice);
      if (!it.title || !Number.isFinite(price) || price <= 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid product data: title="${it.title}", price="${it.price ?? it.unitPrice}"`,
        });
      }
      products.push({
        title: it.title,
        quantity: it.qty || it.quantity || 1,
        amount: price,
        currency: "lyd",
        isChargeable: true,
      });
    }

    // 1. تسجيل جهة الاتصال - نفشل بوضوح لو ما نجح، لا نكمل بصمت
    let contactId = null;
    try {
      const cRes = await fetch(`${apiBaseUrl}/api/contacts`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: order.customer_name || "زبون", phone }),
      });
      const cData = await cRes.json();
      if (!cRes.ok || !cData?.data?._id) {
        return res.status(502).json({
          success: false,
          error: "Failed to register contact with Darb Assabil",
          details: cData,
        });
      }
      contactId = cData.data._id;
    } catch (e) {
      return res.status(502).json({ success: false, error: `Contact request failed: ${e.message}` });
    }

    // 2. جلب كود الخدمة - نفشل بوضوح لو ما نجح
    let serviceId = null;
    try {
      const sRes = await fetch(`${apiBaseUrl}/api/local/service/rates/public`, { method: "GET", headers });
      const sData = await sRes.json();
      serviceId = sData?.data?.results?.[0]?._id || (Array.isArray(sData?.data) ? sData.data[0]?._id : null);
      if (!cRes.ok || !cData?.data?._id) {
  const providerError =
    cData?.message ||
    cData?.error?.message ||
    (typeof cData?.error === "string" ? cData.error : null) ||
    JSON.stringify(cData);

  console.error("Darb Assabil contact error:", {
    status: cRes.status,
    response: cData,
  });

  return res.status(502).json({
    success: false,
    error: `فشل تسجيل العميل لدى درب السبيل. HTTP ${cRes.status}: ${providerError}`,
    details: cData,
  });
}
    } catch (e) {
      return res.status(502).json({ success: false, error: `Service rate request failed: ${e.message}` });
    }

    // 3. إنشاء الشحنة
    const shipPayload = {
      from: { countryCode: "LBY", city: "طرابلس", area: "المركز", address: "مقر المتجر" },
      to: { countryCode: "LBY", city: "طرابلس", area: "المركز", address: order.customer_address || "طرابلس" },
      products,
      contacts: [contactId],
      service: serviceId,
      paymentBy: "receiver",
      notes: `طلب #${order.id} - العميل: ${order.customer_name} (${phone})`,
    };

    const shipRes = await fetch(`${apiBaseUrl}/api/local/shipments`, {
      method: "POST",
      headers,
      body: JSON.stringify(shipPayload),
    });
    const shipData = await shipRes.json().catch(() => ({}));

    return res.status(shipRes.ok ? 200 : 502).json({ success: shipRes.ok, data: shipData });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}