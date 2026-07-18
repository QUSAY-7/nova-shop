
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
  images: [], // أضف روابط صورك الحقيقية هنا لاستبدال الرسم التوضيحي
};

const FEATURES = [
  { icon: ShieldCheck, title: "حماية RFID فعلية", body: "طبقة معدنية تمنع أي جهاز قراءة عن بُعد من نسخ بيانات بطاقتك دون علمك." },
  { icon: CreditCard, title: "تتسع لـ 6 بطاقات", body: "تصميم رفيع بسماكة 8.5 مم فقط، يدخل بسهولة في أي جيب دون أن يثقله." },
  { icon: Truck, title: "توصيل لكل مدن ليبيا", body: "من طرابلس إلى بنغازي وسبها، شحن يصل لباب بيتك أينما كنت." },
  { icon: MessageCircle, title: "فحص قبل الدفع", body: "تتأكد من منتجك أولاً، وتدفع براحتك كاش أو تحويل بنكي." },
];

const FAQ = [
  { q: "كيف تحمي المحفظة بطاقاتي فعلياً؟", a: "تحتوي على غلاف معدني (Faraday Cage) يحجب موجات الراديو المستخدمة في قراءة الشريحة عن بُعد، فلا يستطيع أي جهاز خارجي التقاط بيانات بطاقتك ما دامت داخلها." },
  { q: "هل تناسب جميع أنواع البطاقات؟", a: "نعم، تناسب بطاقات الصراف الآلي، بطاقات الائتمان، والهوية، بمقاس قياسي يتسع حتى 6 بطاقات." },
  { q: "كم تستغرق مدة التوصيل؟", a: "عادة من يوم إلى 3 أيام حسب مدينتك، وسيتواصل معك مندوب التوصيل قبل الوصول." },
];

