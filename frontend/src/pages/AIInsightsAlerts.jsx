import { useState, useEffect } from "react";
import {
  Sparkles,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Activity
} from "lucide-react";
import api from "../api/api";

function AIInsightsAlerts() {
  const [insightsData, setInsightsData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [insRes, alertRes] = await Promise.all([
        api.get("/ml/insights"),
        api.get("/ml/alerts"),
      ]);
      setInsightsData(insRes.data);
      setAlerts(alertRes.data || []);
    } catch (err) {
      console.error("Error loading insights and alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolveAlert = async (alertId) => {
    try {
      await api.post(`/ml/alerts/${alertId}/resolve`);
      setActionSuccess("Alert marked as resolved!");
      fetchData();
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err) {
      alert("Error resolving alert.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>✦</div>
          <div style={{ fontWeight: 600, color: "var(--text-muted)" }}>Synthesizing Executive AI Intelligence Feed...</div>
        </div>
      </div>
    );
  }

  const healthScore = insightsData?.overall_health_score || 85;
  const insightsList = insightsData?.insights || [];
  const nextActions = insightsData?.strategic_next_steps || [];

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>AI Strategic Insights & Alert Center</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Autonomous multi-engine synthesis combining revenue trends, customer health, stock security, and prioritized executive actions.
          </p>
        </div>

        <button className="btn-secondary" onClick={fetchData}>
          <RefreshCw size={16} /> Re-scan Intelligence Feeds
        </button>
      </div>

      {actionSuccess && (
        <div style={{ padding: "12px 18px", borderRadius: "10px", background: "var(--success-bg)", border: "1px solid var(--success-border)", color: "var(--success-text)", fontSize: "13.5px", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={16} /> {actionSuccess}
        </div>
      )}

      {/* Business Health Score Card */}
      <div
        className="glass-card"
        style={{
          padding: "30px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "24px"
        }}
      >
        <div style={{ maxWidth: "600px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Sparkles size={18} color="#818cf8" />
            <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Composite Business Health Index
            </span>
          </div>
          <h2 style={{ fontSize: "22px", color: "#ffffff", marginBottom: "8px" }}>
            {insightsData?.business_status || "Strong Commercial Momentum"}
          </h2>
          <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.5 }}>
            Synthesized across gross margin velocity, customer retention stability, stock availability, and basket cross-sell elasticity.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "52px", fontWeight: 900, lineHeight: 1, color: healthScore >= 75 ? "#34d399" : "#fbbf24" }}>
              {healthScore}
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700, marginTop: "4px" }}>
              HEALTH RATING (/100)
            </div>
          </div>
        </div>
      </div>

      {/* AI Key Takeaways and Strategic Recommendations */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
        {/* Strategic Next Steps */}
        <div className="glass-card" style={{ padding: "26px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
            <TrendingUp size={18} color="var(--primary-600)" /> Prioritized Executive Action Plan
          </h3>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "18px" }}>
            Prescriptive next steps recommended by the platform's diagnostic models
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {nextActions.map((action, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px",
                  borderRadius: "10px",
                  background: "#f8fafc",
                  border: "1px solid var(--border-light)"
                }}
              >
                <div style={{ background: "var(--primary-100)", color: "var(--primary-700)", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "12px", flexShrink: 0 }}>
                  {idx + 1}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-main)", fontWeight: 500 }}>
                  {action}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Analytical Insights Feed */}
        <div className="glass-card" style={{ padding: "26px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={18} color="#7c3aed" /> Engine Observations
          </h3>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "18px" }}>
            Real-time analytical diagnoses from underlying predictive models
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {insightsList.map((ins, idx) => (
              <div
                key={idx}
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "#fdf4ff",
                  borderLeft: "4px solid #a855f7",
                  fontSize: "13px",
                  color: "#581c87",
                  lineHeight: 1.5
                }}
              >
                {ins}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active System Alerts Ledger */}
      <div className="glass-card" style={{ padding: "26px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 800 }}>Active Alert Operations ({alerts.filter((a) => !a.is_resolved).length} Pending)</h3>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Automated notifications regarding inventory breaches, churn alarms, and revenue variations.
            </div>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Alert Domain</th>
                <th>Notification Title</th>
                <th>Details</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                    No alerts pending. All operational metrics within normal bounds.
                  </td>
                </tr>
              ) : (
                alerts.map((a) => {
                  const isCritical = a.severity === "CRITICAL" || a.severity === "HIGH";
                  return (
                    <tr key={a.id} style={{ background: a.is_resolved ? "#fafafa" : "#ffffff", opacity: a.is_resolved ? 0.6 : 1 }}>
                      <td>
                        <span className={`badge ${isCritical ? "badge-danger" : a.severity === "MEDIUM" ? "badge-warning" : "badge-info"}`}>
                          {a.severity}
                        </span>
                      </td>
                      <td><span className="badge badge-info">{a.alert_type}</span></td>
                      <td style={{ fontWeight: 700 }}>{a.title}</td>
                      <td style={{ fontSize: "12.5px", color: "var(--text-muted)", maxWidth: "340px" }}>{a.message}</td>
                      <td>
                        {a.is_resolved ? (
                          <span className="badge badge-success">Resolved</span>
                        ) : (
                          <span className="badge badge-warning">Active</span>
                        )}
                      </td>
                      <td>
                        {!a.is_resolved && (
                          <button
                            className="btn-secondary"
                            style={{ padding: "5px 10px", fontSize: "12px" }}
                            onClick={() => handleResolveAlert(a.id)}
                          >
                            <CheckCircle2 size={13} /> Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AIInsightsAlerts;
