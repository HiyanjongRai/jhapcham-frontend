import React, { useState } from "react";
import "./SignupPage.css";
import { API_BASE } from "../config/config";
import { Link } from "react-router-dom"

const SignupPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/register/customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Account created successfully!");
        setMessageType("success");
        // Optional: redirect after 2 seconds
        setTimeout(() => window.location.href = "/login", 2000);
      } else {
        setMessage(data.message || "Registration failed. Try again.");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Server error. Try again later.");
      setMessageType("error");
    }

    setLoading(false);
  };

  return (
    <div className="signup-page">
      <main className="main">
        <div className="main-inner">

          {/* Left illustration */}
          <section className="hero-card">
            <div className="hero-art">
              <div className="phone"></div>
              <div className="cart"></div>
              <div className="shopping-bags">
                <div className="bag bag-small" />
                <div className="bag bag-medium" />
              </div>
            </div>
          </section>

          {/* Signup form */}
          <section className="form-card">
            <h1>Create an account</h1>
            <p className="form-subtitle">Enter your details below</p>

            {message && (
              <p className={`signup-message ${messageType}`}>
                {message}
              </p>
            )}

            <form className="signup-form" onSubmit={handleSubmit}>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
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
                {loading ? "Creating..." : "Create Account"}
              </button>

              <button type="button" className="btn-google">
                <span className="google-icon">G</span>
                <span>Sign up with Google</span>
              </button>
            </form>

            <p className="login-text">
  Already have an account?{" "}
  <Link to="/login" className="login-link">
    Log in
  </Link>
</p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SignupPage;
