import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../config/config";
import { mergeGuestCartIntoUser } from "../AddCart/cartUtils";

import "./SignupPage.css";

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

      console.log("Logged in userId =", userId);

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

          console.log("Seller status API =", statusData);

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
    }

    setLoading(false);
  };

  return (
    <div className="signup-page">
      <main className="main">
        <div className="main-inner">
          <section className="form-card">
            <h1>Login</h1>
            <p className="form-subtitle">Enter your login credentials</p>

            {message && <p className="signup-message">{message}</p>}

            <form className="signup-form" onSubmit={handleSubmit}>
              <input
                type="text"
                name="usernameOrEmail"
                placeholder="Username or Email"
                value={formData.usernameOrEmail}
                onChange={handleChange}
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="login-text">
              Don’t have an account?
              <Link to="/signup" className="login-link">Sign up</Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
