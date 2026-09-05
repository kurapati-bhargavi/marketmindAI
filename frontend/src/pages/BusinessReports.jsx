import { useState, useEffect } from "react";
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import api from "../api/api";

function BusinessReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeReportType, setActiveReportType] = useState("executive");
  const [exporting, setExporting] = useState(false);

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

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const typeParam = activeReportType === "executive" ? "sales" : activeReportType;
      const response = await api.get(`/reports/export?report_type=${typeParam}&format=${format}`, {
        responseType: "blob"
      });

      const blob = new Blob([response.data], {
        type: format === "csv" ? "text/csv" : (format === "excel" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/html")
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const ext = format === "excel" ? "xlsx" : (format === "csv" ? "csv" : "html");
      link.setAttribute("download", `MarketMind_${typeParam}_report.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "28px", marginBottom: "10px" }}>📄</div>
          <div style={{ fontWeight: 600, color: "var(--text-muted)" }}>Generating Live Business Intelligence Digest...</div>
        </div>
      </div>
    );
  }

  const kpis = report?.kpi_summary || {};
  const categories = report?.top_categories || [];
  const products = report?.top_products || [];

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Header & Export Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Business Reports & Export Center</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Audit-ready business intelligence digests and real-time database exports.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button className="btn-secondary" onClick={fetchReport}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn-secondary" onClick={() => handleExport("csv")} disabled={exporting}>
            <Download size={15} /> Export CSV
          </button>
          <button className="btn-secondary" onClick={() => handleExport("excel")} disabled={exporting}>
            <FileSpreadsheet size={15} /> Export Excel
          </button>
          <button className="btn-primary" onClick={handlePrint}>
            <Printer size={15} /> Print / PDF
          </button>
        </div>
      </div>

      {/* Report Category Switcher Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px", overflowX: "auto" }}>
        {[
          { id: "executive", label: "Executive Digest" },
          { id: "sales", label: "Sales Breakdown" },
          { id: "forecast", label: "AI Forecast Report" },
          { id: "customers", label: "Customer Intelligence" },
          { id: "inventory", label: "Inventory Audit" },
          { id: "anomalies", label: "Anomaly Log" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReportType(tab.id)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              background: activeReportType === tab.id ? "var(--primary-600)" : "#f1f5f9",
              color: activeReportType === tab.id ? "#ffffff" : "var(--text-muted)",
              transition: "all 0.2s ease"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Printable Report Document Card */}
      <div
        className="glass-card"
        style={{
          padding: "36px",
          background: "#ffffff",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-lg)"
        }}
      >
        {/* Document Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid var(--border-light)", paddingBottom: "20px", marginBottom: "24px" }}>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--primary-700)", letterSpacing: "-0.02em" }}>
              MarketMind AI
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-main)", marginTop: "2px" }}>
              {report?.title || "Executive Business Performance Digest"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Report Category: {activeReportType.toUpperCase()} · Generated: {report?.generated_at}
            </div>
          </div>

          <span className="badge badge-success" style={{ fontSize: "12px", padding: "6px 12px" }}>
            ✦ PostgreSQL Verified Single Source
          </span>
        </div>

        {/* Executive Summary Narrative */}
        <div style={{ marginBottom: "26px", padding: "16px 20px", background: "#f8fafc", borderRadius: "10px", border: "1px solid var(--border-light)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px", color: "var(--primary-800)" }}>
            Executive Narrative
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-main)", lineHeight: 1.6, margin: 0 }}>
            {report?.summary_narrative}
          </p>
        </div>

        {/* Key Commercial Metrics Grid */}
        <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>Key Performance Indicators</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "14px", marginBottom: "28px" }}>
          <div style={{ padding: "14px", background: "#ffffff", border: "1px solid var(--border-light)", borderRadius: "10px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>GROSS REVENUE</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--primary-700)", marginTop: "4px" }}>
              ₹{kpis.total_revenue?.toLocaleString()}
            </div>
          </div>

          <div style={{ padding: "14px", background: "#ffffff", border: "1px solid var(--border-light)", borderRadius: "10px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>TRANSACTION VOLUME</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-main)", marginTop: "4px" }}>
              {kpis.total_orders?.toLocaleString()} Orders
            </div>
          </div>

          <div style={{ padding: "14px", background: "#ffffff", border: "1px solid var(--border-light)", borderRadius: "10px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>AVERAGE ORDER VALUE</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#059669", marginTop: "4px" }}>
              ₹{kpis.average_order_value?.toLocaleString()}
            </div>
          </div>

          <div style={{ padding: "14px", background: "#ffffff", border: "1px solid var(--border-light)", borderRadius: "10px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>ACTIVE CLIENT BASE</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#7c3aed", marginTop: "4px" }}>
              {kpis.total_customers} Customers
            </div>
          </div>
        </div>

        {/* Top Products & Top Categories Tables */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", marginBottom: "28px" }}>
          <div>
            <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>Top Revenue Generating Products</h4>
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
            <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>Category Performance Share</h4>
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

        {/* Prescriptive Directives */}
        <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>Strategic Action Directives</h4>
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
