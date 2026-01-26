import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Eye, 
  EyeOff, 
  ShoppingCart, 
  AlertCircle, 
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { API_BASE } from "../config/config";
import { mergeGuestCartIntoUser } from "../AddCart/cartUtils";
import "./Auth.css";
import avatar from "../Images/avatar/avatar.png";
import logo from "../Images/Logo/logo1.png";
import Footer from "../FooterSection/Footer";

function encodeUserId(userId) {
  return window.btoa(String(userId));
}

const LoginPage = () => {
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
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
      let token = data.token;

      if (Array.isArray(role)) role = role[0];
      const roleForRouting = role.toUpperCase().replace(/^ROLE_/, "");
      
      localStorage.setItem("userId", encodeUserId(userId));
      localStorage.setItem("userRole", roleForRouting);
      if (token) localStorage.setItem("token", token);
      if (data.email) localStorage.setItem("userEmail", data.email);

      await mergeGuestCartIntoUser(userId);

      const paths = { "CUSTOMER": "/customer/dashboard", "SELLER": "/seller/dashboard", "ADMIN": "/admin/dashboard" };
      navigate(paths[roleForRouting] || "/", { replace: true });

    } catch (err) {
      setMessage("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-centered-content">
        <div className="auth-main-card">
          {/* Left Section - Visual */}
          <div className="auth-visual-section">
            <div className="auth-visual-content">
              <h1 className="auth-visual-title">
                Simplify <br /> 
                management With <br /> 
                Our dashboard.
              </h1>
              <p className="auth-visual-description">
                Experience the next generation of e-commerce management with our user-friendly interface.
              </p>
            </div>
            <div className="auth-visual-image">
              <img 
                src={avatar} 
                alt="Management Illustration" 
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
                <h1>Welcome Back</h1>
                <p>Please login to your account</p>
              </div>

              {message && (
                <div className="auth-alert auth-alert-error">
                  <AlertCircle size={18} />
                  <span>{message}</span>
                </div>
              )}

              <form className="auth-form-v2" onSubmit={handleSubmit}>
                <div className="auth-input-group">
                  <div className="auth-input-container">
                    <input
                      className="auth-input"
                      type="text"
                      name="usernameOrEmail"
                      placeholder="Email address"
                      value={formData.usernameOrEmail}
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
                  <Link to="/forgot-password" size="sm" className="auth-forgot-link">
                    Forgot Password?
                  </Link>
                </div>

                <button type="submit" className="auth-primary-btn" disabled={loading}>
                  {loading ? "Processing..." : (
                    <>
                      Sign In
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>

              <div className="auth-divider-container">
                <div className="auth-divider-line"></div>
                <span>Or Login With</span>
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
                Don't have an account?
                <Link to="/signup" className="auth-footer-link">Signup</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;
