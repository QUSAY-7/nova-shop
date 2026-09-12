// InvoiceModal.jsx
import React from "react";
import { X } from "lucide-react";

export default function InvoiceModal({
  order,
  onClose,
  storeName = "NOVA SHOP",
  onPrint,
}) {
  if (!order) return null;

  return (
    <div className="gallery-overlay">
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="gallery-box" style={{ maxWidth: "380px", padding: "24px" }}>
        <button className="gallery-close" onClick={onClose} aria-label="إغلاق">
          <X size={16} />
        </button>

        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <p style={{ fontFamily: "'Almarai',sans-serif", fontWeight: 800, fontSize: "18px", color: "var(--teal-dark)" }}>
            {storeName}
          </p>
          <p style={{ fontSize: "12px", color: "var(--muted)" }}>
            فاتورة طلب رقم {order.id}
          </p>
          <p style={{ fontSize: "11px", color: "var(--muted)" }}>
            {new Date(order.created_at).toLocaleString("ar-LY")}
          </p>
        </div>

        <div style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "12px 0", marginBottom: "12px" }}>
          {(order.items || []).map((item, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
              <span>
                {item.title}
                {(item.size || item.color) && ` (${[item.size, item.color].filter(Boolean).join(" / ")})`}
                {" × "}{item.qty}
              </span>
              <span>{item.price * item.qty} د.ل</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "15px", color: "var(--teal-dark)", marginBottom: "12px" }}>
          <span>الإجمالي</span>
          <span>{order.total_price} د.ل</span>
        </div>

        <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.8 }}>
          <p>الاسم: {order.customer_name}</p>
          <p>الهاتف: {order.customer_phone}</p>
          <p>العنوان: {order.customer_address}</p>
          <p>طريقة الدفع: {order.payment_method}</p>
        </div>

        <button
          onClick={() => onPrint(order)}
          className="cta-button"
          style={{ marginTop: "16px" }}
        >
          طباعة الفاتورة
        </button>
      </div>
    </div>
  );
}