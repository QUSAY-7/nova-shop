import React, { useState } from "react";
import {
  ShoppingBag,
  Menu,
  X,
  ShieldCheck,
  Truck,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  CreditCard,
  Minus,
  Plus,
  Banknote,
  Landmark,
} from "lucide-react";

/* ---------------------------------------------------------
   إعدادات المتجر — عدّل هذه القيم فقط عند الحاجة
--------------------------------------------------------- */
const WHATSAPP_NUMBER = "218931739453"; // بصيغة دولية بدون + أو أصفار زائدة
const BANK_ACCOUNT = "LY25025010113475443410011";

const MENU_ITEMS = [
  { label: "الرئيسية", href: "#home" },
  { label: "المنتج", href: "#product" },
  { label: "لماذا نوفا", href: "#why" },
  { label: "الأسئلة الشائعة", href: "#faq" },
  { label: "تواصل معنا", href: "#contact" },
];

const PRODUCT = {
  code: "NV-0104",
  category: "حماية البطاقات",
  name: "محفظة بطاقات مصرفية",
  tagline: "دِرعك الرقمي لبطاقاتك — يمنع نسخ بياناتك المصرفية عن بُعد أثناء تنقلك اليومي",
  price: 45,
  compareAt: 65,
  dims: [
    { label: "الطول", value: "97 مم" },
    { label: "العرض", value: "63 مم" },
    { label: "السماكة", value: "8.5 مم" },
  ],
  // أضف روابط صورك الحقيقية هنا لتحل محل الرسم التوضيحي، مثال: ["/img/1.jpg","/img/2.jpg"]
  images: [],
};

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "حماية RFID فعلية",
    body: "طبقة معدنية تمنع أي جهاز قراءة عن بُعد من نسخ بيانات بطاقتك دون علمك.",
  },
  {
    icon: CreditCard,
    title: "تتسع لـ 6 بطاقات",
    body: "تصميم رفيع بسماكة 8.5 مم فقط، يدخل بسهولة في أي جيب دون أن يثقله.",
  },
  {
    icon: Truck,
    title: "توصيل لكل مدن ليبيا",
    body: "من طرابلس إلى بنغازي وسبها، شحن يصل لباب بيتك أينما كنت.",
  },
  {
    icon: MessageCircle,
    title: "فحص قبل الدفع",
    body: "تتأكد من منتجك أولاً، وتدفع براحتك كاش أو تحويل بنكي.",
  },
];

const FAQ = [
  {
    q: "كيف تحمي المحفظة بطاقاتي فعلياً؟",
    a: "تحتوي على غلاف معدني (Faraday Cage) يحجب موجات الراديو المستخدمة في قراءة الشريحة عن بُعد، فلا يستطيع أي جهاز خارجي التقاط بيانات بطاقتك ما دامت داخلها.",
  },
  {
    q: "هل تناسب جميع أنواع البطاقات؟",
    a: "نعم، تناسب بطاقات الصراف الآلي، بطاقات الائتمان، والهوية، بمقاس قياسي يتسع حتى 6 بطاقات.",
  },
  {
    q: "كم تستغرق مدة التوصيل؟",
    a: "عادة من يوم إلى 3 أيام حسب مدينتك، وسيتواصل معك مندوب التوصيل قبل الوصول.",
  },
];

