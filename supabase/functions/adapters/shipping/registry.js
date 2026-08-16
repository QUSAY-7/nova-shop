import mock from "./mock.js";

const SHIPPING_ADAPTERS = {
  mock,
};

export function getShippingAdapter(providerName) {
  const adapter = SHIPPING_ADAPTERS[providerName];
  if (!adapter) {
    throw new Error(`لا يوجد shipping adapter باسم "${providerName}"`);
  }
  return adapter;
}
// force redeploy