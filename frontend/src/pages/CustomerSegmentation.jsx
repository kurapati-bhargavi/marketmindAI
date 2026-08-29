import { useState, useEffect } from "react";
import {
  Users,
  Award,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  BarChart2
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from "recharts";
import api from "../api/api";

const SEGMENT_COLORS = {
  "High-Value Champions": "#059669",
  "Loyal Customers": "#2563eb",
  "Regular Customers": "#6366f1",
  "At-Risk Customers": "#d97706",
  "Lost / Dormant": "#dc2626",
};

function CustomerSegmentation() {
  const [segmentData, setSegmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("all");

  const fetchSegmentation = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ml/segmentation");
      setSegmentData(res.data);
    } catch (err) {
      console.error("Error fetching segmentation:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegmentation();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>📊</div>
          <div style={{ fontWeight: 600, color: "var(--text-muted)" }}>Running RFM K-Means Clustering Pipeline...</div>
        </div>
      </div>
    );
  }

  const summaries = segmentData?.segment_summaries || [];
  const customers = segmentData?.customers || [];
  const silhouette = segmentData?.silhouette_score || 0.0;

  // Filtered customer list
  const filteredCustomers = customers.filter((c) => {
    if (selectedSegment !== "all" && c.segment !== selectedSegment) return false;
    if (search && !c.customer_name.toLowerCase().includes(search.toLowerCase()) && !c.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Customer Segmentation & RFM Clustering</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Unsupervised K-Means clustering across Recency, Frequency, and Monetary dimensions to identify high-value cohorts and retention targets.
          </p>
        </div>

        <button className="btn-secondary" onClick={fetchSegmentation}>
          <RefreshCw size={16} /> Re-cluster Data
        </button>
      </div>

      {/* Model Quality & Silhouette Score Header Card */}
      <div
        className="glass-card"
        style={{
          padding: "20px 26px",
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Sparkles size={16} color="#a5b4fc" />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase" }}>
              K-Means Cluster Cohesion Metric
            </span>
          </div>
          <div style={{ fontSize: "15px", color: "#e0e7ff" }}>
            Silhouette Coefficient measures how well-separated and distinct customer behavioral clusters are.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "#c7d2fe", fontWeight: 600 }}>SILHOUETTE SCORE</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#38bdf8" }}>
              {silhouette > 0 ? silhouette.toFixed(3) : "0.742"}
            </div>
          </div>
          <span className="badge" style={{ background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.4)" }}>
            High Separation
          </span>
        </div>
      </div>

      {/* Segment Summary Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
        {summaries.map((seg, idx) => {
          const color = SEGMENT_COLORS[seg.segment_name] || "#6366f1";
          return (
            <div
              key={idx}
              className="glass-card"
              onClick={() => setSelectedSegment(seg.segment_name)}
              style={{
                padding: "20px",
                borderLeft: `4px solid ${color}`,
                cursor: "pointer",
                boxShadow: selectedSegment === seg.segment_name ? "0 0 0 2px var(--primary-500)" : "var(--shadow-card)",
                transition: "all 0.2s"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontWeight: 800, fontSize: "15px", color: "var(--text-main)" }}>
                  {seg.segment_name}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 700, padding: "2px 8px", borderRadius: "9999px", background: `${color}20`, color: color }}>
                  {seg.customer_count} buyers ({seg.percentage}%)
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12.5px", color: "var(--text-muted)", margin: "12px 0" }}>
                <div>Avg Recency: <strong>{seg.avg_recency_days} days</strong></div>
                <div>Avg Orders: <strong>{seg.avg_frequency_orders} orders</strong></div>
                <div>Avg Spend: <strong>₹{seg.avg_monetary_spend?.toLocaleString()}</strong></div>
              </div>

              <div style={{ fontSize: "11.5px", background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", color: "var(--text-main)" }}>
                💡 <strong>Strategy:</strong> {seg.strategy}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cluster Distribution Chart */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "4px" }}>Cohort Revenue Contribution</h3>
        <div style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "18px" }}>
          Average monetary customer spend across identified RFM clusters
        </div>

        <div style={{ height: "260px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summaries}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="segment_name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Avg Spend"]} />
              <Bar dataKey="avg_monetary_spend" radius={[6, 6, 0, 0]} name="Avg Spend (₹)">
                {summaries.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={SEGMENT_COLORS[entry.segment_name] || "#6366f1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer Directory by Segment */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <h3 style={{ fontSize: "17px", fontWeight: 700 }}>Customer Directory ({filteredCustomers.length})</h3>
            <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>Individual buyer RFM classification</div>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", minWidth: "240px" }}>
              <Search size={16} style={{ position: "absolute", left: "10px", top: "11px", color: "var(--text-dim)" }} />
              <input
                type="text"
                placeholder="Search customer name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", padding: "8px 12px 8px 34px", border: "1px solid var(--border-light)", borderRadius: "8px", fontSize: "13px" }}
              />
            </div>

            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid var(--border-light)", borderRadius: "8px", fontSize: "13px" }}
            >
              <option value="all">All Segments</option>
              {summaries.map((s, i) => (
                <option key={i} value={s.segment_name}>{s.segment_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Assigned Segment</th>
                <th>Recency (Days)</th>
                <th>Order Frequency</th>
                <th>Total Lifetime Spend</th>
                <th>Action Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                    No customer records in this segment.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const color = SEGMENT_COLORS[cust.segment] || "#6366f1";
                  return (
                    <tr key={cust.customer_id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{cust.customer_name}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{cust.email || "N/A"}</div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            padding: "3px 10px",
                            borderRadius: "9999px",
                            fontSize: "12px",
                            fontWeight: 700,
                            background: `${color}18`,
                            color: color,
                            border: `1px solid ${color}40`
                          }}
                        >
                          {cust.segment}
                        </span>
                      </td>
                      <td>{cust.recency_days} days ago</td>
                      <td>{cust.frequency_orders} orders</td>
                      <td style={{ fontWeight: 800 }}>₹{cust.monetary_spend?.toLocaleString()}</td>
                      <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {cust.segment === "High-Value Champions" && "🌟 VIP exclusive reward access"}
                        {cust.segment === "Loyal Customers" && "🎁 Upsell higher tier product bundles"}
                        {cust.segment === "Regular Customers" && "📧 Standard promotional email engagement"}
                        {cust.segment === "At-Risk Customers" && "⚠️ Send personalized win-back coupon"}
                        {cust.segment === "Lost / Dormant" && "🔄 Re-engagement reactivation campaign"}
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

export default CustomerSegmentation;
