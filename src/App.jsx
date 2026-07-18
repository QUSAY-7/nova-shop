import { useState, useMemo, useRef } from "react";
import {
  ShoppingBag, X, Plus, Minus, Check, Phone, User, MapPin, ChevronLeft,
  CreditCard, Truck, ShieldCheck, MessageCircle, ChevronRight, Menu,
} from "lucide-react";
import img1 from "./assets/product1-1.jpg";
import img2 from "./assets/product1-2.jpg";
import img3 from "./assets/product1-3.jpg";
import img4 from "./assets/product1-4.jpg";
import img5 from "./assets/product1-5.jpg";
import img6 from "./assets/product1-6.jpg";

const C = {
  bg: "#FFFFFF",
  panel: "#FFFFFF",
  panelSoft: "#F0FAFB",
  border: "#E3E8ED",
  tealA: "#22D3C5",
  tealB: "#1499C7",
  text: "#1B2430",
  muted: "#6B7684",
  mutedLight: "#9AA3B0",
  badgeBg: "#E8FBF9",
  badgeText: "#14A196",
};
const gradient = `linear-gradient(135deg, ${C.tealA}, ${C.tealB})`;

function TikTokIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M16.5 2h-3v13.2a2.8 2.8 0 1 1-2.2-2.74V9.4a5.8 5.8 0 1 0 5.2 5.77V8.6a6.9 6.9 0 0 0 4 1.28V6.9a3.9 3.9 0 0 1-4-3.9V2Z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FacebookIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M14 9h2.5V6H14c-1.9 0-3.5 1.6-3.5 3.5V11H8v3h2.5v6h3v-6h2.4l.6-3h-3V9.6c0-.35.15-.6.5-.6Z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InstagramIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="4.5" stroke={color} strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.6" stroke={color} strokeWidth="1.6" />
      <circle cx="16.6" cy="7.4" r="0.9" fill={color} />
    </svg>
  );
}

// رقم الواتساب — بالصيغة الدولية بدون + وبدون صفر البداية (218 + رقمك)
const WHATSAPP_NUMBER = "218931739453";

// رقم الحساب المصرفي لخيار التحويل المصرفي
const BANK_ACCOUNT = "LY25025010113475443410011";

// غيّر هذي الروابط بروابط حساباتك الحقيقية
const FACEBOOK_URL = "https://www.facebook.com/share/18y4PR69R1/";
const INSTAGRAM_URL = "https://instagram.com/novashop";
const TIKTOK_URL = "https://tiktok.com/@novashop";

const CITIES = ["طرابلس", "بنغازي", "مصراتة", "الزاوية", "زليتن", "سبها", "البيضاء", "درنة", "الخمس", "صبراتة", "غريان", "مدينة أخرى"];

// المنتج الوحيد المعروض حاليًا بالمتجر
const PRODUCT = {
  id: "p1",
  sku: "NV-0104",
  name: "محفظة بطاقات مصرفية",
  category: "إكسسوارات",
  tag: "حماية البطاقات",
  price: 45,
  icon: CreditCard,
  images: [img1, img2, img3, img4, img5, img6],
  desc: "يمنع نسخ بيانات بطاقتك المصرفية عن بُعد أثناء التنقل اليومي.",
};

// عناصر القائمة الجانبية — أضف عنصر جديد هنا بأي وقت مستقبلاً
const MENU_ITEMS = [
  { id: "store", label: "الرئيسية" },
  { id: "about", label: "حول المتجر" },
];

