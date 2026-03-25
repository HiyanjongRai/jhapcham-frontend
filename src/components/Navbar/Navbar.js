import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { 
  ShoppingBag, User, Search, Menu, X, 
  ChevronDown, Phone, Heart, ArrowRight, Bell
} from "lucide-react";
import "./Navbar.css";
import { API_BASE } from "../config/config";
import api from "../../api/axios";
import logo from "../Images/Logo/logo1.png";
import ConfirmModal from "../Common/ConfirmModal.jsx";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("All Categories");
  const [categories, setCategories] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [language, setLanguage] = useState("ENG");
  const [currency, setCurrency] = useState("NPR");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showCurrDropdown, setShowCurrDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const encodedId = localStorage.getItem("userId");
  const role = localStorage.getItem("userRole");
  const isLoggedIn = !!encodedId;

  // Do not show Navbar on Dashboards or dedicated Admin/Seller pages
  const hideOnPaths = ["/admin", "/seller", "/customer", "/update-account", "/notifications"];
  const shouldHide = hideOnPaths.some(path => location.pathname.startsWith(path));

  useEffect(() => {
    if (shouldHide) return; // Don't fetch data if we're hidden anyway
    
    const fetchData = async () => {
      try {
        const res = await api.get("/api/categories");
        if (res.data) setCategories(res.data);
      } catch (e) { console.warn(e); }
    };
    fetchData();

    // Initial cart count
    setCartCount(Number(localStorage.getItem("cartCount")) || 0);

    const handleCartUpdate = () => {
      setCartCount(Number(localStorage.getItem("cartCount")) || 0);
    };
    window.addEventListener("cart-updated", handleCartUpdate);

    // Fetch Notifications if logged in
    const userEmail = localStorage.getItem("userEmail");
    if (isLoggedIn && userEmail) {
      const fetchNotifications = async () => {
        try {
          const res = await api.get(`/api/notifications?username=${userEmail}`);
          const countRes = await api.get(`/api/notifications/unread-count?username=${userEmail}`);
          setNotifications(res.data || []);
          setUnreadNotifCount(countRes.data || 0);
        } catch (e) {
          console.warn("Could not load notifications:", e);
        }
      };
      // Fetch once immediately
      fetchNotifications();
      
      // Setup polling every 30 seconds
      const notifInterval = setInterval(fetchNotifications, 30000);
      return () => {
        window.removeEventListener("cart-updated", handleCartUpdate);
        clearInterval(notifInterval);
      };
    }

    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, [shouldHide, isLoggedIn]);

  // Modified: Instead of hiding completely, we now partially hide parts on dashboards
  const isDashboard = hideOnPaths.some(path => location.pathname.startsWith(path));

  // Still return null for very specific cases if needed, but here we want to show TopBars
  // if (shouldHide) return null; 

  const handleReadNotification = async (id, notif) => {
    try {
      if (!notif.isRead) {
        await api.put(`/api/notifications/${id}/read`);
        setUnreadNotifCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
      
      let targetPath = null;
      if (notif.type === "MESSAGE_RECEIVED") {
        targetPath = `/messages`;
      } else if (notif.type === "ORDER_UPDATE") {
        targetPath = role === "SELLER" ? `/seller/dashboard` : 
                     role === "ADMIN" ? `/admin/dashboard` : `/customer/dashboard`;
      }
      
      if (targetPath) navigate(targetPath);
      setShowNotifDropdown(false);
    } catch (e) {
      console.warn("Failed to mark as read:", e);
    }
  };

  const handleClearNotifications = async (e) => {
    e.stopPropagation();
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) return;
    try {
      await api.delete(`/api/notifications/clear-all?username=${userEmail}`);
      setUnreadNotifCount(0);
      setNotifications([]); 
      setShowNotifDropdown(false);
    } catch (e) {
      console.warn("Failed to clear notifications:", e);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      let url = `/products?search=${encodeURIComponent(searchQuery)}`;
      if (searchCategory !== "All Categories") {
        url += `&category=${encodeURIComponent(searchCategory)}`;
      }
      navigate(url);
    }
  };

  return (
    <header className={"porto-navbar-wrapper" + (isDashboard ? " dashboard-mode" : "")}>
      
      {/* ── TOP UTILITY BAR (Show on Dashboards) ────────────────────────── */}
      <div className="porto-top-bar">
        <div className="porto-container">
          <div className="porto-top-left">
            <span>FREE RETURNS. STANDARD SHIPPING ORDERS NPR 5,000+</span>
          </div>
          <div className="porto-top-right">
            <nav className="porto-top-links">
              <Link to={role === "ADMIN" ? "/admin/dashboard" : "/customer/dashboard"}>My Account</Link>
              <Link to="/about">About Us</Link>
              <Link to="/blog">Blog</Link>
              <Link to="/wishlist">My Wishlist</Link>
              <Link to="/cart">Cart</Link>
              {role === "SELLER" ? (
                <Link to="/seller/dashboard" style={{ color: "var(--porto-primary)", fontWeight: "700" }}>Seller Dashboard</Link>
              ) : role === "ADMIN" ? (
                <Link to="/admin/dashboard" style={{ color: "var(--porto-primary)", fontWeight: "700" }}>Admin Dashboard</Link>
              ) : (
                <Link to="/seller/register">Become a Seller</Link>
              )}
              {isLoggedIn ? (
                <span className="porto-logout-link" onClick={() => setShowLogoutModal(true)}>Log Out</span>
              ) : (
                <Link to="/login">Log In</Link>
              )}
            </nav>
            <div className="porto-top-selectors" onMouseLeave={() => { setShowLangDropdown(false); setShowCurrDropdown(false); }}>
              <div className="porto-selector" onClick={() => setShowLangDropdown(!showLangDropdown)}>
                <img 
                  src={language === "ENG" 
                    ? "https://upload.wikimedia.org/wikipedia/en/a/a4/Flag_of_the_United_States.svg" 
                    : "https://upload.wikimedia.org/wikipedia/commons/9/9b/Flag_of_Nepal.svg"} 
                  alt={language} 
                />
                <span>{language}</span>
                <ChevronDown size={10} />
                {showLangDropdown && (
                  <div className="porto-selector-dropdown">
                    <div onClick={() => { setLanguage("ENG"); setShowLangDropdown(false); }}>ENG</div>
                    <div onClick={() => { setLanguage("NEP"); setShowLangDropdown(false); }}>NEP</div>
                  </div>
                )}
              </div>
              <div className="porto-selector" onClick={() => setShowCurrDropdown(!showCurrDropdown)}>
                <span>{currency}</span>
                <ChevronDown size={10} />
                {showCurrDropdown && (
                  <div className="porto-selector-dropdown">
                    <div onClick={() => { setCurrency("NPR"); setShowCurrDropdown(false); }}>NPR</div>
                    <div onClick={() => { setCurrency("USD"); setShowCurrDropdown(false); }}>USD</div>
                  </div>
                )}
              </div>
            </div>
            <div className="porto-social-links">
              <i className="fab fa-facebook-f"></i>
              <i className="fab fa-twitter"></i>
              <i className="fab fa-instagram"></i>
            </div>
          </div>
        </div>
      </div>

      {/* ── MIDDLE BRANDING BAR (Show on Dashboards) ────────────────────── */}
      <div className="porto-mid-bar">
        <div className="porto-container">
          
          <div className="porto-logo-area" onClick={() => navigate('/')}>
             <img src={logo} alt="Porto Logo" className="porto-logo-img" />
          </div>

          <div className="porto-search-area">
            <form className="porto-search-form" onSubmit={handleSearch}>
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="porto-search-cat" onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}>
                <span>{searchCategory}</span>
                <ChevronDown size={14} />
                {showCategoryDropdown && (
                  <div className="porto-search-cat-dropdown">
                    <div onClick={() => setSearchCategory("All Categories")}>All Categories</div>
                    {categories.map(c => (
                      <div key={c.id} onClick={() => setSearchCategory(c.name)}>{c.name}</div>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="porto-search-btn">
                <Search size={18} />
              </button>
            </form>
          </div>

          <div className="porto-contact-area">
            <div className="porto-contact-icon">
              <Phone size={28} strokeWidth={1} />
            </div>
            <div className="porto-contact-text">
              <span>CALL US NOW</span>
              <strong>+123 5678 890</strong>
            </div>
          </div>

          <div className="porto-actions-area">
            {role !== "SELLER" && role !== "ADMIN" && (
              <button 
                className="porto-action-btn" 
                onClick={() => navigate('/customer/dashboard')}
                title="My Account"
              >
                <User size={26} strokeWidth={1.5} />
              </button>
            )}
            {role === "ADMIN" && (
              <button 
                className="porto-action-btn" 
                onClick={() => navigate('/admin/dashboard')}
                title="Admin Console"
              >
                <User size={26} strokeWidth={1.5} />
              </button>
            )}
            <button className="porto-action-btn" onClick={() => navigate('/wishlist')}>
              <Heart size={26} strokeWidth={1.5} />
            </button>
            <button className="porto-action-btn porto-cart-btn" onClick={() => navigate('/cart')}>
              <ShoppingBag size={26} strokeWidth={1.5} />
              <span className="porto-cart-badge">{cartCount}</span>
            </button>

            {isLoggedIn && !location.pathname.includes('/customer/dashboard') && !location.pathname.includes('/seller') && (
              <div 
                className="porto-action-btn porto-cart-btn" 
                style={{ marginLeft: '10px' }}
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              >
                <Bell size={26} strokeWidth={1.5} />
                {unreadNotifCount > 0 && <span className="porto-cart-badge">{unreadNotifCount}</span>}
                
                {showNotifDropdown && (
                   <div className="porto-notification-dropdown">
                     <div className="porto-notification-header">
                       <span>Notifications</span>
                       {notifications.length > 0 && (
                         <div className="porto-clear-all-btn" onClick={handleClearNotifications}>
                           Clear All
                         </div>
                       )}
                     </div>
                     <div className="porto-notification-list">
                       {notifications.length > 0 ? (
                         notifications.slice(0, 8).map(notif => (
                           <div 
                             key={notif.id} 
                             className={`porto-notification-item ${!notif.isRead ? 'unread' : ''}`}
                             onClick={(e) => { e.stopPropagation(); handleReadNotification(notif.id, notif); }}
                           >
                             <div className="porto-notif-title">{notif.title}</div>
                             <div className="porto-notif-msg">{notif.message}</div>
                             <div className="porto-notif-time">{new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                           </div>
                         ))
                       ) : (
                         <div className="porto-notif-empty">No notifications yet.</div>
                       )}
                     </div>
                   </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── BOTTOM NAVIGATION BAR (Hide on Dashboards) ───────────────────── */}
      {!isDashboard && (
        <div className="porto-nav-bar">
          <div className="porto-container">
            <button className="porto-mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu size={24} />
            </button>

            <nav className={`porto-main-nav ${isMobileMenuOpen ? 'open' : ''}`}>
               <Link to="/" className="active">HOME</Link>
               <div className="porto-nav-item has-dropdown">
                 <Link to="/products">CATEGORIES</Link>
                 <ChevronDown size={10} />
               </div>
               <div className="porto-nav-item has-dropdown">
                 <Link to="/products">PRODUCTS</Link>
                 <ChevronDown size={10} />
               </div>
               <div className="porto-nav-item has-dropdown">
                 <span>PAGES</span>
                 <ChevronDown size={10} />
               </div>
               <Link to="/blog">BLOG</Link>
               <Link to="/elements">ELEMENTS</Link>
               <Link to="/contact">CONTACT US</Link>
            </nav>

            <div className="porto-nav-right">
               <span className="porto-nav-tag">SPECIAL OFFER!</span>
               <Link to="/products" className="porto-buy-link">BUY PORTO!</Link>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          localStorage.clear();
          navigate('/login');
        }}
        title="Sign Out"
        message="Are you sure you want to log out from your account?"
        confirmText="Logout"
        cancelText="Stay Logged In"
        type="danger"
      />
    </header>
  );
};

export default Navbar;
