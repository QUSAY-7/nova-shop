import React, { useState, useMemo, useEffect } from "react";
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
  Minus,
  Plus,
  Banknote,
  Landmark,
  Headphones,
  Lightbulb,
  Watch,
  CreditCard,
  Smartphone,
  LayoutGrid,
  Trash2,
  Wallet,
  WalletMinimal,
} from "lucide-react";
import { supabase } from "./supabaseClient";

/* ---------------------------------------------------------
  إعدادات المتجر — عدّل هذه القيم فقط عند الحاجة
--------------------------------------------------------- */
const WHATSAPP_NUMBER = "218931739453"; // بصيغة دولية بدون + أو أصفار زائدة
const BANK_ACCOUNT = "LY25025010113475443410011";

const MENU_ITEMS = [
  { label: "الرئيسية", href: "#home" },
  { label: "المنتجات", href: "#products" },
  { label: "لماذا نوفا", href: "#why" },
  { label: "الأسئلة الشائعة", href: "#faq" },
  { label: "تواصل معنا", href: "#contact" },
];

/* أيقونة افتراضية حسب التصنيف — تُستخدم فقط إذا المنتج بدون صورة */
const CATEGORY_ICONS = {
  "إلكترونيات": Headphones,
  "إكسسوارات": CreditCard,
  "إضاءة": Lightbulb,
};
const getCategoryIcon = (category) => CATEGORY_ICONS[category] || LayoutGrid;

const FEATURES = [
  { icon: ShieldCheck, title: "فحص قبل الشحن", body: "كل طلب يُراجع ويُفحص قبل إرساله لك، مهما كان المنتج." },
  { icon: LayoutGrid, title: "تشكيلة متنوعة", body: "إلكترونيات، إكسسوارات، وإضاءة مختارة بعناية لكل الأذواق." },
  { icon: Truck, title: "توصيل لكل مدن ليبيا", body: "من طرابلس إلى بنغازي وسبها، شحن يصل لباب بيتك أينما كنت." },
  { icon: MessageCircle, title: "دعم واتساب مباشر", body: "أي سؤال قبل أو بعد الطلب، فريقنا يرد عليك مباشرة." },
];

