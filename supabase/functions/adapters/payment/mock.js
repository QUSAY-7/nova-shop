export default {
  async createPayment(order, config) {
    return {
      redirectUrl: `https://example.com/fake-checkout/${order.id}`,
      paymentId: `mock_${order.id}`,
      raw: { note: "mock adapter" },
    };
  },

  async verifyWebhook(requestPayload, headers, config) {
    return {
      valid: true,
      status: "paid",
      paymentId: requestPayload.paymentId ?? "mock_unknown",
      raw: requestPayload,
    };
  },

  async refund(paymentId, amount, config) {
    return { success: true, raw: { paymentId, amount } };
  },
};
// force redeploy