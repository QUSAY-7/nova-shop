// supabase/functions/adapters/payment/ezone-pay.js

const DEFAULT_BASE_URL = "https://test.ezonepay.ly";

function resolveApiKey(config) {
  return config?.apiKey || config?.api_key || Deno.env.get("EZONE_PAY_API_KEY");
}

function resolveBaseUrl(config) {
  const url = config?.baseUrl || config?.base_url || Deno.env.get("EZONE_PAY_BASE_URL") || DEFAULT_BASE_URL;
  return url.replace(/\/+$/, "");
}

function splitName(fullName) {
  const parts = (fullName || "").trim().split(/\s+/);
  return {
    firstName: parts[0] || "عميل",
    lastName: parts.slice(1).join(" ") || "-",
  };
}

export default {
  async createPayment(order, config) {
    const apiKey = resolveApiKey(config);
    const baseUrl = resolveBaseUrl(config);

    if (!apiKey) {
      throw new Error("Ezone Pay: API key غير موجود بإعدادات المتجر");
    }

    const { firstName, lastName } = splitName(order.customer_name);

    const payload = {
      Title: `طلب #${order.id}`,
      OrderReference: String(order.id),
      Amount: order.total_price,
      Note: `طلب من المتجر - ${order.customer_name || ""}`,
      MaxUsageCount: 1,
      Customer: {
        FirstName: firstName,
        LastName: lastName,
        PhoneNumber: order.customer_phone,
      },
      RedirectUrl: config?.redirectUrl || config?.redirect_url,
    };

    const response = await fetch(`${baseUrl}/payment-link/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Ezone Pay: رد غير صالح من الخادم — ${text.substring(0, 200)}`);
    }

    if (!response.ok) {
      throw new Error(data?.message || data?.error || `Ezone Pay: خطأ من الـ API (${response.status})`);
    }

    return {
      redirectUrl: data.Link || data.link,
      paymentId: data.Id ?? data.id,
      raw: data,
    };
  },

  async verifyWebhook(requestPayload, headers, config) {
    return {
      valid: true,
      status: requestPayload.event === 2 || requestPayload.Event === 2 ? "paid" : "pending",
      paymentId: requestPayload.transactionId ?? requestPayload.TransactionId,
      raw: requestPayload,
    };
  },

  async refund(paymentId, amount, config) {
    // ملاحظة: توثيق Ezone Pay لا يذكر endpoint خاص بالاسترجاع حاليًا — يحتاج تأكيد منهم
    throw new Error("Ezone Pay: خاصية الاسترجاع غير مدعومة حاليًا حسب التوثيق المتوفر");
  },
};