export default function App() {
  const [cart, setCart] = useState({});
  const [view, setView] = useState("store");
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [form, setForm] = useState({ name: "", phone: "", city: CITIES[0], area: "", address: "", note: "", paymentMethod: "cash" });
  const [errors, setErrors] = useState({});
  const [orderNo, setOrderNo] = useState(null);

  // ===== سلايدر الصور: حالة اللمس/السحب =====
  const imgWrapRef = useRef(null);
  const touchStartXRef = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const addToCart = () => setCart((c) => ({ ...c, [PRODUCT.id]: (c[PRODUCT.id] || 0) + 1 }));
  const decFromCart = () => setCart((c) => { const n = { ...c }; if (!n[PRODUCT.id]) return n; n[PRODUCT.id] -= 1; if (n[PRODUCT.id] <= 0) delete n[PRODUCT.id]; return n; });
  const removeFromCart = () => setCart((c) => { const n = { ...c }; delete n[PRODUCT.id]; return n; });

  const qty = cart[PRODUCT.id] || 0;
  const cartItems = qty > 0 ? [{ ...PRODUCT, qty }] : [];
  const cartCount = qty;
  const cartTotal = qty * PRODUCT.price;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "اكتب اسمك الكامل";
    if (!/^0?9[0-9]{8}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "رقم هاتف ليبي غير صحيح (مثال: 0912345678)";
    if (!form.address.trim()) e.address = "اكتب عنوانك بالتفصيل";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitOrder = () => {
    if (!validate()) return;
    const newOrderNo = "NV-" + Math.floor(100000 + Math.random() * 900000);
    setOrderNo(newOrderNo);

    const lines = [
      `طلب جديد من NOVA SHOP — رقم الطلب ${newOrderNo}`,
      ``,
      `الاسم: ${form.name}`,
      `الهاتف: ${form.phone}`,
      `المدينة: ${form.city}`,
      `المنطقة: ${form.area}`,
      `العنوان: ${form.address}`,
      form.note ? `ملاحظات: ${form.note}` : null,
      ``,
      `المنتجات:`,
      ...cartItems.map((i) => `- ${i.name} × ${i.qty} = ${i.qty * i.price} د.ل`),
      ``,
      `الإجمالي: ${cartTotal} د.ل`,
      `طريقة الدفع: ${form.paymentMethod === "bank" ? "تحويل مصرفي" : "نقدًا (كاش)"}`,
      form.paymentMethod === "bank" ? `رقم الحساب المصرفي: ${BANK_ACCOUNT}` : null,
    ].filter(Boolean).join("\n");

    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`;
    window.open(waUrl, "_blank");

    setView("success");
  };

  const resetAll = () => {
    setCart({}); setForm({ name: "", phone: "", city: CITIES[0], area: "", address: "", note: "", paymentMethod: "cash" });
    setErrors({}); setOrderNo(null); setView("store");
  };

  // ===== أحداث اللمس للسلايدر =====
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    setDragOffset(e.touches[0].clientX - touchStartXRef.current);
  };
  const handleTouchEnd = () => {
    if (!isDragging) { setIsDragging(false); setDragOffset(0); return; }
    setIsDragging(false);
    const width = imgWrapRef.current?.offsetWidth || 300;
    const threshold = width * 0.15;
    if (PRODUCT.images.length > 1) {
      if (dragOffset > threshold) {
        setActiveImage((i) => (i - 1 + PRODUCT.images.length) % PRODUCT.images.length);
      } else if (dragOffset < -threshold) {
        setActiveImage((i) => (i + 1) % PRODUCT.images.length);
      }
    }
    setDragOffset(0);
  };

  return (
    <div dir="rtl" className="min-h-screen w-full" style={{ background: C.bg, color: C.text, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus, select:focus, button:focus-visible { outline: 2px solid ${C.tealB}; outline-offset: 2px; }
        ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 8px; }
        .dot { position:absolute; border-radius:50%; }
      `}</style>

      {/* Announcement bar */}
      <div className="text-center py-2 px-4" style={{ background: gradient, fontSize: 12.5, color: "#fff", fontWeight: 600 }}>
        منتجات ذكية مختارة بعناية · توصيلاً لباب بيتك في كل ربوع ليبيا
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 px-5 py-3" style={{ background: "rgba(255,255,255,0.92)", borderBottom: `1px solid ${C.border}`, backdropFilter: "blur(8px)" }}>
        <div className="relative flex items-center justify-center" style={{ maxWidth: 1120, margin: "0 auto", height: 46 }}>
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-2 rounded-full px-4 py-2"
            style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", border: `1.5px solid ${C.tealB}`, color: C.tealB }}
          >
            <ShoppingBag size={17} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>السلة</span>
            {cartCount > 0 && (
              <span className="flex items-center justify-center rounded-full" style={{ position: "absolute", top: -8, left: -8, width: 19, height: 19, background: gradient, color: "#fff", fontSize: 10.5, fontWeight: 700 }}>{cartCount}</span>
            )}
          </button>

          <div style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 800, fontSize: 21, letterSpacing: 1 }}>NOVA SHOP</div>

          <button
            onClick={() => setMenuOpen(true)}
            className="flex items-center justify-center rounded-full"
            style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, border: `1.5px solid ${C.tealB}`, color: C.tealB }}
            aria-label="القائمة"
          >
            <Menu size={19} />
          </button>
        </div>
      </header>

      {view === "store" && (
        <>
          {/* Hero */}
          <section className="relative px-5 pt-16 pb-10 text-center overflow-hidden" style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div className="dot" style={{ top: 20, right: "22%", width: 14, height: 14, background: C.tealA, opacity: 0.5 }} />
            <div className="dot" style={{ top: 60, left: "18%", width: 10, height: 10, background: C.tealB, opacity: 0.45 }} />
            <div className="dot" style={{ bottom: 30, right: "15%", width: 8, height: 8, background: C.tealA, opacity: 0.4 }} />

            <h1
              style={{
                fontFamily: "'Tajawal', sans-serif", fontWeight: 800,
                fontSize: "clamp(38px, 8vw, 64px)", letterSpacing: 1,
                backgroundImage: `linear-gradient(90deg, ${C.tealA}, ${C.tealB}, #3B6FE0)`,
                WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
              }}
            >
              NOVA SHOP
            </h1>
            <div className="mx-auto mt-2 mb-5 rounded-full" style={{ width: 90, height: 4, background: gradient }} />
            <p style={{ color: C.text, fontSize: 16, fontWeight: 600 }}>توصيل لكل مدن ليبيا، بثقة من أول طلب</p>

            <div className="flex flex-wrap justify-center gap-6 mt-8" style={{ fontSize: 13, color: C.muted }}>
              <div className="flex items-center gap-2"><Truck size={16} color={C.tealB} /> شحن لكل المدن</div>
              <div className="flex items-center gap-2"><ShieldCheck size={16} color={C.tealB} /> فحص قبل الدفع</div>
              <div className="flex items-center gap-2"><MessageCircle size={16} color={C.tealB} /> دعم واتساب</div>
            </div>
          </section>

          {/* Product */}
          <section className="px-5 py-6" style={{ maxWidth: 560, margin: "0 auto" }}>
            <div className="rounded-2xl p-5" style={{ background: C.panel, border: `1.5px solid ${C.border}` }}>
              <div
                ref={imgWrapRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ position: "relative", width: "100%", height: 280, borderRadius: 14, overflow: "hidden", background: C.panelSoft, touchAction: "pan-y" }}
              >
                <div
                  style={{
                    display: "flex",
                    height: "100%",
                    direction: "ltr",
                    transform: `translateX(calc(${-activeImage * 100}% + ${isDragging ? dragOffset : 0}px))`,
                    transition: isDragging ? "none" : "transform 0.35s cubic-bezier(.22,.61,.36,1)",
                  }}
                >
                  {PRODUCT.images.map((src, idx) => (
                    <img
                      key={idx}
                      src={src}
                      alt={PRODUCT.name}
                      draggable={false}
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", flexShrink: 0, userSelect: "none" }}
                    />
                  ))}
                </div>
                {PRODUCT.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImage((i) => (i - 1 + PRODUCT.images.length) % PRODUCT.images.length)}
                      className="flex items-center justify-center rounded-full"
                      style={{ position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)", width: 32, height: 32, background: "rgba(255,255,255,0.9)", color: C.tealB }}
                    >
                      <ChevronRight size={18} />
                    </button>
                    <button
                      onClick={() => setActiveImage((i) => (i + 1) % PRODUCT.images.length)}
                      className="flex items-center justify-center rounded-full"
                      style={{ position: "absolute", top: "50%", left: 8, transform: "translateY(-50%)", width: 32, height: 32, background: "rgba(255,255,255,0.9)", color: C.tealB }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      {PRODUCT.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImage(idx)}
                          style={{ borderRadius: 999, width: idx === activeImage ? 18 : 6, height: 6, background: idx === activeImage ? C.tealB : "rgba(20,30,40,0.25)", transition: "all .2s" }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between" style={{ fontSize: 10.5, color: C.mutedLight, margin: "14px 0 6px", fontFamily: "'IBM Plex Mono', monospace" }}>
                <span>{PRODUCT.sku}</span>
                <span className="rounded-full px-2 py-0.5" style={{ background: C.badgeBg, color: C.badgeText, fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontWeight: 700 }}>{PRODUCT.tag}</span>
              </div>
              <h2 style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 800, fontSize: 20 }}>{PRODUCT.name}</h2>
              <p style={{ color: C.muted, fontSize: 13.5, lineHeight: 1.9, margin: "10px 0 18px" }}>{PRODUCT.desc}</p>

              <div className="flex items-center justify-between">
                <span style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 800, fontSize: 20, color: C.tealB }}>{PRODUCT.price} د.ل</span>
                {qty === 0 ? (
                  <button onClick={addToCart} className="rounded-full px-5 py-2.5 flex items-center gap-1.5" style={{ background: gradient, color: "#fff", fontSize: 13.5, fontWeight: 700 }}>
                    <Plus size={14} /> أضف إلى السلة
                  </button>
                ) : (
                  <div className="flex items-center gap-4 rounded-full px-3 py-2" style={{ border: `1px solid ${C.border}` }}>
                    <button onClick={addToCart} style={{ color: C.tealB }}><Plus size={16} /></button>
                    <span style={{ fontSize: 14 }}>{qty}</span>
                    <button onClick={decFromCart} style={{ color: C.muted }}><Minus size={16} /></button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {view === "about" && (
        <section className="px-5 py-12" style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 800, fontSize: 26, textAlign: "center", marginBottom: 30 }}>حول المتجر</h2>

          <div className="rounded-2xl p-5 mb-4" style={{ background: C.panelSoft, border: `1px solid ${C.border}` }}>
            <h3 style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700, fontSize: 17, color: C.tealB, marginBottom: 8 }}>من نحن</h3>
            <p style={{ fontSize: 14, color: C.text, lineHeight: 1.9 }}>Nova Shop متجر ليبي يقدّم منتجات ذكية مختارة بعناية، مع التزام كامل بثقة العميل من أول طلب.</p>
          </div>

          <div className="rounded-2xl p-5 mb-4" style={{ background: C.panelSoft, border: `1px solid ${C.border}` }}>
            <h3 style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700, fontSize: 17, color: C.tealB, marginBottom: 8 }}>سياسة الاسترجاع</h3>
            <p style={{ fontSize: 14, color: C.text, lineHeight: 1.9 }}>يحق للعميل فحص المنتج قبل استلامه. في حال وجود عيب مصنعي، يمكن الاسترجاع أو الاستبدال خلال 48 ساعة من الاستلام.</p>
          </div>

          <div className="rounded-2xl p-5" style={{ background: C.panelSoft, border: `1px solid ${C.border}` }}>
            <h3 style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700, fontSize: 17, color: C.tealB, marginBottom: 8 }}>الدعم الفني</h3>
            <p style={{ fontSize: 14, color: C.text, lineHeight: 1.9 }}>لأي استفسار أو مشكلة بالطلب، تواصل معنا مباشرة عبر واتساب وسنرد عليك في أقرب وقت.</p>
          </div>
        </section>
      )}

      {view === "checkout" && (
        <section className="px-5 py-10" style={{ maxWidth: 560, margin: "0 auto" }}>
          <button onClick={() => setView("store")} className="flex items-center gap-1 mb-6" style={{ color: C.muted, fontSize: 13 }}>
            <ChevronLeft size={16} /> عودة للمتجر
          </button>
          <div className="flex items-center gap-2 mb-6" style={{ fontSize: 12, color: C.muted }}>
            <span style={{ color: C.tealB }}>السلة</span>
            <div style={{ width: 20, height: 1, background: C.border }} />
            <span style={{ color: C.tealB, fontWeight: 700 }}>بياناتك</span>
            <div style={{ width: 20, height: 1, background: C.border }} />
            <span>التأكيد</span>
          </div>
          <h2 style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 800, fontSize: 22 }}>بيانات التوصيل</h2>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>الدفع متوفر بجميع الطرق: كاش أو تحويل مصرفي.</p>

          <div className="mt-6 flex flex-col gap-4">
            <Field label="الاسم الكامل" icon={User} error={errors.name}>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: قصي خالد" style={inputStyle} />
            </Field>
            <Field label="رقم الهاتف" icon={Phone} error={errors.phone}>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0912345678" style={inputStyle} dir="ltr" />
            </Field>
            <Field label="المدينة">
              <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={inputStyle}>
                {CITIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </Field>
            <Field label="المنطقة / الحي">
              <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="مثال: عين زارة" style={inputStyle} />
            </Field>
            <Field label="العنوان بالتفصيل" icon={MapPin} error={errors.address}>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="الحي، أقرب معلم، رقم المنزل..." rows={3} style={{ ...inputStyle, resize: "none" }} />
            </Field>
            <Field label="ملاحظات (اختياري)">
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="مثال: التوصيل بعد الساعة 4" style={inputStyle} />
            </Field>

            {/* طريقة الدفع */}
            <label className="flex flex-col gap-1.5">
              <span style={{ fontSize: 12.5, color: "#6B7684" }}>طريقة الدفع</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, paymentMethod: "cash" })}
                  className="flex-1 rounded-xl py-2.5"
                  style={{ fontSize: 13.5, fontWeight: 700, background: form.paymentMethod === "cash" ? undefined : "transparent", backgroundImage: form.paymentMethod === "cash" ? gradient : "none", color: form.paymentMethod === "cash" ? "#fff" : C.muted, border: `1px solid ${form.paymentMethod === "cash" ? "transparent" : C.border}` }}
                >
                  كاش عند الاستلام
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, paymentMethod: "bank" })}
                  className="flex-1 rounded-xl py-2.5"
                  style={{ fontSize: 13.5, fontWeight: 700, background: form.paymentMethod === "bank" ? undefined : "transparent", backgroundImage: form.paymentMethod === "bank" ? gradient : "none", color: form.paymentMethod === "bank" ? "#fff" : C.muted, border: `1px solid ${form.paymentMethod === "bank" ? "transparent" : C.border}` }}
                >
                  تحويل مصرفي
                </button>
              </div>
            </label>

            {form.paymentMethod === "bank" && (
              <div className="rounded-xl p-4" style={{ background: C.panelSoft, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 6 }}>حوّل المبلغ إلى الحساب التالي، ثم أرسل لنا إيصال التحويل عبر واتساب:</div>
                <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
                  <span dir="ltr" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, letterSpacing: 0.5 }}>{BANK_ACCOUNT}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 rounded-2xl p-5" style={{ background: C.panelSoft, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>ملخص الطلب</div>
            {cartItems.map((i) => (
              <div key={i.id} className="flex justify-between" style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>
                <span>{i.name} × {i.qty}</span><span>{i.qty * i.price} د.ل</span>
              </div>
            ))}
            <div className="flex justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}`, fontFamily: "'Tajawal', sans-serif", fontWeight: 800, fontSize: 16 }}>
              <span>الإجمالي</span><span style={{ color: C.tealB }}>{cartTotal} د.ل</span>
            </div>
          </div>

          <button onClick={submitOrder} className="w-full rounded-full py-3 mt-6" style={{ background: gradient, color: "#fff", fontFamily: "'Tajawal', sans-serif", fontWeight: 800, fontSize: 15 }}>
            تأكيد الطلب
          </button>
        </section>
      )}

      {view === "success" && (
        <section className="px-5 py-16 text-center" style={{ maxWidth: 480, margin: "0 auto" }}>
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center rounded-full" style={{ width: 84, height: 84, border: `2px solid ${C.tealB}` }}>
              <Check size={38} color={C.tealB} />
            </div>
          </div>
          <h2 style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 800, fontSize: 24 }}>تم إرسال طلبك عبر واتساب</h2>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 10, lineHeight: 1.9 }}>
            رقم الطلب <span style={{ color: C.tealB, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>{orderNo}</span>
            <br /> إذا ما فتحت نافذة واتساب تلقائيًا (بعض المتصفحات تمنع النوافذ المنبثقة)، اضغط الزر تحت.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full px-6 py-3 mt-6"
            style={{ background: gradient, color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}
          >
            فتح واتساب يدويًا
          </a>
          <div>
            <button onClick={resetAll} className="rounded-full px-6 py-3 mt-4" style={{ border: `1.5px solid ${C.tealB}`, color: C.tealB, fontSize: 14 }}>متابعة التسوق</button>
          </div>
        </section>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex justify-end" style={{ background: "rgba(20,30,40,0.5)" }} onClick={() => setCartOpen(false)}>
          <div className="h-full w-full flex flex-col p-5" style={{ maxWidth: 380, background: "#fff", borderInlineStart: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 800, fontSize: 18 }}>سلتك</h3>
              <button onClick={() => setCartOpen(false)} style={{ color: C.muted }}><X size={22} /></button>
            </div>
            {cartItems.length === 0 ? (
              <p style={{ color: C.muted, fontSize: 14, marginTop: 20 }}>سلتك فارغة حاليًا.</p>
            ) : (
              <div className="flex-1 overflow-y-auto flex flex-col gap-4">
                {cartItems.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 pb-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <div className="rounded-lg shrink-0" style={{ width: 48, height: 48, background: C.panelSoft, overflow: "hidden", position: "relative" }}>
                      <img src={i.images[0]} alt={i.name} style={{ display: "block", position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
                    </div>
                    <div className="flex-1">
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{i.name}</div>
                      <div style={{ fontSize: 11.5, color: C.mutedLight, marginTop: 2, fontFamily: "'IBM Plex Mono', monospace" }}>{i.sku} · {i.price} د.ل</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={addToCart} style={{ color: C.tealB }}><Plus size={15} /></button>
                      <span style={{ fontSize: 13 }}>{i.qty}</span>
                      <button onClick={decFromCart} style={{ color: C.muted }}><Minus size={15} /></button>
                    </div>
                    <button onClick={removeFromCart} style={{ color: C.mutedLight }}><X size={16} /></button>
                  </div>
                ))}
              </div>
            )}
            {cartItems.length > 0 && (
              <div className="pt-4 mt-2">
                <div className="flex justify-between mb-4" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 800, fontSize: 16 }}>
                  <span>الإجمالي</span><span style={{ color: C.tealB }}>{cartTotal} د.ل</span>
                </div>
                <button onClick={() => { setCartOpen(false); setView("checkout"); }} className="w-full rounded-full py-3" style={{ background: gradient, color: "#fff", fontFamily: "'Tajawal', sans-serif", fontWeight: 800, fontSize: 14 }}>
                  إتمام الطلب
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* القائمة الجانبية — عمودية وقابلة للتوسعة */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex justify-start" style={{ background: "rgba(20,30,40,0.5)" }} onClick={() => setMenuOpen(false)}>
          <div className="h-full w-full flex flex-col p-5" style={{ maxWidth: 300, background: "#fff", borderInlineEnd: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 800, fontSize: 18 }}>القائمة</h3>
              <button onClick={() => setMenuOpen(false)} style={{ color: C.muted }}><X size={22} /></button>
            </div>
            <div className="flex flex-col gap-1">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id); setMenuOpen(false); }}
                  className="text-right rounded-xl px-4 py-3"
                  style={{
                    fontSize: 14.5,
                    fontWeight: view === item.id ? 700 : 500,
                    color: view === item.id ? C.tealB : C.text,
                    background: view === item.id ? C.badgeBg : "transparent",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp button */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center rounded-full"
        style={{ position: "fixed", bottom: 24, right: 24, width: 56, height: 56, background: "#25D366", boxShadow: "0 8px 20px -6px rgba(37,211,102,0.6)", zIndex: 50 }}
      >
        <MessageCircle size={26} color="#fff" fill="#fff" />
      </a>

      <footer className="px-5 py-10" style={{ borderTop: `1px solid ${C.border}`, marginTop: 30 }}>
        <div className="grid gap-8" style={{ maxWidth: 1120, margin: "0 auto", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          <div>
            <div style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 800, marginBottom: 8 }}>NOVA SHOP</div>
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.8 }}>منتجات مختارة بعناية، والدفع متوفر بجميع الطرق.</p>
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 10 }}>روابط</div>
            <div className="flex flex-col gap-2" style={{ fontSize: 12.5, color: C.muted }}>
              <span>المتجر</span><span>سياسة التوصيل</span><span>الأسئلة الشائعة</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 10 }}>تواصل</div>
            <div className="flex flex-col gap-2" style={{ fontSize: 12.5, color: C.muted }}>
              <span dir="ltr" style={{ textAlign: "right" }}>واتساب: {WHATSAPP_NUMBER.replace("218", "0")}</span><span>طرابلس، ليبيا</span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-full" style={{ width: 34, height: 34, background: C.panelSoft, border: `1px solid ${C.border}`, color: C.tealB }}>
                <FacebookIcon size={16} color={C.tealB} />
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-full" style={{ width: 34, height: 34, background: C.panelSoft, border: `1px solid ${C.border}`, color: C.tealB }}>
                <InstagramIcon size={16} color={C.tealB} />
              </a>
              <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-full" style={{ width: 34, height: 34, background: C.panelSoft, border: `1px solid ${C.border}`, color: C.tealB }}>
                <TikTokIcon size={16} color={C.tealB} />
              </a>
            </div>
          </div>
        </div>
        <div className="text-center mt-8" style={{ color: C.mutedLight, fontSize: 11.5 }}>NOVA SHOP © {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
}

function Field({ label, icon: Icon, error, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5" style={{ fontSize: 12.5, color: "#6B7684" }}>{Icon && <Icon size={13} />} {label}</span>
      {children}
      {error && <span style={{ fontSize: 11.5, color: "#E2837D" }}>{error}</span>}
    </label>
  );
}

const inputStyle = { background: "#F0FAFB", border: "1px solid #E3E8ED", borderRadius: 10, padding: "11px 14px", color: "#1B2430", fontSize: 14, fontFamily: "'IBM Plex Sans Arabic', sans-serif", width: "100%" };