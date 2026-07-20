import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// ⚠️ غيّر كلمة المرور هذي لأي شي تحبه
const ADMIN_PASSWORD = "غيرني123";

export default function Admin() {
  const [authed, setAuthed] = useState(
    sessionStorage.getItem("admin_authed") === "true"
  );
  const [passwordInput, setPasswordInput] = useState("");

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
    image: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (authed) fetchProducts();
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

  function handleLogin(e) {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_authed", "true");
      setAuthed(true);
    } else {
      alert("كلمة المرور غلط");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_authed");
    setAuthed(false);
  }

  async function uploadImageIfNeeded() {
    // لو المستخدم اختار "رابط" واكتب رابط، نستخدمه مباشرة
    if (uploadMethod === "url") {
      return form.image || null;
    }
    // لو اختار "رفع ملف" ومافيه ملف مختار، نرجع الصورة القديمة (وقت التعديل) أو null
    if (!imageFile) {
      return form.image || null;
    }

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("Product-images")
      .upload(fileName, imageFile);

    if (uploadError) {
      alert("فشل رفع الصورة: " + uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from("Product-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.price) {
      alert("لازم تكتب اسم المنتج والسعر على الأقل");
      return;
    }

    setSaving(true);
    const imageUrl = await uploadImageIfNeeded();

    // ⚠️ ملاحظة مهمة: أسماء الأعمدة هنا لازم تطابق أعمدة جدول products
    // بالضبط زي ما هي بـ Supabase (title, old_price... مو name, compare_at)
    const payload = {
      title: form.name,
      description: form.description || null,
      price: Number(form.price),
      old_price: form.compare_at ? Number(form.compare_at) : null,
      category: form.category || null,
      code: form.code || null,
      image: imageUrl,
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
    setImageFile(null);
    setEditingId(null);
    fetchProducts();
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.title || "",
      description: product.description || "",
      price: product.price || "",
      compare_at: product.old_price || "",
      category: product.category || "",
      code: product.code || "",
      image: product.image || "",
    });
    setUploadMethod("url");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
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

  // شاشة تسجيل الدخول
  if (!authed) {
    return (
      <div style={styles.loginWrap}>
        <form onSubmit={handleLogin} style={styles.loginBox}>
          <h2>لوحة التحكم</h2>
          <input
            type="password"
            placeholder="كلمة المرور"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={styles.input}
            autoFocus
          />
          <button type="submit" style={styles.primaryBtn}>
            دخول
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

      {/* نموذج إضافة / تعديل */}
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
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
            style={styles.input}
          />
        ) : (
          <input
            style={styles.input}
            placeholder="https://..."
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
          />
        )}

        {form.image && uploadMethod === "url" && (
          <img src={form.image} alt="preview" style={styles.preview} />
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
          {products.map((p) => (
            <div key={p.id} style={styles.card}>
              {p.image && (
                <img src={p.image} alt={p.title} style={styles.thumb} />
              )}
              <div style={{ flex: 1 }}>
                <strong>{p.title}</strong>
                <div>{p.price} د.ك</div>
                {p.category && <div style={{ color: "#888" }}>{p.category}</div>}
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
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 700, margin: "0 auto", padding: 16, fontFamily: "sans-serif" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  loginWrap: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" },
  loginBox: { display: "flex", flexDirection: "column", gap: 10, width: 260 },
  form: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 30, border: "1px solid #eee", padding: 16, borderRadius: 8 },
  row: { display: "flex", gap: 10 },
  input: { padding: 10, borderRadius: 6, border: "1px solid #ccc", width: "100%" },
  primaryBtn: { padding: "10px 16px", background: "#111", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  secondaryBtn: { padding: "8px 12px", background: "#eee", border: "none", borderRadius: 6, cursor: "pointer" },
  deleteBtn: { padding: "8px 12px", background: "#ffe1e1", color: "#c00", border: "none", borderRadius: 6, cursor: "pointer" },
  logoutBtn: { padding: "6px 12px", background: "#eee", border: "none", borderRadius: 6, cursor: "pointer" },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: { display: "flex", alignItems: "center", gap: 12, border: "1px solid #eee", padding: 10, borderRadius: 8 },
  thumb: { width: 50, height: 50, objectFit: "cover", borderRadius: 6 },
  cardActions: { display: "flex", gap: 6 },
  preview: { width: 100, height: 100, objectFit: "cover", borderRadius: 6 },
};