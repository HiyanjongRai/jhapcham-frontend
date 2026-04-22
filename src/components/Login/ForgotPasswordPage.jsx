import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { API_BASE } from "../config/config";
import "./Auth.css";
import avatar from "../Images/avatar/avatar.png";
import logo from "../Images/Logo/logo1.png";
import Footer from "../FooterSection/Footer";

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP, 3 = Reset Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage({ text: data.message || "Failed to send reset email.", type: "error" });
      } else {
        setMessage({ text: "OTP sent to your email! It is valid for 15 minutes.", type: "success" });
        setStep(2);
      }
    } catch (err) {
      setMessage({ text: "Server connection failed.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage({ text: data.message || "Invalid or expired OTP.", type: "error" });
      } else {
        setMessage({ text: "Code verified! Reset your password below.", type: "success" });
        setStep(3);
      }
    } catch (err) {
      setMessage({ text: "Connection error. Check your internet.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ text: "Passwords must match exactly.", type: "error" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: "Password must be at least 6 characters.", type: "error" });
      return;
    }
    
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage({ text: data.message || "Could not reset password at this time.", type: "error" });
      } else {
        setMessage({ text: "Success! Your password is now updated.", type: "success" });
        setTimeout(() => navigate("/login"), 2500);
      }
    } catch (err) {
      setMessage({ text: "Server connection failed.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-centered-content">
        <div className="auth-main-card">
          
          <div className="auth-visual-section">
            <div className="auth-visual-content">
              <h1 className="auth-visual-title">
                {step === 3 ? "Almost <br /> There." : "Secure <br /> Recovery."}
              </h1>
              <p className="auth-visual-description">
                {step === 1 ? "Life happens, but we've got your back. Let's find your account." : 
                 step === 2 ? "A temporary verification code has been sent to your inbox." :
                 "Choose a strong password to keep your Jhapcham account safe."}
              </p>
            </div>
            <div className="auth-visual-image">
              <img 
                src={avatar} 
                alt="Account Security" 
                className="auth-primary-illustration"
                style={{ filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.15))" }}
              />
            </div>
          </div>

          <div className="auth-form-section">
            <div className="auth-form-container">
              <div className="auth-logo-header" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
                <img src={logo} alt="Jhapcham Logo" style={{ height: '35px', width: 'auto', objectFit: 'contain' }} />
              </div>

              <div className="auth-header-text">
                <h1>{step === 3 ? "New Password" : "Reset Access"}</h1>
                <p>
                  {step === 1 ? "Enter your email to receive a recovery code." : 
                   step === 2 ? "Check your email for the recovery code." : 
                   "Update your credentials below."}
                </p>
              </div>

              {message.text && (
                <div className={`auth-alert ${message.type === "error" ? "auth-alert-error" : "auth-alert-success"}`} style={{ animation: "fadeIn 0.4s ease" }}>
                  {message.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                  <span>{message.text}</span>
                </div>
              )}

              {step === 1 && (
                <form className="auth-form-v2" onSubmit={handleRequestOtp}>
                  <div className="auth-input-group">
                    <label className="gt-caption" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Email Address</label>
                    <div className="auth-input-container">
                      <Mail className="auth-input-icon" size={18} style={{ color: '#94a3b8', marginLeft: '14px', position: 'absolute', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        className="auth-input"
                        type="email"
                        placeholder="e.g. name@example.com"
                        style={{ paddingLeft: '44px' }}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button type="submit" className="auth-primary-btn" disabled={loading}>
                    {loading ? "Sending Code..." : (
                      <>
                        Get Recovery Code
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form className="auth-form-v2" onSubmit={handleVerifyOtp}>
                  <div className="auth-input-group">
                    <label className="gt-caption" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', textAlign: 'center' }}>Enter 6-Digit Code</label>
                    <div className="auth-input-container">
                      <input
                        className="auth-input"
                        type="text"
                        placeholder="••••••"
                        maxLength="6"
                        style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.25rem', fontWeight: '700' }}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button type="submit" className="auth-primary-btn" disabled={loading}>
                    {loading ? "Verifying..." : (
                      <>
                        Confirm Code
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                  
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                     <button type="button" className="gt-note" style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setStep(1)}>
                        Back to email entry
                     </button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <form className="auth-form-v2" onSubmit={handleResetPassword}>
                  <div className="auth-input-group">
                    <label className="gt-caption" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>New Password</label>
                    <div className="auth-input-container">
                      <Lock className="auth-input-icon" size={18} style={{ color: '#94a3b8', marginLeft: '14px', position: 'absolute', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        className="auth-input"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        style={{ paddingLeft: '44px' }}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        autoFocus
                      />
                      <button 
                        type="button" 
                        className="auth-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label className="gt-caption" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Confirm Password</label>
                    <div className="auth-input-container">
                      <Lock className="auth-input-icon" size={18} style={{ color: '#94a3b8', marginLeft: '14px', position: 'absolute', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        className="auth-input"
                        type={showPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        style={{ paddingLeft: '44px' }}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="auth-primary-btn" disabled={loading}>
                    {loading ? "Updating..." : (
                      <>
                        Save & Sign In
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}

              <p className="auth-footer-prompt" style={{ marginTop: '24px' }}>
                Remember your password?
                <Link to="/login" className="auth-footer-link" style={{ marginLeft: '10px' }}>Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
export default ForgotPasswordPage;
