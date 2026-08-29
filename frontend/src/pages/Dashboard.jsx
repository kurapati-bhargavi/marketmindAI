import { useState, useEffect } from "react";
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import api from "../api/api";

const PIE_COLORS = ["#2563eb", "#4f46e5", "#7c3aed", "#059669", "#d97706", "#dc2626"];

function Dashboard({ user, onNavigate }) {
  const [kpis, setKpis] = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);
  const [productSales, setProductSales] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendView, setTrendView] = useState("monthly"); // "monthly" or "daily"
  const [dailyTrend, setDailyTrend] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [kpiRes, monthRes, prodRes, catRes, insightRes, dailyRes] = await Promise.allSettled([
          api.get("/analytics/sales-summary"),
          api.get("/analytics/monthly-sales"),
          api.get("/analytics/product-sales?limit=6"),
          api.get("/analytics/category-sales"),
          api.get("/ml/insights"),
          api.get("/analytics/daily-trend?days=30"),
        ]);

        if (kpiRes.status === "fulfilled") setKpis(kpiRes.value.data);
        if (monthRes.status === "fulfilled") setMonthlySales(monthRes.value.data);
        if (prodRes.status === "fulfilled") setProductSales(prodRes.value.data);
        if (catRes.status === "fulfilled") setCategorySales(catRes.value.data);
        if (insightRes.status === "fulfilled") setAiInsights(insightRes.value.data);
        if (dailyRes.status === "fulfilled") setDailyTrend(dailyRes.value.data);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>⚡</div>
          <div style={{ fontWeight: 600, color: "var(--text-muted)" }}>Loading Sales Intelligence Dashboard...</div>
        </div>
      </div>
    );
  }

  const role = user?.role || "Business Owner";

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Top Banner with AI Health Score */}
      <div
        className="glass-card"
        style={{
          padding: "24px 30px",
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span style={{ fontSize: "16px" }}>✦</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              AI Intelligence Pulse
            </span>
          </div>
          <h1 style={{ fontSize: "24px", color: "#ffffff", marginBottom: "4px" }}>
            Welcome back, {user?.name || "Business Leader"}
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>
            {aiInsights?.business_status || "Your sales intelligence models are running and evaluating real-time transactions."}
          </p>
        </div>

        {aiInsights && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              background: "rgba(255,255,255,0.08)",
              padding: "12px 20px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.12)"
            }}
          >
            <div>
              <div style={{ fontSize: "11.5px", color: "#cbd5e1", fontWeight: 600 }}>Business Health Index</div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: aiInsights.overall_health_score >= 75 ? "#34d399" : "#fbbf24" }}>
                {aiInsights.overall_health_score}/100
              </div>
            </div>
            <button
              className="btn-primary"
              onClick={() => onNavigate("insights")}
              style={{ fontSize: "12.5px", padding: "8px 14px", background: "rgba(255,255,255,0.2)", boxShadow: "none" }}
            >
              Inspect Insights →
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
        {/* Total Revenue */}
        <div className="glass-card" style={{ padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>Total Gross Revenue</span>
            <div style={{ background: "#eff6ff", color: "#2563eb", padding: "8px", borderRadius: "10px" }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-main)", marginBottom: "4px" }}>
            ₹{kpis?.total_revenue?.toLocaleString() || "0"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--success-text)", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
            <ArrowUpRight size={14} /> Cumulative lifetime revenue
          </div>
        </div>

        {/* Total Orders */}
        <div className="glass-card" style={{ padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>Total Transactions</span>
            <div style={{ background: "#fdf4ff", color: "#9333ea", padding: "8px", borderRadius: "10px" }}>
              <ShoppingCart size={18} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-main)", marginBottom: "4px" }}>
            {kpis?.total_orders?.toLocaleString() || "0"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {kpis?.total_items_sold || 0} total units sold
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="glass-card" style={{ padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>Average Order Value</span>
            <div style={{ background: "#ecfdf5", color: "#059669", padding: "8px", borderRadius: "10px" }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-main)", marginBottom: "4px" }}>
            ₹{kpis?.average_order_value?.toLocaleString() || "0"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Basket size per invoice
          </div>
        </div>

        {/* Total Customers */}
        <div className="glass-card" style={{ padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>Active Customers</span>
            <div style={{ background: "#f0fdf4", color: "#16a34a", padding: "8px", borderRadius: "10px" }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-main)", marginBottom: "4px" }}>
            {kpis?.total_customers || "0"}
          </div>
          <div
            onClick={() => onNavigate("segmentation")}
            style={{ fontSize: "12px", color: "var(--primary-600)", fontWeight: 600, cursor: "pointer" }}
          >
            View RFM Segments →
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="glass-card" style={{ padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>Low Stock Items</span>
            <div
              style={{
                background: (kpis?.low_stock_products || 0) > 0 ? "#fef2f2" : "#ecfdf5",
                color: (kpis?.low_stock_products || 0) > 0 ? "#dc2626" : "#059669",
                padding: "8px",
                borderRadius: "10px"
              }}
            >
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: (kpis?.low_stock_products || 0) > 0 ? "#dc2626" : "var(--text-main)", marginBottom: "4px" }}>
            {kpis?.low_stock_products || "0"}
          </div>
          <div
            onClick={() => onNavigate("inventory")}
            style={{ fontSize: "12px", color: (kpis?.low_stock_products || 0) > 0 ? "#dc2626" : "var(--text-muted)", fontWeight: 600, cursor: "pointer" }}
          >
            {(kpis?.low_stock_products || 0) > 0 ? "⚠️ Immediate restock required →" : "All stock levels optimal"}
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Revenue Performance Chart */}
        <div className="glass-card" style={{ padding: "26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 700 }}>Sales & Revenue Performance</h3>
              <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                {trendView === "monthly" ? "Aggregated monthly gross sales revenue" : "Last 30 days daily sales velocity"}
              </div>
            </div>
            <div style={{ display: "flex", background: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
              <button
                onClick={() => setTrendView("monthly")}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background: trendView === "monthly" ? "#ffffff" : "transparent",
                  color: trendView === "monthly" ? "var(--primary-600)" : "var(--text-muted)",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setTrendView("daily")}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background: trendView === "daily" ? "#ffffff" : "transparent",
                  color: trendView === "daily" ? "var(--primary-600)" : "var(--text-muted)",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                Daily (30D)
              </button>
            </div>
          </div>

          <div style={{ height: "320px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              {trendView === "monthly" ? (
                <BarChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Revenue"]} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} name="Monthly Revenue" />
                </BarChart>
              ) : (
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Daily Revenue"]} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3 }} name="Daily Revenue" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="glass-card" style={{ padding: "26px" }}>
          <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "4px" }}>Revenue by Category</h3>
          <div style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "20px" }}>
            Sales distribution across departments
          </div>

          <div style={{ height: "240px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySales}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Revenue"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
            {categorySales.slice(0, 4).map((cat, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span style={{ color: "var(--text-main)", fontWeight: 500 }}>{cat.category}</span>
                </div>
                <span style={{ fontWeight: 700 }}>₹{cat.revenue?.toLocaleString()} ({cat.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Selling Products Leaderboard & Action Callouts */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px" }}>
        {/* Top Selling Products */}
        <div className="glass-card" style={{ padding: "26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 700 }}>Top Performing Products</h3>
              <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>Ranked by gross sales contribution</div>
            </div>
            <button
              onClick={() => onNavigate("sales")}
              style={{ background: "none", border: "none", color: "var(--primary-600)", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
            >
              Full Ledger →
            </button>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Units Sold</th>
                  <th>Gross Revenue</th>
                </tr>
              </thead>
              <tbody>
                {productSales.map((prod, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{prod.product_name}</td>
                    <td><span className="badge badge-info">{prod.category}</span></td>
                    <td>{prod.quantity_sold}</td>
                    <td style={{ fontWeight: 700 }}>₹{prod.revenue?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Strategic Intelligence Links */}
        <div className="glass-card" style={{ padding: "26px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ fontSize: "17px", fontWeight: 700 }}>AI Intelligence Shortcuts</h3>
          <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>Jump directly to specialized ML workflows</div>

          <div
            onClick={() => onNavigate("forecasting")}
            style={{
              padding: "14px",
              borderRadius: "10px",
              background: "#eff6ff",
              border: "1px solid #dbeafe",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <TrendingUp size={20} color="#2563eb" />
              <div>
                <div style={{ fontWeight: 700, fontSize: "13.5px", color: "#1e3a8a" }}>Sales Forecasting</div>
                <div style={{ fontSize: "11.5px", color: "#60a5fa" }}>30-day projection with 95% confidence</div>
              </div>
            </div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb" }}>→</span>
          </div>

          <div
            onClick={() => onNavigate("churn")}
            style={{
              padding: "14px",
              borderRadius: "10px",
              background: "#fef2f2",
              border: "1px solid #fee2e2",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <UserX size={20} color="#dc2626" />
              <div>
                <div style={{ fontWeight: 700, fontSize: "13.5px", color: "#991b1b" }}>Churn Risk Protection</div>
                <div style={{ fontSize: "11.5px", color: "#f87171" }}>Detect and retain high-risk clients</div>
              </div>
            </div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#dc2626" }}>→</span>
          </div>

          <div
            onClick={() => onNavigate("recommendations")}
            style={{
              padding: "14px",
              borderRadius: "10px",
              background: "#fdf4ff",
              border: "1px solid #fae8ff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Sparkles size={20} color="#9333ea" />
              <div>
                <div style={{ fontWeight: 700, fontSize: "13.5px", color: "#701a75" }}>Cross-Sell Recommendations</div>
                <div style={{ fontSize: "11.5px", color: "#c084fc" }}>Item co-occurrence affinity engine</div>
              </div>
            </div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#9333ea" }}>→</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;