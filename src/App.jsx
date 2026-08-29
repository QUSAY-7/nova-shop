import React, { useState, useMemo, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  Search,
  Lock,
  RotateCcw,
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
  إعدادات المتجر — تُجلب الآن من جدول store_settings بـ Supabase
--------------------------------------------------------- */
const MENU_ITEMS = [
  { label: "الرئيسية", href: "#home" },
  { label: "المنتجات", href: "#products" },
  { label: "لماذا نختارنا", href: "#why" },
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default"); // default | price-asc | price-desc
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [cart, setCart] = useState({}); // { [productId]: qty }
  const [payment, setPayment] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [lastOrder, setLastOrder] = useState(null);
  const [showInvoicePrompt, setShowInvoicePrompt] = useState(false);

  // ---- بيانات المنتجات من Supabase ----
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [variantsByProduct, setVariantsByProduct] = useState({});
  const [selectedVariants, setSelectedVariants] = useState({});

  // ---- إعدادات المتجر من Supabase ----
  const [settings, setSettings] = useState(null);

  // ---- معرض صور المنتج ----
  const [galleryProduct, setGalleryProduct] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

    // ---- طلباتي (بحث آمن ومحمي للزبون) ----
  const [myOrdersOpen, setMyOrdersOpen] = useState(false);
  const [orderTab, setOrderTab] = useState("local"); // 'local' | 'lookup'
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupOrderId, setLookupOrderId] = useState("");
  const [localOrders, setLocalOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [myOrdersLoading, setMyOrdersLoading] = useState(false);
  const [myOrdersSearched, setMyOrdersSearched] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  // تحميل طلبات الجهاز المحفوظة تلقائياً
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("nova_customer_orders") || "[]");
      setLocalOrders(saved);
    } catch (e) {
      console.error("فشل قراءة الطلبات المحلية", e);
    }
  }, []);

  // تحميل طلبات الجهاز المحفوظة
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("nova_customer_orders") || "[]");
      setLocalOrders(saved);
    } catch (e) {
      console.error("فشل قراءة الطلبات المحلية", e);
    }
  }, []);

  // ---- تسجيل الزيارة (مرة واحدة يومياً لكل جهاز) ----
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const lastVisit = localStorage.getItem("nova_last_visit");

    if (lastVisit !== today) {
      supabase.from("visits").insert([{}]).then(({ error }) => {
        if (!error) {
          localStorage.setItem("nova_last_visit", today);
        }
      });
    }
  }, []);

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
        // فتح منتج معين تلقائياً لو الرابط يحتوي على ?product=ID
        const params = new URLSearchParams(window.location.search);
        const sharedId = params.get("product");
        if (sharedId) {
          const found = (data || []).find((p) => String(p.id) === String(sharedId));
          if (found) {
            setGalleryProduct(found);
            setGalleryIndex(0);
          }
        }
      }
      setLoading(false);
    };

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchVariants = async () => {
      const { data, error } = await supabase.from("product_variants").select("*");
      if (!isMounted) return;
      if (!error && data) {
        const grouped = {};
        data.forEach((v) => {
          if (!grouped[v.product_id]) grouped[v.product_id] = [];
          grouped[v.product_id].push(v);
        });
        setVariantsByProduct(grouped);
      }
    };
    fetchVariants();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (!isMounted) return;

      if (!error) {
        setSettings(data);
      }
    };

    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const CATEGORIES = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ["الكل", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = activeCategory === "الكل" ? products : products.filter((p) => p.category === activeCategory);

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.code || "").toLowerCase().includes(q)
      );
    }

    if (minPrice !== "") {
      list = list.filter((p) => p.price >= Number(minPrice));
    }
    if (maxPrice !== "") {
      list = list.filter((p) => p.price <= Number(maxPrice));
    }

    if (sortBy === "price-asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    }

    return list;
  }, [activeCategory, products, searchQuery, sortBy, minPrice, maxPrice]);

  const getVariantsForProduct = (productId) => variantsByProduct[productId] || [];

  const getSelectedVariant = (productId) => {
    const opts = getVariantsForProduct(productId);
    if (opts.length === 0) return null;
    const sel = selectedVariants[productId] || {};
    return (
      opts.find(
        (v) => (v.size || "") === (sel.size || "") && (v.color || "") === (sel.color || "")
      ) || null
    );
  };

  const setSelectedVariant = (productId, field, value) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
  };

  const getEffectivePrice = (product, variant) =>
    variant && variant.price != null ? Number(variant.price) : Number(product.price);

  const getEffectiveStock = (product, variant) =>
    variant ? Number(variant.quantity) : Number(product.stock);

  const cartKey = (productId, variant) => (variant ? `${productId}::${variant.id}` : `${productId}`);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([key, line]) => {
          const product = products.find((p) => String(p.id) === String(line.productId));
          const variant = line.variantId
            ? getVariantsForProduct(line.productId).find((v) => v.id === line.variantId)
            : null;
          return { key, product, variant, qty: line.qty };
        })
        .filter((line) => line.product && line.qty > 0),
    [cart, products, variantsByProduct]
  );

  const totalQty = cartItems.reduce((sum, l) => sum + l.qty, 0);
  const totalPrice = cartItems.reduce(
    (sum, l) => sum + l.qty * getEffectivePrice(l.product, l.variant),
    0
  );

  const setQty = (key, qty, meta) => {
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[key];
      else next[key] = { ...(meta || next[key] || {}), qty };
      return next;
    });
  };

  const addToCart = (product) => {
    const opts = getVariantsForProduct(product.id);
    if (opts.length > 0) {
      const variant = getSelectedVariant(product.id);
      if (!variant) {
        alert("من فضلك اختر المقاس/اللون أولاً");
        return;
      }
      const key = cartKey(product.id, variant);
      const current = cart[key]?.qty || 0;
      setQty(key, current + 1, {
        productId: product.id,
        variantId: variant.id,
        size: variant.size,
        color: variant.color,
      });
    } else {
      const key = cartKey(product.id, null);
      const current = cart[key]?.qty || 0;
      setQty(key, current + 1, { productId: product.id, variantId: null, size: null, color: null });
    }
  };

  const inc = (key) => {
    const line = cart[key];
    if (!line) return;
    const product = products.find((p) => p.id === line.productId);
    const variant = line.variantId
      ? getVariantsForProduct(line.productId).find((v) => v.id === line.variantId)
      : null;
    const stock = product ? getEffectiveStock(product, variant) : 0;
    if (line.qty >= stock) return;
    setQty(key, line.qty + 1, line);
  };

  const dec = (key) => {
    const line = cart[key];
    if (!line) return;
    setQty(key, line.qty - 1, line);
  };

  const handleShare = (product) => {
    const url = `${window.location.origin}${window.location.pathname}?product=${product.id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("تم نسخ رابط المنتج ✅");
    }).catch(() => {
      alert("تعذر نسخ الرابط، حاول مرة أخرى");
    });
  };

  const saveOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      alert("من فضلك أكمل بياناتك (الاسم، الهاتف، العنوان) قبل إتمام الطلب");
      return false;
    }

    const items = cartItems.map((l) => ({
      product_id: l.product.id,
      title: l.product.title,
      size: l.variant?.size || null,
      color: l.variant?.color || null,
      qty: l.qty,
      price: getEffectivePrice(l.product, l.variant),
    }));

    const { data: insertedOrder, error } = await supabase
      .from("orders")
      .insert([
        {
          items,
          total_price: totalPrice,
                    payment_method: payment === "cash" ? "كاش" : payment === "bank" ? "تحويل بنكي" : "Ezone Pay (دفع إلكتروني)",
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
        },
      ])
      .select()
      .single();

         // ========== إرسال تلقائي لشركة درب السبيل للتوصيل ==========
    try {
      const storedConfigs = JSON.parse(localStorage.getItem("nova_integration_providers_config") || "{}");
      const darbCfg = storedConfigs["darb_assabil"];
      if (darbCfg && darbCfg.isActive !== false) {
        await supabase.from("orders").update({
          tracking_number: `DS-${insertedOrder.id}`,
          delivery_provider: "darb_assabil",
        }).eq("id", insertedOrder.id);

        fetch("/api/dispatch-shipment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order: {
              id: insertedOrder.id,
              customer_name: customerName,
              customer_phone: customerPhone,
              customer_address: customerAddress,
              items,
              total_price: totalPrice,
            },
          }),
        }).catch(() => {});
      }
    } catch (e) {
      console.warn("Darb Assabil dispatch:", e);
    }

    // ========== الدفع الإلكتروني عبر Ezone Pay ==========
    if (payment === "ezone") {
      try {
        const nameParts = (customerName || "زبون المتجر").trim().split(" ");
        let firstName = nameParts[0] || "زبون";
        let lastName = nameParts.slice(1).join(" ") || "المتجر";
        if (firstName.length < 3) firstName = firstName + "...".slice(0, 3 - firstName.length);
        if (lastName.length < 3) lastName = lastName + "...".slice(0, 3 - lastName.length);

        const ezonePayload = {
          Title: `طلب متجر #${insertedOrder.id}`,
          OrderReference: `ORD-${insertedOrder.id}`,
          IsUniqueOrderReference: true,
          InternalReference: `NOVA-${insertedOrder.id}`,
          Amount: Number(totalPrice),
          Currency: 1, // 1 = LYD
          Note: "طلب شراء عبر المتجر الإلكتروني",
          Customer: {
            FirstName: firstName,
            LastName: lastName,
            PhoneNumber: customerPhone || "0910000000",
          },
          RedirectUrl: `${window.location.origin}/?payment_success=true&order_id=${insertedOrder.id}`,
        };

        console.log("📤 Ezone Pay: إرسال طلب الدفع...", ezonePayload);

        const ezoneRes = await fetch("/api/ezone-pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: ezonePayload }),
        });

        const responseText = await ezoneRes.text();
        console.log("📥 Ezone Pay Response:", ezoneRes.status, responseText);

        if (ezoneRes.ok) {
          const result = JSON.parse(responseText);
          if (result.success && result.data?.Link) {
            window.location.href = result.data.Link;
            return true;
          } else {
            console.error("❌ Ezone Pay: لم يتم إرجاع رابط الدفع", result);
            alert("⚠️ تعذر إنشاء رابط الدفع الإلكتروني. تم حفظ طلبك وسيتم التواصل معك.\n\nتفاصيل: " + (result.error || result.message || "لا يوجد رابط دفع"));
            return true;
          }
        } else {
          let errorDetail = responseText;
          try {
            const errData = JSON.parse(responseText);
            errorDetail = errData.error || errData.details?.message || responseText;
          } catch(e) {}
          console.error("❌ Ezone Pay HTTP Error:", ezoneRes.status, responseText);
          alert("⚠️ خطأ Ezone Pay (HTTP " + ezoneRes.status + "):\n\n" + errorDetail + "\n\nتم حفظ طلبك وسيتم التواصل معك.");
          return true;
        }
      } catch (ezErr) {
        console.error("❌ Ezone Pay Exception:", ezErr);
        alert("⚠️ تعذر الاتصال بخدمة الدفع الإلكتروني. تم حفظ طلبك وسيتم التواصل معك.\n\nالخطأ: " + ezErr.message);
        return true;
      }
    }

    // خصم الكمية من المخزون (المنتج نفسه أو خيار المقاس/اللون حسب الحالة)
    for (const line of cartItems) {
      if (line.variant) {
        const newQty = Math.max(0, line.variant.quantity - line.qty);
        const { error: variantError } = await supabase
          .from("product_variants")
          .update({ quantity: newQty })
          .eq("id", line.variant.id);
        if (variantError) {
          console.error(`فشل تحديث كمية خيار المنتج ${line.product.title}:`, variantError.message);
        }
      } else {
        const newStock = Math.max(0, line.product.stock - line.qty);
        const { error: stockError } = await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", line.product.id);
        if (stockError) {
          console.error(`فشل تحديث مخزون المنتج ${line.product.title}:`, stockError.message);
        }
      }
    }

    // تحديث الحالة محلياً فوراً
    setProducts((prev) =>
      prev.map((p) => {
        const line = cartItems.find((l) => l.product.id === p.id && !l.variant);
        return line ? { ...p, stock: Math.max(0, p.stock - line.qty) } : p;
      })
    );

    setVariantsByProduct((prev) => {
      const next = { ...prev };
      cartItems.forEach((line) => {
        if (line.variant) {
          next[line.product.id] = (next[line.product.id] || []).map((v) =>
            v.id === line.variant.id ? { ...v, quantity: Math.max(0, v.quantity - line.qty) } : v
          );
        }
      });
      return next;
    });

    // إفراغ السلة وبيانات الزبون بعد إتمام الطلب
    setLastOrder(insertedOrder);
    setShowInvoicePrompt(true);
    setCart({});
    setSelectedVariants({});
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    return true;
  };

  // بحث آمن عن الطلبات يتطلب رقم الهاتف ورقم الطلب معاً لحماية الخصوصية
    // بحث آمن عن الطلبات يتطلب رقم الهاتف ورقم الطلب معاً لحماية الخصوصية
  const fetchMyOrders = async () => {
    if (!lookupPhone.trim() || !lookupOrderId.trim()) {
      alert("لحماية خصوصيتك، يُرجى إدخال رقم الهاتف ورقم الطلب معاً.");
      return;
    }
    setMyOrdersLoading(true);
    setMyOrdersSearched(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", lookupOrderId.trim())
      .eq("customer_phone", lookupPhone.trim());
    if (!error && data) {
      setMyOrders(data);
    } else {
      setMyOrders([]);
    }
    setMyOrdersLoading(false);
  };
  const orderMessage = () => {
    const lines = [`طلب جديد من ${settings?.store_name || "NOVA SHOP"}`, ""];
    cartItems.forEach((l) => {
      const code = l.product.code || l.product.id;
      const variantLabel = l.variant
        ? ` (${[l.variant.size, l.variant.color].filter(Boolean).join(" / ")})`
        : "";
      const price = getEffectivePrice(l.product, l.variant);
      lines.push(`${l.product.title}${variantLabel} (${code}) × ${l.qty} — ${price * l.qty} د.ل`);
    });
    lines.push("");
    lines.push(`الإجمالي: ${totalPrice} د.ل`);
    lines.push(`طريقة الدفع: ${payment === "cash" ? "كاش عند الاستلام" : "تحويل بنكي"}`);
    if (payment === "bank") lines.push(`رقم الحساب: ${settings?.bank_account || ""}`);
    return encodeURIComponent(lines.join("\n"));
  };

  const waLink = `https://wa.me/${settings?.whatsapp_number || ""}?text=${orderMessage()}`;

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(settings?.bank_account || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      /* noop */
    }
  };

  const printCustomerInvoice = (order) => {
    if (!order) return;
    const itemsRows = (order.items || [])
      .map(
        (it) => `
          <tr>
            <td>${it.title}${it.size || it.color ? ` (${[it.size, it.color].filter(Boolean).join(" / ")})` : ""}</td>
            <td style="text-align:center">${it.qty}</td>
            <td style="text-align:center">${it.price} د.ل</td>
            <td style="text-align:center">${it.price * it.qty} د.ل</td>
          </tr>`
      )
      .join("");

    const invoiceWindow = window.open("", "_blank");
    invoiceWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>فاتورة طلب #${order.id}</title>
        <style>
          body { font-family: Tajawal, Arial, sans-serif; padding: 32px; color: #0B2027; }
          .header { border-bottom: 2px solid #0E7C86; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { color: #0E7C86; margin: 0; }
          .meta { font-size: 13px; color: #5B7278; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { padding: 10px; border-bottom: 1px solid #E3ECED; text-align: right; }
          th { background: #E7F3F3; color: #0A5A61; }
          .total-row td { font-weight: bold; font-size: 16px; border-top: 2px solid #0E7C86; }
          .customer-box { margin-top: 20px; padding: 14px; background: #F3F7F8; border-radius: 8px; font-size: 13px; }
          .footer { margin-top: 32px; text-align: center; font-size: 12px; color: #5B7278; }
          @media print { button { display: none; } }
          .print-btn { margin-top: 24px; padding: 10px 20px; background: #0E7C86; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header" style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
          <div>
            <h1>${settings?.store_name || "المتجر"}</h1>
            <div class="meta">
              فاتورة رقم INV-${order.id}<br/>
              ${new Date(order.created_at || Date.now()).toLocaleDateString("ar-LY", { year: "numeric", month: "long", day: "numeric" })}
              —
              ${new Date(order.created_at || Date.now()).toLocaleTimeString("ar-LY", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          ${settings?.logo_url ? `<img src="${settings.logo_url}" alt="شعار" style="width:64px; height:64px; object-fit:contain;" />` : ""}
        </div>
        <div class="customer-box">
          <div>الاسم: ${order.customer_name || "-"}</div>
          <div>الهاتف: ${order.customer_phone || "-"}</div>
          <div>العنوان: ${order.customer_address || "-"}</div>
          <div>طريقة الدفع: ${order.payment_method || "-"}</div>
        </div>
        <table>
          <thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
          <tbody>
            ${itemsRows}
            <tr class="total-row"><td colspan="3">الإجمالي الكلي</td><td>${order.total_price} د.ل</td></tr>
          </tbody>
        </table>
        <div class="footer">شكراً لتسوقك من ${settings?.store_name || "متجرنا"}</div>
        <center><button class="print-btn" onclick="window.print()">🖨️ طباعة / حفظ PDF</button></center>
      </body>
      </html>
    `);
    invoiceWindow.document.close();
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

  // ---- معرض الصور: مساعدين ----
  const getProductImages = (product) => {
    if (product.images && product.images.length > 0) return product.images;
    if (product.image) return [product.image];
    return [];
  };

  const openGallery = (product) => {
    if (getProductImages(product).length === 0) return;
    setGalleryProduct(product);
    setGalleryIndex(0);
  };

  const closeGallery = () => {
    setGalleryProduct(null);
    setGalleryIndex(0);
  };

  const galleryImages = galleryProduct ? getProductImages(galleryProduct) : [];

  const nextGalleryImage = () => {
    setGalleryIndex((i) => (i + 1) % galleryImages.length);
  };

  const prevGalleryImage = () => {
    setGalleryIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
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
        .logo{ font-family:'Almarai',sans-serif; font-weight:800; font-size:20px; color:var(--teal-dark); }
        .logo .accent{ color:var(--gold); }

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

        /* ---------- Product image gallery modal ---------- */
        .gallery-overlay{ position:fixed; inset:0; z-index:60; display:flex; align-items:center; justify-content:center; padding:16px; }
        .gallery-backdrop{ position:absolute; inset:0; background:rgba(0,0,0,.7); }
        .gallery-box{ position:relative; width:100%; max-width:420px; background:#fff; border-radius:20px; overflow:hidden; display:flex; flex-direction:column; }
        .gallery-close{ position:absolute; top:10px; left:10px; z-index:2; width:34px; height:34px; border-radius:999px; background:rgba(255,255,255,.9); display:flex; align-items:center; justify-content:center; }
        .gallery-main{ position:relative; width:100%; aspect-ratio:1/1; background:var(--teal-light); display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .gallery-main img{ width:100%; height:100%; object-fit:cover; }
        .gallery-nav{ position:absolute; top:50%; transform:translateY(-50%); width:36px; height:36px; border-radius:999px; background:rgba(255,255,255,.9); display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(0,0,0,.15); }
        .gallery-nav.prev{ right:10px; }
        .gallery-nav.next{ left:10px; }
        .gallery-thumbs{ display:flex; gap:8px; padding:12px; overflow-x:auto; }
        .gallery-thumb{ flex-shrink:0; width:56px; height:56px; border-radius:10px; overflow:hidden; border:2px solid transparent; opacity:.6; }
        .gallery-thumb.active{ border-color:var(--teal); opacity:1; }
        .gallery-thumb img{ width:100%; height:100%; object-fit:cover; display:block; }

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
            {(settings?.store_name || "NOVA SHOP").split(" ")[0]}{" "}
            <span className="accent">{(settings?.store_name || "NOVA SHOP").split(" ").slice(1).join(" ")}</span>
          </a>

          <div className="header-actions">
            <button onClick={() => setMyOrdersOpen(true)} className="nav-action-btn" aria-label="طلباتي">
              <Package size={17} />
              <span>طلباتي</span>
            </button>
            <button onClick={() => setCartOpen(true)} className="nav-action-btn solid" aria-label="السلة">
              <ShoppingCart size={17} />
              <span>السلة</span>
              {totalQty > 0 && <span className="cart-badge">{totalQty}</span>}
            </button>
          </div>
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
              <a href={`https://wa.me/${settings?.whatsapp_number || ""}`} target="_blank" rel="noreferrer" className="wa-link">
                <MessageCircle size={18} /> تواصل عبر واتساب
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ===== My Orders drawer (مع الحماية التامة للخصوصية) ===== */}
      {myOrdersOpen && (
        <div className="drawer-overlay">
          <div className="drawer-backdrop" onClick={() => setMyOrdersOpen(false)} />
          <div className="drawer">
            <div className="drawer-head">
              <span className="drawer-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Package size={20} color="var(--teal)" /> طلباتي
              </span>
              <button onClick={() => setMyOrdersOpen(false)} className="icon-btn">
                <X size={16} />
              </button>
            </div>

            <div className="security-notice">
              <Lock size={15} />
              <span>خصوصيتك محمية: يتطلب تتبع أي طلب إدخال رقم الهاتف ورقم الطلب معاً لضمان عدم اطلاع أي شخص على بياناتك.</span>
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
                onClick={() => setOrderTab("lookup")}
              >
                تتبع برقم الطلب
              </button>
            </div>

            {orderTab === "lookup" ? (
              <div className="field-block" style={{ marginTop: 0 }}>
                <span className="field-label">رقم الطلب (Order ID)</span>
                <input
                  type="text"
                  className="customer-input"
                  placeholder="مثال: 105"
                  value={lookupOrderId}
                  onChange={(e) => setLookupOrderId(e.target.value)}
                  style={{ marginBottom: "8px" }}
                />
                <span className="field-label">رقم الهاتف المسجل</span>
                <input
                  type="tel"
                  className="customer-input"
                  placeholder="09XXXXXXXX"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                />
                <button
                  onClick={fetchMyOrders}
                  className="cta-button"
                  style={{ marginTop: "12px" }}
                >
                  <Search size={16} /> بحث آمن عن الطلب
                </button>

                <div className="cart-scroll" style={{ marginTop: "16px" }}>
                  {myOrdersLoading ? (
                    <div className="state-box">جاري التحقق والبحث...</div>
                  ) : myOrdersSearched && myOrders.length === 0 ? (
                    <div className="cart-empty">
                      <Package size={32} />
                      <span>لم يتم العثور على طلب مطابق لرقم الطلب والهاتف المدخلين</span>
                    </div>
                  ) : (
                    myOrders.map((order) => (
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
                          onClick={() => setInvoiceOrder(order)}
                          className="add-btn"
                          style={{ marginTop: "8px" }}
                        >
                          🧾 عرض الفاتورة
                        </button>
                      </div>
                    ))
                  )}
                </div>
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
                        onClick={() => setInvoiceOrder(order)}
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
      )}

      {/* ===== Invoice modal ===== */}
      {invoiceOrder && (
        <div className="gallery-overlay">
          <div className="gallery-backdrop" onClick={() => setInvoiceOrder(null)} />
          <div className="gallery-box" style={{ maxWidth: "380px", padding: "24px" }}>
            <button className="gallery-close" onClick={() => setInvoiceOrder(null)} aria-label="إغلاق">
              <X size={16} />
            </button>

            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <p style={{ fontFamily: "'Almarai',sans-serif", fontWeight: 800, fontSize: "18px", color: "var(--teal-dark)" }}>
                {settings?.store_name || "NOVA SHOP"}
              </p>
              <p style={{ fontSize: "12px", color: "var(--muted)" }}>
                فاتورة طلب رقم {invoiceOrder.id}
              </p>
              <p style={{ fontSize: "11px", color: "var(--muted)" }}>
                {new Date(invoiceOrder.created_at).toLocaleString("ar-LY")}
              </p>
            </div>

            <div style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "12px 0", marginBottom: "12px" }}>
              {(invoiceOrder.items || []).map((item, idx) => (
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
              <span>{invoiceOrder.total_price} د.ل</span>
            </div>

            <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.8 }}>
              <p>الاسم: {invoiceOrder.customer_name}</p>
              <p>الهاتف: {invoiceOrder.customer_phone}</p>
              <p>العنوان: {invoiceOrder.customer_address}</p>
              <p>طريقة الدفع: {invoiceOrder.payment_method}</p>
            </div>

            <button
              onClick={() => printCustomerInvoice(invoiceOrder)}
              className="cta-button"
              style={{ marginTop: "16px" }}
            >
              طباعة الفاتورة
            </button>
          </div>
        </div>
      )}

      {/* ===== Cart drawer ===== */}
      {cartOpen && (
        <div className="drawer-overlay">
          <div className="drawer-backdrop" onClick={() => setCartOpen(false)} />
          <div className="drawer">
            <div className="drawer-head">
              <span className="drawer-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <ShoppingCart size={20} color="var(--teal)" /> سلتك ({totalQty})
              </span>
              <button onClick={() => setCartOpen(false)} className="icon-btn">
                <X size={16} />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="cart-empty">
                <ShoppingCart size={36} />
                <span>سلتك فارغة، أضف منتجاً لتبدأ طلبك</span>
              </div>
            ) : (
              <div className="cart-scroll">
                {cartItems.map(({ key, product, variant, qty }) => (
                  <div key={key} className="cart-line">
                    <div className="cart-thumb">
                      <CartThumb product={product} />
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
                          <button className="qty-btn" onClick={() => dec(key)}>
                            <Minus />
                          </button>
                          <span className="qty-val">{qty}</span>
                          <button className="qty-btn" onClick={() => inc(key)}>
                            <Plus />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button className="cart-remove" onClick={() => setQty(key, 0)} aria-label="إزالة">
                      <Trash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cartItems.length > 0 && (
              <>
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
                <div className="field-block">
                  <span className="field-label">عنوان التوصيل</span>
                  <input
                    type="text"
                    className="customer-input"
                    placeholder="المدينة، الحي، أقرب نقطة دالة"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                  />
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
                      <button onClick={copyAccount} className="copy-btn">
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

                <div className="cart-total-row">
                  <div className="total-line">
                    <span className="qty-label">الإجمالي</span>
                    <span className="total-amount">{totalPrice} د.ل</span>
                  </div>
                                    <button
                    className="cta-button"
                    onClick={async () => {
                      const ok = await saveOrder();
                      if (ok && payment !== "ezone") {
                        window.open(waLink, "_blank", "noopener,noreferrer");
                      }
                    }}
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

          {settings?.logo_url ? (
            <div
              style={{
                width: "100%",
                maxWidth: 320,
                maxHeight: 320,
                minHeight: 160,
                margin: "20px auto 0",
                borderRadius: 24,
                overflow: "hidden",
                boxShadow: "0 12px 32px rgba(0,0,0,.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={settings.logo_url}
                alt="شعار المتجر"
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            </div>
          ) : (
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
                  <span className="parcel-mark">{(settings?.store_name || "NOVA").split(" ")[0].toUpperCase()}</span>
                </div>
                <div className="badge-pulse">
                  <ShieldCheck />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== Why Nova ===== */}
      <section id="why" className="section">
        <div className="container">
          <h2 className="section-title">لماذا تتسوق من {settings?.store_name || "نوفا"}</h2>
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
              {/* شريط البحث وتحديد الأسعار بتصميم مستطيل بحواف دائرية وأصغر حجماً */}
              <div className="search-filter-wrapper">
                <div className="search-box">
                  <span className="search-icon-inside">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="ابحث عن منتج بالاسم أو الكود..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="search-clear" onClick={() => setSearchQuery("")}>
                      ×
                    </button>
                  )}
                </div>
                <div className="filters-row">
                  <select
                    className="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="default">الترتيب الافتراضي</option>
                    <option value="price-asc">السعر: من الأقل للأعلى</option>
                    <option value="price-desc">السعر: من الأعلى للأقل</option>
                  </select>
                  <input
                    type="number"
                    className="price-input"
                    placeholder="السعر من (د.ل)"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <input
                    type="number"
                    className="price-input"
                    placeholder="السعر إلى (د.ل)"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
                {(searchQuery || minPrice || maxPrice || sortBy !== "default") && (
                  <button
                    className="filter-reset-btn"
                    onClick={() => {
                      setSearchQuery("");
                      setMinPrice("");
                      setMaxPrice("");
                      setSortBy("default");
                    }}
                  >
                    <RotateCcw size={12} /> إعادة ضبط الفلاتر
                  </button>
                )}
              </div>

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
                  const variantOptions = getVariantsForProduct(product.id);
                  const hasVariants = variantOptions.length > 0;
                  const selectedVariant = hasVariants ? getSelectedVariant(product.id) : null;
                  const effectivePrice = getEffectivePrice(product, selectedVariant);
                  const effectiveStock = hasVariants
                    ? (selectedVariant ? getEffectiveStock(product, selectedVariant) : 0)
                    : product.stock;
                  const key = cartKey(product.id, selectedVariant);
                  const qty = cart[key]?.qty || 0;
                  const compareAt = product.compare_at ?? product.compareAt ?? null;
                  const sizeOptions = Array.from(new Set(variantOptions.map((v) => v.size).filter(Boolean)));
                  const colorOptions = Array.from(new Set(variantOptions.map((v) => v.color).filter(Boolean)));

                  return (
                    <div key={product.id} className="product-card">
                      <div
                        className="product-thumb"
                        onClick={() => openGallery(product)}
                        style={{ cursor: getProductImages(product).length > 0 ? "pointer" : "default" }}
                      >
                        <span className="product-cat-pill">{product.category}</span>
                        {product.stock === 0 && (
                          <span className="out-of-stock-badge">نفد المخزون</span>
                        )}
                        <ProductThumb product={product} />
                      </div>

                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "6px" }}>
                        <p className="product-name">{product.title}</p>
                        <button
                          onClick={() => handleShare(product)}
                          aria-label="مشاركة المنتج"
                          style={{ flexShrink: 0, width: "26px", height: "26px", borderRadius: "999px", background: "var(--teal-light)", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Copy size={12} style={{ color: "var(--teal-dark)" }} />
                        </button>
                      </div>
                      <p className="product-desc-sm">{product.description || product.desc}</p>
                      {!hasVariants && product.stock > 0 && product.stock <= 5 && (
                        <p className="low-stock-note">باقي {product.stock} قطع فقط!</p>
                      )}

                      {hasVariants && (
                        <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                          {sizeOptions.length > 0 && (
                            <select
                              value={selectedVariants[product.id]?.size || ""}
                              onChange={(e) => setSelectedVariant(product.id, "size", e.target.value)}
                              style={{ flex: 1, minWidth: "70px", padding: "6px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "12px" }}
                            >
                              <option value="">المقاس</option>
                              {sizeOptions.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          )}
                          {colorOptions.length > 0 && (
                            <select
                              value={selectedVariants[product.id]?.color || ""}
                              onChange={(e) => setSelectedVariant(product.id, "color", e.target.value)}
                              style={{ flex: 1, minWidth: "70px", padding: "6px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "12px" }}
                            >
                              <option value="">اللون</option>
                              {colorOptions.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}

                      <div className="product-price-row">
                        <span className="product-price">{effectivePrice} د.ل</span>
                        {compareAt && <span className="product-compare">{compareAt} د.ل</span>}
                      </div>
                      <div className="product-action">
                        {hasVariants && !selectedVariant ? (
                          <button className="add-btn" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            اختر الخيار أولاً
                          </button>
                        ) : effectiveStock === 0 ? (
                          <button className="add-btn" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            نفد المخزون
                          </button>
                        ) : qty === 0 ? (
                          <button className="add-btn" onClick={() => addToCart(product)}>
                            <Plus size={14} /> أضف للسلة
                          </button>
                        ) : (
                          <div className="qty-control">
                            <button className="qty-btn" onClick={() => dec(key)}>
                              <Minus />
                            </button>
                            <span className="qty-val">{qty}</span>
                            <button
                              className="qty-btn"
                              onClick={() => inc(key)}
                              disabled={qty >= effectiveStock}
                              style={qty >= effectiveStock ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                            >
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
        <p className="footer-name">VELTRIX SHOP</p>
        <p className="footer-tag">مدعوم من فيلتريكس شوب — حلول متاجر إلكترونية احترافية</p>
        <a href="https://wa.me/218931739453" target="_blank" rel="noreferrer" className="footer-wa">
          <MessageCircle /> تواصل معنا
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
                            <button
                className="sticky-cta"
                onClick={async () => {
                  const ok = await saveOrder();
                  if (ok && payment !== "ezone") {
                    window.open(waLink, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                {payment === "ezone" ? <><Wallet size={18} /> ادفع الآن</> : <><MessageCircle /> اطلب الآن</>}
              </button>
            ) : (
              <a href="#products" className="sticky-cta">
                <LayoutGrid /> تسوّق الآن
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ===== Product image gallery modal ===== */}
      {galleryProduct && (
        <div className="gallery-overlay">
          <div className="gallery-backdrop" onClick={closeGallery} />
          <div className="gallery-box">
            <button className="gallery-close" onClick={closeGallery} aria-label="إغلاق">
              <X size={16} />
            </button>
            <div className="gallery-main">
              <img src={galleryImages[galleryIndex]} alt={galleryProduct.title} />
              {galleryImages.length > 1 && (
                <>
                  <button className="gallery-nav prev" onClick={prevGalleryImage} aria-label="السابق">
                    <ChevronRight />
                  </button>
                  <button className="gallery-nav next" onClick={nextGalleryImage} aria-label="التالي">
                    <ChevronLeft />
                  </button>
                </>
              )}
            </div>
            {galleryImages.length > 1 && (
              <div className="gallery-thumbs">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    className={`gallery-thumb ${i === galleryIndex ? "active" : ""}`}
                    onClick={() => setGalleryIndex(i)}
                  >
                    <img src={img} alt={`صورة ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Post-order invoice prompt ===== */}
      {showInvoicePrompt && lastOrder && (
        <div className="gallery-overlay">
          <div className="gallery-backdrop" onClick={() => setShowInvoicePrompt(false)} />
          <div className="gallery-box" style={{ padding: "28px 20px", textAlign: "center" }}>
            <ShieldCheck size={40} style={{ color: "var(--success)", margin: "0 auto 12px" }} />
            <h3 style={{ marginBottom: 8 }}>تم إرسال طلبك بنجاح ✅</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
              يمكنك تحميل أو طباعة فاتورتك كإثبات شراء
            </p>
            <button
              className="cta-button"
              style={{ marginBottom: 10 }}
              onClick={() => printCustomerInvoice(lastOrder)}
            >
              🧾 عرض / طباعة الفاتورة
            </button>
            <button
              className="secondary-btn"
              style={{ width: "100%", padding: "12px", borderRadius: 14, background: "var(--teal-light)", color: "var(--teal-dark)", fontWeight: 700 }}
              onClick={() => setShowInvoicePrompt(false)}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}