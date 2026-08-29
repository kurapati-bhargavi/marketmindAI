import { useState, useEffect } from "react";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Boxes,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Info,
  Calendar
} from "lucide-react";
import api from "../api/api";

function AnomalyDetection() {
  const [anomalyData, setAnomalyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("all");

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ml/anomalies");
      setAnomalyData(res.data);
    } catch (err) {
      console.error("Error loading anomalies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔍</div>
          <div style={{ fontWeight: 600, color: "var(--text-muted)" }}>Scanning Transactions & Inventory with Isolation Forest...</div>
        </div>
      </div>
    );
  }

  const salesAnomalies = anomalyData?.sales_anomalies || [];
  const inventoryAnomalies = anomalyData?.inventory_anomalies || [];
  const totalAnomalies = anomalyData?.total_anomalies || 0;

  const filteredSales = salesAnomalies.filter((a) => {
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    return true;
  });

  const filteredInventory = inventoryAnomalies.filter((a) => {
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Sales & Inventory Anomaly Detection</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Unsupervised Isolation Forest and Interquartile Range (IQR) detection spotting revenue deviations and inventory breaches.
          </p>
        </div>

        <button className="btn-secondary" onClick={fetchAnomalies}>
          <RefreshCw size={16} /> Re-scan Anomaly Models
        </button>
      </div>

      {/* Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
        <div className="glass-card" style={{ padding: "20px", borderTop: "4px solid #ef4444" }}>
          <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
            TOTAL ANOMALIES DETECTED
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: totalAnomalies > 0 ? "var(--danger-text)" : "var(--success-text)", margin: "4px 0" }}>
            {totalAnomalies} Events
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Deviations outside 2.5σ threshold
          </div>
        </div>

        <div className="glass-card" style={{ padding: "20px", borderTop: "4px solid #f59e0b" }}>
          <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
            REVENUE SPIKES / PLUNGES
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-main)", margin: "4px 0" }}>
            {salesAnomalies.length} Transactions
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Statistical daily volume deviations
          </div>
        </div>

        <div className="glass-card" style={{ padding: "20px", borderTop: "4px solid #3b82f6" }}>
          <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
            INVENTORY DEFICITS
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-main)", margin: "4px 0" }}>
            {inventoryAnomalies.length} SKUs
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Stockout and safety reorder risks
          </div>
        </div>
      </div>

      {/* Severity Filter Toggle */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>Severity Filter:</span>
        {["all", "CRITICAL", "WARNING", "INFO"].map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "1px solid var(--border-light)",
              background: severityFilter === sev ? "var(--primary-600)" : "#ffffff",
              color: severityFilter === sev ? "#ffffff" : "var(--text-main)",
              fontWeight: 600,
              fontSize: "12.5px",
              cursor: "pointer"
            }}
          >
            {sev.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Sales Revenue Anomalies Table */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "17px", fontWeight: 700 }}>Sales Volume & Revenue Outliers</h3>
            <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
              Detected via Isolation Forest model on daily transaction logs
            </div>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Observed Revenue</th>
                <th>Expected Benchmark</th>
                <th>Deviation %</th>
                <th>Anomaly Type</th>
                <th>Severity</th>
                <th>Diagnosis</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                    No sales anomalies detected in this range. Sales pattern is normal.
                  </td>
                </tr>
              ) : (
                filteredSales.map((item, idx) => {
                  const isSpike = item.anomaly_type === "REVENUE_SPIKE";
                  const isPlunge = item.anomaly_type === "REVENUE_PLUNGE";
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{item.date}</td>
                      <td style={{ fontWeight: 800 }}>₹{item.actual_revenue?.toLocaleString()}</td>
                      <td style={{ color: "var(--text-muted)" }}>₹{item.expected_revenue?.toLocaleString()}</td>
                      <td style={{ fontWeight: 800, color: isSpike ? "var(--success-text)" : "var(--danger-text)" }}>
                        {item.deviation_percentage > 0 ? `+${item.deviation_percentage}%` : `${item.deviation_percentage}%`}
                      </td>
                      <td>
                        <span className={`badge ${isSpike ? "badge-success" : "badge-danger"}`}>
                          {isSpike ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {item.anomaly_type}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${item.severity === "CRITICAL" ? "badge-danger" : item.severity === "WARNING" ? "badge-warning" : "badge-info"}`}>
                          {item.severity}
                        </span>
                      </td>
                      <td style={{ fontSize: "12.5px", color: "var(--text-main)" }}>
                        {item.description}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Outlier Alerts Table */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "17px", fontWeight: 700 }}>Inventory Discrepancy & Stockout Anomalies</h3>
            <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
              Identifies sudden depletion and below-safety inventory levels
            </div>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Reorder Safety Level</th>
                <th>Severity</th>
                <th>Anomaly Issue</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                    No inventory anomalies detected.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700 }}>{item.product_name}</td>
                    <td><span className="badge badge-info">{item.category}</span></td>
                    <td style={{ fontWeight: 800, color: item.current_stock <= 0 ? "var(--danger-text)" : "var(--warning-text)" }}>
                      {item.current_stock} units
                    </td>
                    <td>{item.reorder_threshold} units</td>
                    <td>
                      <span className={`badge ${item.severity === "CRITICAL" ? "badge-danger" : "badge-warning"}`}>
                        {item.severity}
                      </span>
                    </td>
                    <td style={{ fontSize: "12.5px", color: "var(--text-main)" }}>
                      {item.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AnomalyDetection;
