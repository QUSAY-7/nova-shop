import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  Package,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Eye,
  FileText,
  Percent,
  Layers,
  Settings,
} from "lucide-react";
import { supabase } from "./supabaseClient";

function buildStatusWhatsAppLink(order) {
  let phone = (order.customer_phone || "").replace(/[^\d]/g, "");
  if (!phone) return null;
  if (phone.startsWith("0")) phone = "218" + phone.slice(1);
  else if (!phone.startsWith("218")) phone = "218" + phone;

  const name = order.customer_name || "";
  const messages = {
    "جديد": `مرحباً ${name}، تم استلام طلبك رقم #${order.id} وهو الآن قيد المراجعة. شكراً لتسوقك معنا 🌟`,
    "قيد التجهيز": `مرحباً ${name}، طلبك رقم #${order.id} قيد التجهيز حالياً وسيتم شحنه قريباً 📦`,
    "تم الشحن": `مرحباً ${name}، طلبك رقم #${order.id} تم شحنه وهو في الطريق إليك 🚚`,
    "تم التسليم": `مرحباً ${name}، نتمنى أنك استلمت طلبك رقم #${order.id} بسلام. شكراً لثقتك بنا ❤️`,
    "ملغي": `مرحباً ${name}، نأسف لإبلاغك أن طلبك رقم #${order.id} تم إلغاؤه. لأي استفسار تواصل معنا.`,
  };

  const text = messages[order.status] || `مرحباً، تحديث بخصوص طلبك رقم #${order.id}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function printAdminInvoice(order, storeName) {
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
      <div class="header">
        <h1>${storeName || "المتجر"}</h1>
        <div class="meta">
          فاتورة رقم INV-${order.id}<br/>
          ${new Date(order.created_at).toLocaleDateString("ar-LY", { year: "numeric", month: "long", day: "numeric" })}
          —
          ${new Date(order.created_at).toLocaleTimeString("ar-LY", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
      <div class="customer-box">
        <div>الاسم: ${order.customer_name || "-"}</div>
        <div>الهاتف: ${order.customer_phone || "-"}</div>
        <div>العنوان: ${order.customer_address || "-"}</div>
        <div>طريقة الدفع: ${order.payment_method || "-"}</div>
        <div>حالة الطلب: ${order.status || "-"}</div>
      </div>
      <table>
        <thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
        <tbody>
          ${itemsRows}
          <tr class="total-row"><td colspan="3">الإجمالي الكلي</td><td>${order.total_price} د.ل</td></tr>
        </tbody>
      </table>
      <div class="footer">شكراً لتسوقك من ${storeName || "متجرنا"}</div>
      <center><button class="print-btn" onclick="window.print()">🖨️ طباعة / حفظ PDF</button></center>
    </body>
    </html>
  `);
  invoiceWindow.document.close();
}

