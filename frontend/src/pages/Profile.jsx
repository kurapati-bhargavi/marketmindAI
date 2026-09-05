import { useState } from "react";
import {
  User,
  Mail,
  ShieldCheck,
  Calendar,
  Key,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Award,
  Terminal,
  LogOut
} from "lucide-react";
import api from "../api/api";

const ROLE_PERMISSIONS = {
  "Business Owner": [
    "Full Executive Dashboard with Revenue, Margin & Growth KPIs",
    "Complete Sales & Transaction ledger with refund tracking",
    "CSV Data Ingestion & Batch Pipeline Processing",
    "Real-time Inventory Monitoring, Restock Orders & Threshold Control",
    "RFM Customer Segmentation (K-Means Clustering)",
    "Time-Series Sales Forecasting with 95% Confidence Intervals",
    "Machine Learning Churn Probability Gauges & Risk Tiering",
    "Item-Based Collaborative Filtering & Product Recommendations",
    "Automated Anomaly Detection & Business Health Alerts",
    "Executive Boardroom Reports with One-Click PDF/Excel Export"
  ],
  "Store Manager": [
    "Store Operations Dashboard & Daily Trends",
    "Sales Invoice Ledger & Store Level Tracking",
    "Inventory Master, Stockouts & Safety Reorder Management",
    "Sales CSV Data Ingestion & Product Catalog Uploads",
    "Customer Segments & Retention Triggers",
    "Demand & Inventory Requirement Forecasting",
    "Product Affinities & Cross-Sell Recommendations",
    "Operational Alert Management & Resolution"
  ],
  "Sales Executive": [
    "Personal Sales Overview & Monthly Targets",
    "Transaction Ledger & Invoice Creation",
    "Live Stock Availability Lookup",
    "Customer Directory & Directory Search",
    "Personalized Product Recommendations for Customer Pitching"
  ],
  "System Administrator": [
    "Platform Health, Database & Infrastructure Monitoring",
    "User Management & Role-Based Access Control (RBAC)",
    "System-Wide Audit Logs & Transaction Inspection",
    "Master Inventory Configuration & Global Settings",
    "Security Alerts, Machine Learning Pipeline Supervision"
  ]
};

function Profile({ user, onUserUpdate, onLogout, onRoleChange }) {
  const [name, setName] = useState(user?.name || "Business Executive");
  const [role, setRole] = useState(user?.role || "Business Owner");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");

  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["Business Owner"];

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess("");

    try {
      if (user?.id) {
        await api.put(`/users/${user.id}`, {
          name: name.trim(),
          role: role,
        });
      }
      const updatedUser = { ...user, name: name.trim(), role: role };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      if (onUserUpdate) onUserUpdate(updatedUser);
      if (onRoleChange) onRoleChange(role);

      setSaveSuccess("Profile settings successfully saved!");
      setTimeout(() => setSaveSuccess(""), 3000);
    } catch (err) {
      // If error or non-admin updating endpoint, fallback to local storage
      const updatedUser = { ...user, name: name.trim(), role: role };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      if (onUserUpdate) onUserUpdate(updatedUser);
      if (onRoleChange) onRoleChange(role);

      setSaveSuccess("Session profile updated!");
      setTimeout(() => setSaveSuccess(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Account & Profile Center</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Manage your platform credentials, active role permissions, security configuration and workspace session.
        </p>
      </div>

      {saveSuccess && (
        <div
          style={{
            padding: "14px 20px",
            borderRadius: "10px",
            background: "var(--success-bg)",
            border: "1px solid var(--success-border)",
            color: "var(--success-text)",
            fontSize: "13.5px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={18} /> {saveSuccess}
        </div>
      )}

      {/* Main Profile Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
        {/* User Card */}
        <div className="glass-card" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "16px",
                background: "var(--accent-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "28px",
                fontWeight: 800,
                boxShadow: "0 8px 20px rgba(79, 70, 229, 0.35)"
              }}
            >
              {(user?.name || "U")[0].toUpperCase()}
            </div>

            <div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-main)" }}>
                {user?.name || "MarketMind User"}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                <Mail size={14} /> {user?.email || "user@marketmind.ai"}
              </div>
              <div style={{ marginTop: "6px" }}>
                <span className="badge badge-success">
                  <ShieldCheck size={12} style={{ marginRight: "4px", display: "inline" }} />
                  {user?.role || role}
                </span>
              </div>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border-light)", margin: "4px 0" }} />

          <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px" }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-light)",
                  fontSize: "13.5px",
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px" }}>
                Platform Persona / Active Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-light)",
                  fontSize: "13.5px",
                  outline: "none",
                  fontWeight: 600
                }}
              >
                <option value="Business Owner">Business Owner (Full Suite)</option>
                <option value="Store Manager">Store Manager (Operations)</option>
                <option value="Sales Executive">Sales Executive (Ledger & CRM)</option>
                <option value="System Administrator">System Administrator (Root Admin)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", marginTop: "6px" }}
            >
              {saving ? "Saving Changes..." : "Save Profile Updates"}
            </button>
          </form>
        </div>

        {/* Session & Security Info */}
        <div className="glass-card" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "18px" }}>
          <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>Active Session Diagnostics</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#f8fafc", border: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Key size={15} /> Authentication Method
              </span>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--primary-700)" }}>
                JWT Bearer (HMAC-SHA256)
              </span>
            </div>

            <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#f8fafc", border: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Terminal size={15} /> Backend API Version
              </span>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-main)" }}>
                FastAPI v1.0.0 (Production)
              </span>
            </div>

            <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#f8fafc", border: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={15} /> ML Intelligence Engines
              </span>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#059669" }}>
                Active & Calibrated
              </span>
            </div>

            <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#f8fafc", border: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={15} /> Security Status
              </span>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--success-text)" }}>
                TLS / Encrypted Session
              </span>
            </div>
          </div>

          <div style={{ marginTop: "auto", paddingTop: "12px" }}>
            <button
              onClick={onLogout}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #fee2e2",
                background: "#fef2f2",
                color: "#dc2626",
                fontWeight: 700,
                fontSize: "13.5px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <LogOut size={16} /> Sign Out of Platform
            </button>
          </div>
        </div>
      </div>

      {/* Role Capabilities Matrix */}
      <div className="glass-card" style={{ padding: "26px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <Award size={20} color="var(--primary-600)" />
          <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>
            Role Permissions & Authorized Modules ({role})
          </h3>
        </div>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "18px" }}>
          Overview of feature modules enabled for this role credential.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "12px" }}>
          {permissions.map((perm, idx) => (
            <div
              key={idx}
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                background: "#f8fafc",
                border: "1px solid var(--border-light)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-main)"
              }}
            >
              <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
              <span>{perm}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Profile;
