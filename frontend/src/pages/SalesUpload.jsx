import { useState, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  Sparkles,
  ArrowRight,
  Database,
  RefreshCw
} from "lucide-react";
import api from "../api/api";

function SalesUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a standard CSV file (.csv).");
      return;
    }

    setFile(selectedFile);
    setError("");
    setImportResult(null);
    setLoading(true);

    // Call dry-run preview endpoint
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await api.post("/sales-upload/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setPreviewData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Error previewing CSV file.");
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/sales-upload/csv", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        setImportResult(res.data);
      } else {
        setError(res.data.message || "Failed to import CSV records.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Database ingestion failed.");
    } finally {
      setLoading(false);
    }
  };


  const handleLoadSampleDataset = async () => {
    setLoading(true);
    setError("");
    try {
      // Create a sample CSV blob from standard retail items
      const sampleCsv = `customer_name,customer_email,customer_phone,product_name,category,quantity,unit_price,total_amount,sale_date,payment_method
Aditi Sharma,aditi.sharma@example.com,+91-9876543201,Wireless Bluetooth Earbuds,Electronics,2,2499.00,4998.00,2026-08-15,UPI
Rajesh Kumar,rajesh.kumar@example.com,+91-9876543202,Ultra HD Smart Watch,Electronics,1,4999.00,4999.00,2026-08-16,CREDIT_CARD
Priya Patel,priya.patel@example.com,+91-9876543203,Classic Slim-Fit Denim Jeans,Apparel,2,1999.00,3998.00,2026-08-17,DEBIT_CARD
Vikram Singh,vikram.singh@example.com,+91-9876543204,Stainless Steel Air Fryer,Home & Kitchen,1,6499.00,6499.00,2026-08-18,UPI
Ananya Roy,ananya.roy@example.com,+91-9876543205,Vitamin C Brightening Serum,Health & Beauty,3,799.00,2397.00,2026-08-19,NET_BANKING
Karthik Iyer,karthik.iyer@example.com,+91-9876543206,Noise Cancelling Headphones,Electronics,1,8499.00,8499.00,2026-08-20,CREDIT_CARD
Sneha Reddy,sneha.reddy@example.com,+91-9876543207,Premium Organic Cotton T-Shirt,Apparel,4,899.00,3596.00,2026-08-21,UPI
Amitabh Verma,amitabh.verma@example.com,+91-9876543208,Cast Iron Dutch Oven,Home & Kitchen,1,3899.00,3899.00,2026-08-22,CARD
Pooja Nair,pooja.nair@example.com,+91-9876543209,Sonic Electric Toothbrush,Health & Beauty,2,2199.00,4398.00,2026-08-23,UPI
Rohan Mehta,rohan.mehta@example.com,+91-9876543210,Fast Charging Power Bank 20000mAh,Electronics,2,1899.00,3798.00,2026-08-24,UPI`;

      const blob = new Blob([sampleCsv], { type: "text/csv" });
      const sampleFile = new File([blob], "marketmind_demo_retail_sales.csv", { type: "text/csv" });
      await handleFileSelect(sampleFile);
    } catch (e) {
      setError("Failed to create sample dataset.");
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Data Ingestion & CSV Pipeline</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Upload raw transaction CSV files. MarketMind AI automatically cleans data, normalizes columns, and links products and customer histories.
          </p>
        </div>

        <button className="btn-secondary" onClick={handleLoadSampleDataset} disabled={loading}>
          <Sparkles size={16} color="var(--primary-600)" /> One-Click Demo Dataset
        </button>
      </div>

      {/* Upload Dropzone */}
      <div
        className="glass-card"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: "50px 30px",
          textAlign: "center",
          border: "2px dashed var(--primary-500)",
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          cursor: "pointer",
          borderRadius: "16px",
          transition: "all 0.2s"
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          onChange={(e) => handleFileSelect(e.target.files[0])}
          style={{ display: "none" }}
        />

        <div style={{ display: "inline-flex", padding: "16px", background: "var(--primary-50)", color: "var(--primary-600)", borderRadius: "50%", marginBottom: "16px" }}>
          <UploadCloud size={36} />
        </div>

        <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "6px" }}>
          {file ? file.name : "Drag and drop your sales CSV here"}
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "13.5px", maxWidth: "480px", margin: "0 auto 16px" }}>
          Supported flexible headers: <code>customer_name</code>, <code>product_name</code>, <code>category</code>, <code>quantity</code>, <code>unit_price</code>, <code>sale_date</code>.
        </p>

        <span className="btn-primary" style={{ display: "inline-flex" }}>
          <FileSpreadsheet size={16} /> Browse Files
        </span>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ padding: "14px 18px", borderRadius: "10px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", color: "var(--danger-text)", fontSize: "13.5px", display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertTriangle size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* Dry-Run Preview Table */}
      {previewData && !importResult && (
        <div className="glass-card animate-fade-in" style={{ padding: "26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 700 }}>Validation & Schema Preview</h3>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                {previewData.message}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span className="badge badge-success">
                <CheckCircle size={13} /> {previewData.valid_rows_count} Valid Rows
              </span>
              {previewData.invalid_rows_count > 0 && (
                <span className="badge badge-danger">
                  <AlertTriangle size={13} /> {previewData.invalid_rows_count} Invalid
                </span>
              )}
              {previewData.is_duplicate && (
                <span className="badge badge-warning">
                  Duplicate File Detected
                </span>
              )}

              <button
                className="btn-primary"
                onClick={handleConfirmImport}
                disabled={loading || previewData.valid_rows_count === 0 || previewData.is_duplicate}
                style={{ opacity: previewData.valid_rows_count === 0 || previewData.is_duplicate ? 0.6 : 1 }}
              >
                {loading ? (
                  <>
                    <div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#ffffff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    Ingesting Data...
                  </>
                ) : (
                  "Confirm & Import to Database"
                )}
              </button>
            </div>
          </div>

          {/* Sample Rows Preview */}
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {previewData.sample_preview?.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{row.customer_name}</td>
                    <td>{row.product_name}</td>
                    <td><span className="badge badge-info">{row.category}</span></td>
                    <td>{row.quantity}</td>
                    <td>₹{row.unit_price}</td>
                    <td style={{ fontWeight: 700 }}>₹{row.total_amount}</td>
                    <td>{row.sale_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Success Result Card */}
      {importResult && (
        <div className="glass-card animate-fade-in" style={{ padding: "30px", border: "1px solid var(--success-border)", background: "var(--success-bg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ background: "var(--success-text)", color: "#ffffff", padding: "8px", borderRadius: "50%" }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "19px", fontWeight: 800, color: "var(--success-text)" }}>
                Data Ingestion Successful!
              </h3>
              <p style={{ fontSize: "13.5px", color: "var(--text-muted)" }}>
                {importResult.message}
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginTop: "16px" }}>
            <div style={{ background: "#ffffff", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>TRANSACTIONS INSERTED</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--primary-700)" }}>{importResult.rows_inserted}</div>
            </div>
            <div style={{ background: "#ffffff", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>CUSTOMERS CREATED</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--success-text)" }}>{importResult.customers_created}</div>
            </div>
            <div style={{ background: "#ffffff", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>PRODUCTS PROVISIONED</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#9333ea" }}>{importResult.products_created}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "24px", flexWrap: "wrap" }}>
            <button
              className="btn-primary"
              onClick={() => onUploadSuccess && onUploadSuccess()}
              style={{ padding: "10px 20px", fontSize: "14px" }}
            >
              View Live Dashboard & Insights →
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setFile(null);
                setPreviewData(null);
                setImportResult(null);
              }}
              style={{ padding: "10px 18px", fontSize: "14px" }}
            >
              Upload Another Dataset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesUpload;

