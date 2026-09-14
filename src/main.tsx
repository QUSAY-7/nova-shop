import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// تحميل المتجر ولوحة الإدارة بشكل منفصل وذكي (Lazy Loading)
const App = lazy(() => import("./App.jsx"));
const Admin = lazy(() => import("./Admin.jsx"));

// واجهة تحميل سريعة وأنيقة تظهر لأجزاء من الثانية حتى يكتمل العرض
function LoadingFallback() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "#0f172a",
      color: "#38bdf8",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "42px",
          height: "42px",
          border: "4px solid rgba(56, 189, 248, 0.15)",
          borderTopColor: "#38bdf8",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 16px"
        }} />
        <p style={{ fontSize: "14px", color: "#94a3b8" }}>جاري تحميل المتجر...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function Root() {
  const isAdmin = window.location.pathname.startsWith("/admin");
  return (
    <Suspense fallback={<LoadingFallback />}>
      {isAdmin ? <Admin /> : <App />}
    </Suspense>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);