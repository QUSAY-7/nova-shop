import mock from "./mock.js";
import ezonepay from "./ezone-pay.js";

const PAYMENT_ADAPTERS = {
  mock,
  ezonepay,
};

export function getPaymentAdapter(providerName) {
  const adapter = PAYMENT_ADAPTERS[providerName];
  if (!adapter) {
    throw new Error(`لا يوجد payment adapter باسم "${providerName}"`);
  }
  return adapter;
}
// force redeploy