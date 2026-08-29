import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ReceiptText,
  UploadCloud,
  Boxes,
  Users2,
  TrendingUp,
  UserX,
  Sparkles,
  AlertTriangle,
  Bell,
  FileBarChart,
  ShieldCheck,
  UserCheck,
  LogOut,
  ChevronRight,
  Menu,
  X,
  RefreshCw
} from "lucide-react";
import api from "../api/api";

const ROLE_NAV_ITEMS = {
  "Business Owner": [
    { id: "dashboard", label: "Executive Dashboard", icon: LayoutDashboard },
    { id: "sales", label: "Sales & Transactions", icon: ReceiptText },
    { id: "upload", label: "Data Ingestion (CSV)", icon: UploadCloud },
    { id: "inventory", label: "Inventory Intelligence", icon: Boxes },
    { id: "segmentation", label: "Customer Segments", icon: Users2 },
    { id: "forecasting", label: "Sales Forecasting", icon: TrendingUp },
    { id: "churn", label: "Churn Prediction", icon: UserX },
    { id: "recommendations", label: "Recommendations", icon: Sparkles },
    { id: "anomalies", label: "Anomaly Detection", icon: AlertTriangle },
    { id: "insights", label: "AI Insights & Alerts", icon: Bell },
    { id: "reports", label: "Executive Reports", icon: FileBarChart },
    { id: "profile", label: "My Profile", icon: UserCheck },
  ],
  "Store Manager": [
    { id: "dashboard", label: "Store Dashboard", icon: LayoutDashboard },
    { id: "sales", label: "Sales & Invoices", icon: ReceiptText },
    { id: "inventory", label: "Inventory & Stock", icon: Boxes },
    { id: "upload", label: "Upload Sales CSV", icon: UploadCloud },
    { id: "segmentation", label: "Customer Insights", icon: Users2 },
    { id: "forecasting", label: "Demand Forecasting", icon: TrendingUp },
    { id: "recommendations", label: "Product Cross-Sell", icon: Sparkles },
    { id: "anomalies", label: "Anomalies & Variance", icon: AlertTriangle },
    { id: "insights", label: "Store Alerts", icon: Bell },
    { id: "profile", label: "My Profile", icon: UserCheck },
  ],
  "Sales Executive": [
    { id: "dashboard", label: "Sales Overview", icon: LayoutDashboard },
    { id: "sales", label: "Transaction Ledger", icon: ReceiptText },
    { id: "inventory", label: "Stock Availability", icon: Boxes },
    { id: "segmentation", label: "Customer Directory", icon: Users2 },
    { id: "recommendations", label: "Product Suggestions", icon: Sparkles },
    { id: "profile", label: "My Profile", icon: UserCheck },
  ],
  "System Administrator": [
    { id: "dashboard", label: "Admin Overview", icon: LayoutDashboard },
    { id: "users", label: "User & Role Management", icon: ShieldCheck },
    { id: "sales", label: "System Transactions", icon: ReceiptText },
    { id: "inventory", label: "Inventory Master", icon: Boxes },
    { id: "insights", label: "System Health & Alerts", icon: Bell },
    { id: "profile", label: "Admin Profile", icon: UserCheck },
  ]
};

