// OrderTrackingModal.jsx
import React from "react";
import { Package, X, Lock, MessageCircle, Search } from "lucide-react";

export default function OrderTrackingModal({
  isOpen,
  onClose,
  orderTab,
  setOrderTab,
  localOrders = [],
  lookupPhone,
  setLookupPhone,
  otpSent,
  setOtpSent,
  otpCode,
  setOtpCode,
  otpInput,
  setOtpInput,
  otpVerified,
  setOtpVerified,
  myOrders = [],
  setMyOrders,
  myOrdersLoading,
  myOrdersSearched,
  setMyOrdersSearched,
  onSendOtp,
  onVerifyOtp,
  onViewInvoice,
}) {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setOtpSent(false);
    setOtpCode("");
    setOtpInput("");
    setOtpVerified(false);
    setMyOrders([]);
    setMyOrdersSearched(false);
  };

  return (
    <div className="drawer-overlay">
      <div className="drawer-backdrop" onClick={handleClose} />
      <div className="drawer">
        <div className="drawer-head">
          <span className="drawer-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Package size={20} color="var(--teal)" /> طلباتي
          </span>
          <button onClick={handleClose} className="icon-btn">
            <X size={16} />
          </button>
        </div>

        <div className="security-notice">
          <Lock size={15} />
          <span>خصوصيتك محمية: يتطلب تتبع الطلبات التحقق برمز عبر واتساب.</span>
        </div>

        <div className="order-tabs">
          <button
            className={`order-tab-btn ${orderTab === "local" ? "active" : ""}`}
            onClick={() => setOrderTab("local")}
          >
            طلبات هذا الجهاز ({localOrders.length})
          </button>
          <button
            className={`order-tab-btn ${orderTab === "lookup" ? "active" : ""}`}
            onClick={() => {
              setOrderTab("lookup");
              setOtpSent(false);
              setOtpCode("");
              setOtpInput("");
              setOtpVerified(false);
              setMyOrders([]);
              setMyOrdersSearched(false);
            }}
          >
            تتبع برقم الهاتف
          </button>
        </div>

        {orderTab === "lookup" ? (
          <div className="field-block" style={{ marginTop: 0, flex: 1, overflowY: "auto" }}>
            {/* ── الخطوة 1: إدخال رقم الهاتف ── */}
            {!otpSent && (
              <>
                <div style={{ textAlign: "center", padding: "16px 0 10px", fontSize: "13px", color: "var(--muted)", lineHeight: 1.7 }}>
                  أدخل رقم هاتفك المسجل في الطلب وسيُرسل لك رمز تحقق عبر واتساب المتجر.
                </div>
                <span className="field-label">رقم الهاتف</span>
                <input
                  type="tel"
                  className="customer-input"
                  placeholder="09XXXXXXXX"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  style={{ marginBottom: "12px" }}
                />
                <button onClick={onSendOtp} className="cta-button">
                  <MessageCircle size={16} /> إرسال رمز التحقق عبر واتساب
                </button>
              </>
            )}

            {/* ── الخطوة 2: إدخال OTP ── */}
            {otpSent && !otpVerified && (
              <>
                <div style={{ textAlign: "center", padding: "12px", background: "var(--teal-light)", borderRadius: "14px", marginBottom: "14px", marginTop: "8px" }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--teal-dark)", marginBottom: "4px" }}>✅ تم فتح واتساب</p>
                  <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>
                    أرسل الرسالة للمتجر، ثم أدخل الرمز المكوّن من 4 أرقام أدناه.
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                    الرمز صالح لمدة 5 دقائق · الهاتف: {lookupPhone}
                  </p>
                </div>
                <span className="field-label">رمز التحقق (4 أرقام)</span>
                <input
                  type="number"
                  className="customer-input"
                  placeholder="XXXX"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.slice(0, 4))}
                  style={{ marginBottom: "12px", textAlign: "center", fontSize: "22px", letterSpacing: "8px", fontWeight: 800 }}
                />
                <button
                  onClick={onVerifyOtp}
                  className="cta-button"
                  style={{ marginBottom: "10px" }}
                >
                  <Search size={16} /> تحقق وعرض طلباتي
                </button>
                <button
                  onClick={() => { setOtpSent(false); setOtpCode(""); setOtpInput(""); }}
                  style={{ width: "100%", padding: "10px", borderRadius: "12px", fontSize: "13px", color: "var(--muted)", border: "1px solid var(--line)", background: "transparent" }}
                >
                  ↩ تغيير رقم الهاتف
                </button>
              </>
            )}

            {/* ── الخطوة 3: النتائج ── */}
            {otpVerified && (
              <div className="cart-scroll" style={{ marginTop: "12px" }}>
                {myOrdersLoading ? (
                  <div className="state-box">جاري جلب طلباتك...</div>
                ) : myOrdersSearched && myOrders.length === 0 ? (
                  <div className="cart-empty">
                    <Package size={32} />
                    <span>لا توجد طلبات مسجلة على رقم {lookupPhone}</span>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: "12px", color: "var(--teal-dark)", fontWeight: 700, marginBottom: "8px" }}>
                      ✅ تم التحقق · {myOrders.length} طلب بالرقم {lookupPhone}
                    </p>
                    {myOrders.map((order) => (
                      <div key={order.id} className="cart-line" style={{ flexDirection: "column", alignItems: "stretch" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span className="cart-name">طلب رقم #{order.id}</span>
                          <span className="cart-price">{order.total_price} د.ل</span>
                        </div>
                        <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>
                          {new Date(order.created_at).toLocaleDateString("ar-LY")} · {order.status || "قيد المعالجة"}
                        </p>
                        {(order.items || []).map((item, idx) => (
                          <p key={idx} className="cart-code">
                            {item.title} × {item.qty}
                          </p>
                        ))}
                        <button
                          onClick={() => onViewInvoice(order)}
                          className="add-btn"
                          style={{ marginTop: "8px" }}
                        >
                          🧾 عرض الفاتورة
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="cart-scroll">
            {localOrders.length === 0 ? (
              <div className="cart-empty">
                <Package size={32} />
                <span>لا توجد طلبات مسجلة على هذا الجهاز بعد</span>
              </div>
            ) : (
              localOrders.map((order) => (
                <div key={order.id} className="cart-line" style={{ flexDirection: "column", alignItems: "stretch" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span className="cart-name">طلب رقم #{order.id}</span>
                    <span className="cart-price">{order.total_price} د.ل</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>
                    {new Date(order.created_at).toLocaleDateString("ar-LY")}
                  </p>
                  {(order.items || []).map((item, idx) => (
                    <p key={idx} className="cart-code">
                      {item.title} × {item.qty}
                    </p>
                  ))}
                  <button
                    onClick={() => onViewInvoice(order)}
                    className="add-btn"
                    style={{ marginTop: "8px" }}
                  >
                    🧾 عرض الفاتورة
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
