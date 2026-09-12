// CartDrawer.jsx
import React from "react";
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  Banknote,
  Landmark,
  Wallet,
  Copy,
  Check,
  MessageCircle,
} from "lucide-react";
import { LIBYA_CITIES, getAreasForCity } from "../../../libyaDeliveryData";

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems = [],
  totalQty = 0,
  itemsSubtotal = 0,
  deliveryCost = 0,
  totalPrice = 0,
  deliveryInfo = { rate: 0, days: 2 },
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  deliveryCity,
  setDeliveryCity,
  deliveryArea,
  setDeliveryArea,
  customerAddress,
  setCustomerAddress,
  payment,
  setPayment,
  settings,
  copied,
  onCopyAccount,
  onInc,
  onDec,
  onRemoveItem,
  getEffectivePrice,
  onCheckout,
  cartThumb: CartThumb,
}) {
  if (!isOpen) return null;

  return (
    <div className="drawer-overlay">
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <span className="drawer-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ShoppingCart size={20} color="var(--teal)" /> سلتك ({totalQty})
          </span>
          <button onClick={onClose} className="icon-btn">
            <X size={16} />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <ShoppingCart size={36} />
            <span>سلتك فارغة، أضف منتجاً لتبدأ طلبك</span>
          </div>
        ) : (
          <>
            {/* منطقة محتوى السلة القابلة للتمرير على شاشات الهواتف */}
            <div className="cart-body">
              <div className="cart-scroll">
                {cartItems.map(({ key, product, variant, qty }) => (
                  <div key={key} className="cart-line">
                    <div className="cart-thumb">
                      {CartThumb ? (
                        <CartThumb product={product} />
                      ) : product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }}
                        />
                      ) : (
                        <ShoppingCart size={20} />
                      )}
                    </div>
                    <div className="cart-info">
                      <p className="cart-name">
                        {product.title}
                        {variant && ` (${[variant.size, variant.color].filter(Boolean).join(" / ")})`}
                      </p>
                      <p className="cart-code">{product.code || product.id}</p>
                      <div className="cart-line-bottom">
                        <span className="cart-price">{getEffectivePrice(product, variant) * qty} د.ل</span>
                        <div className="qty-control sm">
                          <button className="qty-btn" onClick={() => onDec(key)}>
                            <Minus />
                          </button>
                          <span className="qty-val">{qty}</span>
                          <button className="qty-btn" onClick={() => onInc(key)}>
                            <Plus />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button className="cart-remove" onClick={() => onRemoveItem(key)} aria-label="إزالة">
                      <Trash2 />
                    </button>
                  </div>
                ))}
              </div>

              <div className="field-block">
                <span className="field-label">اسمك الكامل</span>
                <input
                  type="text"
                  className="customer-input"
                  placeholder="مثال: محمد أحمد"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="field-block">
                <span className="field-label">رقم هاتفك</span>
                <input
                  type="tel"
                  className="customer-input"
                  placeholder="09XXXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              {/* حقول التوصيل المنظمة للمدن والمناطق الليبية */}
              <div className="field-block">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                  <div>
                    <span className="field-label">المدينة 🇱🇾</span>
                    <select
                      className="customer-input"
                      value={deliveryCity}
                      onChange={(e) => {
                        const newCity = e.target.value;
                        setDeliveryCity(newCity);
                        const areas = getAreasForCity(newCity);
                        setDeliveryArea(areas[0] || newCity);
                      }}
                      style={{ width: "100%", height: "42px", padding: "0 10px", borderRadius: "12px", border: "1px solid var(--line)", background: "#fff", fontWeight: 700 }}
                    >
                      {LIBYA_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="field-label">المنطقة / الحي</span>
                    <select
                      className="customer-input"
                      value={deliveryArea}
                      onChange={(e) => setDeliveryArea(e.target.value)}
                      style={{ width: "100%", height: "42px", padding: "0 10px", borderRadius: "12px", border: "1px solid var(--line)", background: "#fff" }}
                    >
                      {getAreasForCity(deliveryCity).map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <span className="field-label">تفاصيل العنوان / أقرب نقطة دالة</span>
                <input
                  type="text"
                  className="customer-input"
                  placeholder="الشارع، رقم المبنى، أو علامة مميزة (اختياري)"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                />
                <div style={{ marginTop: "6px", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--teal-dark)", background: "var(--teal-light)", padding: "6px 10px", borderRadius: "8px" }}>
                  <span>🚚 رسوم التوصيل لـ ({deliveryCity}): <strong>{deliveryCost} د.ل</strong></span>
                  <span>⏳ مدة الوصول: <strong>{deliveryInfo.days} {deliveryInfo.days === 1 ? "يوم" : "أيام"}</strong></span>
                </div>
              </div>

              <div className="field-block">
                <span className="field-label">طريقة الدفع</span>
                <div className="payment-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                  <button onClick={() => setPayment("cash")} className={`pay-btn ${payment === "cash" ? "active" : ""}`}>
                    <Banknote /> كاش
                  </button>
                  <button onClick={() => setPayment("bank")} className={`pay-btn ${payment === "bank" ? "active" : ""}`}>
                    <Landmark /> تحويل بنكي
                  </button>
                  <button onClick={() => setPayment("ezone")} className={`pay-btn ${payment === "ezone" ? "active" : ""}`}>
                    <Wallet /> دفع إلكتروني
                  </button>
                </div>
                {payment === "bank" && (
                  <div className="bank-box">
                    <span className="bank-number">{settings?.bank_account}</span>
                    <button onClick={onCopyAccount} className="copy-btn">
                      {copied ? <Check className="ok" /> : <Copy />}
                    </button>
                  </div>
                )}
                {payment === "ezone" && (
                  <div style={{ marginTop: "10px", padding: "10px 12px", background: "var(--teal-light)", borderRadius: "12px", fontSize: "12px", color: "var(--teal-dark)", lineHeight: 1.6 }}>
                    🔒 <strong>الدفع الإلكتروني المباشر:</strong>
                    <br />
                    عند الضغط على إتمام الطلب، سيتم نقلك مباشرة إلى بوابة الدفع الآمنة لاختيار وسيلة الدفع المفضلة (سداد، إدفع لي، موبي كاش، تداول، مصرفي باي، إلخ).
                  </div>
                )}
              </div>
            </div>

            {/* تذييل السلة الثابت في الأسفل دائماً */}
            <div className="cart-total-row">
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px", fontSize: "13px", color: "var(--muted)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>سعر المنتجات:</span>
                  <span>{itemsSubtotal} د.ل</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>رسوم التوصيل ({deliveryCity}):</span>
                  <span>{deliveryCost} د.ل</span>
                </div>
                <div style={{ borderTop: "1px dashed var(--line)", marginTop: "4px", paddingTop: "6px", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "16px", color: "var(--teal-dark)" }}>
                  <span>الإجمالي النهائي:</span>
                  <span className="total-amount">{totalPrice} د.ل</span>
                </div>
              </div>
              <button
                className="cta-button"
                onClick={onCheckout}
              >
                {payment === "ezone" ? (
                  <><Wallet size={18} /> الدفع الإلكتروني وإتمام الطلب</>
                ) : (
                  <><MessageCircle size={18} /> إتمام الطلب عبر واتساب</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}