import { useState, useEffect, useMemo } from "react";
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
  useEffect(() => {
    if (isModerator) setActiveTab("products");
  }, [userRole]);
  const TABS = isModerator
    ? [{ id: "products", label: "المنتجات" }]
    : [
        { id: "dashboard", label: "الرئيسية" },
        { id: "settings", label: "إعدادات المتجر" },
        { id: "orders", label: "الطلبات" },
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

  const emptySettingsForm = {
    store_name: "",
    whatsapp_number: "",
    bank_account: "",
    facebook_url: "",
    instagram_url: "",
  };
  const [settingsForm, setSettingsForm] = useState(emptySettingsForm);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const ORDER_STATUSES = ["جديد", "قيد التجهيز", "تم الشحن", "تم التسليم", "ملغي"];
const STATUS_LABELS = {
  "جديد": "جديد",
  "قيد التجهيز": "قيد التجهيز",
  "تم الشحن": "قيد الشحن",
  "تم التسليم": "تم التسليم",
  "ملغي": "ملغي",
};
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
    return Object.values(map).sort((a, b) => b.ordersCount - a.ordersCount);
  }, [orders]);

  const dashboardStats = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== "ملغي");
    const totalSales = validOrders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
    const totalOrders = orders.length;
    const totalCustomers = customers.length;

    // مبيعات اليوم والشهر
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = new Date().toISOString().slice(0, 7);

    const dailySales = validOrders
      .filter((o) => o.created_at.slice(0, 10) === today)
      .reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);

    const monthlySales = validOrders
      .filter((o) => o.created_at.slice(0, 7) === thisMonth)
      .reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);

    // مبيعات كل منتج (بالكمية)
    const productSales = {};
    validOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const key = it.title || "منتج بدون اسم";
        productSales[key] = (productSales[key] || 0) + (it.qty || 0);
      });
    });

    // الأكثر مبيعاً (أول 5)
    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([title, qty]) => ({ title, qty }));

    const topProduct = topProducts[0]?.title || null;
    const topQty = topProducts[0]?.qty || 0;

    // الأقل طلباً — نأخذ كل منتجات المخزون ونقارنها بمبيعاتها
    const topTitles = new Set(topProducts.map((p) => p.title));
    const leastOrderedProducts = products
      .map((p) => ({ title: p.title, qty: productSales[p.title] || 0 }))
      .filter((p) => !topTitles.has(p.title))
      .sort((a, b) => a.qty - b.qty)
      .slice(0, 5);

    const todayVisits = visits.filter((v) => v.created_at.slice(0, 10) === today).length;
    const monthVisits = visits.filter((v) => v.created_at.slice(0, 7) === thisMonth).length;

    return {
      totalSales,
      totalOrders,
      totalCustomers,
      topProduct,
      topQty,
      todayVisits,
      monthVisits,
      dailySales,
      monthlySales,
      topProducts,
      leastOrderedProducts,
    };
  }, [orders, customers, visits, products]);

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
    if (!error) setProducts(data);
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
        whatsapp_number: data.whatsapp_number || "",
        bank_account: data.bank_account || "",
        facebook_url: data.facebook_url || "",
        instagram_url: data.instagram_url || "",
      });
    }
    setSettingsLoading(false);
  }

  async function handleSettingsSubmit(e) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSaved(false);

    const { error } = await supabase
      .from("store_settings")
      .update(settingsForm)
      .eq("id", 1);

    setSettingsSaving(false);

    if (error) {
      alert("صار خطأ أثناء حفظ الإعدادات: " + error.message);
      return;
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
    if (!error) setOrders(data);
    setOrdersLoading(false);
  }

  async function fetchVisits() {
    const { data, error } = await supabase.from("visits").select("created_at");
    if (!error) setVisits(data || []);
  }async function fetchUserRole() {
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

  async function handleAddMember(e) {
    e.preventDefault();
    if (!newMemberEmail) return;
    setTeamSaving(true);
    const { error } = await supabase
      .from("admin_users")
      .insert([{ email: newMemberEmail, role: newMemberRole }]);
    setTeamSaving(false);
    if (error) {
      alert("فشل الإضافة: " + error.message);
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
    if (!confirm("متأكد تبي تزيل هذا العضو؟")) return;
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
      old_price: form.compare_at ? Number(form.compare_at) : null,
      category: form.category || null,
      code: form.code || null,
      stock: form.stock !== "" ? Number(form.stock) : 0,
      image: imageUrls[0] || null,
      images: imageUrls,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("products").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("products").insert([payload]));
    }

    setSaving(false);

    if (error) {
      alert("صار خطأ: " + error.message);
      return;
    }

    setForm(emptyForm);
    setImageFiles([]);
    setExistingImages([]);
    setEditingId(null);
    fetchProducts();
  }

  function startEdit(product) {
    setEditingId(product.id);
    const imgs = product.images && product.images.length ? product.images : (product.image ? [product.image] : []);
    setForm({
      name: product.title || "",
      description: product.description || "",
      price: product.price || "",
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

  return (
  <div dir="rtl" style={styles.layout}>
    {/* زر فتح/إغلاق القائمة - يظهر بس على الموبايل */}
    <button
      onClick={() => setSidebarOpen(!sidebarOpen)}
      style={styles.menuToggle}
      className="admin-menu-toggle"
    >
      ☰
    </button>

    {/* خلفية شفافة تقفل القائمة عند الضغط عليها */}
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
      <h3 style={styles.sidebarTitle}>لوحة التحكم</h3>
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

    {/* المحتوى */}
    <div style={styles.page}>
        {/* ---- تبويب: الرئيسية ---- */}
        
{activeTab === "dashboard" && (
          <>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>إجمالي المبيعات</div>
                <div style={styles.statValue}>{dashboardStats.totalSales} د.ل</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>مبيعات اليوم</div>
                <div style={styles.statValue}>{dashboardStats.dailySales} د.ل</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>مبيعات الشهر</div>
                <div style={styles.statValue}>{dashboardStats.monthlySales} د.ل</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>عدد الطلبات</div>
                <div style={styles.statValue}>{dashboardStats.totalOrders}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>عدد العملاء</div>
                <div style={styles.statValue}>{dashboardStats.totalCustomers}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>زوار اليوم</div>
                <div style={styles.statValue}>{dashboardStats.todayVisits}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>زوار الشهر</div>
                <div style={styles.statValue}>{dashboardStats.monthVisits}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
              {/* الأكثر طلباً */}
              <div style={{ flex: 1, minWidth: 250 }}>
                <h3>الأكثر طلباً</h3>
                {dashboardStats.topProducts.length === 0 ? (
                  <p style={{ color: "#888" }}>لا توجد بيانات بعد</p>
                ) : (
                  <div style={styles.list}>
                    {dashboardStats.topProducts.map((p, i) => (
                      <div key={i} style={styles.orderCard}>
                        <span>{p.title}</span>
                        <span style={{ float: "left", fontWeight: "bold", color: "#1c9963" }}>
                          {p.qty} طلب
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* الأقل طلباً */}
              <div style={{ flex: 1, minWidth: 250 }}>
                <h3>الأقل طلباً</h3>
                {dashboardStats.leastOrderedProducts.length === 0 ? (
                  <p style={{ color: "#888" }}>لا توجد بيانات بعد</p>
                ) : (
                  <div style={styles.list}>
                    {dashboardStats.leastOrderedProducts.map((p, i) => (
                      <div key={i} style={styles.orderCard}>
                        <span>{p.title}</span>
                        <span style={{ float: "left", fontWeight: "bold", color: "#c00" }}>
                          {p.qty} طلب
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        {/* ---- تبويب: إعدادات المتجر ---- */}
        {activeTab === "settings" && (
          <form onSubmit={handleSettingsSubmit} style={styles.form}>
            <h3>إعدادات المتجر</h3>
            {settingsLoading ? (
              <p>جارٍ تحميل الإعدادات...</p>
            ) : (
              <>
                <input
                  style={styles.input}
                  placeholder="اسم المتجر"
                  value={settingsForm.store_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, store_name: e.target.value })}
                />
                <input
                  style={styles.input}
                  placeholder="رقم الواتساب (بصيغة دولية، مثال 218912345678)"
                  value={settingsForm.whatsapp_number}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                />
                <input
                  style={styles.input}
                  placeholder="رقم الحساب البنكي"
                  value={settingsForm.bank_account}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bank_account: e.target.value })}
                />
                <div style={styles.row}>
                  <input
                    style={styles.input}
                    placeholder="رابط فيسبوك (اختياري)"
                    value={settingsForm.facebook_url}
                    onChange={(e) => setSettingsForm({ ...settingsForm, facebook_url: e.target.value })}
                  />
                  <input
                    style={styles.input}
                    placeholder="رابط إنستقرام (اختياري)"
                    value={settingsForm.instagram_url}
                    onChange={(e) => setSettingsForm({ ...settingsForm, instagram_url: e.target.value })}
                  />
                </div>
                <div style={styles.row}>
                  <button type="submit" disabled={settingsSaving} style={styles.primaryBtn}>
                    {settingsSaving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
                  </button>
                  {settingsSaved && (
                    <span style={{ color: "#1c9963", alignSelf: "center" }}>✓ تم الحفظ بنجاح</span>
                  )}
                </div>
              </>
            )}
          </form>
        )}

        {/* ---- تبويب: الطلبات ---- */}
        {activeTab === "orders" && (
          <>
            <h3>الطلبات ({orders.length})</h3>
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

        {/* ---- تبويب: العملاء ---- */}
        {activeTab === "customers" && (
          <>
            <h3>العملاء ({customers.length})</h3>
            {customers.length === 0 ? (
              <p style={{ color: "#888" }}>لا يوجد عملاء مسجّلون بعد</p>
            ) : (
              <div style={styles.list}>
                {customers.map((c) => (
                  <div key={c.phone} style={styles.orderCard}>
                    <div style={styles.orderHeadRow}>
                      <strong>{c.name}</strong>
                      <span style={{ color: "#888", fontSize: 13 }}>
                        آخر طلب: {new Date(c.lastOrderDate).toLocaleDateString("ar-LY")}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>
                      <div>📞 {c.phone}</div>
                      {c.address && <div>📍 {c.address}</div>}
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 16, fontSize: 13, fontWeight: "bold" }}>
                      <span>عدد الطلبات: {c.ordersCount}</span>
                      <span style={{ color: "#1c9963" }}>إجمالي الإنفاق: {c.totalSpent} د.ل</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ---- تبويب: المنتجات ---- */}
        {activeTab === "products" && (
          <>
            <form onSubmit={handleSubmit} style={styles.form}>
              <h3>{editingId ? "تعديل منتج" : "إضافة منتج جديد"}</h3>

              <input
                style={styles.input}
                placeholder="اسم المنتج *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <textarea
                style={styles.input}
                placeholder="الوصف"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div style={styles.row}>
                <input
                  style={styles.input}
                  type="number"
                  placeholder="السعر *"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
                <input
                  style={styles.input}
                  type="number"
                  placeholder="السعر قبل الخصم (اختياري)"
                  value={form.compare_at}
                  onChange={(e) => setForm({ ...form, compare_at: e.target.value })}
                />
              </div>
              <div style={styles.row}>
                <input
                  style={styles.input}
                  placeholder="التصنيف"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
                <input
                  style={styles.input}
                  placeholder="كود المنتج (اختياري)"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <input
                style={styles.input}
                type="number"
                placeholder="الكمية المتوفرة بالمخزون *"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />

              <div style={styles.row}>
                <label>
                  <input type="radio" checked={uploadMethod === "file"} onChange={() => setUploadMethod("file")} />{" "}
                  رفع من الجهاز
                </label>
                <label>
                  <input type="radio" checked={uploadMethod === "url"} onChange={() => setUploadMethod("url")} />{" "}
                  رابط صورة
                </label>
              </div>

              {uploadMethod === "file" ? (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setImageFiles(Array.from(e.target.files))}
                    style={styles.input}
                  />
                  <span style={{ fontSize: 12, color: "#888" }}>
                    تقدر تختار أكثر من صورة بنفس الوقت (Ctrl أو Shift أثناء الاختيار)
                  </span>
                  {existingImages.length > 0 && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {existingImages.map((url, i) => (
                        <img key={i} src={url} alt={`صورة ${i + 1}`} style={styles.preview} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <input
                    style={styles.input}
                    placeholder="رابط الصورة الرئيسية https://..."
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                  />
                  <textarea
                    style={styles.input}
                    placeholder={"روابط صور إضافية (اختياري) — كل رابط بسطر منفصل"}
                    value={form.extraImagesText}
                    onChange={(e) => setForm({ ...form, extraImagesText: e.target.value })}
                    rows={3}
                  />
                </>
              )}

              {form.image && uploadMethod === "url" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <img src={form.image} alt="preview" style={styles.preview} />
                  {form.extraImagesText
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((url, i) => (
                      <img key={i} src={url} alt={`صورة إضافية ${i + 1}`} style={styles.preview} />
                    ))}
                </div>
              )}

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

            <h3>المنتجات الحالية ({products.length})</h3>
            {loading ? (
              <p>جارٍ التحميل...</p>
            ) : (
              <div style={styles.list}>
                {products.map((p) => {
                  const stockColor = p.stock === 0 ? "#c00" : p.stock <= 5 ? "#c98a00" : "#1c9963";
                  const stockLabel =
                    p.stock === 0 ? "نفد المخزون" : p.stock <= 5 ? `منخفض: ${p.stock} قطع` : `${p.stock} قطعة متوفرة`;
                  return (
                    <div key={p.id} style={styles.card}>
                      {p.image && <img src={p.image} alt={p.title} style={styles.thumb} />}
                      <div style={{ flex: 1 }}>
                        <strong>{p.title}</strong>
                        <div>{p.price} د.ك</div>
                        {p.category && <div style={{ color: "#888" }}>{p.category}</div>}
                        <div style={{ color: stockColor, fontWeight: "bold", fontSize: 13 }}>{stockLabel}</div>
                      </div>
                      <div style={styles.cardActions}>
                      <button onClick={() => startEdit(p)} style={styles.secondaryBtn}>
                        تعديل
                      </button>
                      {!isModerator && (
                        <button onClick={() => handleDelete(p.id)} style={styles.deleteBtn}>
                          حذف
                        </button>
                      )}
                    </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
     {/* ---- تبويب: إدارة الفريق (Owner فقط) ---- */}
        {activeTab === "team" && isOwner && (
          <>
            <h3>إدارة الفريق</h3>
            <form onSubmit={handleAddMember} style={styles.form}>
              <input
                style={styles.input}
                type="email"
                placeholder="البريد الإلكتروني للعضو الجديد"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
              />
              <select
                style={styles.select}
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
              >
                <option value="admin">أدمن (كل الصلاحيات عدا إدارة الفريق)</option>
                <option value="moderator">مشرف (إضافة/تعديل منتجات فقط)</option>
              </select>
              <button type="submit" disabled={teamSaving} style={styles.primaryBtn}>
                {teamSaving ? "جارٍ الإضافة..." : "إضافة عضو"}
              </button>
              <span style={{ fontSize: 12, color: "#888" }}>
                ⚠️ لازم تنشئ حساب الدخول لهذا الشخص أولاً من لوحة Supabase (Authentication) بنفس هذا البريد.
              </span>
            </form>

            <h3>الأعضاء الحاليون ({teamMembers.length})</h3>
            <div style={styles.list}>
              {teamMembers.map((m) => (
                <div key={m.id} style={styles.orderCard}>
                  <div style={styles.orderHeadRow}>
                    <strong>{m.email}</strong>
                    <span
                      style={{
                        color: m.role === "owner" ? "#c98a00" : m.role === "admin" ? "#1c9963" : "#888",
                        fontWeight: "bold",
                        fontSize: 13,
                      }}
                    >
                      {m.role === "owner" ? "مالك" : m.role === "admin" ? "أدمن" : "مشرف"}
                    </span>
                  </div>
                  {m.role !== "owner" && (
                    <button
                      onClick={() => handleRemoveMember(m.id, m.role)}
                      style={{ ...styles.deleteBtn, marginTop: 8 }}
                    >
                      إزالة العضو
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---- تبويب: إعدادات الدخول (Owner فقط) ---- */}
        {activeTab === "credentials" && isOwner && (
          <form onSubmit={handleUpdateCredentials} style={styles.form}>
            <h3>إعدادات الدخول (البريد وكلمة المرور)</h3>
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
              <span style={{ color: credsMessage.startsWith("خطأ") ? "#c00" : "#1c9963" }}>
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
  layout: { display: "flex", minHeight: "100vh", fontFamily: "sans-serif" },
 menuToggle: {
  display: "none",
  position: "fixed",
  top: 12,
  right: 12,
  zIndex: 1001,
  width: 42,
  height: 42,
  background: "#111",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: 20,
  cursor: "pointer",
  kanbanBoard: {
  display: "flex",
  flexDirection: "row",
  flexWrap: "nowrap",
  gap: 12,
  overflowX: "auto",
  paddingBottom: 12,
  WebkitOverflowScrolling: "touch",
},
kanbanColumn: { minWidth: 240, maxWidth: 240, flexShrink: 0, background: "#f4f4f4", borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", maxHeight: "75vh" },
kanbanHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold", paddingBottom: 8, marginBottom: 8, borderBottom: "2px solid #ddd" },
kanbanCount: { background: "#111", color: "#fff", borderRadius: 999, padding: "2px 8px", fontSize: 12 },
kanbanList: { display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" },
},
overlay: {
  display: "none",
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  zIndex: 999,
},
  sidebar: {
    width: 200,
    background: "#111",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    padding: 16,
    gap: 8,
    flexShrink: 0,
  },
  sidebarTitle: { color: "#fff", marginBottom: 10, fontSize: 16 },
  tabBtn: {
    padding: "10px 12px",
    background: "transparent",
    color: "#ccc",
    border: "none",
    borderRadius: 6,
    textAlign: "right",
    cursor: "pointer",
    fontSize: 14,
  },
  tabBtnActive: { background: "#25D366", color: "#fff", fontWeight: "bold" },
  page: { flex: 1, maxWidth: 700, margin: "0 auto", padding: 16 },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  statCard: { border: "1px solid #eee", borderRadius: 10, padding: 14, background: "#fafafa" },
  statLabel: { fontSize: 12, color: "#888", marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "bold", color: "#111" },
  loginWrap: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" },
  loginBox: { display: "flex", flexDirection: "column", gap: 10, width: 260 },
  form: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 30, border: "1px solid #eee", padding: 16, borderRadius: 8 },
  row: { display: "flex", gap: 10 },
  input: { padding: 10, borderRadius: 6, border: "1px solid #ccc", width: "100%" },
  primaryBtn: { padding: "10px 16px", background: "#111", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  secondaryBtn: { padding: "8px 12px", background: "#eee", border: "none", borderRadius: 6, cursor: "pointer" },
  whatsappBtn: { padding: "8px 12px", background: "#25D366", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" },
  deleteBtn: { padding: "8px 12px", background: "#ffe1e1", color: "#c00", border: "none", borderRadius: 6, cursor: "pointer" },
  logoutBtn: { padding: "8px 12px", background: "#333", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", marginTop: "auto" },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: { display: "flex", alignItems: "center", gap: 12, border: "1px solid #eee", padding: 10, borderRadius: 8 },
  orderCard: { border: "1px solid #eee", padding: 12, borderRadius: 8 },
  orderHeadRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  select: { padding: 8, borderRadius: 6, border: "1px solid #ccc" },
  thumb: { width: 50, height: 50, objectFit: "cover", borderRadius: 6 },
  cardActions: { display: "flex", gap: 6 },
  preview: { width: 100, height: 100, objectFit: "cover", borderRadius: 6 },
};