const FAQ = [
  { q: "هل أقدر أتأكد من المنتج قبل الدفع؟", a: "نعم، تقدر تفحص طلبك عند الاستلام قبل الدفع إذا اخترت الدفع كاش، وإذا كان تحويل بنكي فريقنا يؤكد لك تفاصيل المنتج قبل الشحن." },
  { q: "هل تشحنون لكل مدن ليبيا؟", a: "نعم، نوصل لجميع المدن الليبية، ومدة التوصيل عادة من يوم إلى 3 أيام حسب موقعك." },
  { q: "كيف أطلب أكثر من منتج بنفس الوقت؟", a: "أضف كل منتج تريده للسلة بالكمية المطلوبة، وعند إتمام الطلب سيصلنا طلب واحد يجمعهم كلهم." },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [cart, setCart] = useState({}); // { [productId]: qty }
  const [payment, setPayment] = useState("cash");
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // ---- بيانات المنتجات من Supabase ----
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        setLoadError(error.message);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const CATEGORIES = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ["الكل", ...unique];
  }, [products]);

  const filteredProducts = useMemo(
    () => (activeCategory === "الكل" ? products : products.filter((p) => p.category === activeCategory)),
    [activeCategory, products]
  );

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ product: products.find((p) => String(p.id) === String (id)), qty }))
        .filter((line) => line.product && line.qty > 0),
    [cart, products]
  );

  const totalQty = cartItems.reduce((sum, l) => sum + l.qty, 0);
  const totalPrice = cartItems.reduce((sum, l) => sum + l.qty * l.product.price, 0);

  const setQty = (id, qty) => {
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  };
  const addToCart = (id) => setQty(id, (cart[id] || 0) + 1);
  const inc = (id) => setQty(id, (cart[id] || 0) + 1);
  const dec = (id) => setQty(id, (cart[id] || 0) - 1);

  const orderMessage = () => {
    const lines = ["طلب جديد من NOVA SHOP", ""];
    cartItems.forEach((l) => {
      const code = l.product.code || l.product.id;
      lines.push(`${l.product.title} (${code}) × ${l.qty} — ${l.product.price * l.qty} د.ل`);
    });
    lines.push("");
    lines.push(`الإجمالي: ${totalPrice} د.ل`);
    lines.push(`طريقة الدفع: ${payment === "cash" ? "كاش عند الاستلام" : "تحويل بنكي"}`);
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

  // يعرض صورة المنتج إن وجدت، وإلا أيقونة افتراضية حسب التصنيف
  const ProductThumb = ({ product }) => {
    if (product.image) {
      return (
        <img
          src={product.image}
          alt={product.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "14px" }}
        />
      );
    }
    const Icon = getCategoryIcon(product.category);
    return <Icon />;
  };

  const CartThumb = ({ product }) => {
    if (product.image) {
      return (
        <img
          src={product.image}
          alt={product.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }}
        />
      );
    }
    const Icon = getCategoryIcon(product.category);
    return <Icon />;
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
        }
        *{ box-sizing:border-box; }
        .app{ min-height:100vh; background:var(--bg); color:var(--ink); font-family:'Tajawal', sans-serif; padding-bottom: 96px; }
        img,svg{ display:block; }
        a{ text-decoration:none; color:inherit; }
        button{ font-family:inherit; cursor:pointer; border:none; background:none; }

        .container{ max-width: var(--container); margin: 0 auto; padding: 0 16px; }

        /* ---------- Header ---------- */
        .header{ position: sticky; top:0; z-index:40; background: rgba(243,247,248,0.9); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
        .header-inner{ max-width: var(--container); margin:0 auto; padding: 0 16px; height:64px; display:flex; align-items:center; justify-content:space-between; }
        .icon-btn{ width:40px; height:40px; border-radius:999px; display:flex; align-items:center; justify-content:center; background:var(--surface); border:1px solid var(--line); transition: transform .15s ease; }
        .icon-btn:active{ transform: scale(.94); }
        .icon-btn.solid{ background:var(--teal); border-color:var(--teal); color:#fff; position:relative; }
        .logo{ font-family:'Almarai',sans-serif; font-weight:800; font-size:20px; color:var(--teal-dark); }
        .logo .accent{ color:var(--gold); }
        .cart-badge{ position:absolute; top:-4px; left:-4px; min-width:18px; height:18px; padding:0 4px; border-radius:999px; background:var(--gold); color:#fff; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; }

        /* ---------- Drawers ---------- */
        .drawer-overlay{ position:fixed; inset:0; z-index:50; display:flex; justify-content:flex-end; }
        .drawer-backdrop{ position:absolute; inset:0; background:rgba(0,0,0,.4); }
        .drawer{ position:relative; width:300px; max-width:85%; height:100%; background:#fff; box-shadow:-8px 0 30px rgba(0,0,0,.15); padding:20px; display:flex; flex-direction:column; animation: slideIn .22s ease; }
        @keyframes slideIn{ from{ transform:translateX(100%);} to{ transform:translateX(0);} }
        .drawer-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-shrink:0; }
        .drawer-title{ font-family:'Almarai',sans-serif; font-weight:800; font-size:17px; }
        .drawer-nav{ display:flex; flex-direction:column; gap:2px; }
        .drawer-nav a{ padding:13px 12px; border-radius:12px; font-size:15px; font-weight:500; transition: background .15s; }
        .drawer-nav a:active{ background:var(--teal-light); }
        .drawer-foot{ margin-top:auto; padding-top:20px; border-top:1px solid var(--line); flex-shrink:0; }
        .wa-link{ display:flex; align-items:center; gap:8px; padding:13px 12px; border-radius:12px; font-weight:700; color:var(--success); font-size:15px; }

        .cart-scroll{ flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:10px; margin:-4px; padding:4px; }
        .cart-empty{ flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; text-align:center; color:var(--muted); }
        .cart-empty svg{ width:34px; height:34px; opacity:.5; }
        .cart-empty span{ font-size:13px; }

        .cart-line{ display:flex; gap:10px; padding:10px; border-radius:16px; background:var(--teal-light); }
        .cart-thumb{ width:48px; height:48px; border-radius:12px; flex-shrink:0; background:var(--surface); display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .cart-thumb svg{ width:20px; height:20px; color:var(--teal-dark); }
        .cart-info{ flex:1; min-width:0; }
        .cart-name{ font-size:13px; font-weight:700; }
        .cart-code{ font-size:10px; color:var(--muted); margin-top:1px; }
        .cart-line-bottom{ display:flex; align-items:center; justify-content:space-between; margin-top:6px; }
        .cart-price{ font-size:13px; font-weight:700; color:var(--teal-dark); }
        .cart-remove{ width:26px; height:26px; border-radius:999px; display:flex; align-items:center; justify-content:center; }
        .cart-remove svg{ width:13px; height:13px; color:var(--muted); }

        .qty-control{ display:flex; align-items:center; gap:10px; background:#fff; border-radius:999px; padding:4px 5px; }
        .qty-control.sm{ padding:3px 4px; gap:8px; }
        .qty-btn{ width:28px; height:28px; border-radius:999px; background:var(--bg); display:flex; align-items:center; justify-content:center; }
        .qty-btn:active{ transform: scale(.92); }
        .qty-btn svg{ width:13px; height:13px; }
        .qty-val{ width:16px; text-align:center; font-weight:700; font-size:13px; }

        .cart-total-row{ margin-top:14px; padding-top:16px; border-top:1px solid var(--line); flex-shrink:0; }
        .total-line{ display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
        .total-amount{ font-family:'Almarai',sans-serif; font-weight:800; font-size:20px; color:var(--teal-dark); }

        .cta-button{ width:100%; display:flex; align-items:center; justify-content:center; gap:8px; padding:15px; border-radius:18px; background:var(--teal); color:#fff; font-weight:800; font-size:15px; box-shadow:0 10px 24px rgba(14,124,134,.25); transition: transform .15s ease; }
        .cta-button:active{ transform: scale(.98); }
        .cta-button:disabled{ opacity:.5; }

        /* ---------- Hero ---------- */
        .hero{ padding: 28px 0 8px; }
        .hero-top{ display:flex; flex-direction:column; align-items:center; text-align:center; gap:10px; }
        .eyebrow{ font-size:12px; font-weight:700; padding:6px 14px; border-radius:999px; background:var(--teal-light); color:var(--teal-dark); }
        .h1{ font-family:'Almarai',sans-serif; font-weight:800; font-size:26px; line-height:1.5; max-width:380px; }
        .h1-sub{ font-size:14px; color:var(--muted); max-width:340px; line-height:1.7; }

        .parcel-wrap{ position:relative; width:100%; max-width:260px; aspect-ratio:1/1; margin:20px auto 0; display:flex; align-items:center; justify-content:center; }
        .parcel-glow{ position:absolute; inset:24px; border-radius:32px; filter:blur(30px); opacity:.4; background: radial-gradient(circle at 50% 40%, var(--teal), transparent 70%); }
        .parcel-float{ position:relative; width:170px; height:190px; animation: floatY 4.5s ease-in-out infinite; }
        @keyframes floatY{ 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-6px);} }
        .parcel-chip{ position:absolute; width:64px; height:64px; border-radius:16px; display:flex; align-items:center; justify-content:center; box-shadow:0 12px 22px rgba(0,0,0,.16); }
        .parcel-chip svg{ width:24px; height:24px; color:#fff; }
        .chip-1{ right:-4px; top:6px; transform:rotate(-10deg); background:linear-gradient(135deg,#2a3f47,#0B2027); }
        .chip-2{ left:-8px; top:2px; transform:rotate(9deg); background:linear-gradient(135deg,var(--gold),#8a6a22); }
        .parcel-body{ position:absolute; inset:46px 8px 8px 8px; border-radius:18px; overflow:hidden; background:linear-gradient(160deg,#12333a,#0A1F24); box-shadow:0 20px 40px rgba(0,0,0,.28); border:1px solid rgba(255,255,255,.08); display:flex; align-items:center; justify-content:center; }
        .parcel-noise{ position:absolute; inset:0; opacity:.16; background-image: repeating-linear-gradient(115deg, rgba(255,255,255,.09) 0px, rgba(255,255,255,.09) 1px, transparent 1px, transparent 10px); }
        .parcel-scan-clip{ position:absolute; inset:0; overflow:hidden; }
        .scan-line{ position:absolute; inset-inline:0; height:32px; background:linear-gradient(180deg, transparent, rgba(45,212,191,.55), transparent); animation: scan 3.4s ease-in-out infinite; }
        @keyframes scan{ 0%{ transform:translateY(-160%); opacity:0;} 12%{ opacity:1;} 88%{ opacity:1;} 100%{ transform:translateY(240%); opacity:0;} }
        .parcel-mark{ position:relative; font-family:'Almarai',sans-serif; font-weight:800; font-size:13px; letter-spacing:3px; color:rgba(255,255,255,.35); }
        .badge-pulse{ position:absolute; top:-6px; right:-6px; width:40px; height:40px; border-radius:999px; background:var(--teal); display:flex; align-items:center; justify-content:center; box-shadow:0 6px 16px rgba(0,0,0,.2); animation: pulseRing 2.2s ease-out infinite; z-index:2; }
        @keyframes pulseRing{ 0%{ box-shadow:0 0 0 0 rgba(14,124,134,.35);} 100%{ box-shadow:0 0 0 14px rgba(14,124,134,0);} }
        .badge-pulse svg{ width:18px; height:18px; color:#fff; }

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

        /* ---------- Category tabs ---------- */
        .cat-tabs{ display:flex; gap:8px; overflow-x:auto; padding-bottom:4px; margin-bottom:16px; scrollbar-width:none; }
        .cat-tabs::-webkit-scrollbar{ display:none; }
        .cat-tab{ flex-shrink:0; padding:9px 18px; border-radius:999px; font-size:13px; font-weight:700; border:1px solid var(--line); background:var(--surface); color:var(--ink); transition: all .15s ease; }
        .cat-tab.active{ background:var(--teal); border-color:var(--teal); color:#fff; }

        /* ---------- Product grid ---------- */
        .product-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .product-card{ border-radius:20px; background:var(--surface); border:1px solid var(--line); padding:14px; display:flex; flex-direction:column; }
        .product-thumb{ width:100%; aspect-ratio:1/1; border-radius:14px; background:var(--teal-light); display:flex; align-items:center; justify-content:center; margin-bottom:10px; position:relative; overflow:hidden; }
        .product-thumb svg{ width:30px; height:30px; color:var(--teal-dark); }
        .product-cat-pill{ position:absolute; top:8px; right:8px; font-size:9px; font-weight:700; padding:3px 8px; border-radius:999px; background:rgba(255,255,255,.85); color:var(--teal-dark); z-index:1; }
        .product-name{ font-size:13px; font-weight:700; line-height:1.4; min-height:36px; }
        .product-desc-sm{ font-size:11px; color:var(--muted); line-height:1.5; margin-top:3px; min-height:32px; }
        .product-price-row{ display:flex; align-items:baseline; gap:6px; margin-top:8px; }
        .product-price{ font-family:'Almarai',sans-serif; font-weight:800; font-size:16px; color:var(--teal-dark); }
        .product-compare{ font-size:11px; color:var(--muted); text-decoration:line-through; }
        .product-action{ margin-top:10px; }
        .add-btn{ width:100%; display:flex; align-items:center; justify-content:center; gap:6px; padding:10px; border-radius:12px; background:var(--teal-light); color:var(--teal-dark); font-size:12.5px; font-weight:700; transition: background .15s; }
        .add-btn:active{ transform: scale(.97); }
        .product-action .qty-control{ width:100%; justify-content:space-between; background:var(--teal-light); }

        /* ---------- Loading / empty states ---------- */
        .state-box{ text-align:center; padding:40px 16px; color:var(--muted); font-size:13px; }

        /* ---------- Payment (in cart) ---------- */
        .field-block{ margin-top:16px; flex-shrink:0; }
        .field-label{ font-size:13px; font-weight:700; display:block; margin-bottom:8px; }
        .payment-grid{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .pay-btn{ display:flex; align-items:center; justify-content:center; gap:6px; padding:11px; border-radius:12px; font-size:12.5px; font-weight:700; background:transparent; border:1px solid var(--line); color:var(--ink); transition: all .15s ease; }
        .pay-btn svg{ width:14px; height:14px; }
        .pay-btn.active{ background:var(--teal); border-color:var(--teal); color:#fff; }
        .bank-box{ margin-top:10px; display:flex; align-items:center; justify-content:space-between; gap:8px; padding:11px; border-radius:12px; background:var(--teal-light); }
        .bank-number{ font-size:11px; font-family: monospace; letter-spacing:.5px; color:var(--teal-dark); direction:ltr; }
        .copy-btn{ width:30px; height:30px; border-radius:999px; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.12); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .copy-btn svg{ width:13px; height:13px; }
        .copy-btn .ok{ color:var(--success); }

        /* ---------- FAQ ---------- */
        .faq-list{ display:flex; flex-direction:column; gap:8px; }
        .faq-item{ border-radius:16px; background:var(--surface); border:1px solid var(--line); overflow:hidden; }
        .faq-question{ width:100%; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:15px; text-align:right; }
        .faq-question span{ font-size:14px; font-weight:700; }
        .faq-question svg{ width:16px; height:16px; flex-shrink:0; }
        .faq-answer{ padding:0 15px 15px; font-size:13px; line-height:1.7; color:var(--muted); }

        /* ---------- Footer ---------- */
        .footer{ text-align:center; padding:36px 16px; }
        .footer-name{ font-family:'Almarai',sans-serif; font-weight:800; font-size:17px; color:var(--teal-dark); }
        .footer-tag{ font-size:12px; color:var(--muted); margin-top:4px; }
        .footer-wa{ display:inline-flex; align-items:center; gap:8px; margin-top:14px; font-size:14px; font-weight:700; color:var(--success); }
        .footer-wa svg{ width:16px; height:16px; }

        /* ---------- Sticky bar ---------- */
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
          :root{ --container: 720px; }
          .h1{ font-size:30px; max-width:480px; }
          .parcel-wrap{ max-width:300px; }
          .features-grid{ grid-template-columns:repeat(2,1fr); gap:14px; }
          .product-grid{ grid-template-columns:repeat(3,1fr); }
        }

        /* =====================================================
          اللابتوب / الشاشات الكبيرة — من 1024px
        ===================================================== */
        @media (min-width: 1024px){
          :root{ --container: 1120px; }
          .app{ padding-bottom:40px; }

          .hero .container{ display:grid; grid-template-columns: 1.1fr 0.9fr; align-items:center; gap:48px; text-align:right; }
          .hero-top{ align-items:flex-start; text-align:right; }
          .h1{ font-size:38px; max-width:540px; }
          .h1-sub{ max-width:460px; }
          .parcel-wrap{ margin:0; max-width:360px; }
          .trust-row{ grid-column: 1 / -1; grid-template-columns:repeat(3,1fr); max-width:540px; margin-top:32px; }

          .features-grid{ grid-template-columns:repeat(4,1fr); gap:16px; }
          .feature-card{ padding:20px; }

          .product-grid{ grid-template-columns:repeat(4,1fr); gap:18px; }
          .faq-list{ max-width:760px; }

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
            {totalQty > 0 && <span className="cart-badge">{totalQty}</span>}
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
              <span className="drawer-title">سلتك ({totalQty})</span>
              <button onClick={() => setCartOpen(false)} className="icon-btn">
                <X size={16} />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="cart-empty">
                <ShoppingBag />
                <span>سلتك فارغة، أضف منتجاً لتبدأ طلبك</span>
              </div>
            ) : (
              <div className="cart-scroll">
                {cartItems.map(({ product, qty }) => (
                  <div key={product.id} className="cart-line">
                    <div className="cart-thumb">
                      <CartThumb product={product} />
                    </div>
                    <div className="cart-info">
                      <p className="cart-name">{product.title}</p>
                      <p className="cart-code">{product.code || product.id}</p>
                      <div className="cart-line-bottom">
                        <span className="cart-price">{product.price * qty} د.ل</span>
                        <div className="qty-control sm">
                          <button className="qty-btn" onClick={() => dec(product.id)}>
                            <Minus />
                          </button>
                          <span className="qty-val">{qty}</span>
                          <button className="qty-btn" onClick={() => inc(product.id)}>
                            <Plus />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button className="cart-remove" onClick={() => setQty(product.id, 0)} aria-label="إزالة">
                      <Trash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cartItems.length > 0 && (
              <>
                <div className="field-block">
                  <span className="field-label">طريقة الدفع</span>
                  <div className="payment-grid">
                    <button onClick={() => setPayment("cash")} className={`pay-btn ${payment === "cash" ? "active" : ""}`}>
                      <Banknote /> كاش
                    </button>
                    <button onClick={() => setPayment("bank")} className={`pay-btn ${payment === "bank" ? "active" : ""}`}>
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

                <div className="cart-total-row">
                  <div className="total-line">
                    <span className="qty-label">الإجمالي</span>
                    <span className="total-amount">{totalPrice} د.ل</span>
                  </div>
                  <a href={waLink} target="_blank" rel="noreferrer" className="cta-button">
                    <MessageCircle size={18} /> إتمام الطلب عبر واتساب
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== Hero ===== */}
      <section id="home" className="hero">
        <div className="container">
          <div className="hero-top">
            <span className="eyebrow">توصيل لكل مدن ليبيا 🇱🇾</span>
            <h1 className="h1">تسوّق إلكترونياتك وإكسسواراتك بثقة، من أول طلب</h1>
            <p className="h1-sub">تشكيلة مختارة بعناية من الإلكترونيات والإكسسوارات والإضاءة، تصل لباب بيتك في أي مدينة ليبية.</p>

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

          <div className="parcel-wrap">
            <div className="parcel-glow" />
            <div className="parcel-float">
              <div className="parcel-chip chip-1">
                <Headphones />
              </div>
              <div className="parcel-chip chip-2">
                <Lightbulb />
              </div>
              <div className="parcel-body">
                <div className="parcel-noise" />
                <div className="parcel-scan-clip">
                  <div className="scan-line" />
                </div>
                <span className="parcel-mark">NOVA</span>
              </div>
              <div className="badge-pulse">
                <ShieldCheck />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Why Nova ===== */}
      <section id="why" className="section">
        <div className="container">
          <h2 className="section-title">لماذا تتسوق من نوفا</h2>
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

      {/* ===== Products ===== */}
      <section id="products" className="section">
        <div className="container">
          <h2 className="section-title">منتجاتنا</h2>

          {loading ? (
            <div className="state-box">جاري تحميل المنتجات...</div>
          ) : loadError ? (
            <div className="state-box">تعذّر تحميل المنتجات: {loadError}</div>
          ) : products.length === 0 ? (
            <div className="state-box">لا توجد منتجات حالياً</div>
          ) : (
            <>
              <div className="cat-tabs">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`cat-tab ${activeCategory === cat ? "active" : ""}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="product-grid">
                {filteredProducts.map((product) => {
                  const qty = cart[product.id] || 0;
                  const compareAt = product.compare_at ?? product.compareAt ?? null;
                  return (
                    <div key={product.id} className="product-card">
                      <div className="product-thumb">
                        <span className="product-cat-pill">{product.category}</span>
                        <ProductThumb product={product} />
                      </div>
                      <p className="product-name">{product.title}</p>
                      <p className="product-desc-sm">{product.description || product.desc}</p>
                      <div className="product-price-row">
                        <span className="product-price">{product.price} د.ل</span>
                        {compareAt && <span className="product-compare">{compareAt} د.ل</span>}
                      </div>
                      <div className="product-action">
                        {qty === 0 ? (
                          <button className="add-btn" onClick={() => addToCart(product.id)}>
                            <Plus size={14} /> أضف للسلة
                          </button>
                        ) : (
                          <div className="qty-control">
                            <button className="qty-btn" onClick={() => dec(product.id)}>
                              <Minus />
                            </button>
                            <span className="qty-val">{qty}</span>
                            <button className="qty-btn" onClick={() => inc(product.id)}>
                              <Plus />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
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
              <p className="sticky-total-label">{totalQty > 0 ? "الإجمالي" : "تصفّح المنتجات"}</p>
              <p className="sticky-total-amount">{totalQty > 0 ? `${totalPrice} د.ل` : `${products.length} منتج`}</p>
            </div>
            {totalQty > 0 ? (
              <a href={waLink} target="_blank" rel="noreferrer" className="sticky-cta">
                <MessageCircle /> اطلب الآن
              </a>
            ) : (
              <a href="#products" className="sticky-cta">
                <LayoutGrid /> تسوّق الآن
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}