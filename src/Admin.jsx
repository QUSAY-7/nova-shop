import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";
function buildStatusWhatsAppLink(order) {
  let phone = (order.customer_phone || "").replace(/[^\d]/g, "");
  if (!phone) return null;
  // لو الرقم محلي (يبدأ بـ 0 أو 9 أرقام)، نضيف مقدمة ليبيا 218
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

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadMethod, setUploadMethod] = useState("file"); // "file" أو "url"

  const emptyForm = {
    name: "",
    description: "",
    price: "",
    compare_at: "",
    category: "",
    code: "",
    stock: "",
    image: "", // الصورة الرئيسية (غلاف)
    extraImagesText: "", // روابط صور إضافية، كل رابط بسطر (وضع url)
  };
  const [form, setForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState([]); // ملفات متعددة (وضع رفع من الجهاز)
  const [existingImages, setExistingImages] = useState([]); // صور المنتج الحالية وقت التعديل
  const [editingId, setEditingId] = useState(null);

  // ---- إعدادات المتجر ----
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

  // ---- الطلبات ----
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const ORDER_STATUSES = ["جديد", "قيد التجهيز", "تم الشحن", "تم التسليم", "ملغي"];
// ---- تجميع العملاء من الطلبات ----
  const customers = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const phone = o.customer_phone;
      if (!phone) return; // تجاهل الطلبات القديمة بدون رقم هاتف
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

  // ---- إحصائيات لوحة التحكم ----
  const dashboardStats = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== "ملغي");
    const totalSales = validOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const totalOrders = orders.length;
    const totalCustomers = customers.length;

    const productSales = {};
    validOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const key = it.title || "منتج بدون اسم";
        productSales[key] = (productSales[key] || 0) + (it.qty || 0);
      });
    });
    let topProduct = null;
    let topQty = 0;
    Object.entries(productSales).forEach(([title, qty]) => {
      if (qty > topQty) {
        topQty = qty;
        topProduct = title;
      }
    });

    return { totalSales, totalOrders, totalCustomers, topProduct, topQty };
  }, [orders, customers]);
  // تحقق من وجود جلسة دخول حالية، وتابع أي تغيير بحالة الدخول
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authed) {
      fetchProducts();
      fetchSettings();
      fetchOrders();
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

  async function updateOrderStatus(id, status) {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);
    if (error) {
      alert("فشل تحديث الحالة: " + error.message);
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
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
      // رابط الصورة الرئيسية + الروابط الإضافية (كل رابط بسطر)
      if (form.image) urls.push(form.image);
      const extra = form.extraImagesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      urls = urls.concat(extra);
    } else {
      // وضع رفع من الجهاز: نحتفظ بالصور القديمة (وقت التعديل) ونضيف لها أي ملفات جديدة
      urls = [...existingImages];

      for (const file of imageFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("Product-images")
          .upload(fileName, file);

        if (uploadError) {
          alert("فشل رفع إحدى الصور: " + uploadError.message);
          continue;
        }

        const { data } = supabase.storage
          .from("Product-images")
          .getPublicUrl(fileName);

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

    // ⚠️ ملاحظة مهمة: أسماء الأعمدة هنا لازم تطابق أعمدة جدول products
    // بالضبط زي ما هي بـ Supabase (title, old_price... مو name, compare_at)
    const payload = {
      title: form.name,
      description: form.description || null,
      price: Number(form.price),
      old_price: form.compare_at ? Number(form.compare_at) : null,
      category: form.category || null,
      code: form.code || null,
      stock: form.stock !== "" ? Number(form.stock) : 0,
      image: imageUrls[0] || null, // أول صورة تُستخدم كغلاف بشبكة المنتجات
      images: imageUrls,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingId));
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFiles([]);
    setExistingImages([]);
  }

  async function handleDelete(id) {
    if (!confirm("متأكد تبي تحذف هذا المنتج؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("فشل الحذف: " + error.message);
      return;
    }
    fetchProducts();
  }

  // أثناء التحقق من وجود جلسة دخول سابقة
  if (authChecking) {
    return (
      <div style={styles.loginWrap}>
        <p>جارٍ التحقق...</p>
      </div>
    );
  }

  // شاشة تسجيل الدخول
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
          {loginError && (
            <span style={{ color: "#c00", fontSize: 13 }}>{loginError}</span>
          )}
          <button type="submit" disabled={loggingIn} style={styles.primaryBtn}>
            {loggingIn ? "جارٍ الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h2>لوحة تحكم المنتجات</h2>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          تسجيل خروج
        </button>
      </div>
{/* لوحة الإحصائيات */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>إجمالي المبيعات</div>
          <div style={styles.statValue}>{dashboardStats.totalSales} د.ل</div>
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
          <div style={styles.statLabel}>الأكثر مبيعاً</div>
          <div style={{ ...styles.statValue, fontSize: 15 }}>
            {dashboardStats.topProduct ? `${dashboardStats.topProduct} (${dashboardStats.topQty})` : "لا يوجد بعد"}
          </div>
        </div>
      </div>
      {/* إعدادات المتجر */}
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
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, store_name: e.target.value })
              }
            />
            <input
              style={styles.input}
              placeholder="رقم الواتساب (بصيغة دولية، مثال 218912345678)"
              value={settingsForm.whatsapp_number}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })
              }
            />
            <input
              style={styles.input}
              placeholder="رقم الحساب البنكي"
              value={settingsForm.bank_account}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, bank_account: e.target.value })
              }
            />
            <div style={styles.row}>
              <input
                style={styles.input}
                placeholder="رابط فيسبوك (اختياري)"
                value={settingsForm.facebook_url}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, facebook_url: e.target.value })
                }
              />
              <input
                style={styles.input}
                placeholder="رابط إنستقرام (اختياري)"
                value={settingsForm.instagram_url}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, instagram_url: e.target.value })
                }
              />
            </div>

            <div style={styles.row}>
              <button type="submit" disabled={settingsSaving} style={styles.primaryBtn}>
                {settingsSaving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
              </button>
              {settingsSaved && (
                <span style={{ color: "#1c9963", alignSelf: "center" }}>
                  ✓ تم الحفظ بنجاح
                </span>
              )}
            </div>
          </>
        )}
      </form>

      {/* الطلبات */}
      <h3>الطلبات ({orders.length})</h3>
      {ordersLoading ? (
        <p>جارٍ تحميل الطلبات...</p>
      ) : orders.length === 0 ? (
        <p style={{ color: "#888" }}>لا توجد طلبات حتى الآن</p>
      ) : (
        <div style={{ ...styles.list, marginBottom: 30 }}>
          {orders.map((o) => (
            <div key={o.id} style={styles.orderCard}>
              <div style={styles.orderHeadRow}>
                <strong>طلب #{o.id}</strong>
                <span style={{ color: "#888", fontSize: 13 }}>
                  {new Date(o.created_at).toLocaleString("ar-LY")}
                </span>
              </div>
              <div style={{ fontSize: 14, margin: "6px 0" }}>
                {(o.items || []).map((it, i) => (
                  <div key={i}>
                    {it.title} × {it.qty} — {it.price * it.qty} د.ل
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 14, fontWeight: "bold" }}>
                الإجمالي: {o.total_price} د.ل — {o.payment_method}
              </div>
              <div style={{ fontSize: 13, marginTop: 8, padding: 8, background: "#f7f7f7", borderRadius: 6 }}>
                <div><strong>الزبون:</strong> {o.customer_name || "غير مسجل"}</div>
                <div><strong>الهاتف:</strong> {o.customer_phone || "غير مسجل"}</div>
                <div><strong>العنوان:</strong> {o.customer_address || "غير مسجل"}</div>
              </div>

              
                 <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                <select
                  value={o.status}
                  onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                  style={styles.select}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {o.customer_phone && (
                  <button
                    type="button"
                    onClick={() => window.open(buildStatusWhatsAppLink(o), "_blank")}
                    style={styles.whatsappBtn}
                  >
                    إرسال إشعار واتساب
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
{/* العملاء */}
      <h3>العملاء ({customers.length})</h3>
      {customers.length === 0 ? (
        <p style={{ color: "#888", marginBottom: 30 }}>لا يوجد عملاء مسجّلون بعد</p>
      ) : (
        <div style={{ ...styles.list, marginBottom: 30 }}>
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

      {/* نموذج إضافة / تعديل منتج */}
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

        {/* اختيار طريقة الصورة */}
        <div style={styles.row}>
          <label>
            <input
              type="radio"
              checked={uploadMethod === "file"}
              onChange={() => setUploadMethod("file")}
            />{" "}
            رفع من الجهاز
          </label>
          <label>
            <input
              type="radio"
              checked={uploadMethod === "url"}
              onChange={() => setUploadMethod("url")}
            />{" "}
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

      {/* قائمة المنتجات */}
      <h3>المنتجات الحالية ({products.length})</h3>
      {loading ? (
        <p>جارٍ التحميل...</p>
      ) : (
        <div style={styles.list}>
          {products.map((p) => {
            const stockColor =
              p.stock === 0 ? "#c00" : p.stock <= 5 ? "#c98a00" : "#1c9963";
            const stockLabel =
              p.stock === 0 ? "نفد المخزون" : p.stock <= 5 ? `منخفض: ${p.stock} قطع` : `${p.stock} قطعة متوفرة`;
            return (
              <div key={p.id} style={styles.card}>
                {p.image && (
                  <img src={p.image} alt={p.title} style={styles.thumb} />
                )}
                <div style={{ flex: 1 }}>
                  <strong>{p.title}</strong>
                  <div>{p.price} د.ك</div>
                  {p.category && <div style={{ color: "#888" }}>{p.category}</div>}
                  <div style={{ color: stockColor, fontWeight: "bold", fontSize: 13 }}>
                    {stockLabel}
                  </div>
                </div>
                <div style={styles.cardActions}>
                  <button onClick={() => startEdit(p)} style={styles.secondaryBtn}>
                    تعديل
                  </button>
                  <button onClick={() => handleDelete(p.id)} style={styles.deleteBtn}>
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 700, margin: "0 auto", padding: 16, fontFamily: "sans-serif" },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16, marginBottom: 24 },
  statCard: { border: "1px solid #eee", borderRadius: 10, padding: 14, background: "#fafafa" },
  statLabel: { fontSize: 12, color: "#888", marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "bold", color: "#111" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  loginWrap: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" },
  loginBox: { display: "flex", flexDirection: "column", gap: 10, width: 260 },
  form: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 30, border: "1px solid #eee", padding: 16, borderRadius: 8 },
  row: { display: "flex", gap: 10 },
  input: { padding: 10, borderRadius: 6, border: "1px solid #ccc", width: "100%" },
  primaryBtn: { padding: "10px 16px", background: "#111", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  secondaryBtn: { padding: "8px 12px", background: "#eee", border: "none", borderRadius: 6, cursor: "pointer" },
  whatsappBtn: {  padding: "8px 12px", background: "#25D366", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" },
  deleteBtn: { padding: "8px 12px", background: "#ffe1e1", color: "#c00", border: "none", borderRadius: 6, cursor: "pointer" },
  logoutBtn: { padding: "6px 12px", background: "#eee", border: "none", borderRadius: 6, cursor: "pointer" },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: { display: "flex", alignItems: "center", gap: 12, border: "1px solid #eee", padding: 10, borderRadius: 8 },
  orderCard: { border: "1px solid #eee", padding: 12, borderRadius: 8 },
  orderHeadRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  select: { padding: 8, borderRadius: 6, border: "1px solid #ccc" },
  thumb: { width: 50, height: 50, objectFit: "cover", borderRadius: 6 },
  cardActions: { display: "flex", gap: 6 },
  preview: { width: 100, height: 100, objectFit: "cover", borderRadius: 6 },
};