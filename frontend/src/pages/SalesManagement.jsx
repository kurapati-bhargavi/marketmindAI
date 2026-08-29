import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Download,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import api from "../api/api";

function SalesManagement() {
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Sale Modal state
  const [showModal, setShowModal] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [newSale, setNewSale] = useState({
    customer_id: "",
    product_id: "",
    quantity: 1,
    unit_price: "",
    payment_method: "CARD",
  });
  const [modalMsg, setModalMsg] = useState("");
  const [modalError, setModalError] = useState("");

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (category) params.category = category;

      const res = await api.get("/sales/", { params });
      setSales(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Error fetching sales:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [catRes, prodRes, custRes] = await Promise.all([
        api.get("/products/categories"),
        api.get("/products/"),
        api.get("/customers/"),
      ]);
      setCategories(catRes.data || []);
      setProductsList(prodRes.data || []);
      setCustomersList(custRes.data || []);
    } catch (e) {
      console.error("Error fetching metadata:", e);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [page, category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSales();
  };

  const handleProductSelect = (e) => {
    const prodId = parseInt(e.target.value);
    const prod = productsList.find((p) => p.id === prodId);
    setNewSale({
      ...newSale,
      product_id: prodId,
      unit_price: prod ? prod.price : "",
    });
  };

  const handleCreateSale = async (e) => {
    e.preventDefault();
    setModalMsg("");
    setModalError("");

    if (!newSale.customer_id || !newSale.product_id || newSale.quantity <= 0) {
      setModalError("Please select customer, product and valid quantity.");
      return;
    }

    try {
      await api.post("/sales/", {
        customer_id: parseInt(newSale.customer_id),
        product_id: parseInt(newSale.product_id),
        quantity: parseInt(newSale.quantity),
        unit_price: parseFloat(newSale.unit_price),
        payment_method: newSale.payment_method,
      });

      setModalMsg("Transaction recorded successfully!");
      fetchSales();
      setTimeout(() => {
        setShowModal(false);
        setModalMsg("");
        setNewSale({ customer_id: "", product_id: "", quantity: 1, unit_price: "", payment_method: "CARD" });
      }, 1000);
    } catch (err) {
      setModalError(err.response?.data?.detail || "Failed to create transaction.");
    }
  };

  const exportCSV = () => {
    if (sales.length === 0) return;
    const headers = ["Invoice", "Customer", "Product", "Category", "Quantity", "Unit Price", "Total", "Date", "Payment"];
    const rows = sales.map((s) => [
      s.invoice_number || `INV-${s.id}`,
      `"${s.customer_name}"`,
      `"${s.product_name}"`,
      s.category,
      s.quantity,
      s.unit_price,
      s.total_amount,
      s.sale_date,
      s.payment_method
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header & Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Sales & Transaction Ledger</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Complete historical transactions, customer invoices, and real-time revenue receipts.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn-secondary" onClick={exportCSV}>
            <Download size={16} /> Export CSV
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Transaction
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: "18px 24px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search Box */}
          <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
            <Search size={17} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-dim)" }} />
            <input
              type="text"
              placeholder="Search by customer, product, or invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 38px",
                border: "1px solid var(--border-light)",
                borderRadius: "8px",
                fontSize: "13.5px",
                outline: "none"
              }}
            />
          </div>

          {/* Category Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={16} color="var(--text-muted)" />
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "10px 14px",
                border: "1px solid var(--border-light)",
                borderRadius: "8px",
                fontSize: "13.5px",
                background: "#ffffff",
                outline: "none"
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: "9px 18px" }}>
            Filter Results
          </button>
        </form>
      </div>

      {/* Transactions Data Table */}
      <div className="glass-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
            Showing {sales.length} of {total} total transactions
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Page {page} of {totalPages}</div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total Amount</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Loading transactions...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    No sales transactions match the current criteria.
                  </td>
                </tr>
              ) : (
                sales.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: "var(--primary-700)" }}>
                      {item.invoice_number || `INV-${item.id}`}
                    </td>
                    <td>{item.sale_date?.slice(0, 10)}</td>
                    <td style={{ fontWeight: 600 }}>{item.customer_name}</td>
                    <td>{item.product_name}</td>
                    <td><span className="badge badge-info">{item.category}</span></td>
                    <td>{item.quantity}</td>
                    <td>₹{item.unit_price?.toLocaleString()}</td>
                    <td style={{ fontWeight: 800, color: "var(--text-main)" }}>
                      ₹{item.total_amount?.toLocaleString()}
                    </td>
                    <td><span className="badge badge-success">{item.payment_method || "CARD"}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px" }}>
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Showing {sales.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} records
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              style={{ padding: "6px 12px", opacity: page <= 1 ? 0.5 : 1 }}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              className="btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              style={{ padding: "6px 12px", opacity: page >= totalPages ? 0.5 : 1 }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* New Transaction Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px"
          }}
        >
          <div className="glass-card" style={{ width: "500px", maxWidth: "100%", padding: "30px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>Record New Transaction</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
              Manually enter a customer sale. Inventory stock will automatically decrement.
            </p>

            {modalMsg && (
              <div style={{ padding: "10px", borderRadius: "8px", background: "var(--success-bg)", color: "var(--success-text)", marginBottom: "14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={16} /> {modalMsg}
              </div>
            )}
            {modalError && (
              <div style={{ padding: "10px", borderRadius: "8px", background: "var(--danger-bg)", color: "var(--danger-text)", marginBottom: "14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertCircle size={16} /> {modalError}
              </div>
            )}

            <form onSubmit={handleCreateSale} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Customer</label>
                <select
                  value={newSale.customer_id}
                  onChange={(e) => setNewSale({ ...newSale, customer_id: e.target.value })}
                  required
                  style={{ width: "100%", padding: "10px", border: "1px solid var(--border-light)", borderRadius: "8px", fontSize: "13.5px" }}
                >
                  <option value="">Select Customer</option>
                  {customersList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email || c.phone || `ID: ${c.id}`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Product</label>
                <select
                  value={newSale.product_id}
                  onChange={handleProductSelect}
                  required
                  style={{ width: "100%", padding: "10px", border: "1px solid var(--border-light)", borderRadius: "8px", fontSize: "13.5px" }}
                >
                  <option value="">Select Product</option>
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.price} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newSale.quantity}
                    onChange={(e) => setNewSale({ ...newSale, quantity: parseInt(e.target.value) || 1 })}
                    required
                    style={{ width: "100%", padding: "10px", border: "1px solid var(--border-light)", borderRadius: "8px", fontSize: "13.5px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSale.unit_price}
                    onChange={(e) => setNewSale({ ...newSale, unit_price: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px", border: "1px solid var(--border-light)", borderRadius: "8px", fontSize: "13.5px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Payment Method</label>
                <select
                  value={newSale.payment_method}
                  onChange={(e) => setNewSale({ ...newSale, payment_method: e.target.value })}
                  style={{ width: "100%", padding: "10px", border: "1px solid var(--border-light)", borderRadius: "8px", fontSize: "13.5px" }}
                >
                  <option value="UPI">UPI / QR Payment</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="NET_BANKING">Net Banking</option>
                  <option value="CASH">Cash on Delivery</option>
                </select>
              </div>

              {/* Total Calculation Display */}
              <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>Total Calculated:</span>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--primary-700)" }}>
                  ₹{(newSale.quantity * (parseFloat(newSale.unit_price) || 0)).toLocaleString()}
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Confirm Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesManagement;
