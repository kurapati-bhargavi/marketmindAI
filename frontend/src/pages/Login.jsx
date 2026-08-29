import { useState } from "react";
import api from "../api/api";

function Login({ onLogin, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const data = response.data;

      // =========================
      // SAVE JWT TOKEN
      // =========================

      localStorage.setItem("token", data.access_token);

      // =========================
      // SAVE USER INFORMATION
      // =========================

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      console.log("Login successful:", data);

      setMessage("Login successful!");

      // Give the user a moment to see success
      setTimeout(() => {
        onLogin();
      }, 500);

    } catch (error) {
      console.error("Login error:", error);

      let errorMessage =
        "Login failed. Please check your email and password.";

      // FastAPI normal error
      if (typeof error.response?.data?.detail === "string") {
        errorMessage = error.response.data.detail;
      }

      // FastAPI validation errors
      else if (Array.isArray(error.response?.data?.detail)) {
        errorMessage = error.response.data.detail
          .map((item) => item.msg || "Invalid input.")
          .join(", ");
      }

      setMessage(errorMessage);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>

      {/* =========================
          LOGIN CARD
      ========================= */}

      <div style={styles.card}>

        {/* Logo / Brand */}

        <div style={styles.logoContainer}>
          <div style={styles.logo}>M</div>

          <h1 style={styles.brand}>
            MarketMind <span style={styles.ai}>AI</span>
          </h1>
        </div>

        <h2 style={styles.title}>
          Welcome Back
        </h2>

        <p style={styles.subtitle}>
          Sign in to access your business intelligence dashboard.
        </p>

        {/* =========================
            ERROR / SUCCESS MESSAGE
        ========================= */}

        {message && (
          <div
            style={{
              ...styles.message,
              background: message.includes("successful")
                ? "#dcfce7"
                : "#fee2e2",
              color: message.includes("successful")
                ? "#166534"
                : "#b91c1c",
            }}
          >
            {message}
          </div>
        )}

        {/* =========================
            LOGIN FORM
        ========================= */}

        <form onSubmit={handleLogin}>

          {/* Email */}

          <div style={styles.formGroup}>
            <label
              htmlFor="email"
              style={styles.label}
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your email"
              required
              style={styles.input}
            />
          </div>

          {/* Password */}

          <div style={styles.formGroup}>
            <label
              htmlFor="password"
              style={styles.label}
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              required
              style={styles.input}
            />
          </div>

          {/* Login Button */}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.loginButton,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

        {/* =========================
            BACK BUTTON
        ========================= */}

        {onBack && (
  <button
    type="button"
    onClick={onBack}
    style={styles.backButton}
  >
    ← Back to Landing Page
  </button>
)}

      </div>

      {/* =========================
          FOOTER
      ========================= */}

      <p style={styles.footer}>
        © 2026 MarketMind AI · Small Business Sales Intelligence
      </p>

    </div>
  );
}

// =========================
// STYLES
// =========================

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg, #eef2ff 0%, #f8fafc 50%, #eff6ff 100%)",
    padding: "25px",
    boxSizing: "border-box",
    fontFamily:
      "Inter, Arial, Helvetica, sans-serif",
  },

  card: {
    width: "430px",
    maxWidth: "100%",
    background: "#ffffff",
    padding: "40px",
    borderRadius: "18px",
    boxShadow:
      "0 15px 40px rgba(0, 0, 0, 0.10)",
    boxSizing: "border-box",
  },

  logoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "25px",
  },

  logo: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "bold",
  },

  brand: {
    margin: 0,
    fontSize: "25px",
    fontWeight: "700",
    color: "#111827",
  },

  ai: {
    color: "#2563eb",
  },

  title: {
    textAlign: "center",
    margin: "0 0 8px 0",
    fontSize: "28px",
    color: "#111827",
  },

  subtitle: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.6",
    marginBottom: "25px",
  },

  message: {
    padding: "12px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "20px",
    lineHeight: "1.4",
  },

  formGroup: {
    marginBottom: "18px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
  },

  input: {
    width: "100%",
    padding: "13px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    background: "#ffffff",
  },

  loginButton: {
    width: "100%",
    padding: "13px",
    marginTop: "5px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },

  backButton: {
    width: "100%",
    marginTop: "18px",
    padding: "10px",
    border: "none",
    background: "transparent",
    color: "#2563eb",
    fontSize: "14px",
    cursor: "pointer",
  },

  footer: {
    marginTop: "20px",
    color: "#6b7280",
    fontSize: "12px",
    textAlign: "center",
  },
};

export default Login;

