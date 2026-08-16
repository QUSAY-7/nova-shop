export default {
  async createShipment(order, config) {
    return {
      shipmentId: `mock_ship_${order.id}`,
      trackingUrl: `https://example.com/fake-tracking/${order.id}`,
      estimatedCost: 15,
      raw: { note: "mock adapter" },
    };
  },

  async trackShipment(shipmentId, config) {
    return { status: "in_transit", raw: { shipmentId } };
  },

  async cancelShipment(shipmentId, config) {
    return { success: true, raw: { shipmentId } };
  },
};
// force redeploy