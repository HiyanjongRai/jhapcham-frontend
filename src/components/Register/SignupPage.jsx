import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  Lock, 
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
import avatar from "../Images/avatar/avatar3.png";
import Footer from "../FooterSection/Footer";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
    contactNumber: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/register/customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Account created. Welcome to Jhapcham!");
        setMessageType("success");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setMessage(data.message || "Registration failed.");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Server connection failed.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-centered-content">
        <div className="auth-main-card">
          {/* Left Section - Visual (Swapped text for signup) */}
          <div className="auth-visual-section">
            <div className="auth-visual-content">
              <h1 className="auth-visual-title">
                Join Our <br /> 
                growing <br /> 
                Community.
              </h1>
              <p className="auth-visual-description">
                Start your shopping journey with us today and unlock exclusive benefits and offers.
              </p>
            </div>
            <div className="auth-visual-image">
              <img 
                src={avatar}
                alt="Community Illustration" 
                className="auth-primary-illustration"
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
                <h1>Create Account</h1>
                <p>Join the collective experience</p>
              </div>

              {message && (
                <div className={`auth-alert ${messageType === "success" ? "auth-alert-success" : "auth-alert-error"}`}>
                  {messageType === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                  <span>{message}</span>
                </div>
              )}

              <form className="auth-form-v2" onSubmit={handleSubmit}>
                <div className="auth-input-group">
                  <div className="auth-input-container">
                    <input
                      className="auth-input"
                      type="text"
                      name="fullName"
                      placeholder="Full Name"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div className="auth-input-container">
                    <input
                      className="auth-input"
                      type="text"
                      name="username"
                      placeholder="Username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="auth-input-container">
                    <input
                      className="auth-input"
                      type="text"
                      name="contactNumber"
                      placeholder="Contact"
                      value={formData.contactNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <div className="auth-input-container">
                    <input
                      className="auth-input"
                      type="email"
                      name="email"
                      placeholder="Email address"
                      value={formData.email}
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
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
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
                  {loading ? "Creating..." : (
                    <>
                      Create Account
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>

              <div className="auth-divider-container">
                <div className="auth-divider-line"></div>
                <span>Or Sign Up With</span>
                <div className="auth-divider-line"></div>
              </div>

              <div className="auth-social-row">
                <button className="auth-social-btn">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" width="20" alt="G" />
                  Google
                </button>
                <button className="auth-social-btn">
                  <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" width="20" alt="F" />
                  Facebook
                </button>
              </div>

              <p className="auth-footer-prompt">
                Already have an account?
                <Link to="/login" className="auth-footer-link">Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SignupPage;