/* ---------------------------------------------------------
   الرسم التوضيحي للمنتج (يُستخدم إن لم تُضف صور حقيقية)
--------------------------------------------------------- */
function WalletArt() {
  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto flex items-center justify-center">
      <div
        className="absolute inset-6 rounded-[2rem] blur-2xl opacity-40"
        style={{ background: "radial-gradient(circle at 50% 40%, var(--teal), transparent 70%)" }}
      />
      <div className="relative w-56 h-72 float">
        {/* البطاقات خلف المحفظة */}
        <div className="absolute -left-3 top-8 w-48 h-30 rounded-xl shadow-lg rotate-[-8deg]"
             style={{ background: "linear-gradient(135deg,#2a3f47,#0B2027)", height: "7.5rem" }} />
        <div className="absolute -right-2 top-4 w-48 h-30 rounded-xl shadow-lg rotate-[6deg]"
             style={{ background: "linear-gradient(135deg,var(--gold),#8a6a22)", height: "7.5rem" }} />
        {/* جسم المحفظة */}
        <div
          className="absolute inset-x-4 top-16 bottom-4 rounded-2xl shadow-2xl overflow-hidden border border-white/10"
          style={{ background: "linear-gradient(160deg,#12333a,#0A1F24)" }}
        >
          <div className="absolute inset-0 opacity-20"
               style={{ backgroundImage: "repeating-linear-gradient(115deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 10px)" }} />
          <div className="absolute inset-0 overflow-hidden">
            <div className="scan-line absolute inset-x-0 h-10"
                 style={{ background: "linear-gradient(180deg, transparent, rgba(45,212,191,0.55), transparent)" }} />
          </div>
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
            <span className="text-[10px] tracking-widest text-white/50 font-display">NOVA</span>
            <ShieldCheck className="w-4 h-4 text-teal-200/70" />
          </div>
        </div>
        {/* شارة الحماية */}
        <div className="pulse-badge absolute -top-2 -left-2 w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
             style={{ background: "var(--teal)" }}>
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [payment, setPayment] = useState("cash");
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const total = PRODUCT.price * qty;

  const orderMessage = () => {
    const lines = [
      "طلب جديد من NOVA SHOP",
      `المنتج: ${PRODUCT.name} (${PRODUCT.code})`,
      `الكمية: ${qty}`,
      `الإجمالي: ${total} د.ل`,
      `طريقة الدفع: ${payment === "cash" ? "كاش عند الاستلام" : "تحويل بنكي"}`,
    ];
    if (payment === "bank") lines.push(`رقم الحساب: ${BANK_ACCOUNT}`);
    return encodeURIComponent(lines.join("\n"));
  };

  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${orderMessage()}`;

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(BANK_ACCOUNT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      /* noop */
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen pb-24 lg:pb-0"
      style={{ background: "var(--bg)", fontFamily: "'Tajawal', sans-serif", color: "var(--ink)" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Tajawal:wght@300;400;500;700&display=swap');
        :root{
          --bg:#F3F7F8; --surface:#FFFFFF; --ink:#0B2027; --muted:#5B7278;
          --teal:#0E7C86; --teal-dark:#0A5A61; --teal-light:#E7F3F3;
          --gold:#C89B3C; --success:#1C9963; --line:#E3ECED;
        }
        .font-display{ font-family:'Almarai', sans-serif; }
        @keyframes scan{
          0%{ transform:translateY(-140%); opacity:0; }
          12%{ opacity:1; }
          88%{ opacity:1; }
          100%{ transform:translateY(140%); opacity:0; }
        }
        .scan-line{ animation: scan 3.4s ease-in-out infinite; }
        @keyframes pulseRing{
          0%{ box-shadow:0 0 0 0 rgba(14,124,134,.35); }
          100%{ box-shadow:0 0 0 14px rgba(14,124,134,0); }
        }
        .pulse-badge{ animation: pulseRing 2.2s ease-out infinite; }
        @keyframes floatY{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-6px); } }
        .float{ animation: floatY 4.5s ease-in-out infinite; }
        .no-scrollbar::-webkit-scrollbar{ display:none; }
        .no-scrollbar{ -ms-overflow-style:none; scrollbar-width:none; }
        @media (prefers-reduced-motion: reduce){
          .scan-line,.pulse-badge,.float{ animation:none !important; }
        }
      `}</style>

      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: "rgba(243,247,248,0.85)", borderBottom: "1px solid var(--line)" }}>
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => setMenuOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
            style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
            aria-label="القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>

          <a href="#home" className="font-display font-extrabold text-xl tracking-tight" style={{ color: "var(--teal-dark)" }}>
            NOVA <span style={{ color: "var(--gold)" }}>SHOP</span>
          </a>

          <button
            onClick={() => setCartOpen(true)}
            className="relative w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
            style={{ background: "var(--teal)" }}
            aria-label="السلة"
          >
            <ShoppingBag className="w-5 h-5 text-white" />
            {qty > 0 && (
              <span
                className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] flex items-center justify-center text-white font-bold"
                style={{ background: "var(--gold)" }}
              >
                {qty}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ===== Sidebar drawer (عمودي) ===== */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="relative w-72 max-w-[80%] h-full bg-white shadow-2xl p-5 flex flex-col animate-[slideIn_.25s_ease]">
            <div className="flex items-center justify-between mb-8">
              <span className="font-display font-extrabold text-lg" style={{ color: "var(--teal-dark)" }}>القائمة</span>
              <button onClick={() => setMenuOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--teal-light)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {MENU_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="py-3 px-3 rounded-xl text-[15px] font-medium transition hover:bg-[var(--teal-light)]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-auto pt-6 border-t" style={{ borderColor: "var(--line)" }}>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 py-3 px-3 rounded-xl text-[15px] font-medium"
                style={{ color: "var(--success)" }}
              >
                <MessageCircle className="w-5 h-5" /> تواصل عبر واتساب
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ===== Cart drawer ===== */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="relative w-80 max-w-[85%] h-full bg-white shadow-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display font-extrabold text-lg">سلتك</span>
              <button onClick={() => setCartOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--teal-light)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-3 p-3 rounded-2xl" style={{ background: "var(--teal-light)" }}>
              <div className="w-16 h-16 rounded-xl shrink-0" style={{ background: "linear-gradient(160deg,#12333a,#0A1F24)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{PRODUCT.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{PRODUCT.code}</p>
                <p className="text-sm font-bold mt-1" style={{ color: "var(--teal-dark)" }}>{PRODUCT.price} د.ل</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-sm" style={{ color: "var(--muted)" }}>الكمية</span>
              <div className="flex items-center gap-3 rounded-full px-1" style={{ background: "var(--teal-light)" }}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm active:scale-95">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-5 text-center text-sm font-bold">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm active:scale-95">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">الإجمالي</span>
                <span className="text-xl font-display font-extrabold" style={{ color: "var(--teal-dark)" }}>{total} د.ل</span>
              </div>
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold shadow-lg active:scale-[.98] transition"
                style={{ background: "var(--teal)" }}
              >
                <MessageCircle className="w-5 h-5" /> إتمام الطلب عبر واتساب
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ===== Hero ===== */}
      <section id="home" className="max-w-3xl mx-auto px-4 pt-10 pb-4">
        <div className="flex flex-col items-center text-center gap-3">
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: "var(--teal-light)", color: "var(--teal-dark)" }}
          >
            توصيل لكل مدن ليبيا 🇱🇾
          </span>
          <h1 className="font-display font-extrabold text-3xl leading-tight max-w-sm">
            {PRODUCT.tagline}
          </h1>
        </div>

        <WalletArt />

        <div className="grid grid-cols-3 gap-2 mt-6">
          {[
            { icon: Truck, label: "شحن لكل المدن" },
            { icon: ShieldCheck, label: "فحص قبل الدفع" },
            { icon: MessageCircle, label: "دعم واتساب" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <Icon className="w-5 h-5" style={{ color: "var(--teal)" }} />
              <span className="text-[11px] font-medium text-center leading-tight" style={{ color: "var(--muted)" }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Why Nova ===== */}
      <section id="why" className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="font-display font-extrabold text-xl mb-4">لماذا هذه المحفظة</h2>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="p-4 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: "var(--teal-light)" }}>
                <Icon className="w-4.5 h-4.5" style={{ color: "var(--teal-dark)" }} />
              </div>
              <p className="text-[13px] font-bold mb-1">{title}</p>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--muted)" }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Product / Order ===== */}
      <section id="product" className="max-w-3xl mx-auto px-4 py-4">
        <div className="rounded-3xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--teal-light)", color: "var(--teal-dark)" }}>
              {PRODUCT.category}
            </span>
            <span className="text-[11px]" style={{ color: "var(--muted)" }}>{PRODUCT.code}</span>
          </div>

          <h3 className="font-display font-extrabold text-2xl mt-2">{PRODUCT.name}</h3>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>
            يمنع نسخ بيانات بطاقتك المصرفية عن بُعد أثناء التنقل اليومي.
          </p>

          <div className="flex items-baseline gap-2 mt-3">
            <span className="font-display font-extrabold text-3xl" style={{ color: "var(--teal-dark)" }}>{PRODUCT.price} د.ل</span>
            {PRODUCT.compareAt && (
              <span className="text-sm line-through" style={{ color: "var(--muted)" }}>{PRODUCT.compareAt} د.ل</span>
            )}
          </div>

          {/* المقاسات */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {PRODUCT.dims.map((d) => (
              <div key={d.label} className="text-center py-2.5 rounded-xl" style={{ background: "var(--bg)" }}>
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>{d.label}</p>
                <p className="text-sm font-bold mt-0.5">{d.value}</p>
              </div>
            ))}
          </div>

          {/* الكمية */}
          <div className="flex items-center justify-between mt-5">
            <span className="text-sm font-bold">الكمية</span>
            <div className="flex items-center gap-4 rounded-full px-1.5 py-1" style={{ background: "var(--bg)" }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-9 h-9 rounded-full flex items-center justify-center bg-white shadow-sm active:scale-95">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-5 text-center font-bold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="w-9 h-9 rounded-full flex items-center justify-center bg-white shadow-sm active:scale-95">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* طريقة الدفع */}
          <div className="mt-5">
            <span className="text-sm font-bold block mb-2">طريقة الدفع</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPayment("cash")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition ${payment === "cash" ? "text-white" : ""}`}
                style={payment === "cash" ? { background: "var(--teal)", borderColor: "var(--teal)" } : { borderColor: "var(--line)", color: "var(--ink)" }}
              >
                <Banknote className="w-4 h-4" /> كاش
              </button>
              <button
                onClick={() => setPayment("bank")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition ${payment === "bank" ? "text-white" : ""}`}
                style={payment === "bank" ? { background: "var(--teal)", borderColor: "var(--teal)" } : { borderColor: "var(--line)", color: "var(--ink)" }}
              >
                <Landmark className="w-4 h-4" /> تحويل بنكي
              </button>
            </div>

            {payment === "bank" && (
              <div className="mt-3 flex items-center justify-between gap-2 p-3 rounded-xl" style={{ background: "var(--teal-light)" }}>
                <span className="text-xs font-mono tracking-wide" style={{ color: "var(--teal-dark)" }} dir="ltr">{BANK_ACCOUNT}</span>
                <button onClick={copyAccount} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm active:scale-95">
                  {copied ? <Check className="w-3.5 h-3.5" style={{ color: "var(--success)" }} /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="w-full mt-5 flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold shadow-lg active:scale-[.98] transition"
            style={{ background: "var(--teal)" }}
          >
            <MessageCircle className="w-5 h-5" /> اطلب الآن — {total} د.ل
          </a>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="font-display font-extrabold text-xl mb-4">الأسئلة الشائعة</h2>
        <div className="flex flex-col gap-2">
          {FAQ.map((item, i) => (
            <div key={item.q} className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                className="w-full flex items-center justify-between gap-3 p-4 text-right"
              >
                <span className="text-sm font-bold">{item.q}</span>
                {openFaq === i ? <ChevronLeft className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0 rotate-180" />}
              </button>
              {openFaq === i && (
                <p className="px-4 pb-4 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer id="contact" className="max-w-3xl mx-auto px-4 py-10 text-center">
        <p className="font-display font-extrabold text-lg" style={{ color: "var(--teal-dark)" }}>NOVA SHOP</p>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>توصيل لكل مدن ليبيا، بثقة من أول طلب</p>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 mt-4 text-sm font-bold"
          style={{ color: "var(--success)" }}
        >
          <MessageCircle className="w-4 h-4" /> {WHATSAPP_NUMBER}
        </a>
      </footer>

      {/* ===== Sticky mobile order bar ===== */}
      <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden">
        <div className="max-w-3xl mx-auto px-4 pb-4 pt-2">
          <div className="flex items-center gap-3 p-2.5 rounded-2xl shadow-2xl" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
            <div className="px-2">
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>الإجمالي</p>
              <p className="font-display font-extrabold" style={{ color: "var(--teal-dark)" }}>{total} د.ل</p>
            </div>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold active:scale-[.98] transition"
              style={{ background: "var(--teal)" }}
            >
              <MessageCircle className="w-4.5 h-4.5" /> اطلب الآن
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}