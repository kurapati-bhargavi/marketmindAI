import { useState } from "react";

function MainApp() {
  const [showProfile, setShowProfile] = useState(false);

  const [dataUploaded, setDataUploaded] = useState(
    localStorage.getItem("businessDataUploaded") === "true"
  );

  const handleFeatureClick = (feature) => {
    if (!dataUploaded) {
      alert("Please upload your business data first.");
      return;
    }

    alert(`${feature} feature is ready.`);
  };

  const handleUpload = () => {
    // Temporary frontend state.
    // We will connect this to the real CSV API next.
    localStorage.setItem("businessDataUploaded", "true");
    setDataUploaded(true);

    alert("Business data uploaded successfully.");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* ================= HEADER ================= */}

      <header
        style={{
          height: "70px",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 35px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ margin: 0, color: "#2563eb" }}>
          MarketMind AI
        </h2>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            style={{
              border: "none",
              background: "#eef2ff",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            👤 Business Owner ▾
          </button>

          {showProfile && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "50px",
                width: "230px",
                background: "white",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 5px 20px rgba(0,0,0,0.15)",
                zIndex: 10,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                User Profile
              </h3>

              <p>
                <strong>Name:</strong> User
              </p>

              <p>
                <strong>Role:</strong> Business Owner
              </p>

              <p>
                <strong>Status:</strong> Active
              </p>

              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "none",
                  borderRadius: "6px",
                  background: "#dc2626",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}

      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 25px",
        }}
      >
        <h1>Welcome to MarketMind AI 👋</h1>

        <p style={{ color: "#666", fontSize: "17px" }}>
          Your AI-powered Small Business Sales Intelligence Platform
        </p>

        {/* ================= UPLOAD DATA ================= */}

        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            marginTop: "30px",
            marginBottom: "30px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <h2>Business Data</h2>

          {dataUploaded ? (
            <p style={{ color: "green" }}>
              ✅ Business data is available
            </p>
          ) : (
            <>
              <p>
                Upload your business CSV data to unlock
                MarketMind AI analytics.
              </p>

              <button
                onClick={handleUpload}
                style={{
                  padding: "12px 20px",
                  border: "none",
                  borderRadius: "7px",
                  background: "#2563eb",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Upload Business Data
              </button>
            </>
          )}
        </div>

        {/* ================= FEATURES ================= */}

        <h2>MarketMind AI Features</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <FeatureCard
            title="📊 Sales Analytics"
            description="Analyze revenue, orders and sales performance."
            onClick={() =>
              handleFeatureClick("Sales Analytics")
            }
          />

          <FeatureCard
            title="📦 Inventory Analytics"
            description="Monitor inventory levels and stock movement."
            onClick={() =>
              handleFeatureClick("Inventory Analytics")
            }
          />

          <FeatureCard
            title="👥 Customer Segmentation"
            description="Identify different customer groups."
            onClick={() =>
              handleFeatureClick("Customer Segmentation")
            }
          />

          <FeatureCard
            title="📈 Sales Forecasting"
            description="Predict future sales using AI."
            onClick={() =>
              handleFeatureClick("Sales Forecasting")
            }
          />

          <FeatureCard
            title="⚠️ Churn Prediction"
            description="Identify customers who may stop purchasing."
            onClick={() =>
              handleFeatureClick("Churn Prediction")
            }
          />

          <FeatureCard
            title="💡 Recommendations"
            description="Get actionable business recommendations."
            onClick={() =>
              handleFeatureClick("Recommendations")
            }
          />

          <FeatureCard
            title="🔔 Alerts"
            description="Receive important business alerts."
            onClick={() =>
              handleFeatureClick("Alerts")
            }
          />
        </div>
      </main>
    </div>
  );
}

// ================= FEATURE CARD =================

function FeatureCard({
  title,
  description,
  onClick,
}) {
  return (
    <div
      style={{
        background: "white",
        padding: "25px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
      }}
    >
      <h3>{title}</h3>

      <p
        style={{
          color: "#666",
          minHeight: "45px",
        }}
      >
        {description}
      </p>

      <button
        onClick={onClick}
        style={{
          padding: "10px 18px",
          border: "none",
          borderRadius: "6px",
          background: "#2563eb",
          color: "white",
          cursor: "pointer",
        }}
      >
        Open
      </button>
    </div>
  );
}

export default MainApp;