export default function Admin() {
  const [session, setSession] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const authed = !!session;

  // ---- نظام الأدوار (Roles) ----
  const [userRole, setUserRole] = useState(null); // owner / admin / moderator
  const [roleLoading, setRoleLoading] = useState(true);
  const isOwner = userRole === "owner";
  const isAdmin = userRole === "admin" || userRole === "owner";
  const isModerator = userRole === "moderator";

  const [teamMembers, setTeamMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("moderator");
  const [teamSaving, setTeamSaving] = useState(false);

  const [newLoginEmail, setNewLoginEmail] = useState("");
  const [newLoginPassword, setNewLoginPassword] = useState("");
  const [credsSaving, setCredsSaving] = useState(false);
  const [credsMessage, setCredsMessage] = useState("");

  // ---- تبويبات لوحة التحكم ----
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState("30days"); // today | 7days | 30days | all

  useEffect(() => {
    if (isModerator) setActiveTab("products");
  }, [userRole]);

  const TABS = isModerator
    ? [{ id: "products", label: "المنتجات" }]
    : [
        { id: "dashboard", label: "لوحة الإحصائيات" },
        { id: "settings", label: "إعدادات المتجر" },
        { id: "orders", label: "الطلبات" },
        { id: "invoices", label: "الفواتير" },
        { id: "customers", label: "العملاء" },
        { id: "products", label: "المنتجات" },
        ...(isOwner
          ? [
              { id: "team", label: "إدارة الفريق" },
              { id: "credentials", label: "إعدادات الدخول" },
            ]
          : []),
      ];

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadMethod, setUploadMethod] = useState("file");

  const emptyForm = {
    name: "",
    description: "",
    price: "",
    cost_price: "",
    compare_at: "",
    category: "",
    code: "",
    stock: "",
    image: "",
    extraImagesText: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [variants, setVariants] = useState([]);

  function addVariantRow() {
    setVariants([...variants, { size: "", color: "", price: "", quantity: "" }]);
  }

  function updateVariantRow(index, field, value) {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  }

  function removeVariantRow(index) {
    setVariants(variants.filter((_, i) => i !== index));
  }

  const emptySettingsForm = {
    store_name: "",
    store_description: "",
    whatsapp_number: "",
    bank_account: "",
    facebook_url: "",
    instagram_url: "",
    logo_url: "",
  };
  const [settingsForm, setSettingsForm] = useState(emptySettingsForm);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [bankReceiptInputs, setBankReceiptInputs] = useState({});
  const ORDER_STATUSES = ["جديد", "قيد التحقق من الحوالة", "قيد التجهيز", "تم الشحن", "تم التسليم", "ملغي"];
  const STATUS_LABELS = {
    "جديد": "جديد",
    "قيد التحقق من الحوالة": "قيد التحقق من الحوالة",
    "قيد التجهيز": "قيد التجهيز",
    "تم الشحن": "قيد الشحن",
    "تم التسليم": "تم التسليم",
    "ملغي": "ملغي",
  };

  const CUSTOMER_TIERS = ["دائم", "أحياناً", "نادر"];
  function getCustomerTier(ordersCount) {
    if (ordersCount >= 10) return "دائم";
    if (ordersCount >= 5) return "أحياناً";
    return "نادر";
  }

  function isBankTransferOverdue(order) {
    if (!order.bank_receipt_date || order.bank_verified_at) return false;
    const receiptDate = new Date(order.bank_receipt_date);
    const now = new Date();
    const hoursPassed = (now - receiptDate) / (1000 * 60 * 60);
    return hoursPassed > 24;
  }

  const [visits, setVisits] = useState([]);

  const customers = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const phone = o.customer_phone;
      if (!phone) return;
      if (!map[phone]) {
        map[phone] = {
          phone,
          name: o.customer_name || "بدون اسم",
          address: o.customer_address || "",
          ordersCount: 0,
          totalSpent: 0,
          lastOrderDate: o.created_at,
        };
      }
      map[phone].ordersCount += 1;
      map[phone].totalSpent += o.total_price || 0;
      if (new Date(o.created_at) > new Date(map[phone].lastOrderDate)) {
        map[phone].lastOrderDate = o.created_at;
        map[phone].address = o.customer_address || map[phone].address;
        map[phone].name = o.customer_name || map[phone].name;
      }
    });
    return Object.values(map)
      .map((c) => ({ ...c, tier: getCustomerTier(c.ordersCount) }))
      .sort((a, b) => b.ordersCount - a.ordersCount);
  }, [orders]);

  // ---- حساب الإحصائيات الشاملة والدقيقة بدقة واحترافية ----
  const dashboardStats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    let activeOrders = orders;
    if (timeFilter === "today") {
      activeOrders = orders.filter((o) => o.created_at && o.created_at.slice(0, 10) === todayStr);
    } else if (timeFilter === "7days") {
      activeOrders = orders.filter((o) => o.created_at && new Date(o.created_at) >= sevenDaysAgo);
    } else if (timeFilter === "30days") {
      activeOrders = orders.filter((o) => o.created_at && new Date(o.created_at) >= thirtyDaysAgo);
    }

    const validOrders = activeOrders.filter((o) => o.status !== "ملغي");
    const totalSales = validOrders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
    const totalOrders = activeOrders.length;
    const completedOrders = activeOrders.filter((o) => o.status === "تم التسليم").length;
    const shippedOrders = activeOrders.filter((o) => o.status === "تم الشحن" || o.status === "قيد التجهيز").length;
    const pendingOrders = activeOrders.filter((o) => o.status === "جديد" || o.status === "قيد التحقق من الحوالة").length;
    const cancelledOrders = activeOrders.filter((o) => o.status === "ملغي").length;

    const totalUnitsSold = validOrders.reduce((sum, o) => {
      return sum + (o.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0);
    }, 0);

    const periodCustomers = new Set(activeOrders.map((o) => o.customer_phone).filter(Boolean)).size;
    const aov = validOrders.length > 0 ? Math.round(totalSales / validOrders.length) : 0;

    const productsByTitle = {};
    products.forEach((p) => {
      productsByTitle[p.title] = p;
    });

    let totalProfit = 0;
    validOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const product = productsByTitle[it.title];
        if (product && product.cost_price != null) {
          const itemPrice = Number(it.price) || 0;
          const itemCost = Number(product.cost_price) || 0;
          const qty = Number(it.qty) || 0;
          totalProfit += (itemPrice - itemCost) * qty;
        }
      });
    });

    const productSalesMap = {};
    validOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const title = it.title || "منتج";
        if (!productSalesMap[title]) {
          const matchedProd = products.find((p) => p.title === title);
          productSalesMap[title] = {
            title,
            qty: 0,
            revenue: 0,
            image: matchedProd?.image || null,
          };
        }
        productSalesMap[title].qty += Number(it.qty) || 0;
        productSalesMap[title].revenue += (Number(it.price) || 0) * (Number(it.qty) || 0);
      });
    });

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // بيانات المخطط البياني الديناميكية حسب الفلتر المختار
    let timelineData = [];
    let timelineLabel = "آخر 7 أيام";
    let timelineTotalLabel = "إجمالي مبيعات الأسبوع:";

    if (timeFilter === "today") {
      timelineLabel = "مبيعات اليوم";
      timelineTotalLabel = "إجمالي مبيعات اليوم:";
      timelineData = [{ dayName: "اليوم", sales: totalSales }];
    } else if (timeFilter === "7days") {
      timelineLabel = "آخر 7 أيام";
      timelineTotalLabel = "إجمالي مبيعات 7 أيام:";
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().slice(0, 10);
        const dayName = d.toLocaleDateString("ar-LY", { weekday: "short" });
        const daySales = orders
          .filter((o) => o.status !== "ملغي" && o.created_at && o.created_at.slice(0, 10) === dateStr)
          .reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
        timelineData.push({ date: dateStr, dayName, sales: daySales });
      }
    } else if (timeFilter === "30days") {
      timelineLabel = "آخر 30 يوماً";
      timelineTotalLabel = "إجمالي مبيعات 30 يوماً:";
      for (let w = 3; w >= 0; w--) {
        const startDay = new Date(Date.now() - (w + 1) * 7 * 24 * 60 * 60 * 1000);
        const endDay = new Date(Date.now() - w * 7 * 24 * 60 * 60 * 1000);
        const weekSales = orders
          .filter((o) => {
            if (o.status === "ملغي" || !o.created_at) return false;
            const od = new Date(o.created_at);
            return od >= startDay && od <= endDay;
          })
          .reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
        timelineData.push({ dayName: `الأسبوع ${4 - w}`, sales: weekSales });
      }
    } else {
      timelineLabel = "كل الأوقات";
      timelineTotalLabel = "إجمالي المبيعات الكلية:";
      const monthsMap = {};
      orders.forEach((o) => {
        if (o.status === "ملغي" || !o.created_at) return;
        const m = new Date(o.created_at).toLocaleDateString("ar-LY", { month: "short" });
        monthsMap[m] = (monthsMap[m] || 0) + (Number(o.total_price) || 0);
      });
      timelineData = Object.entries(monthsMap).map(([dayName, sales]) => ({ dayName, sales }));
      if (timelineData.length === 0) {
        timelineData = [{ dayName: "الإجمالي", sales: totalSales }];
      }
    }

    return {
      totalSales,
      totalOrders,
      completedOrders,
      shippedOrders,
      pendingOrders,
      cancelledOrders,
      totalUnitsSold,
      periodCustomers,
      aov,
      totalProfit,
      topSellingProducts,
      timelineData,
      timelineLabel,
      timelineTotalLabel,
      recentOrders: orders.slice(0, 6),
    };
  }, [orders, products, timeFilter]);

  const filteredInvoices = useMemo(() => {
    if (!invoiceSearch.trim()) return orders;
    const q = invoiceSearch.trim().toLowerCase();
    return orders.filter(
      (o) =>
        String(o.id).includes(q) ||
        (o.customer_name || "").toLowerCase().includes(q) ||
        (o.customer_phone || "").includes(q)
    );
  }, [orders, invoiceSearch]);

  const productsByCategory = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const cat = p.category || "بدون تصنيف";
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    });
    return map;
  }, [products]);
  const categoryList = useMemo(() => Object.keys(productsByCategory), [productsByCategory]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authed) {
      fetchProducts();
      fetchSettings();
      fetchOrders();
      fetchVisits();
      fetchUserRole();
      fetchTeamMembers();
    }
  }, [authed]);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });
    if (!error) setProducts(data || []);
    setLoading(false);
  }

  async function fetchSettings() {
    setSettingsLoading(true);
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (!error && data) {
      setSettingsForm({
        store_name: data.store_name || "",
        store_description: data.store_description || localStorage.getItem("nova_store_description") || "",
        whatsapp_number: data.whatsapp_number || "",
        bank_account: data.bank_account || "",
        facebook_url: data.facebook_url || "",
        instagram_url: data.instagram_url || "",
        logo_url: data.logo_url || "",
      });
    }
    setSettingsLoading(false);
  }

  async function handleSettingsSubmit(e) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSaved(false);

    // محاولة الحفظ في Supabase
    let { error } = await supabase
      .from("store_settings")
      .update(settingsForm)
      .eq("id", 1);

    // إذا كان الخطأ بسبب عدم إضافة عمود store_description في جدول Supabase بعد
    if (error && error.message.includes("store_description")) {
      const { store_description, ...restSettings } = settingsForm;
      if (store_description) {
        localStorage.setItem("nova_store_description", store_description);
      }
      const fallbackResult = await supabase
        .from("store_settings")
        .update(restSettings)
        .eq("id", 1);

      if (!fallbackResult.error) {
        error = null;
      } else {
        error = fallbackResult.error;
      }
    }

    setSettingsSaving(false);

    if (error) {
      alert("صار خطأ أثناء حفظ الإعدادات: " + error.message);
      return;
    }

    if (settingsForm.store_description) {
      localStorage.setItem("nova_store_description", settingsForm.store_description);
    }

    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  }

  async function fetchOrders() {
    setOrdersLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setOrders(data || []);
    setOrdersLoading(false);
  }

  async function fetchVisits() {
    const { data, error } = await supabase.from("visits").select("created_at");
    if (!error) setVisits(data || []);
  }

  async function fetchUserRole() {
    setRoleLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email;
    if (!email) {
      setRoleLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("admin_users")
      .select("role")
      .eq("email", email)
      .single();
    if (!error && data) {
      setUserRole(data.role);
    }
    setRoleLoading(false);
  }

  async function fetchTeamMembers() {
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error) setTeamMembers(data || []);
  }

  // حل مشكلة إضافة وتحديث رتبة العضو بذكاء بدون خطأ duplicate key
  async function handleAddMember(e) {
    e.preventDefault();
    const emailClean = newMemberEmail.trim().toLowerCase();
    if (!emailClean) return;
    setTeamSaving(true);

    // التحقق إذا كان البريد مسجلاً مسبقاً
    const { data: existingUser } = await supabase
      .from("admin_users")
      .select("id, email, role")
      .eq("email", emailClean)
      .maybeSingle();

    let error;
    if (existingUser) {
      if (existingUser.role === "owner") {
        alert("هذا الحساب هو المالك الأساسي للمتجر ولا يمكن تغيير صلاحيته.");
        setTeamSaving(false);
        return;
      }
      ({ error } = await supabase
        .from("admin_users")
        .update({ role: newMemberRole })
        .eq("id", existingUser.id));
      if (!error) {
        alert(`تم تحديث صلاحية (${emailClean}) إلى "${newMemberRole === "admin" ? "أدمن" : "مشرف"}" بنجاح ✅`);
      }
    } else {
      ({ error } = await supabase
        .from("admin_users")
        .insert([{ email: emailClean, role: newMemberRole }]));
      if (!error) {
        alert(`تمت إضافة (${emailClean}) كـ "${newMemberRole === "admin" ? "أدمن" : "مشرف"}" بنجاح ✅`);
      }
    }

    setTeamSaving(false);
    if (error) {
      alert("فشل حفظ العضو: " + error.message);
      return;
    }
    setNewMemberEmail("");
    setNewMemberRole("moderator");
    fetchTeamMembers();
  }

  async function handleRemoveMember(id, role) {
    if (role === "owner") {
      alert("لا يمكن حذف المالك");
      return;
    }
    if (!confirm("متأكد تبي تزيل هذا العضو من الفريق؟")) return;
    const { error } = await supabase.from("admin_users").delete().eq("id", id);
    if (error) {
      alert("فشل الحذف: " + error.message);
      return;
    }
    fetchTeamMembers();
  }

  async function handleUpdateCredentials(e) {
    e.preventDefault();
    setCredsSaving(true);
    setCredsMessage("");

    const updates = {};
    if (newLoginEmail) updates.email = newLoginEmail;
    if (newLoginPassword) updates.password = newLoginPassword;

    if (Object.keys(updates).length === 0) {
      setCredsSaving(false);
      return;
    }

    const { error } = await supabase.auth.updateUser(updates);
    setCredsSaving(false);

    if (error) {
      setCredsMessage("خطأ: " + error.message);
      return;
    }

    setCredsMessage("تم التحديث بنجاح! لو غيرت البريد لازم تأكده من صندوق الوارد.");
    setNewLoginEmail("");
    setNewLoginPassword("");
  }

  async function updateOrderStatus(id, status) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      alert("فشل تحديث الحالة: " + error.message);
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  async function saveBankReceipt(orderId) {
    const input = bankReceiptInputs[orderId] || {};
    const { error } = await supabase
      .from("orders")
      .update({
        bank_receipt_number: input.number || null,
        bank_receipt_date: input.date || null,
      })
      .eq("id", orderId);
    if (error) {
      alert("فشل حفظ بيانات الإيصال: " + error.message);
      return;
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, bank_receipt_number: input.number || null, bank_receipt_date: input.date || null }
          : o
      )
    );
  }

  async function confirmBankTransfer(orderId) {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("orders")
      .update({ status: "قيد التجهيز", bank_verified_at: now })
      .eq("id", orderId);
    if (error) {
      alert("فشل تأكيد الحوالة: " + error.message);
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "قيد التجهيز", bank_verified_at: now } : o))
    );
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailInput,
      password: passwordInput,
    });
    setLoggingIn(false);
    if (error) {
      setLoginError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function uploadImagesIfNeeded() {
    let urls = [];

    if (uploadMethod === "url") {
      if (form.image) urls.push(form.image);
      const extra = form.extraImagesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      urls = urls.concat(extra);
    } else {
      urls = [...existingImages];

      for (const file of imageFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("Product-images")
          .upload(fileName, file);

        if (uploadError) {
          alert("فشل رفع إحدى الصور: " + uploadError.message);
          continue;
        }

        const { data } = supabase.storage.from("Product-images").getPublicUrl(fileName);
        urls.push(data.publicUrl);
      }
    }

    return urls;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.price) {
      alert("لازم تكتب اسم المنتج والسعر على الأقل");
      return;
    }

    setSaving(true);
    const imageUrls = await uploadImagesIfNeeded();

    const payload = {
      title: form.name,
      description: form.description || null,
      price: Number(form.price),
      cost_price: form.cost_price !== "" ? Number(form.cost_price) : null,
      old_price: form.compare_at ? Number(form.compare_at) : null,
      category: form.category || null,
      code: form.code || null,
      stock: form.stock !== "" ? Number(form.stock) : 0,
      image: imageUrls[0] || null,
      images: imageUrls,
    };

    let error;
    let productId = editingId;

    if (editingId) {
      ({ error } = await supabase.from("products").update(payload).eq("id", editingId));
    } else {
      const { data, error: insertError } = await supabase
        .from("products")
        .insert([payload])
        .select()
        .single();
      error = insertError;
      if (data) productId = data.id;
    }

    if (error) {
      setSaving(false);
      alert("صار خطأ: " + error.message);
      return;
    }

    if (productId) {
      await supabase.from("product_variants").delete().eq("product_id", productId);

      const validVariants = variants
        .filter((v) => v.size || v.color)
        .map((v) => ({
          product_id: productId,
          size: v.size || null,
          color: v.color || null,
          price: v.price !== "" ? Number(v.price) : null,
          quantity: v.quantity !== "" ? Number(v.quantity) : 0,
        }));

      if (validVariants.length > 0) {
        await supabase.from("product_variants").insert(validVariants);
      }
    }

    setSaving(false);
    setForm(emptyForm);
    setVariants([]);
    setImageFiles([]);
    setExistingImages([]);
    setEditingId(null);
    fetchProducts();
  }

  async function startEdit(product) {
    setEditingId(product.id);
    const imgs = product.images && product.images.length ? product.images : (product.image ? [product.image] : []);
    setForm({
      name: product.title || "",
      description: product.description || "",
      price: product.price || "",
      cost_price: product.cost_price ?? "",
      compare_at: product.old_price || "",
      category: product.category || "",
      code: product.code || "",
      stock: product.stock ?? "",
      image: imgs[0] || "",
      extraImagesText: imgs.slice(1).join("\n"),
    });
    setExistingImages(imgs);
    setImageFiles([]);
    setUploadMethod("url");

    const { data: variantData } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", product.id);

    setVariants(
      (variantData || []).map((v) => ({
        size: v.size || "",
        color: v.color || "",
        price: v.price ?? "",
        quantity: v.quantity ?? "",
      }))
    );

    setActiveTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFiles([]);
    setExistingImages([]);
  }

  async function handleDelete(id) {
    if (isModerator) {
      alert("عذراً، ليس لديك صلاحية حذف المنتجات");
      return;
    }
    if (!confirm("متأكد تبي تحذف هذا المنتج؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("فشل الحذف: " + error.message);
      return;
    }
    fetchProducts();
  }

  if (authChecking) {
    return (
      <div style={styles.loginWrap}>
        <p>جارٍ التحقق...</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={styles.loginWrap}>
        <form onSubmit={handleLogin} style={styles.loginBox}>
          <h2>لوحة التحكم</h2>
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            style={styles.input}
            autoFocus
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={styles.input}
          />
          {loginError && <span style={{ color: "#c00", fontSize: 13 }}>{loginError}</span>}
          <button type="submit" disabled={loggingIn} style={styles.primaryBtn}>
            {loggingIn ? "جارٍ الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    );
  }

  const maxChartSale = Math.max(...(dashboardStats.timelineData || []).map((d) => d.sales), 1);

  return (
    <div dir="rtl" style={styles.layout}>
      {/* زر فتح/إغلاق القائمة للموبايل */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={styles.menuToggle}
        className="admin-menu-toggle"
      >
        ☰
      </button>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={styles.overlay}
          className="admin-overlay"
        />
      )}

      {/* الشريط الجانبي */}
      <aside
        style={styles.sidebar}
        className={`admin-sidebar ${sidebarOpen ? "admin-sidebar-open" : ""}`}
      >
        <div style={{ paddingBottom: 16, borderBottom: "1px solid #222", marginBottom: 12 }}>
          <h3 style={{ color: "#fff", margin: 0, fontSize: 16, fontWeight: 800 }}>
            {settingsForm.store_name || "لوحة الإدارة"}
          </h3>
          <span style={{ fontSize: 11, color: "#888" }}>نظام الإحصائيات المتطور</span>
        </div>

        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSidebarOpen(false);
            }}
            style={{
              ...styles.tabBtn,
              ...(activeTab === tab.id ? styles.tabBtnActive : {}),
            }}
          >
            {tab.label}
          </button>
        ))}

        <button onClick={handleLogout} style={styles.logoutBtn}>
          تسجيل خروج
        </button>
      </aside>

      {/* المحتوى الرئيسي */}
      <div style={styles.page}>
        {/* ========================================================
            تبويب: لوحة الإحصائيات الشاملة
           ======================================================== */}
        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Header / ترحيب وفلاتر الوقت */}
            <div style={styles.dashHeader}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0B2027" }}>لوحة التحكم</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#5B7278" }}>
                  مرحباً بك في لوحة إدارة وتحليل متجرك
                </p>
              </div>

              {/* أزرار تصفية الوقت */}
              <div style={styles.timeFilterGroup}>
                {[
                  { id: "today", label: "اليوم" },
                  { id: "7days", label: "آخر 7 أيام" },
                  { id: "30days", label: "آخر 30 يوم" },
                  { id: "all", label: "كل الأوقات" },
                ].map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => setTimeFilter(tf.id)}
                    style={{
                      ...styles.timeFilterBtn,
                      ...(timeFilter === tf.id ? styles.timeFilterBtnActive : {}),
                    }}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* البطاقات الخمس الرئيسية */}
            <div style={styles.metricCardsGrid}>
              {/* 1. إجمالي المبيعات */}
              <div style={styles.modernCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={styles.metricIconBox("#E0F2FE", "#0284C7")}>
                    <DollarSign size={20} />
                  </div>
                  <span style={styles.trendBadge("#DCFCE7", "#16A34A")}>
                    <ArrowUpRight size={13} /> حقيقي
                  </span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <span style={{ fontSize: 12, color: "#5B7278", fontWeight: 700 }}>إجمالي المبيعات</span>
                  <h3 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: "#0B2027" }}>
                    {dashboardStats.totalSales.toLocaleString()} <span style={{ fontSize: 14 }}>د.ل</span>
                  </h3>
                </div>
              </div>

              {/* 2. عدد الطلبات */}
              <div style={styles.modernCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={styles.metricIconBox("#DCFCE7", "#16A34A")}>
                    <ShoppingBag size={20} />
                  </div>
                  <span style={styles.trendBadge("#F0FDF4", "#15803D")}>
                    {dashboardStats.completedOrders} مكتمل
                  </span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <span style={{ fontSize: 12, color: "#5B7278", fontWeight: 700 }}>الطلبات</span>
                  <h3 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: "#0B2027" }}>
                    {dashboardStats.totalOrders} <span style={{ fontSize: 14 }}>طلب</span>
                  </h3>
                </div>
              </div>

              {/* 3. العملاء */}
              <div style={styles.modernCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={styles.metricIconBox("#F3E8FF", "#9333EA")}>
                    <Users size={20} />
                  </div>
                  <span style={styles.trendBadge("#FAF5FF", "#7E22CE")}>زبائن</span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <span style={{ fontSize: 12, color: "#5B7278", fontWeight: 700 }}>العملاء</span>
                  <h3 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: "#0B2027" }}>
                    {dashboardStats.periodCustomers} <span style={{ fontSize: 14 }}>عميل</span>
                  </h3>
                </div>
              </div>

              {/* 4. متوسط قيمة الطلب */}
              <div style={styles.modernCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={styles.metricIconBox("#FEF3C7", "#D97706")}>
                    <TrendingUp size={20} />
                  </div>
                  <span style={styles.trendBadge("#FFFBEB", "#B45309")}>معدل الطلب</span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <span style={{ fontSize: 12, color: "#5B7278", fontWeight: 700 }}>متوسط قيمة الطلب</span>
                  <h3 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: "#0B2027" }}>
                    {dashboardStats.aov.toLocaleString()} <span style={{ fontSize: 14 }}>د.ل</span>
                  </h3>
                  <span style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 2, display: "block" }}>
                    (المبيعات ÷ عدد الطلبات)
                  </span>
                </div>
              </div>

              {/* 5. المنتجات المباعة */}
              <div style={styles.modernCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={styles.metricIconBox("#E0E7FF", "#4F46E5")}>
                    <Package size={20} />
                  </div>
                  <span style={styles.trendBadge("#EEF2FF", "#4338CA")}>قطع</span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <span style={{ fontSize: 12, color: "#5B7278", fontWeight: 700 }}>المنتجات المباعة</span>
                  <h3 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: "#0B2027" }}>
                    {dashboardStats.totalUnitsSold} <span style={{ fontSize: 14 }}>قطعة</span>
                  </h3>
                  <span style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 2, display: "block" }}>
                    إجمالي القطع في الفترة
                  </span>
                </div>
              </div>
            </div>

            {/* صف التحليلات الرئيسية الثلاثة */}
            <div style={styles.analyticsRow}>
              {/* 1. أفضل المنتجات مبيعاً */}
              <div style={{ ...styles.modernCard, flex: 1, minWidth: 260 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>أفضل المنتجات مبيعاً</h4>
                  <span style={{ fontSize: 11, color: "#5B7278" }}>بالكمية</span>
                </div>

                {dashboardStats.topSellingProducts.length === 0 ? (
                  <p style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 20 }}>لا توجد مبيعات في هذه الفترة</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {dashboardStats.topSellingProducts.map((p, idx) => (
                      <div key={idx} style={styles.topProductItem}>
                        <span style={styles.rankBadge}>{idx + 1}</span>
                        {p.image ? (
                          <img src={p.image} alt={p.title} style={styles.topProductThumb} />
                        ) : (
                          <div style={{ ...styles.topProductThumb, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f0f0" }}>
                            <Package size={16} color="#888" />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {p.title}
                          </div>
                          <span style={{ fontSize: 11, color: "#5B7278" }}>مباع: {p.qty} قطعة</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#0E7C86" }}>
                          {p.revenue.toLocaleString()} د.ل
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. نظرة عامة على المبيعات (ديناميكية حسب الفلتر المختار) */}
              <div style={{ ...styles.modernCard, flex: 1.5, minWidth: 320 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>نظرة عامة على المبيعات</h4>
                  <span style={{ fontSize: 11, color: "#0E7C86", fontWeight: 700 }}>{dashboardStats.timelineLabel}</span>
                </div>

                <div style={{ height: 170, display: "flex", alignItems: "flex-end", gap: 12, paddingTop: 10, paddingBottom: 10, borderBottom: "1px solid #E3ECED" }}>
                  {dashboardStats.timelineData.map((d, i) => {
                    const heightPercent = maxChartSale > 0 ? (d.sales / maxChartSale) * 100 : 0;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: d.sales > 0 ? "#0E7C86" : "#aaa" }}>
                          {d.sales > 0 ? `${d.sales.toLocaleString()}` : "0"}
                        </span>
                        <div
                          style={{
                            width: "100%",
                            maxWidth: 36,
                            height: `${Math.max(heightPercent, 6)}%`,
                            background: d.sales > 0 ? "linear-gradient(180deg, #0E7C86 0%, #2DD4BF 100%)" : "#E2E8F0",
                            borderRadius: "6px 6px 0 0",
                            transition: "all .3s ease",
                          }}
                        />
                        <span style={{ fontSize: 11, color: "#5B7278", marginTop: 4 }}>{d.dayName}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, color: "#5B7278" }}>
                  <span>{dashboardStats.timelineTotalLabel}</span>
                  <strong style={{ color: "#0B2027", fontSize: 13 }}>
                    {dashboardStats.timelineData.reduce((s, x) => s + x.sales, 0).toLocaleString()} د.ل
                  </strong>
                </div>
              </div>

              {/* 3. حالة الطلبات */}
              <div style={{ ...styles.modernCard, flex: 1, minWidth: 260 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>حالة الطلبات</h4>
                  <span style={{ fontSize: 11, color: "#5B7278" }}>{dashboardStats.totalOrders} طلب</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { label: "مكتملة", count: dashboardStats.completedOrders, color: "#16A34A", bg: "#DCFCE7" },
                    { label: "قيد الشحن والتجهيز", count: dashboardStats.shippedOrders, color: "#0284C7", bg: "#E0F2FE" },
                    { label: "جديد / معلق", count: dashboardStats.pendingOrders, color: "#D97706", bg: "#FEF3C7" },
                    { label: "ملغي", count: dashboardStats.cancelledOrders, color: "#DC2626", bg: "#FEE2E2" },
                  ].map((st, i) => {
                    const pct = dashboardStats.totalOrders > 0 ? Math.round((st.count / dashboardStats.totalOrders) * 100) : 0;
                    return (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: st.color }} />
                            {st.label}
                          </span>
                          <span style={{ fontWeight: 800, color: "#0B2027" }}>
                            {st.count} ({pct}%)
                          </span>
                        </div>
                        <div style={{ width: "100%", height: 6, background: "#F1F5F9", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: st.color, borderRadius: 999 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* جدول آخر الطلبات الحديثة */}
            <div style={styles.modernCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>آخر الطلبات المسجلة</h4>
                <button onClick={() => setActiveTab("orders")} style={{ fontSize: 12, color: "#0E7C86", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
                  عرض كل الطلبات ←
                </button>
              </div>

              {dashboardStats.recentOrders.length === 0 ? (
                <p style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 20 }}>لا توجد طلبات مسجلة بعد</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>رقم الطلب</th>
                        <th style={styles.th}>العميل</th>
                        <th style={styles.th}>المنتجات</th>
                        <th style={styles.th}>المبلغ</th>
                        <th style={styles.th}>الحالة</th>
                        <th style={styles.th}>التاريخ</th>
                        <th style={styles.th}>الإجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardStats.recentOrders.map((o) => (
                        <tr key={o.id} style={styles.tr}>
                          <td style={{ ...styles.td, fontWeight: 800 }}>#{o.id}</td>
                          <td style={styles.td}>
                            <div>{o.customer_name || "زبون"}</div>
                            <div style={{ fontSize: 11, color: "#5B7278" }}>{o.customer_phone}</div>
                          </td>
                          <td style={styles.td}>
                            {(o.items || []).map((it) => `${it.title} (${it.qty})`).join("، ")}
                          </td>
                          <td style={{ ...styles.td, fontWeight: 800, color: "#0E7C86" }}>
                            {o.total_price} د.ل
                          </td>
                          <td style={styles.td}>
                            <span style={styles.orderStatusPill(o.status)}>
                              {STATUS_LABELS[o.status] || o.status || "جديد"}
                            </span>
                          </td>
                          <td style={{ ...styles.td, fontSize: 11, color: "#5B7278" }}>
                            {new Date(o.created_at).toLocaleDateString("ar-LY")}
                          </td>
                          <td style={styles.td}>
                            <button
                              onClick={() => printAdminInvoice(o, settingsForm.store_name)}
                              style={styles.actionPillBtn}
                            >
                              🧾 فاتورة
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- تبويب: إعدادات المتجر ---- */}
        {activeTab === "settings" && (
          <form onSubmit={handleSettingsSubmit} style={styles.form}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>إعدادات المتجر</h3>
            {settingsLoading ? (
              <p>جارٍ تحميل الإعدادات...</p>
            ) : (
              <>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>اسم المتجر</label>
                  <input
                    style={styles.input}
                    placeholder="مثال: NOVA SHOP"
                    value={settingsForm.store_name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, store_name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>
                    وصف المتجر (يظهر تحت الشعار واسم المتجر)
                  </label>
                  <textarea
                    rows={3}
                    style={{ ...styles.input, resize: "vertical" }}
                    placeholder="اكتب وصفاً جذاباً لمتجرك يظهر للزبائن تحت الشعار مباشرة (مثال: كل ما تحتاجه في مكان واحد — منتجات أصلية، عروض حصرية، وتوصيل سريع لكافة المدن)"
                    value={settingsForm.store_description}
                    onChange={(e) => setSettingsForm({ ...settingsForm, store_description: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700 }}>شعار المتجر (اختياري)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const fileExt = file.name.split(".").pop();
                      const fileName = `logo-${Date.now()}.${fileExt}`;
                      const { error: uploadError } = await supabase.storage
                        .from("Product-images")
                        .upload(fileName, file);
                      if (uploadError) {
                        alert("فشل رفع الشعار: " + uploadError.message);
                        return;
                      }
                      const { data } = supabase.storage.from("Product-images").getPublicUrl(fileName);
                      setSettingsForm({ ...settingsForm, logo_url: data.publicUrl });
                    }}
                    style={styles.input}
                  />
                  {settingsForm.logo_url && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img src={settingsForm.logo_url} alt="شعار المتجر" style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 8, border: "1px solid #eee" }} />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm("متأكد تبي تحذف الشعار؟")) return;
                          try {
                            const url = settingsForm.logo_url;
                            const fileName = url.split("/").pop();
                            await supabase.storage.from("Product-images").remove([fileName]);
                          } catch (err) {
                            console.error("تعذر حذف الملف من التخزين:", err);
                          }
                          setSettingsForm({ ...settingsForm, logo_url: "" });
                        }}
                        style={{
                          background: "#fee2e2",
                          color: "#b91c1c",
                          border: "1px solid #fca5a5",
                          borderRadius: 8,
                          padding: "6px 12px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        حذف الشعار
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>رقم الواتساب</label>
                  <input
                    style={styles.input}
                    placeholder="رقم الواتساب (بصيغة دولية، مثال 218912345678)"
                    value={settingsForm.whatsapp_number}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>رقم الحساب البنكي</label>
                  <input
                    style={styles.input}
                    placeholder="رقم الحساب البنكي لتحويلات الزبائن"
                    value={settingsForm.bank_account}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bank_account: e.target.value })}
                  />
                </div>

                <div style={styles.row}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>رابط فيسبوك</label>
                    <input
                      style={styles.input}
                      placeholder="رابط فيسبوك (اختياري)"
                      value={settingsForm.facebook_url}
                      onChange={(e) => setSettingsForm({ ...settingsForm, facebook_url: e.target.value })}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>رابط إنستقرام</label>
                    <input
                      style={styles.input}
                      placeholder="رابط إنستقرام (اختياري)"
                      value={settingsForm.instagram_url}
                      onChange={(e) => setSettingsForm({ ...settingsForm, instagram_url: e.target.value })}
                    />
                  </div>
                </div>

                <div style={styles.row}>
                  <button type="submit" disabled={settingsSaving} style={styles.primaryBtn}>
                    {settingsSaving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
                  </button>
                  {settingsSaved && (
                    <span style={{ color: "#1c9963", alignSelf: "center", fontWeight: 700 }}>✓ تم الحفظ بنجاح</span>
                  )}
                </div>
              </>
            )}
          </form>
        )}

        {/* ---- تبويب: الطلبات ---- */}
        {activeTab === "orders" && (
          <>
            <h3 style={{ margin: "0 0 14px 0", fontSize: 18, fontWeight: 800 }}>الطلبات ({orders.length})</h3>
            {ordersLoading ? (
              <p>جارٍ تحميل الطلبات...</p>
            ) : orders.length === 0 ? (
              <p style={{ color: "#888" }}>لا توجد طلبات حتى الآن</p>
            ) : (
              <div dir="rtl" style={styles.kanbanBoard}>
                {ORDER_STATUSES.map((status) => {
                  const statusOrders = orders.filter((o) => o.status === status);
                  return (
                    <div key={status} style={styles.kanbanColumn}>
                      <div style={styles.kanbanHeader}>
                        <span>{STATUS_LABELS[status]}</span>
                        <span style={styles.kanbanCount}>{statusOrders.length}</span>
                      </div>
                      <div style={styles.kanbanList}>
                        {statusOrders.length === 0 ? (
                          <p style={{ color: "#bbb", fontSize: 12, textAlign: "center", padding: 16 }}>
                            لا توجد طلبات
                          </p>
                        ) : (
                          statusOrders.map((o) => (
                            <div key={o.id} style={styles.orderCard}>
                              <div style={styles.orderHeadRow}>
                                <strong>#{o.id}</strong>
                                <span style={{ color: "#888", fontSize: 12 }}>
                                  {new Date(o.created_at).toLocaleDateString("ar-LY")}
                                </span>
                              </div>
                              <div style={{ fontSize: 13, margin: "6px 0" }}>
                                {(o.items || []).map((it, i) => (
                                  <div key={i}>{it.title} × {it.qty}</div>
                                ))}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: "bold" }}>
                                {o.total_price} د.ل — {o.payment_method}
                              </div>
                              <div style={{ fontSize: 12, marginTop: 6, padding: 6, background: "#f7f7f7", borderRadius: 6 }}>
                                <div>{o.customer_name || "غير مسجل"}</div>
                                <div>{o.customer_phone || "غير مسجل"}</div>
                              </div>
                              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                                <select
                                  value={o.status}
                                  onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                  style={{ ...styles.select, fontSize: 12, flex: 1 }}
                                >
                                  {ORDER_STATUSES.map((s) => (
                                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                  ))}
                                </select>
                                {o.customer_phone && (
                                  <button
                                    type="button"
                                    onClick={() => window.open(buildStatusWhatsAppLink(o), "_blank")}
                                    style={{ ...styles.whatsappBtn, fontSize: 11, padding: "6px 8px" }}
                                  >
                                    واتساب
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ---- تبويب: الفواتير (تم تحويله إلى صفوف جدول منظمة) ---- */}
        {activeTab === "invoices" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0B2027" }}>سجل الفواتير</h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#5B7278" }}>
                  عرض وإدارة وطباعة جميع فواتير المبيعات
                </p>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, background: "#E0F2FE", color: "#0369A1", padding: "6px 14px", borderRadius: 999 }}>
                إجمالي الفواتير: {filteredInvoices.length} فاتورة ({filteredInvoices.reduce((s, o) => s + (Number(o.total_price) || 0), 0).toLocaleString()} د.ل)
              </div>
            </div>

            {/* شريط البحث في الفواتير */}
            <div style={styles.searchBarWrapper}>
              <input
                style={styles.invoiceSearchInput}
                placeholder="🔍 ابحث برقم الفاتورة، اسم الزبون، أو رقم الهاتف..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
              />
              {invoiceSearch && (
                <button
                  onClick={() => setInvoiceSearch("")}
                  style={styles.clearSearchBtn}
                >
                  مسح
                </button>
              )}
            </div>

            {ordersLoading ? (
              <p>جارٍ تحميل الفواتير...</p>
            ) : filteredInvoices.length === 0 ? (
              <div style={{ ...styles.modernCard, textAlign: "center", padding: 32, color: "#888" }}>
                لا توجد فواتير مطابقة لعملية البحث
              </div>
            ) : (
              <div style={styles.modernCard}>
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>رقم الفاتورة</th>
                        <th style={styles.th}>العميل</th>
                        <th style={styles.th}>رقم الهاتف</th>
                        <th style={styles.th}>المنتجات</th>
                        <th style={styles.th}>طريقة الدفع</th>
                        <th style={styles.th}>الإجمالي</th>
                        <th style={styles.th}>الحالة</th>
                        <th style={styles.th}>تاريخ الفاتورة</th>
                        <th style={styles.th}>الإجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((order) => (
                        <tr key={order.id} style={styles.tr}>
                          <td style={{ ...styles.td, fontWeight: 800, color: "#0E7C86" }}>
                            INV-{order.id}
                          </td>
                          <td style={{ ...styles.td, fontWeight: 700 }}>
                            {order.customer_name || "زبون"}
                          </td>
                          <td style={{ ...styles.td, direction: "ltr", textAlign: "right" }}>
                            {order.customer_phone || "-"}
                          </td>
                          <td style={styles.td}>
                            <div style={{ maxWidth: 220, fontSize: 12, lineHeight: 1.4 }}>
                              {(order.items || []).map((it, idx) => (
                                <span key={idx} style={{ display: "block" }}>
                                  • {it.title} × {it.qty}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: order.payment_method === "كاش" ? "#F1F5F9" : "#FEF3C7", color: order.payment_method === "كاش" ? "#334155" : "#B45309" }}>
                              {order.payment_method || "كاش"}
                            </span>
                          </td>
                          <td style={{ ...styles.td, fontWeight: 800, fontSize: 14, color: "#0B2027" }}>
                            {order.total_price} د.ل
                          </td>
                          <td style={styles.td}>
                            <span style={styles.orderStatusPill(order.status)}>
                              {STATUS_LABELS[order.status] || order.status || "جديد"}
                            </span>
                          </td>
                          <td style={{ ...styles.td, fontSize: 11.5, color: "#5B7278" }}>
                            <div>{new Date(order.created_at).toLocaleDateString("ar-LY")}</div>
                            <div style={{ fontSize: 10, color: "#94A3B8" }}>
                              {new Date(order.created_at).toLocaleTimeString("ar-LY", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <button
                              onClick={() => printAdminInvoice(order, settingsForm.store_name)}
                              style={styles.printInvoiceRowBtn}
                            >
                              🧾 طباعة / عرض
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- تبويب: العملاء ---- */}
        {activeTab === "customers" && (
          <>
            <h3 style={{ margin: "0 0 14px 0", fontSize: 18, fontWeight: 800 }}>العملاء ({customers.length})</h3>
            {customers.length === 0 ? (
              <p style={{ color: "#888" }}>لا يوجد عملاء مسجّلون بعد</p>
            ) : (
              <div style={styles.kanbanBoard}>
                {CUSTOMER_TIERS.map((tier) => {
                  const list = customers.filter((c) => c.tier === tier);
                  return (
                    <div key={tier} style={styles.kanbanColumn}>
                      <div style={styles.kanbanHeader}>
                        <span>عملاء {tier}</span>
                        <span style={styles.kanbanCount}>{list.length}</span>
                      </div>
                      <div style={styles.kanbanList}>
                        {list.map((c) => (
                          <div key={c.phone} style={styles.orderCard}>
                            <strong>{c.name}</strong>
                            <div style={{ fontSize: 12, color: "#5B7278", marginTop: 2 }}>{c.phone}</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>{c.ordersCount} طلبات — {c.totalSpent} د.ل</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ---- تبويب: المنتجات ---- */}
        {activeTab === "products" && (
          <>
            <form onSubmit={handleSubmit} style={styles.form}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{editingId ? "تعديل منتج" : "إضافة منتج جديد"}</h3>
              <input
                style={styles.input}
                placeholder="اسم المنتج *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <textarea
                style={{ ...styles.input, resize: "vertical" }}
                placeholder="وصف المنتج"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div style={styles.row}>
                <input
                  style={styles.input}
                  type="number"
                  placeholder="سعر البيع (د.ل) *"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
                <input
                  style={styles.input}
                  type="number"
                  placeholder="سعر التكلفة (اختياري للربح)"
                  value={form.cost_price}
                  onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                />
                <input
                  style={styles.input}
                  type="number"
                  placeholder="سعر المقارنة (قبل الخصم)"
                  value={form.compare_at}
                  onChange={(e) => setForm({ ...form, compare_at: e.target.value })}
                />
              </div>
              <div style={styles.row}>
                <input
                  style={styles.input}
                  placeholder="التصنيف (مثال: إلكترونيات)"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
                <input
                  style={styles.input}
                  placeholder="كود المنتج (SKU)"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
                <input
                  style={styles.input}
                  type="number"
                  placeholder="المخزون"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>

              {/* رفع الصور */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700 }}>صور المنتج</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                  style={styles.input}
                />
              </div>

              <div style={styles.row}>
                <button type="submit" disabled={saving} style={styles.primaryBtn}>
                  {saving ? "جارٍ الحفظ..." : editingId ? "حفظ التعديل" : "إضافة المنتج"}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} style={styles.secondaryBtn}>
                    إلغاء
                  </button>
                )}
              </div>
            </form>

            <h3 style={{ margin: "20px 0 14px 0", fontSize: 18, fontWeight: 800 }}>المنتجات الحالية ({products.length})</h3>
            {loading ? (
              <p>جارٍ التحميل...</p>
            ) : (
              <div style={styles.kanbanBoard}>
                {categoryList.map((cat) => (
                  <div key={cat} style={styles.kanbanColumn}>
                    <div style={styles.kanbanHeader}>
                      <span>{cat}</span>
                      <span style={styles.kanbanCount}>{productsByCategory[cat].length}</span>
                    </div>
                    <div style={styles.kanbanList}>
                      {productsByCategory[cat].map((p) => {
                        const stockColor = p.stock === 0 ? "#c00" : p.stock <= 5 ? "#c98a00" : "#1c9963";
                        const stockLabel =
                          p.stock === 0 ? "نفد المخزون" : p.stock <= 5 ? `منخفض: ${p.stock} قطع` : `${p.stock} قطعة متوفرة`;
                        return (
                          <div key={p.id} style={styles.orderCard}>
                            {p.image && (
                              <img src={p.image} alt={p.title} style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 6 }} />
                            )}
                            <strong style={{ display: "block", marginTop: 6 }}>{p.title}</strong>
                            <div>{p.price} د.ل</div>
                            <div style={{ color: stockColor, fontWeight: "bold", fontSize: 12 }}>{stockLabel}</div>
                            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                              <button onClick={() => startEdit(p)} style={{ ...styles.secondaryBtn, fontSize: 12, flex: 1 }}>
                                تعديل
                              </button>
                              {!isModerator && (
                                <button onClick={() => handleDelete(p.id)} style={{ ...styles.deleteBtn, fontSize: 12, flex: 1 }}>
                                  حذف
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ---- تبويب: إدارة الفريق (Owner فقط) مع حل مشكلة البريد المكرر وعرض قائمة الأعضاء ---- */}
        {activeTab === "team" && isOwner && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>إدارة الفريق والصلاحيات</h3>

            <form onSubmit={handleAddMember} style={styles.form}>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>إضافة أو تعديل صلاحية عضو</h4>
              <div style={styles.row}>
                <input
                  style={{ ...styles.input, flex: 2 }}
                  type="email"
                  placeholder="البريد الإلكتروني للعضو (مثال: aar06382@gmail.com)"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  required
                />
                <select
                  style={{ ...styles.select, flex: 1 }}
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                >
                  <option value="admin">أدمن (كل الصلاحيات عدا إدارة الفريق)</option>
                  <option value="moderator">مشرف (إضافة وتعديل المنتجات فقط)</option>
                </select>
                <button type="submit" disabled={teamSaving} style={{ ...styles.primaryBtn, whiteSpace: "nowrap" }}>
                  {teamSaving ? "جارٍ الحفظ..." : "حفظ الصلاحية"}
                </button>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#5B7278", lineHeight: 1.6 }}>
                💡 <strong>ملاحظة:</strong> إذا كان البريد مسجلاً مسبقاً، سيتم تعديل رتبته وصلاحيته تلقائياً بدون أي تعارض. تأكد من تسجيل نفس البريد في Authentication بـ Supabase ليتمكن العضو من الدخول بكلمة مروره.
              </p>
            </form>

            <div style={styles.modernCard}>
              <h4 style={{ margin: "0 0 14px 0", fontSize: 16, fontWeight: 800 }}>أعضاء الفريق الحاليون ({teamMembers.length})</h4>
              {teamMembers.length === 0 ? (
                <p style={{ color: "#888", fontSize: 13 }}>لا يوجد أعضاء مسجلين بعد</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>البريد الإلكتروني</th>
                        <th style={styles.th}>الرتبة / الصلاحية</th>
                        <th style={styles.th}>تاريخ الإضافة</th>
                        <th style={styles.th}>الإجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((m) => {
                        const isMemberOwner = m.role === "owner";
                        const roleLabel = isMemberOwner ? "مالك المتجر (Owner)" : m.role === "admin" ? "أدمن (Admin)" : "مشرف (Moderator)";
                        const roleBg = isMemberOwner ? "#FEF3C7" : m.role === "admin" ? "#E0F2FE" : "#F1F5F9";
                        const roleColor = isMemberOwner ? "#D97706" : m.role === "admin" ? "#0284C7" : "#475569";
                        return (
                          <tr key={m.id} style={styles.tr}>
                            <td style={{ ...styles.td, fontWeight: 700 }}>{m.email}</td>
                            <td style={styles.td}>
                              <span style={{ padding: "4px 10px", borderRadius: 999, background: roleBg, color: roleColor, fontSize: 11.5, fontWeight: 800 }}>
                                {roleLabel}
                              </span>
                            </td>
                            <td style={{ ...styles.td, fontSize: 12, color: "#5B7278" }}>
                              {m.created_at ? new Date(m.created_at).toLocaleDateString("ar-LY") : "-"}
                            </td>
                            <td style={styles.td}>
                              {!isMemberOwner ? (
                                <button
                                  onClick={() => handleRemoveMember(m.id, m.role)}
                                  style={{ ...styles.deleteBtn, padding: "5px 12px", borderRadius: 999 }}
                                >
                                  إزالة العضو
                                </button>
                              ) : (
                                <span style={{ fontSize: 12, color: "#94A3B8" }}>المالك الأساسي</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- تبويب: إعدادات الدخول (Owner فقط) ---- */}
        {activeTab === "credentials" && isOwner && (
          <form onSubmit={handleUpdateCredentials} style={styles.form}>
            <h3 style={{ margin: "0 0 14px 0", fontSize: 18, fontWeight: 800 }}>إعدادات الدخول</h3>
            <input
              style={styles.input}
              type="email"
              placeholder="بريد إلكتروني جديد (اتركه فارغ لعدم التغيير)"
              value={newLoginEmail}
              onChange={(e) => setNewLoginEmail(e.target.value)}
            />
            <input
              style={styles.input}
              type="password"
              placeholder="كلمة مرور جديدة (اتركها فارغة لعدم التغيير)"
              value={newLoginPassword}
              onChange={(e) => setNewLoginPassword(e.target.value)}
            />
            <button type="submit" disabled={credsSaving} style={styles.primaryBtn}>
              {credsSaving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
            </button>
            {credsMessage && (
              <span style={{ color: credsMessage.startsWith("خطأ") ? "#c00" : "#1c9963", fontWeight: 700 }}>
                {credsMessage}
              </span>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  layout: { display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Tajawal', Arial, sans-serif" },
  menuToggle: {
    display: "none",
    position: "fixed",
    top: 12,
    right: 12,
    zIndex: 1001,
    width: 42,
    height: 42,
    background: "#0B2027",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 20,
    cursor: "pointer",
  },
  overlay: {
    display: "none",
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 999,
  },
  sidebar: {
    width: 220,
    background: "#0B2027",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    padding: 20,
    gap: 6,
    flexShrink: 0,
  },
  tabBtn: {
    padding: "11px 14px",
    background: "transparent",
    color: "#94A3B8",
    border: "none",
    borderRadius: 10,
    textAlign: "right",
    cursor: "pointer",
    fontSize: 13.5,
    fontWeight: 700,
    transition: "all .15s ease",
  },
  tabBtnActive: { background: "#0E7C86", color: "#fff", fontWeight: 800 },
  page: { flex: 1, padding: "24px 32px", maxWidth: 1280, margin: "0 auto", width: "100%" },
  dashHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 },
  timeFilterGroup: { display: "flex", background: "#E2E8F0", padding: 4, borderRadius: 999, gap: 4 },
  timeFilterBtn: { padding: "6px 14px", borderRadius: 999, border: "none", background: "transparent", color: "#64748B", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  timeFilterBtnActive: { background: "#fff", color: "#0B2027", boxShadow: "0 2px 4px rgba(0,0,0,0.06)" },
  metricCardsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 },
  modernCard: { background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  metricIconBox: (bg, color) => ({ width: 38, height: 38, borderRadius: 10, background: bg, color: color, display: "flex", alignItems: "center", justifyContent: "center" }),
  trendBadge: (bg, color) => ({ padding: "3px 8px", borderRadius: 999, background: bg, color: color, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 2 }),
  analyticsRow: { display: "flex", gap: 14, flexWrap: "wrap" },
  topProductItem: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #F1F5F9" },
  rankBadge: { width: 22, height: 22, borderRadius: "50%", background: "#F1F5F9", color: "#475569", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" },
  topProductThumb: { width: 38, height: 38, borderRadius: 8, objectFit: "cover" },
  searchBarWrapper: { display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 460 },
  invoiceSearchInput: { flex: 1, padding: "10px 16px", borderRadius: 999, border: "1px solid #CBD5E1", background: "#fff", outline: "none", fontSize: 13, fontFamily: "inherit" },
  clearSearchBtn: { padding: "8px 16px", borderRadius: 999, background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#64748B", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "right" },
  th: { padding: "12px 14px", borderBottom: "1.5px solid #E2E8F0", fontSize: 12.5, fontWeight: 800, color: "#475569", background: "#F8FAFC" },
  tr: { borderBottom: "1px solid #F1F5F9", transition: "background .15s ease" },
  td: { padding: "14px", fontSize: 13 },
  orderStatusPill: (status) => {
    const isCompleted = status === "تم التسليم";
    const isShipped = status === "تم الشحن" || status === "قيد التجهيز";
    const isCancelled = status === "ملغي";
    const bg = isCompleted ? "#DCFCE7" : isShipped ? "#E0F2FE" : isCancelled ? "#FEE2E2" : "#FEF3C7";
    const color = isCompleted ? "#16A34A" : isShipped ? "#0284C7" : isCancelled ? "#DC2626" : "#D97706";
    return { padding: "4px 10px", borderRadius: 999, background: bg, color: color, fontSize: 11, fontWeight: 800, display: "inline-block" };
  },
  actionPillBtn: { padding: "5px 12px", borderRadius: 999, background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#0B2027", fontSize: 11.5, fontWeight: 700, cursor: "pointer" },
  printInvoiceRowBtn: { padding: "6px 14px", borderRadius: 999, background: "#0E7C86", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, transition: "opacity .15s" },
  kanbanBoard: { display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12 },
  kanbanColumn: { minWidth: 250, background: "#F8FAFC", borderRadius: 14, border: "1px solid #E2E8F0", padding: 12, display: "flex", flexDirection: "column", maxHeight: "75vh" },
  kanbanHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800, paddingBottom: 8, marginBottom: 8, borderBottom: "2px solid #E2E8F0" },
  kanbanCount: { background: "#0E7C86", color: "#fff", borderRadius: 999, padding: "2px 8px", fontSize: 11 },
  kanbanList: { display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" },
  orderCard: { background: "#fff", border: "1px solid #E2E8F0", padding: 12, borderRadius: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" },
  orderHeadRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  form: { display: "flex", flexDirection: "column", gap: 14, background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #E2E8F0" },
  row: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  input: { padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", width: "100%", fontFamily: "inherit", fontSize: 13, outline: "none" },
  select: { padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontFamily: "inherit", fontSize: 13, outline: "none", background: "#fff" },
  primaryBtn: { padding: "11px 20px", background: "#0E7C86", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 13.5 },
  secondaryBtn: { padding: "8px 14px", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 },
  whatsappBtn: { padding: "8px 12px", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 12 },
  deleteBtn: { padding: "8px 12px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 },
  logoutBtn: { padding: "10px 14px", background: "#1E293B", color: "#F87171", border: "none", borderRadius: 10, cursor: "pointer", marginTop: "auto", fontWeight: 700 },
  loginWrap: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#F8FAFC" },
  loginBox: { display: "flex", flexDirection: "column", gap: 12, width: 300, background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #E2E8F0" },
  list: { display: "flex", flexDirection: "column", gap: 10 },
};