const ROLE_BADGES = {
  "Business Owner": { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", icon: "👑" },
  "Store Manager": { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", icon: "🏪" },
  "Sales Executive": { bg: "#fdf4ff", color: "#86198f", border: "#f5d0fe", icon: "📈" },
  "System Administrator": { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", icon: "⚙️" },
};

function AppLayout({ activeTab, setActiveTab, user, onLogout, onRoleChange, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);
  const [alertsList, setAlertsList] = useState([]);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  const role = user?.role || "Business Owner";
  const navItems = ROLE_NAV_ITEMS[role] || ROLE_NAV_ITEMS["Business Owner"];
  const badge = ROLE_BADGES[role] || ROLE_BADGES["Business Owner"];

  const fetchAlerts = async () => {
    try {
      const res = await api.get("/ml/alerts");
      const unread = res.data.filter((a) => !a.is_resolved);
      setAlertsCount(unread.length);
      setAlertsList(res.data.slice(0, 5));
    } catch (e) {
      // silent fallback
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-app)" }}>
      {/* ================= SIDEBAR ================= */}
      <aside
        style={{
          width: "270px",
          background: "var(--bg-sidebar)",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 40,
          boxShadow: "4px 0 16px rgba(0,0,0,0.15)",
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: "24px 20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            borderBottom: "1px solid #1e293b",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "20px",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.4)",
            }}
          >
            M
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "18px", letterSpacing: "-0.02em" }}>
              MarketMind <span style={{ color: "#60a5fa" }}>AI</span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>
              Sales Intelligence Platform
            </div>
          </div>
        </div>

        {/* User Role Card */}
        <div style={{ padding: "16px 20px", background: "#162032", borderBottom: "1px solid #1e293b" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>
                {user?.name || "User"}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                {user?.email}
              </div>
            </div>
            <span
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                borderRadius: "6px",
                background: badge.bg,
                color: badge.color,
                fontWeight: 700,
                border: `1px solid ${badge.border}`
              }}
            >
              {badge.icon} {role}
            </span>
          </div>
        </div>

        {/* Navigation Menu Items */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 12px 10px" }}>
            Intelligence Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "none",
                  background: isActive ? "var(--accent-gradient)" : "transparent",
                  color: isActive ? "#ffffff" : "var(--text-sidebar)",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: "13.5px",
                  cursor: "pointer",
                  marginBottom: "4px",
                  transition: "all 0.15s ease",
                  textAlign: "left",
                  boxShadow: isActive ? "0 4px 12px rgba(79, 70, 229, 0.3)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "var(--bg-sidebar-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Icon size={17} style={{ opacity: isActive ? 1 : 0.8 }} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight size={14} />}
              </button>
            );
          })}
        </nav>

        {/* Quick Role Switcher for Testing / Demonstrations */}
        <div style={{ padding: "12px 16px", background: "#090d16", borderTop: "1px solid #1e293b" }}>
          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, marginBottom: "6px" }}>
            Demo Role Switch:
          </div>
          <select
            value={role}
            onChange={(e) => onRoleChange && onRoleChange(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 10px",
              background: "#1e293b",
              color: "#ffffff",
              border: "1px solid #334155",
              borderRadius: "6px",
              fontSize: "12px",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="Business Owner">Business Owner (Full Access)</option>
            <option value="Store Manager">Store Manager (Store Ops)</option>
            <option value="Sales Executive">Sales Executive (Sales View)</option>
            <option value="System Administrator">System Administrator (Admin)</option>
          </select>
        </div>

        {/* Logout Button */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid #1e293b" }}>
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "9px 12px",
              background: "#ef444420",
              color: "#f87171",
              border: "1px solid #ef444440",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#ef444435")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ef444420")}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Navbar */}
        <header
          style={{
            height: "70px",
            background: "#ffffff",
            borderBottom: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            position: "sticky",
            top: 0,
            zIndex: 30,
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
          }}
        >
          <div>
            <h2 style={{ fontSize: "19px", fontWeight: 800, color: "var(--text-main)", textTransform: "capitalize" }}>
              {navItems.find((n) => n.id === activeTab)?.label || "Dashboard"}
            </h2>
            <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
              MarketMind AI Intelligence Core · Active Session: {role}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", position: "relative" }}>
            {/* Live Alerts Bell */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
                style={{
                  background: "#f1f5f9",
                  border: "1px solid var(--border-light)",
                  borderRadius: "10px",
                  padding: "9px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "var(--text-main)",
                  fontWeight: 600,
                  fontSize: "13px"
                }}
              >
                <Bell size={17} color="#4f46e5" />
                <span>Alerts</span>
                {alertsCount > 0 && (
                  <span
                    style={{
                      background: "#ef4444",
                      color: "#ffffff",
                      borderRadius: "9999px",
                      padding: "2px 7px",
                      fontSize: "11px",
                      fontWeight: 700
                    }}
                  >
                    {alertsCount}
                  </span>
                )}
              </button>

              {/* Alerts Quick Dropdown */}
              {showAlertsDropdown && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "45px",
                    width: "360px",
                    background: "#ffffff",
                    borderRadius: "12px",
                    boxShadow: "var(--shadow-xl)",
                    border: "1px solid var(--border-light)",
                    zIndex: 50,
                    padding: "16px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ fontWeight: 700, fontSize: "14px" }}>Active Alerts ({alertsCount})</div>
                    <button
                      onClick={() => {
                        setActiveTab("insights");
                        setShowAlertsDropdown(false);
                      }}
                      style={{ background: "none", border: "none", color: "var(--primary-600)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                    >
                      View All →
                    </button>
                  </div>
                  {alertsList.length === 0 ? (
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", padding: "12px 0" }}>No pending alerts. All systems healthy.</div>
                  ) : (
                    alertsList.map((a) => (
                      <div
                        key={a.id}
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          background: a.severity === "CRITICAL" ? "#fef2f2" : "#f8fafc",
                          borderLeft: `4px solid ${a.severity === "CRITICAL" ? "#dc2626" : "#f59e0b"}`,
                          marginBottom: "8px",
                          fontSize: "12.5px"
                        }}
                      >
                        <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{a.title}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "11.5px", marginTop: "2px" }}>{a.message}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Quick Data Ingestion shortcut */}
            {role !== "Sales Executive" && (
              <button
                className="btn-primary"
                onClick={() => setActiveTab("upload")}
                style={{ fontSize: "13px", padding: "8px 16px" }}
              >
                <UploadCloud size={16} />
                Upload CSV Data
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Body Content */}
        <main style={{ flex: 1, padding: "30px 32px", maxWidth: "1600px", width: "100%", margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
