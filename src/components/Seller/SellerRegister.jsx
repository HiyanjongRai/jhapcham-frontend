import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { 
  Store, 
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight
} from "lucide-react";
import { API_BASE } from "../config/config";
import "../Login/Auth.css";
import logo from "../Images/Logo/logo1.png";
import Footer from "../FooterSection/Footer";

export default function SellerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (form.password.length < 8) {
      setMessage({ type: "error", text: "Min. 8 characters required." });
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/api/auth/register/seller`, form);
      const { userId, role, token } = res.data;

      localStorage.setItem("userId", btoa(String(userId)));
      localStorage.setItem("userRole", role);
      if(token) localStorage.setItem("token", token);

      setMessage({ type: "success", text: "Seller invitation accepted!" });
      setTimeout(() => navigate("/seller-application"), 1500);
    } catch (err) {
      setMessage({ type: "error", text: "Merchant application failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-centered-content">
        <div className="auth-main-card">
          {/* Left Section - Visual (Merchant specific) */}
          <div className="auth-visual-section">
            <div className="auth-visual-content">
              <h1 className="auth-visual-title">
                Scale Your <br /> 
                Business With <br /> 
                Our shop tools.
              </h1>
              <p className="auth-visual-description">
                Join thousands of merchants and start your global selling journey with professional management tools.
              </p>
            </div>
            <div className="auth-visual-image">
              <img 
                src="https://cdni.iconscout.com/illustration/premium/thumb/business-growth-success-6510759-5389659.png" 
                alt="Merchant Illustration" 
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>

          {/* Right Section - Form */}
          <div className="auth-form-section">
            <div className="auth-form-container">
              <div className="auth-logo-header" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
                <img src={logo} alt="Jhapcham Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
              </div>

              <div className="auth-header-text">
                <h1>Become a Seller</h1>
                <p>Apply for your digital storefront</p>
              </div>

              {message && (
                <div className={`auth-alert ${message.type === "success" ? "auth-alert-success" : "auth-alert-error"}`}>
                  {message.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                  <span>{message.text}</span>
                </div>
              )}

              <form className="auth-form-v2" onSubmit={handleSubmit}>
                <div className="auth-input-group">
                  <div className="auth-input-container">
                    <input
                      className="auth-input"
                      type="text"
                      name="username"
                      placeholder="Shop identity / Username"
                      value={form.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <div className="auth-input-container">
                    <input
                      className="auth-input"
                      type="email"
                      name="email"
                      placeholder="Business Correspondence / Email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <div className="auth-input-container">
                    <input
                      className="auth-input"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Access Key / Password"
                      value={form.password}
                      onChange={handleChange}
                      minLength={8}
                      required
                    />
                    <button 
                      type="button" 
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="auth-primary-btn" disabled={loading}>
                  {loading ? "Processing..." : (
                    <>
                      Apply Now
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>

              <div className="auth-divider-container">
                <div className="auth-divider-line"></div>
                <span>Join via Organization</span>
                <div className="auth-divider-line"></div>
              </div>

              <div className="auth-social-row">
                <button className="auth-social-btn">
                  <img src="https://www.svgrepo.com/show/475641/google-color.svg" width="20" alt="G" />
                  Google Workspace
                </button>
                <button className="auth-social-btn" style={{ fontSize: '0.8rem' }}>
                  <img src="https://www.svgrepo.com/show/448234/linkedin.svg" width="20" alt="L" />
                  LinkedIn Business
                </button>
              </div>

              <p className="auth-footer-prompt">
                Already lead a store?
                <Link to="/login" className="auth-footer-link">Log In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
