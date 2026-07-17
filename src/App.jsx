import { useState, useMemo } from "react";
import {
  ShoppingBag, X, Plus, Minus, Check, Phone, User, MapPin, ChevronLeft,
  Watch, BatteryCharging, Lamp, Bluetooth, CreditCard, Headphones,
  Truck, ShieldCheck, MessageCircle, Search,
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

// غيّر هذا الرقم بأي وقت — بالصيغة الدولية بدون + وبدون صفر البداية (مثال ليبيا: 218 + الرقم بدون 0)
const WHATSAPP_NUMBER = "218912345678";

const CITIES = ["طرابلس", "بنغازي", "مصراتة", "الزاوية", "زليتن", "سبها", "البيضاء", "درنة", "الخمس", "صبراتة", "غريان", "مدينة أخرى"];
const CATEGORIES = ["الكل", "إلكترونيات", "إكسسوارات", "إضاءة", "طاقة"];

const PRODUCTS = [
  { id: "p1", sku: "NV-0104", name: "سوار حماية RFID", category: "إكسسوارات", tag: "حماية البطاقات", price: 45, icon: CreditCard, desc: "يمنع نسخ بيانات بطاقتك المصرفية عن بُعد أثناء التنقل اليومي." },
  { id: "p2", sku: "NV-0091", name: "جهاز تتبع بلوتوث", category: "إلكترونيات", tag: "لا مزيد من الضياع", price: 60, icon: Bluetooth, desc: "علّقه على مفاتيحك أو حقيبتك وتتبّعها لحظيًا من هاتفك." },
  { id: "p3", sku: "NV-0057", name: "ساعة ذكية S11", category: "إلكترونيات", tag: "الأكثر طلبًا", price: 150, icon: Watch, desc: "مكالمات، إشعارات، وقياس صحي كامل — بطارية تدوم أيامًا." },
  { id: "p4", sku: "NV-0132", name: "باور بانك شمسي", category: "طاقة", tag: "طاقة أينما كنت", price: 85, icon: BatteryCharging, desc: "شحن سريع بالطاقة الشمسية، مقاوم للماء والغبار." },
  { id: "p5", sku: "NV-0078", name: "مصباح ذكي G", category: "إضاءة", tag: "إضاءة أجواء", price: 70, icon: Lamp, desc: "تحكم كامل بالألوان والسطوع من التطبيق، يضيف لمسة فاخرة لأي غرفة." },
  { id: "p6", sku: "NV-0145", name: "سماعة بلوتوث رياضية", category: "إلكترونيات", tag: "صوت نقي", price: 55, icon: Headphones, desc: "مقاومة للعرق، اتصال مستقر، وعزل ضوضاء خفيف." },
];

export default function App() {
  const [cart, setCart] = useState({});
  const [view, setView] = useState("store");
  const [cartOpen, setCartOpen] = useState(false);
  const [quickView, setQuickView] = useState(null);
  const [category, setCategory] = useState("الكل");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", city: CITIES[0], area: "", address: "", note: "" });
  const [errors, setErrors] = useState({});
  const [orderNo, setOrderNo] = useState(null);

  const addToCart = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const decFromCart = (id) => setCart((c) => { const n = { ...c }; if (!n[id]) return n; n[id] -= 1; if (n[id] <= 0) delete n[id]; return n; });
  const removeFromCart = (id) => setCart((c) => { const n = { ...c }; delete n[id]; return n; });

  const cartItems = Object.entries(cart).map(([id, qty]) => ({ ...PRODUCTS.find((p) => p.id === id), qty })).filter(Boolean);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);

  const filtered = useMemo(() => PRODUCTS.filter((p) => {
    const inCat = category === "الكل" || p.category === category;
    const inQuery = query.trim() === "" || (p.name + p.tag + p.category).includes(query.trim());
    return inCat && inQuery;
  }), [category, query]);

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
      `طريقة الدفع: نقدًا عند الاستلام`,
    ].filter(Boolean).join("\n");

    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`;
    window.open(waUrl, "_blank");

    setView("success");
  };

  const resetAll = () => {
    setCart({}); setForm({ name: "", phone: "", city: CITIES[0], area: "", address: "", note: "" });
    setErrors({}); setOrderNo(null); setView("store");
  };

  const qvProduct = quickView ? PRODUCTS.find((p) => p.id === quickView) : null;

  return (
    <div dir="rtl" className="min-h-screen w-full" style={{ background: C.bg, color: C.text, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus, select:focus, button:focus-visible { outline: 2px solid ${C.tealB}; outline-offset: 2px; }
        .pcard { transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
        .pcard:hover { transform: translateY(-4px); border-color: ${C.tealB}; box-shadow: 0 16px 32px -16px rgba(20,153,199,0.28); }
        .pcard:hover .quickadd { opacity: 1; transform: translateY(0); }
        .quickadd { opacity: 0; transform: translateY(6px); transition: all .2s ease; }
        ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 8px; }
        .dot { position:absolute; border-radius:50%; }
        .product-row { display: flex; flex-direction: row; gap: 20px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 12px; }
        .product-card { width: 230px; flex-shrink: 0; scroll-snap-align: start; }
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

          <div
            className="hidden sm:flex items-center gap-2 rounded-full px-4 py-2"
            style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 220, background: C.panelSoft, border: `1px solid ${C.border}` }}
          >
            <Search size={15} color={C.muted} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن منتج..." className="bg-transparent w-full" style={{ color: C.text, fontSize: 13, outline: "none", border: "none" }} />
          </div>
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

            <button onClick={() => setView("store")} className="rounded-full px-8 py-3 mt-6" style={{ background: gradient, color: "#fff", fontFamily: "'Tajawal', sans-serif", fontWeight: 800, fontSize: 15 }}>
              تسوّق الآن
            </button>

            <div className="flex flex-wrap justify-center gap-6 mt-8" style={{ fontSize: 13, color: C.muted }}>
              <div className="flex items-center gap-2"><Truck size={16} color={C.tealB} /> شحن لكل المدن</div>
              <div className="flex items-center gap-2"><ShieldCheck size={16} color={C.tealB} /> فحص قبل الدفع</div>
              <div className="flex items-center gap-2"><MessageCircle size={16} color={C.tealB} /> دعم واتساب</div>
            </div>
          </section>

          {/* Section heading */}
          <div className="text-center px-5 mt-6" style={{ maxWidth: 1120, margin: "24px auto 0" }}>
            <h2 style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 800, fontSize: 21 }}>منتجات مختارة بعناية</h2>
            <div className="mx-auto mt-2 rounded-full" style={{ width: 60, height: 3, background: gradient }} />
          </div>

          {/* Category tabs */}
          <section className="px-5 mt-6" style={{ maxWidth: 1120, margin: "24px auto 0" }}>
            <div className="flex gap-2 flex-wrap justify-center pb-4">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className="rounded-full px-4 py-2" style={{ fontSize: 13, background: category === c ? undefined : "transparent", backgroundImage: category === c ? gradient : "none", color: category === c ? "#fff" : C.muted, fontWeight: category === c ? 700 : 500, border: `1px solid ${category === c ? "transparent" : C.border}` }}>
                  {c}
                </button>
              ))}
            </div>
          </section>

          {/* Products */}
          <section className="px-5 py-6" style={{ maxWidth: 1120, margin: "0 auto" }}>
            {filtered.length === 0 ? (
              <p style={{ color: C.muted, fontSize: 14, textAlign: "center", padding: "40px 0" }}>لا توجد منتجات مطابقة لبحثك.</p>
            ) : (
              <div className="product-row">
                {filtered.map((p) => {
                  const Icon = p.icon;
                  const qty = cart[p.id] || 0;
                  return (
                    <div key={p.id} className="pcard product-card rounded-2xl p-5 flex flex-col cursor-pointer" style={{ background: C.panel, border: `1.5px solid ${C.border}` }} onClick={() => setQuickView(p.id)}>
                      <div className="flex items-center justify-center rounded-xl mb-4" style={{ height: 110, background: C.panelSoft }}>
                        <Icon size={38} color={C.tealB} strokeWidth={1.5} />
                      </div>
                      <div className="flex items-center justify-between" style={{ fontSize: 10.5, color: C.mutedLight, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                        <span>{p.sku}</span>
                        <span className="rounded-full px-2 py-0.5" style={{ background: C.badgeBg, color: C.badgeText, fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontWeight: 700 }}>{p.tag}</span>
                      </div>
                      <div style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700, fontSize: 15.5 }}>{p.name}</div>
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <span style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 800, fontSize: 17, color: C.tealB }}>{p.price} د.ل</span>
                        {qty === 0 ? (
                          <button onClick={(e) => { e.stopPropagation(); addToCart(p.id); }} className="quickadd rounded-full px-3.5 py-2 flex items-center gap-1" style={{ background: gradient, color: "#fff", fontSize: 12.5, fontWeight: 700 }}>
                            <Plus size={13} /> أضف
                          </button>
                        ) : (
                          <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-3 rounded-full px-2 py-1" style={{ border: `1px solid ${C.border}` }}>
                            <button onClick={() => addToCart(p.id)} style={{ color: C.tealB }}><Plus size={14} /></button>
                            <span style={{ fontSize: 12.5 }}>{qty}</span>
                            <button onClick={() => decFromCart(p.id)} style={{ color: C.muted }}><Minus size={14} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
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
          <p style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>الدفع نقدًا عند استلام الطلب — لا حاجة لبطاقة أو تحويل.</p>

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
            تأكيد الطلب — الدفع عند الاستلام
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

      {/* Quick view modal */}
      {qvProduct && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-5" style={{ background: "rgba(20,30,40,0.5)" }} onClick={() => setQuickView(null)}>
          <div className="rounded-2xl p-6 w-full" style={{ maxWidth: 480, background: "#fff", border: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end"><button onClick={() => setQuickView(null)} style={{ color: C.muted }}><X size={20} /></button></div>
            <div className="flex items-center justify-center rounded-xl mb-4" style={{ height: 140, background: C.panelSoft }}>
              <qvProduct.icon size={52} color={C.tealB} strokeWidth={1.3} />
            </div>
            <div style={{ fontSize: 11, color: C.mutedLight, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 6 }}>{qvProduct.sku} · {qvProduct.category}</div>
            <h3 style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 800, fontSize: 19 }}>{qvProduct.name}</h3>
            <p style={{ color: C.muted, fontSize: 13.5, lineHeight: 1.9, margin: "10px 0 16px" }}>{qvProduct.desc}</p>
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 800, fontSize: 20, color: C.tealB }}>{qvProduct.price} د.ل</span>
              <button onClick={() => { addToCart(qvProduct.id); setQuickView(null); setCartOpen(true); }} className="rounded-full px-5 py-2.5" style={{ background: gradient, color: "#fff", fontWeight: 700, fontSize: 13.5 }}>
                أضف إلى السلة
              </button>
            </div>
          </div>
        </div>
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
                    <div className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 48, height: 48, background: C.panelSoft }}>
                      <i.icon size={22} color={C.tealB} />
                    </div>
                    <div className="flex-1">
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{i.name}</div>
                      <div style={{ fontSize: 11.5, color: C.mutedLight, marginTop: 2, fontFamily: "'IBM Plex Mono', monospace" }}>{i.sku} · {i.price} د.ل</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => addToCart(i.id)} style={{ color: C.tealB }}><Plus size={15} /></button>
                      <span style={{ fontSize: 13 }}>{i.qty}</span>
                      <button onClick={() => decFromCart(i.id)} style={{ color: C.muted }}><Minus size={15} /></button>
                    </div>
                    <button onClick={() => removeFromCart(i.id)} style={{ color: C.mutedLight }}><X size={16} /></button>
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

      <footer className="px-5 py-10" style={{ borderTop: `1px solid ${C.border}`, marginTop: 30 }}>
        <div className="grid gap-8" style={{ maxWidth: 1120, margin: "0 auto", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          <div>
            <div style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 800, marginBottom: 8 }}>NOVA SHOP</div>
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.8 }}>منتجات مختارة بعناية، بضمان الدفع عند الاستلام.</p>
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
              <span>واتساب: 09xxxxxxxx</span><span>طرابلس، ليبيا</span>
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