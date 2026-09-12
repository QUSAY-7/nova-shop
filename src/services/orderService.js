// src/services/orderService.js
import { supabase } from "../supabaseClient";

/**
 * دالة إرسال وحفظ الطلب عبر الخادم الآمن
 */
export async function submitOrder({
  customerName,
  customerPhone,
  customerAddress,
  deliveryCity,
  deliveryArea,
  formattedFullAddress,
  items,
  paymentMethod,
  shippingCost,
}) {
  const requestBody = {
    items,
    customer_name: customerName.trim(),
    customer_phone: customerPhone.trim(),
    customer_address: formattedFullAddress,
    payment_method: paymentMethod,
    delivery_city: deliveryCity,
    delivery_area: deliveryArea || deliveryCity,
    shipping_cost: shippingCost,
  };

  const res = await fetch("/api/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const text = await res.text();
  if (!res.ok) {
    let errMsg = text;
    try {
      const err = JSON.parse(text);
      errMsg = err.error || err.message || text;
    } catch (_) {}
    throw new Error(errMsg);
  }

  const apiResponse = JSON.parse(text);
  const { order: insertedOrder, verified_total } = apiResponse;

  if (!insertedOrder) {
    throw new Error("لم يتم إرجاع بيانات الطلب من الخادم.");
  }

  // إرسال تلقائي لشركة الشحن درب السبيل إن كانت مفعلة
  await dispatchDarbAssabil({
    orderId: insertedOrder.id,
    customerName,
    customerPhone,
    deliveryCity,
    deliveryArea,
    formattedFullAddress,
    items,
    totalPrice: verified_total,
    shippingCost,
  });

  return {
    order: insertedOrder,
    verifiedTotal: verified_total,
  };
}

/**
 * إرسال الشحنة لشركة درب السبيل للتوصيل
 */
async function dispatchDarbAssabil({
  orderId,
  customerName,
  customerPhone,
  deliveryCity,
  deliveryArea,
  formattedFullAddress,
  items,
  totalPrice,
  shippingCost,
}) {
  try {
    const storedConfigs = JSON.parse(localStorage.getItem("nova_integration_providers_config") || "{}");
    const darbCfg = storedConfigs["darb_assabil"];
    if (darbCfg && darbCfg.isActive !== false && orderId) {
      await supabase.from("orders").update({
        tracking_number: `DS-${orderId}`,
        delivery_provider: "darb_assabil",
      }).eq("id", orderId);

      await fetch("/api/dispatch-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: {
            id: orderId,
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim(),
            delivery_city: deliveryCity,
            delivery_area: deliveryArea || deliveryCity,
            customer_address: formattedFullAddress,
            items,
            total_price: totalPrice,
            shipping_cost: shippingCost,
          },
        }),
      });
    }
  } catch (e) {
    console.warn("Darb Assabil dispatch error:", e);
  }
}

/**
 * بدء عملية الدفع الإلكتروني عبر Ezone Pay
 */
export async function initiateEzonePayment({
  orderId,
  customerName,
  customerPhone,
  totalPrice,
}) {
  const nameParts = (customerName || "زبون المتجر").trim().split(" ");
  let firstName = nameParts[0] || "زبون";
  let lastName = nameParts.slice(1).join(" ") || "المتجر";
  if (firstName.length < 3) firstName = firstName + "...".slice(0, 3 - firstName.length);
  if (lastName.length < 3) lastName = lastName + "...".slice(0, 3 - lastName.length);

  const ezonePayload = {
    Title: `طلب متجر #${orderId}`,
    OrderReference: `ORD-${orderId}`,
    IsUniqueOrderReference: true,
    InternalReference: `NOVA-${orderId}`,
    Amount: Number(totalPrice),
    Currency: 1, // 1 = LYD
    Note: "طلب شراء عبر المتجر الإلكتروني",
    Customer: {
      FirstName: firstName,
      LastName: lastName,
      PhoneNumber: customerPhone || "0910000000",
    },
    RedirectUrl: `${window.location.origin}/?payment_success=true&order_id=${orderId}`,
  };

  const ezRes = await fetch("/api/ezone-pay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload: ezonePayload }),
  });

  const ezText = await ezRes.text();
  if (!ezRes.ok) {
    throw new Error(`خطأ Ezone Pay (${ezRes.status})`);
  }

  const result = JSON.parse(ezText);
  if (result.success && result.data?.Link) {
    return result.data.Link;
  } else {
    throw new Error(result.error || "لم يتم إرجاع رابط الدفع من Ezone Pay.");
  }
}
