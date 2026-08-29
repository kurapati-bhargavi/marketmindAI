import { useState, useEffect } from "react";
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import api from "../api/api";

function BusinessReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/generate");
      setReport(res.data.report);
    } catch (err) {
      console.error("Error generating report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>📄</div>
          <div style={{ fontWeight: 600, color: "var(--text-muted)" }}>Generating Comprehensive Executive Report...</div>
        </div>
      </div>
    );
  }

  const kpis = report?.kpi_summary || {};
  const categories = report?.top_categories || [];
  const products = report?.top_products || [];

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
      {/* Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Executive Business Digest & Reports</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            C-Suite performance brief synthesizing historical revenues, inventory exposures, and AI forecasts.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-secondary" onClick={fetchReport}>
            <RefreshCw size={16} /> Refresh Digest
          </button>
          <button className="btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div
        className="glass-card"
        style={{
          padding: "40px",
          background: "#ffffff",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-lg)"
        }}
      >
        {/* Document Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid var(--border-light)", paddingBottom: "24px", marginBottom: "28px" }}>
          <div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--primary-700)", letterSpacing: "-0.02em" }}>
              MarketMind AI
            </div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-main)", marginTop: "2px" }}>
              {report?.title || "Executive Business Performance Digest"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Period: {report?.period} · Generated: {report?.generated_at}
            </div>
          </div>

          <span className="badge badge-success" style={{ fontSize: "13px", padding: "6px 12px" }}>
            ✦ Live Intelligence Snapshot
          </span>
        </div>

        {/* Executive Summary Narrative */}
        <div style={{ marginBottom: "28px", padding: "18px 22px", background: "#f8fafc", borderRadius: "12px", border: "1px solid var(--border-light)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "6px", color: "var(--primary-800)" }}>
            Executive Narrative
          </h3>
          <p style={{ fontSize: "13.5px", color: "var(--text-main)", lineHeight: 1.6 }}>
            {report?.summary_narrative}
          </p>
        </div>

        {/* Key Commercial Metrics Grid */}
        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>Key Commercial Metrics</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          <div style={{ padding: "16px", background: "#ffffff", border: "1px solid var(--border-light)", borderRadius: "10px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>GROSS REVENUE</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--primary-700)", marginTop: "4px" }}>
              ₹{kpis.total_revenue?.toLocaleString()}
            </div>
          </div>

          <div style={{ padding: "16px", background: "#ffffff", border: "1px solid var(--border-light)", borderRadius: "10px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>TRANSACTION VOLUME</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)", marginTop: "4px" }}>
              {kpis.total_orders?.toLocaleString()} Orders
            </div>
          </div>

          <div style={{ padding: "16px", background: "#ffffff", border: "1px solid var(--border-light)", borderRadius: "10px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>AVERAGE ORDER VALUE</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#059669", marginTop: "4px" }}>
              ₹{kpis.average_order_value?.toLocaleString()}
            </div>
          </div>

          <div style={{ padding: "16px", background: "#ffffff", border: "1px solid var(--border-light)", borderRadius: "10px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>ACTIVE BUYERS</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#7c3aed", marginTop: "4px" }}>
              {kpis.total_customers} Buyers
            </div>
          </div>
        </div>

        {/* Top Products & Top Categories Tables */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "28px", marginBottom: "30px" }}>
          <div>
            <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>Top Product Revenue Contributors</h4>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Units</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                      <td><span className="badge badge-info">{p.category}</span></td>
                      <td>{p.quantity_sold}</td>
                      <td style={{ fontWeight: 700 }}>₹{p.revenue?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>Department Category Breakdown</h4>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Revenue</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{c.category}</td>
                      <td style={{ fontWeight: 700 }}>₹{c.revenue?.toLocaleString()}</td>
                      <td>{c.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AI Action Items in Report */}
        <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>Prescriptive Strategic Directives</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {report?.action_items?.map((item, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--text-main)" }}>
              <span style={{ color: "var(--primary-600)", fontWeight: 700 }}>✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BusinessReports;