/* ---------------------------------------------------------
   الرسم التوضيحي للمنتج
--------------------------------------------------------- */
function WalletArt() {
  return (
    <div className="wallet-wrap">
      <div className="wallet-glow" />
      <div className="wallet-float">
        <div className="card-back card-back-1" />
        <div className="card-back card-back-2" />
        <div className="wallet-body">
          <div className="wallet-noise" />
          <div className="wallet-scan-clip">
            <div className="scan-line" />
          </div>
          <div className="wallet-foot">
            <span>NOVA</span>
            <ShieldCheck className="ic-16" />
          </div>
        </div>
        <div className="badge-pulse">
          <ShieldCheck className="ic-20 white" />
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
    <div dir="rtl" className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Tajawal:wght@300;400;500;700&display=swap');

        :root{
          --bg:#F3F7F8; --surface:#FFFFFF; --ink:#0B2027; --muted:#5B7278;
          --teal:#0E7C86; --teal-dark:#0A5A61; --teal-light:#E7F3F3;
          --gold:#C89B3C; --success:#1C9963; --line:#E3ECED;
          --container: 480px;
          --radius-lg: 22px;
          --radius-md: 16px;
        }
        *{ box-sizing:border-box; }
        .app{
          min-height:100vh;
          background:var(--bg);
          color:var(--ink);
          font-family:'Tajawal', sans-serif;
          padding-bottom: 96px;
        }
        .font-display{ font-family:'Almarai', sans-serif; }
        img,svg{ display:block; }
        a{ text-decoration:none; color:inherit; }
        button{ font-family:inherit; cursor:pointer; border:none; }

        .container{
          max-width: var(--container);
          margin: 0 auto;
          padding: 0 16px;
        }

        /* ---------- Header ---------- */
        .header{
          position: sticky; top:0; z-index:40;
          background: rgba(243,247,248,0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--line);
        }
        .header-inner{
          max-width: var(--container);
          margin:0 auto;
          padding: 0 16px;
          height:64px;
          display:flex; align-items:center; justify-content:space-between;
        }
        .icon-btn{
          width:40px; height:40px; border-radius:999px;
          display:flex; align-items:center; justify-content:center;
          background:var(--surface); border:1px solid var(--line);
          transition: transform .15s ease;
        }
        .icon-btn:active{ transform: scale(.94); }
        .icon-btn.solid{ background:var(--teal); border-color:var(--teal); color:#fff; position:relative; }
        .logo{ font-family:'Almarai',sans-serif; font-weight:800; font-size:20px; color:var(--teal-dark); }
        .logo .accent{ color:var(--gold); }
        .cart-badge{
          position:absolute; top:-4px; left:-4px; min-width:18px; height:18px; padding:0 4px;
          border-radius:999px; background:var(--gold); color:#fff; font-size:10px; font-weight:700;
          display:flex; align-items:center; justify-content:center;
        }

        /* ---------- Drawers ---------- */
        .drawer-overlay{
          position:fixed; inset:0; z-index:50; display:flex; justify-content:flex-end;
        }
        .drawer-backdrop{ position:absolute; inset:0; background:rgba(0,0,0,.4); }
        .drawer{
          position:relative; width:280px; max-width:82%; height:100%;
          background:#fff; box-shadow:-8px 0 30px rgba(0,0,0,.15);
          padding:20px; display:flex; flex-direction:column;
          animation: slideIn .22s ease;
        }
        @keyframes slideIn{ from{ transform:translateX(100%);} to{ transform:translateX(0);} }
        .drawer-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:28px; }
        .drawer-title{ font-family:'Almarai',sans-serif; font-weight:800; font-size:17px; }
        .drawer-nav{ display:flex; flex-direction:column; gap:2px; }
        .drawer-nav a{ padding:13px 12px; border-radius:12px; font-size:15px; font-weight:500; transition: background .15s; }
        .drawer-nav a:active{ background:var(--teal-light); }
        .drawer-foot{ margin-top:auto; padding-top:20px; border-top:1px solid var(--line); }
        .wa-link{ display:flex; align-items:center; gap:8px; padding:13px 12px; border-radius:12px; font-weight:700; color:var(--success); font-size:15px; }

        .cart-line{ display:flex; gap:12px; padding:12px; border-radius:16px; background:var(--teal-light); }
        .cart-thumb{ width:60px; height:60px; border-radius:12px; flex-shrink:0; background:linear-gradient(160deg,#12333a,#0A1F24); }
        .cart-name{ font-size:14px; font-weight:700; }
        .cart-code{ font-size:11px; color:var(--muted); margin-top:2px; }
        .cart-price{ font-size:14px; font-weight:700; color:var(--teal-dark); margin-top:4px; }

        .qty-row{ display:flex; align-items:center; justify-content:space-between; }
        .qty-label{ font-size:14px; font-weight:700; }
        .qty-control{ display:flex; align-items:center; gap:14px; background:var(--bg); border-radius:999px; padding:5px 6px; }
        .qty-btn{ width:34px; height:34px; border-radius:999px; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.12); display:flex; align-items:center; justify-content:center; }
        .qty-btn:active{ transform: scale(.94); }
        .qty-val{ width:20px; text-align:center; font-weight:700; }

        .cart-total-row{ margin-top:auto; padding-top:16px; border-top:1px solid var(--line); }
        .total-line{ display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
        .total-amount{ font-family:'Almarai',sans-serif; font-weight:800; font-size:20px; color:var(--teal-dark); }

        .cta-button{
          width:100%; display:flex; align-items:center; justify-content:center; gap:8px;
          padding:15px; border-radius:18px; background:var(--teal); color:#fff;
          font-weight:800; font-size:15px; box-shadow:0 10px 24px rgba(14,124,134,.25);
          transition: transform .15s ease;
        }
        .cta-button:active{ transform: scale(.98); }

        /* ---------- Hero ---------- */
        .hero{ padding: 28px 0 8px; }
        .hero-top{ display:flex; flex-direction:column; align-items:center; text-align:center; gap:10px; }
        .eyebrow{ font-size:12px; font-weight:700; padding:6px 14px; border-radius:999px; background:var(--teal-light); color:var(--teal-dark); }
        .h1{ font-family:'Almarai',sans-serif; font-weight:800; font-size:26px; line-height:1.5; max-width:380px; }

        .wallet-wrap{ position:relative; width:100%; max-width:280px; aspect-ratio:1/1; margin:20px auto 0; display:flex; align-items:center; justify-content:center; }
        .wallet-glow{ position:absolute; inset:24px; border-radius:32px; filter:blur(30px); opacity:.4; background: radial-gradient(circle at 50% 40%, var(--teal), transparent 70%); }
        .wallet-float{ position:relative; width:180px; height:230px; animation: floatY 4.5s ease-in-out infinite; }
        @keyframes floatY{ 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-6px);} }
        .card-back{ position:absolute; width:150px; height:96px; border-radius:14px; box-shadow:0 14px 24px rgba(0,0,0,.18); }
        .card-back-1{ right:-8px; top:14px; transform:rotate(-8deg); background:linear-gradient(135deg,#2a3f47,#0B2027); }
        .card-back-2{ left:-6px; top:8px; transform:rotate(6deg); background:linear-gradient(135deg,var(--gold),#8a6a22); }
        .wallet-body{
          position:absolute; inset:52px 12px 12px 12px; border-radius:18px; overflow:hidden;
          background:linear-gradient(160deg,#12333a,#0A1F24); box-shadow:0 20px 40px rgba(0,0,0,.28);
          border:1px solid rgba(255,255,255,.08);
        }
        .wallet-noise{ position:absolute; inset:0; opacity:.18; background-image: repeating-linear-gradient(115deg, rgba(255,255,255,.09) 0px, rgba(255,255,255,.09) 1px, transparent 1px, transparent 10px); }
        .wallet-scan-clip{ position:absolute; inset:0; overflow:hidden; }
        .scan-line{ position:absolute; inset-inline:0; height:34px; background:linear-gradient(180deg, transparent, rgba(45,212,191,.55), transparent); animation: scan 3.4s ease-in-out infinite; }
        @keyframes scan{ 0%{ transform:translateY(-160%); opacity:0;} 12%{ opacity:1;} 88%{ opacity:1;} 100%{ transform:translateY(260%); opacity:0;} }
        .wallet-foot{ position:absolute; bottom:10px; inset-inline:10px; display:flex; align-items:center; justify-content:space-between; }
        .wallet-foot span{ font-family:'Almarai',sans-serif; font-size:10px; letter-spacing:2px; color:rgba(255,255,255,.5); }
        .badge-pulse{
          position:absolute; top:-6px; right:-6px; width:42px; height:42px; border-radius:999px;
          background:var(--teal); display:flex; align-items:center; justify-content:center; box-shadow:0 6px 16px rgba(0,0,0,.2);
          animation: pulseRing 2.2s ease-out infinite;
        }
        @keyframes pulseRing{ 0%{ box-shadow:0 0 0 0 rgba(14,124,134,.35);} 100%{ box-shadow:0 0 0 14px rgba(14,124,134,0);} }

        .ic-16{ width:16px; height:16px; color:rgba(160,220,215,.7); }
        .ic-20{ width:20px; height:20px; }
        .white{ color:#fff; }

        .trust-row{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:24px; }
        .trust-item{ display:flex; flex-direction:column; align-items:center; gap:6px; padding:14px 6px; border-radius:18px; background:var(--surface); border:1px solid var(--line); }
        .trust-item svg{ width:20px; height:20px; color:var(--teal); }
        .trust-item span{ font-size:11px; font-weight:500; color:var(--muted); text-align:center; line-height:1.3; }

        /* ---------- Sections ---------- */
        .section{ padding: 24px 0; }
        .section-title{ font-family:'Almarai',sans-serif; font-weight:800; font-size:19px; margin-bottom:14px; }

        .features-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
        .feature-card{ padding:16px; border-radius:18px; background:var(--surface); border:1px solid var(--line); }
        .feature-icon{ width:36px; height:36px; border-radius:12px; background:var(--teal-light); display:flex; align-items:center; justify-content:center; margin-bottom:10px; }
        .feature-icon svg{ width:18px; height:18px; color:var(--teal-dark); }
        .feature-title{ font-size:13px; font-weight:700; margin-bottom:4px; }
        .feature-body{ font-size:12px; line-height:1.6; color:var(--muted); }

        /* ---------- Product card ---------- */
        .product-card{ padding:20px; border-radius: var(--radius-lg); background:var(--surface); border:1px solid var(--line); }
        .tag-row{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
        .tag{ font-size:11px; font-weight:700; padding:5px 10px; border-radius:999px; background:var(--teal-light); color:var(--teal-dark); }
        .code{ font-size:11px; color:var(--muted); }
        .product-title{ font-family:'Almarai',sans-serif; font-weight:800; font-size:22px; margin-top:4px; }
        .product-desc{ font-size:14px; line-height:1.7; color:var(--muted); margin-top:6px; }
        .price-row{ display:flex; align-items:baseline; gap:8px; margin-top:12px; }
        .price{ font-family:'Almarai',sans-serif; font-weight:800; font-size:28px; color:var(--teal-dark); }
        .price-compare{ font-size:14px; color:var(--muted); text-decoration:line-through; }

        .dims-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:16px; }
        .dim{ text-align:center; padding:10px 4px; border-radius:14px; background:var(--bg); }
        .dim-label{ font-size:11px; color:var(--muted); }
        .dim-value{ font-size:14px; font-weight:700; margin-top:2px; }

        .field-block{ margin-top:20px; }
        .field-label{ font-size:14px; font-weight:700; display:block; margin-bottom:10px; }

        .payment-grid{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .pay-btn{
          display:flex; align-items:center; justify-content:center; gap:8px;
          padding:13px; border-radius:14px; font-size:14px; font-weight:700;
          background:transparent; border:1px solid var(--line); color:var(--ink);
          transition: all .15s ease;
        }
        .pay-btn svg{ width:16px; height:16px; }
        .pay-btn.active{ background:var(--teal); border-color:var(--teal); color:#fff; }

        .bank-box{ margin-top:12px; display:flex; align-items:center; justify-content:space-between; gap:8px; padding:12px; border-radius:14px; background:var(--teal-light); }
        .bank-number{ font-size:12px; font-family: monospace; letter-spacing:.5px; color:var(--teal-dark); direction:ltr; }
        .copy-btn{ width:32px; height:32px; border-radius:999px; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.12); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .copy-btn svg{ width:14px; height:14px; }
        .copy-btn .ok{ color:var(--success); }

        .order-cta{ margin-top:20px; }

        /* ---------- FAQ ---------- */
        .faq-list{ display:flex; flex-direction:column; gap:8px; }
        .faq-item{ border-radius:16px; background:var(--surface); border:1px solid var(--line); overflow:hidden; }
        .faq-question{ width:100%; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:15px; text-align:right; background:transparent; }
        .faq-question span{ font-size:14px; font-weight:700; }
        .faq-question svg{ width:16px; height:16px; flex-shrink:0; }
        .faq-answer{ padding:0 15px 15px; font-size:13px; line-height:1.7; color:var(--muted); }

        /* ---------- Footer ---------- */
        .footer{ text-align:center; padding:36px 16px; }
        .footer-name{ font-family:'Almarai',sans-serif; font-weight:800; font-size:17px; color:var(--teal-dark); }
        .footer-tag{ font-size:12px; color:var(--muted); margin-top:4px; }
        .footer-wa{ display:inline-flex; align-items:center; gap:8px; margin-top:14px; font-size:14px; font-weight:700; color:var(--success); }
        .footer-wa svg{ width:16px; height:16px; }

        /* ---------- Sticky mobile bar ---------- */
        .sticky-bar{ position:fixed; bottom:0; inset-inline:0; z-index:30; }
        .sticky-bar-inner{ max-width: var(--container); margin:0 auto; padding:8px 16px 16px; }
        .sticky-card{ display:flex; align-items:center; gap:12px; padding:10px; border-radius:18px; background:var(--surface); border:1px solid var(--line); box-shadow:0 -6px 24px rgba(0,0,0,.08); }
        .sticky-total-label{ font-size:10px; color:var(--muted); }
        .sticky-total-amount{ font-family:'Almarai',sans-serif; font-weight:800; color:var(--teal-dark); }
        .sticky-cta{ flex:1; display:flex; align-items:center; justify-content:center; gap:8px; padding:13px; border-radius:14px; background:var(--teal); color:#fff; font-weight:700; }
        .sticky-cta svg{ width:18px; height:18px; }

        /* =====================================================
           التابلت — من 640px
        ===================================================== */
        @media (min-width: 640px){
          :root{ --container: 680px; }
          .h1{ font-size:30px; max-width:460px; }
          .wallet-wrap{ max-width:320px; }
          .features-grid{ grid-template-columns:repeat(2,1fr); gap:14px; }
          .trust-row{ gap:12px; }
          .product-card{ padding:28px; }
          .dims-grid{ max-width:420px; margin-inline:auto; }
        }

        /* =====================================================
           اللابتوب / الشاشات الكبيرة — من 1024px
        ===================================================== */
        @media (min-width: 1024px){
          :root{ --container: 1080px; }
          .app{ padding-bottom:40px; }

          .hero .container{
            display:grid; grid-template-columns: 1.1fr 0.9fr; align-items:center; gap:48px; text-align:right;
          }
          .hero-top{ align-items:flex-start; text-align:right; }
          .h1{ font-size:38px; max-width:520px; }
          .wallet-wrap{ margin:0; max-width:380px; }
          .trust-row{ grid-column: 1 / -1; grid-template-columns:repeat(3,1fr); max-width:520px; margin-top:32px; }

          .section .container{ max-width:1080px; }
          .features-grid{ grid-template-columns:repeat(4,1fr); gap:16px; }
          .feature-card{ padding:20px; }

          #product .container{ max-width:640px; }
          .faq-list{ max-width:720px; }

          .sticky-bar{ display:none; }
        }
      `}</style>

      {/* ===== Header ===== */}
      <header className="header">
        <div className="header-inner">
          <button onClick={() => setMenuOpen(true)} className="icon-btn" aria-label="القائمة">
            <Menu size={19} />
          </button>

          <a href="#home" className="logo">
            NOVA <span className="accent">SHOP</span>
          </a>

          <button onClick={() => setCartOpen(true)} className="icon-btn solid" aria-label="السلة">
            <ShoppingBag size={19} />
            {qty > 0 && <span className="cart-badge">{qty}</span>}
          </button>
        </div>
      </header>

      {/* ===== Sidebar drawer ===== */}
      {menuOpen && (
        <div className="drawer-overlay">
          <div className="drawer-backdrop" onClick={() => setMenuOpen(false)} />
          <div className="drawer">
            <div className="drawer-head">
              <span className="drawer-title">القائمة</span>
              <button onClick={() => setMenuOpen(false)} className="icon-btn">
                <X size={16} />
              </button>
            </div>
            <nav className="drawer-nav">
              {MENU_ITEMS.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="drawer-foot">
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="wa-link">
                <MessageCircle size={18} /> تواصل عبر واتساب
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ===== Cart drawer ===== */}
      {cartOpen && (
        <div className="drawer-overlay">
          <div className="drawer-backdrop" onClick={() => setCartOpen(false)} />
          <div className="drawer">
            <div className="drawer-head">
              <span className="drawer-title">سلتك</span>
              <button onClick={() => setCartOpen(false)} className="icon-btn">
                <X size={16} />
              </button>
            </div>

            <div className="cart-line">
              <div className="cart-thumb" />
              <div>
                <p className="cart-name">{PRODUCT.name}</p>
                <p className="cart-code">{PRODUCT.code}</p>
                <p className="cart-price">{PRODUCT.price} د.ل</p>
              </div>
            </div>

            <div className="qty-row" style={{ marginTop: 16 }}>
              <span className="qty-label">الكمية</span>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  <Minus size={14} />
                </button>
                <span className="qty-val">{qty}</span>
                <button className="qty-btn" onClick={() => setQty((q) => q + 1)}>
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="cart-total-row">
              <div className="total-line">
                <span className="qty-label">الإجمالي</span>
                <span className="total-amount">{total} د.ل</span>
              </div>
              <a href={waLink} target="_blank" rel="noreferrer" className="cta-button">
                <MessageCircle size={18} /> إتمام الطلب عبر واتساب
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ===== Hero ===== */}
      <section id="home" className="hero">
        <div className="container">
          <div className="hero-top">
            <span className="eyebrow">توصيل لكل مدن ليبيا 🇱🇾</span>
            <h1 className="h1">{PRODUCT.tagline}</h1>

            <div className="trust-row">
              {[
                { icon: Truck, label: "شحن لكل المدن" },
                { icon: ShieldCheck, label: "فحص قبل الدفع" },
                { icon: MessageCircle, label: "دعم واتساب" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="trust-item">
                  <Icon />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <WalletArt />
        </div>
      </section>

      {/* ===== Why Nova ===== */}
      <section id="why" className="section">
        <div className="container">
          <h2 className="section-title">لماذا هذه المحفظة</h2>
          <div className="features-grid">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="feature-card">
                <div className="feature-icon">
                  <Icon />
                </div>
                <p className="feature-title">{title}</p>
                <p className="feature-body">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Product / Order ===== */}
      <section id="product" className="section">
        <div className="container">
          <div className="product-card">
            <div className="tag-row">
              <span className="tag">{PRODUCT.category}</span>
              <span className="code">{PRODUCT.code}</span>
            </div>

            <h3 className="product-title">{PRODUCT.name}</h3>
            <p className="product-desc">يمنع نسخ بيانات بطاقتك المصرفية عن بُعد أثناء التنقل اليومي.</p>

            <div className="price-row">
              <span className="price">{PRODUCT.price} د.ل</span>
              {PRODUCT.compareAt && <span className="price-compare">{PRODUCT.compareAt} د.ل</span>}
            </div>

            <div className="dims-grid">
              {PRODUCT.dims.map((d) => (
                <div key={d.label} className="dim">
                  <p className="dim-label">{d.label}</p>
                  <p className="dim-value">{d.value}</p>
                </div>
              ))}
            </div>

            <div className="field-block">
              <div className="qty-row">
                <span className="field-label" style={{ marginBottom: 0 }}>الكمية</span>
                <div className="qty-control">
                  <button className="qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                    <Minus size={16} />
                  </button>
                  <span className="qty-val">{qty}</span>
                  <button className="qty-btn" onClick={() => setQty((q) => q + 1)}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="field-block">
              <span className="field-label">طريقة الدفع</span>
              <div className="payment-grid">
                <button
                  onClick={() => setPayment("cash")}
                  className={`pay-btn ${payment === "cash" ? "active" : ""}`}
                >
                  <Banknote /> كاش
                </button>
                <button
                  onClick={() => setPayment("bank")}
                  className={`pay-btn ${payment === "bank" ? "active" : ""}`}
                >
                  <Landmark /> تحويل بنكي
                </button>
              </div>

              {payment === "bank" && (
                <div className="bank-box">
                  <span className="bank-number">{BANK_ACCOUNT}</span>
                  <button onClick={copyAccount} className="copy-btn">
                    {copied ? <Check className="ok" /> : <Copy />}
                  </button>
                </div>
              )}
            </div>

            <a href={waLink} target="_blank" rel="noreferrer" className="cta-button order-cta">
              <MessageCircle size={18} /> اطلب الآن — {total} د.ل
            </a>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="section">
        <div className="container">
          <h2 className="section-title">الأسئلة الشائعة</h2>
          <div className="faq-list">
            {FAQ.map((item, i) => (
              <div key={item.q} className="faq-item">
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                  <span>{item.q}</span>
                  {openFaq === i ? <ChevronLeft /> : <ChevronRight style={{ transform: "rotate(180deg)" }} />}
                </button>
                {openFaq === i && <p className="faq-answer">{item.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer id="contact" className="footer">
        <p className="footer-name">NOVA SHOP</p>
        <p className="footer-tag">توصيل لكل مدن ليبيا، بثقة من أول طلب</p>
        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="footer-wa">
          <MessageCircle /> {WHATSAPP_NUMBER}
        </a>
      </footer>

      {/* ===== Sticky mobile/tablet order bar ===== */}
      <div className="sticky-bar">
        <div className="sticky-bar-inner">
          <div className="sticky-card">
            <div style={{ padding: "0 4px" }}>
              <p className="sticky-total-label">الإجمالي</p>
              <p className="sticky-total-amount">{total} د.ل</p>
            </div>
            <a href={waLink} target="_blank" rel="noreferrer" className="sticky-cta">
              <MessageCircle /> اطلب الآن
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}