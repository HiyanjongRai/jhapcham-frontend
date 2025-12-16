import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./SellerAuth.css";
import { API_BASE } from "../config/config";

export default function SellerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await axios.post(`${API_BASE}/api/auth/register/seller`, form);

      const userId = res.data.userId; // Backend returns 'userId'
      const role = res.data.role;
      const token = res.data.token;

      localStorage.setItem("userId", btoa(String(userId)));
      localStorage.setItem("userRole", role);
      if(token) localStorage.setItem("token", token);

      setMessage({ type: "success", text: "Registration successful! Redirecting..." });

      setTimeout(() => {
        navigate("/seller-application");
      }, 1500);

    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Registration failed. Please try again."
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sa-container">
      <div className="sa-card">
        <h1 className="sa-title">Become a Seller</h1>
        <p className="sa-subtitle">Create your seller account to start selling</p>

        <form onSubmit={handleSubmit}>
          <div className="sa-form-group">
            <label className="sa-label">Username</label>
            <input
              className="sa-input"
              type="text"
              name="username"
              placeholder="Choose a username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="sa-form-group">
            <label className="sa-label">Email Address</label>
            <input
              className="sa-input"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="sa-form-group">
            <label className="sa-label">Password</label>
            <input
              className="sa-input"
              type="password"
              name="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {message && (
            <div className={`sa-message ${message.type === "error" ? "sa-error" : "sa-success"}`}>
              {message.text}
            </div>
          )}

          <button type="submit" className="sa-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Register & Continue"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem", color: "#666" }}>
          Already have an account? <Link to="/login" style={{ color: "#000", fontWeight: "600" }}>Login here</Link>
        </div>
      </div>
    </div>
  );
}
