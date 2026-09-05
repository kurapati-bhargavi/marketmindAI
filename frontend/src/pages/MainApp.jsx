import { useState, useEffect } from "react";
import AppLayout from "../layouts/AppLayout";
import Dashboard from "./Dashboard";
import SalesManagement from "./SalesManagement";
import SalesUpload from "./SalesUpload";
import InventoryIntelligence from "./InventoryIntelligence";
import CustomerSegmentation from "./CustomerSegmentation";
import SalesForecasting from "./SalesForecasting";
import ChurnPrediction from "./ChurnPrediction";
import ProductRecommendations from "./ProductRecommendations";
import AnomalyDetection from "./AnomalyDetection";
import AIInsightsAlerts from "./AIInsightsAlerts";
import BusinessReports from "./BusinessReports";

// =====================
// PROFILE PAGE (inline)
// =====================
function ProfilePage({ user, onLogout }) {
  const [editMode, setEditMode] = useState(false);
  return (
    <div className="animate-fade-in" style={{ maxWidth: "620px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "6px" }}>My Profile</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "28px" }}>
        Account details and session information.
      </p>

      <div className="glass-card" style={{ padding: "28px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "24px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              fontWeight: 800,
              color: "#ffffff",
              flexShrink: 0,
            }}
          >
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-main)" }}>
              {user?.name || "User"}
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{user?.email}</div>
            <span
              style={{
                display: "inline-block",
                marginTop: "6px",
                padding: "3px 10px",
                borderRadius: "9999px",
                background: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {user?.role || "Business Owner"}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {[
            { label: "Full Name", value: user?.name || "—" },
            { label: "Email Address", value: user?.email || "—" },
            { label: "Role", value: user?.role || "Business Owner" },
            { label: "Account Status", value: "Active ✓" },
          ].map((row, i) => (
            <div key={i} style={{ padding: "14px", background: "#f8fafc", borderRadius: "10px", border: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                {row.label}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
                {row.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onLogout}
        style={{
          padding: "12px 24px",
          border: "1px solid #ef4444",
          borderRadius: "8px",
          background: "#fef2f2",
          color: "#dc2626",
          fontWeight: 700,
          fontSize: "14px",
          cursor: "pointer",
        }}
      >
        Sign Out of MarketMind AI
      </button>
    </div>
  );
}

// =====================
// USERS MANAGEMENT (admin only placeholder)
// =====================
function UsersManagement() {
  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>User & Role Management</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
        System Administrator access to manage platform users.
      </p>
      <div className="glass-card" style={{ padding: "30px", textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚙️</div>
        <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>User Management Panel</div>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Visit <strong>/docs</strong> on the backend to seed demo users via the API.
        </p>
        <a
          href="http://127.0.0.1:8000/docs#/Authentication/seed_demo_users_auth_seed_demo_users_post"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-block",
            marginTop: "16px",
            padding: "10px 20px",
            background: "var(--accent-gradient)",
            color: "#fff",
            borderRadius: "8px",
            fontWeight: 700,
            textDecoration: "none",
            fontSize: "13px",
          }}
        >
          Open API Docs →
        </a>
      </div>
    </div>
  );
}

// =====================
// MAIN APP
// =====================
function MainApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [dataUploaded, setDataUploaded] = useState(
    localStorage.getItem("businessDataUploaded") === "true"
  );

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("businessDataUploaded");
    window.location.reload();
  };

  const handleRoleChange = (newRole) => {
    const updated = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
  };

  const handleUploadSuccess = () => {
    localStorage.setItem("businessDataUploaded", "true");
    setDataUploaded(true);
  };

  // =====================
  // PAGE ROUTING
  // =====================
  const renderPage = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard user={user} onNavigate={setActiveTab} />;
      case "sales":
        return <SalesManagement />;
      case "upload":
        return <SalesUpload onUploadSuccess={handleUploadSuccess} />;
      case "inventory":
        return <InventoryIntelligence />;
      case "segmentation":
        return <CustomerSegmentation />;
      case "forecasting":
        return <SalesForecasting />;
      case "churn":
        return <ChurnPrediction />;
      case "recommendations":
        return <ProductRecommendations />;
      case "anomalies":
        return <AnomalyDetection />;
      case "insights":
        return <AIInsightsAlerts />;
      case "reports":
        return <BusinessReports />;
      case "profile":
        return <ProfilePage user={user} onLogout={handleLogout} />;
      case "users":
        return <UsersManagement />;
      default:
        return <Dashboard user={user} onNavigate={setActiveTab} />;
    }
  };

  return (
    <AppLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      user={user}
      onLogout={handleLogout}
      onRoleChange={handleRoleChange}
    >
      {renderPage()}
    </AppLayout>
  );
}

export default MainApp;
