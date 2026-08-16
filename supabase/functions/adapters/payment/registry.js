import mock from "./mock.js";

const PAYMENT_ADAPTERS = {
  mock,
};

export function getPaymentAdapter(providerName) {
  const adapter = PAYMENT_ADAPTERS[providerName];
  if (!adapter) {
    throw new Error(`لا يوجد payment adapter باسم "${providerName}"`);
  }
  return adapter;
}
// force redeploy