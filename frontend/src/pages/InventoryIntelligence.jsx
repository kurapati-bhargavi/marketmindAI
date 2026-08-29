import { useState, useEffect } from "react";
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Settings,
  Search,
  RefreshCw,
  TrendingDown,
  Warehouse
} from "lucide-react";
import api from "../api/api";

function InventoryIntelligence() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  // Restock Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [restockQty, setRestockQty] = useState(25);
  const [reorderThreshold, setReorderThreshold] = useState(10);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get("/inventory/");
      setInventory(res.data.items || []);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await api.post(`/inventory/${selectedItem.product_id}/restock`, {
        quantity: parseInt(restockQty),
      });
      setActionSuccess(`Successfully added ${restockQty} units to ${selectedItem.product_name}!`);
      fetchInventory();
      setTimeout(() => {
        setShowRestockModal(false);
        setActionSuccess("");
      }, 1200);
    } catch (err) {
      alert("Error restocking item.");
    }
  };

  const handleUpdateThreshold = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await api.put(`/inventory/${selectedItem.product_id}/threshold`, {
        reorder_threshold: parseInt(reorderThreshold),
      });
      setActionSuccess(`Updated safety reorder threshold for ${selectedItem.product_name}!`);
      fetchInventory();
      setTimeout(() => {
        setShowConfigModal(false);
        setActionSuccess("");
      }, 1200);
    } catch (err) {
      alert("Error updating threshold.");
    }
  };

  // KPI Calculations
  const totalItems = inventory.length;
  const lowStockCount = inventory.filter((i) => i.current_stock > 0 && i.current_stock <= i.reorder_threshold).length;
  const outOfStockCount = inventory.filter((i) => i.current_stock <= 0).length;
  const totalValuation = inventory.reduce((acc, i) => acc + (i.current_stock * (i.unit_price || 0)), 0);

  // Filtered List
  const filteredInventory = inventory.filter((item) => {
    if (search && !item.product_name.toLowerCase().includes(search.toLowerCase()) && !item.sku?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filterStatus === "low_stock") return item.current_stock > 0 && item.current_stock <= item.reorder_threshold;
    if (filterStatus === "out_of_stock") return item.current_stock <= 0;
    if (filterStatus === "in_stock") return item.current_stock > item.reorder_threshold;
    return true;
  });

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Inventory Intelligence & Stock Control</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Real-time stock level monitoring, safety threshold breaches, automated restocking and warehouse tracking.
          </p>
        </div>

        <button className="btn-secondary" onClick={fetchInventory}>
          <RefreshCw size={16} /> Refresh Stock Levels
        </button>
      </div>

      {/* Inventory KPI Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 600, marginBottom: "8px" }}>TOTAL SKU CATALOG</div>
          <div style={{ fontSize: "26px", fontWeight: 800 }}>{totalItems} Products</div>
          <div style={{ fontSize: "12px", color: "var(--primary-600)", marginTop: "4px" }}>Active inventory lines</div>
        </div>

        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 600, marginBottom: "8px" }}>LOW STOCK WARNINGS</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: lowStockCount > 0 ? "var(--warning-text)" : "var(--text-main)" }}>
            {lowStockCount} SKUs
          </div>
          <div style={{ fontSize: "12px", color: "var(--warning-text)", marginTop: "4px" }}>Below safety reorder point</div>
        </div>

        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 600, marginBottom: "8px" }}>CRITICAL OUT OF STOCK</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: outOfStockCount > 0 ? "var(--danger-text)" : "var(--success-text)" }}>
            {outOfStockCount} SKUs
          </div>
          <div style={{ fontSize: "12px", color: outOfStockCount > 0 ? "var(--danger-text)" : "var(--success-text)", marginTop: "4px" }}>
            {outOfStockCount > 0 ? "Zero quantity available" : "No stockouts"}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 600, marginBottom: "8px" }}>TOTAL STOCK VALUATION</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--primary-700)" }}>
            ₹{totalValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Asset valuation at retail price</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        {/* Search */}
        <div style={{ position: "relative", minWidth: "280px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-dim)" }} />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
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

        {/* Status Filter Buttons */}
        <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
          {[
            { id: "all", label: `All (${totalItems})` },
            { id: "low_stock", label: `Low Stock (${lowStockCount})` },
            { id: "out_of_stock", label: `Out of Stock (${outOfStockCount})` },
            { id: "in_stock", label: "In Stock" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: "6px 14px",
                border: "none",
                borderRadius: "6px",
                background: filterStatus === tab.id ? "#ffffff" : "transparent",
                color: filterStatus === tab.id ? "var(--primary-700)" : "var(--text-muted)",
                fontWeight: 600,
                fontSize: "12.5px",
                cursor: "pointer"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-card" style={{ padding: "20px" }}>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product / SKU</th>
                <th>Category</th>
                <th>Stock Level</th>
                <th>Status</th>
                <th>Reorder Threshold</th>
                <th>Unit Price</th>
                <th>Location</th>
                <th>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Loading inventory records...
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    No products match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isOut = item.current_stock <= 0;
                  const isLow = item.current_stock > 0 && item.current_stock <= item.reorder_threshold;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{item.product_name}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>SKU: {item.sku || "N/A"}</div>
                      </td>
                      <td><span className="badge badge-info">{item.category}</span></td>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: "15px", color: isOut ? "var(--danger-text)" : isLow ? "var(--warning-text)" : "var(--text-main)" }}>
                          {item.current_stock} units
                        </div>
                      </td>
                      <td>
                        {isOut ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : isLow ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">Optimal</span>
                        )}
                      </td>
                      <td>{item.reorder_threshold} units</td>
                      <td>₹{item.unit_price?.toLocaleString()}</td>
                      <td>{item.location || "Main Warehouse"}</td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            className="btn-primary"
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            onClick={() => {
                              setSelectedItem(item);
                              setRestockQty(25);
                              setShowRestockModal(true);
                            }}
                          >
                            <PlusCircle size={14} /> Restock
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: "6px 10px", fontSize: "12px" }}
                            onClick={() => {
                              setSelectedItem(item);
                              setReorderThreshold(item.reorder_threshold);
                              setShowConfigModal(true);
                            }}
                          >
                            <Settings size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {showRestockModal && selectedItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div className="glass-card" style={{ width: "420px", padding: "26px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "4px" }}>Restock Item</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
              Add new units to current stock for <strong>{selectedItem.product_name}</strong>.
            </p>

            {actionSuccess && (
              <div style={{ padding: "10px", borderRadius: "8px", background: "var(--success-bg)", color: "var(--success-text)", fontSize: "13px", marginBottom: "12px" }}>
                {actionSuccess}
              </div>
            )}

            <form onSubmit={handleRestockSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Current Stock</label>
                <input
                  type="text"
                  disabled
                  value={`${selectedItem.current_stock} units`}
                  style={{ width: "100%", padding: "10px", background: "#f8fafc", border: "1px solid var(--border-light)", borderRadius: "8px" }}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Units to Add</label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", border: "1px solid var(--border-light)", borderRadius: "8px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowRestockModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safety Reorder Threshold Config Modal */}
      {showConfigModal && selectedItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div className="glass-card" style={{ width: "420px", padding: "26px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "4px" }}>Configure Safety Stock</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
              Set minimum threshold trigger for <strong>{selectedItem.product_name}</strong>.
            </p>

            {actionSuccess && (
              <div style={{ padding: "10px", borderRadius: "8px", background: "var(--success-bg)", color: "var(--success-text)", fontSize: "13px", marginBottom: "12px" }}>
                {actionSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateThreshold}>
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Reorder Threshold (units)</label>
                <input
                  type="number"
                  min="1"
                  value={reorderThreshold}
                  onChange={(e) => setReorderThreshold(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", border: "1px solid var(--border-light)", borderRadius: "8px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowConfigModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Save Threshold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryIntelligence;
