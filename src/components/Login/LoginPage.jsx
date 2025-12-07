import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../config/config";
import { mergeGuestCartIntoUser } from "../AddCart/cartUtils";
import "./Auth.css";

function encodeUserId(userId) {
  return window.btoa(String(userId));
}

const LoginPage = () => {
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Invalid credentials.");
        setLoading(false);
        return;
      }

      let userId = data.id || data.userId || data.user?.id;
      let role = data.role || data.user?.role;

      if (Array.isArray(role)) role = role[0];

      if (!userId || !role) {
        setMessage("Login failed. Role or user ID missing.");
        setLoading(false);
        return;
      }

      const roleForRouting = role.toUpperCase().replace(/^ROLE_/, "");
      const encodedId = encodeUserId(userId);
      localStorage.setItem("userId", encodedId);
      localStorage.setItem("userRole", roleForRouting);

      await mergeGuestCartIntoUser(userId);

      // Seller check
      if (roleForRouting === "SELLER") {
        try {
          const statusRes = await fetch(`${API_BASE}/api/seller/application/${userId}`);
          const statusData = await statusRes.json();
          const status = statusData.status?.toUpperCase();
          const note = statusData.note || "No note";

          if (status === "REJECTED") {
            alert(`Application rejected. Reason: ${note}`);
            setLoading(false);
            return;
          }

          if (status === "APPROVED") {
            navigate("/seller/dashboard", { replace: true });
            return;
          }

        } catch (err) {
          console.log("Status check failed", err);
        }
      }

      // Other roles
      if (roleForRouting === "CUSTOMER") {
        navigate("/customer/dashboard", { replace: true });
      } else if (roleForRouting === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }

    } catch (err) {
      console.error("Login error:", err);
      setMessage("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Please sign in to your account</p>

        {message && <div className="auth-message auth-error">{message}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="auth-label">Username or Email</label>
            <input
              className="auth-input"
              type="text"
              name="usernameOrEmail"
              placeholder="Enter your username or email"
              value={formData.usernameOrEmail}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?
          <Link to="/signup" className="auth-link">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
