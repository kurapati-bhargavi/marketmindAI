import { useState } from "react";
import api from "../api/api";

function Register({ onRegisterSuccess, onBackToLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
    role: "Business Owner",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Submit registration
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    // Check password match
    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    // Password length check
    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      const data = response.data;

      // Save token and user on successful registration
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      console.log("Registration response:", data);

      // Registration successful
      setMessage(
        data.message || "User registered successfully! Redirecting..."
      );

      // Move straight to dashboard
      setTimeout(() => {
        onRegisterSuccess();
      }, 800);


    } catch (err) {
      console.error("Registration error:", err);

      let errorMessage = "Registration failed.";

      if (Array.isArray(err.response?.data?.detail)) {
        errorMessage = err.response.data.detail
          .map((item) => {
            if (typeof item === "object") {
              return item.msg || "Invalid input.";
            }
            return String(item);
          })
          .join(", ");
      } else if (typeof err.response?.data?.detail === "string") {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f7fb",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "420px",
          maxWidth: "100%",
          padding: "35px",
          background: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1 style={{ marginBottom: "8px" }}>
          Create Account
        </h1>

        <p style={{ color: "#666", marginBottom: "25px" }}>
          Create your MarketMind AI account.
        </p>

        {/* Error message */}
        {error && (
          <div
            style={{
              color: "#b91c1c",
              background: "#fee2e2",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "15px",
            }}
          >
            {error}
          </div>
        )}

        {/* Success message */}
        {message && (
          <div
            style={{
              color: "#166534",
              background: "#dcfce7",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "15px",
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Name */}
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          {/* Password */}
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          {/* Confirm Password */}
          <input
            type="password"
            name="confirm_password"
            placeholder="Confirm Password"
            value={formData.confirm_password}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          {/* Role */}
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            style={inputStyle}
          >
            <option value="Business Owner">
              Business Owner
            </option>

            <option value="Store Manager">
              Store Manager
            </option>

            <option value="Sales Executive">
              Sales Executive
            </option>

            <option value="System Administrator">
              System Administrator
            </option>
          </select>

          {/* Create Account */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...buttonStyle,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </form>

        {/* Login */}
        <button
          onClick={onBackToLogin}
          style={{
            marginTop: "18px",
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "#2563eb",
          }}
        >
          Already have an account? Login
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  boxSizing: "border-box",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
};

const buttonStyle = {
  width: "100%",
  padding: "13px",
  background: "#2563eb",
  color: "#ffffff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: "600",
};

export default Register;

