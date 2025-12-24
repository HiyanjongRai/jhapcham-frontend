import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import { 
  ShoppingBag, 
  User, 
  Search, 
  Menu, 
  X, 
  MessageCircle,
  ChevronDown,
  LogOut,
  Store,
  Bell
} from "lucide-react";
import ConfirmModal from "../Common/ConfirmModal.jsx";
import { API_BASE } from "../config/config";
import { apiGetCart, loadGuestCart } from "../AddCart/cartUtils";
import axios from "../../api/axios";

const navLinks = [
  { label: "Shop", labelKey: "Shop", path: "/" },
  { label: "On Sale", labelKey: "On Sale", path: "/on-sale" },
  { label: "New Arrivals", labelKey: "New Arrivals", path: "/new-arrivals" },
  { label: "Brands", labelKey: "Brands", path: "/brands" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const encodedId = localStorage.getItem("userId");
  const role = localStorage.getItem("userRole");
  const isLoggedIn = !!encodedId;
  const isSeller = role === "SELLER";

  // Load cart count when navbar loads
  useEffect(() => {
    const syncCart = async () => {
      let count = 0;
      if (encodedId) {
         try {
           const userId = atob(encodedId);
           const cartData = await apiGetCart(userId);
           // Legacy DTO has .items array
           if (cartData && Array.isArray(cartData.items)) {
             count = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
           }
         } catch (e) { 
           console.error("Nav sync cart failed", e); 
         }
      } else {
         const cart = loadGuestCart();
         count = cart.reduce((sum, item) => sum + item.quantity, 0);
      }
      
      setCartCount(count);
      localStorage.setItem("cartCount", count);
    };

    syncCart();
  }, [encodedId]);

  // Listen for cart updates from any component
  useEffect(() => {
    const handleUpdate = () => {
      const count = Number(localStorage.getItem("cartCount")) || 0;
      setCartCount(count);
    };

    window.addEventListener("cart-updated", handleUpdate);
    return () => window.removeEventListener("cart-updated", handleUpdate);
  }, []);

  // Load message count (unread only)
  useEffect(() => {
    const loadMessageCount = async () => {
      if (!encodedId) return;

      try {
        const response = await fetch(`${API_BASE}/api/messages/unread-count`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const unreadCount = await response.json();
          setMessageCount(unreadCount);
        }
      } catch (error) {
        console.error("Failed to load message count:", error);
      }
    };

    loadMessageCount();
    
    // Refresh message count every 30 seconds
    const interval = setInterval(loadMessageCount, 30000);
    
    // Listen for manual refresh events (when user reads messages)
    window.addEventListener('messages-updated', loadMessageCount);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('messages-updated', loadMessageCount);
    };
  }, [encodedId]);

  // Load notification count
  useEffect(() => {
    const loadNotificationCount = async () => {
      if (!encodedId) return;
      const username = localStorage.getItem("userEmail"); // Assuming email is stored as userEmail
      if (!username) return;

      try {
        const response = await axios.get(`${API_BASE}/api/notifications/unread-count?username=${username}`);
        setNotificationCount(response.data);
      } catch (error) {
        console.error("Failed to load notification count:", error);
      }
    };

    loadNotificationCount();
    const interval = setInterval(loadNotificationCount, 30000);
    window.addEventListener('notifications-updated', loadNotificationCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-updated', loadNotificationCount);
    };
  }, [encodedId]);

  // Load profile image
  useEffect(() => {
    const loadProfile = async () => {
      if (!encodedId) return;
      try {
        const userId = atob(encodedId);
        const res = await fetch(`${API_BASE}/api/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.email) {
            localStorage.setItem("userEmail", data.email);
          }
          if (data.profileImagePath) {
            setProfileImage(data.profileImagePath.startsWith('http') 
              ? data.profileImagePath 
              : `${API_BASE}/uploads/${data.profileImagePath}`);
          }
        }
      } catch (e) {
        console.error("Failed to load profile for nav", e);
      }
    };
    loadProfile();
    window.addEventListener('profile-updated', loadProfile);
    return () => window.removeEventListener('profile-updated', loadProfile);
  }, [encodedId]);

  const toggleMobileMenu = () => setMobileOpen(!mobileOpen);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const performLogout = () => {
    localStorage.clear();
    navigate("/login");
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <header className="nav">
        {/* LEFT SIDE: Logo & Links */}
        <div className="nav-container">
          <div className="nav-left">
            <div className="nav-logo" onClick={() => navigate("/")}>
              JHAPCHAM
            </div>

            <nav className="nav-desktop-links">
              {navLinks.map((link) => (
                <button
                  key={link.labelKey}
                  className="nav-link"
                  onClick={() => navigate(link.path)}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          {/* CENTER: Search Bar */}
          <div className="nav-center">
            <form className="nav-search-container" onSubmit={(e) => {
                e.preventDefault();
                const val = e.target.querySelector('input').value;
                if(val.trim()) navigate(`/products?search=${encodeURIComponent(val)}`);
            }}>
                <Search className="search-icon" size={18} />
                <input type="text" placeholder="Search for products, brands..." />
                <button type="submit" className="search-submit-btn">Search</button>
            </form>
          </div>

          {/* RIGHT SIDE: Actions */}
          <div className="nav-right">
            {!isLoggedIn ? (
              <>
                {!isSeller && (
                  <button className="nav-icon-btn" onClick={() => navigate("/cart")}>
                    <ShoppingBag size={22} />
                    {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
                  </button>
                )}

                <div className="nav-auth-btns">
                  <button className="nav-btn-text" onClick={() => navigate("/login")}>Login</button>
                  <button className="nav-btn-primary" onClick={() => navigate("/signup")}>Sign Up</button>
                </div>
                
                <button className="nav-seller-link" onClick={() => navigate("/seller/register")}>
                  <Store size={18} />
                  <span>Become Seller</span>
                </button>
              </>
            ) : (
              <div className="nav-logged-in">
                {!isSeller && (
                  <button className="nav-icon-btn" onClick={() => navigate("/cart")}>
                    <ShoppingBag size={22} />
                    {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
                  </button>
                )}

                <button className="nav-icon-btn" onClick={() => navigate("/messages")}>
                  <MessageCircle size={22} />
                  {messageCount > 0 && <span className="nav-badge">{messageCount}</span>}
                </button>

                <button className="nav-icon-btn" onClick={() => navigate("/notifications")} title="Notifications">
                  <Bell size={22} />
                  {notificationCount > 0 && <span className="nav-badge">{notificationCount}</span>}
                </button>

                <div className="nav-user-profile" onClick={() => navigate(`/${role.toLowerCase()}/dashboard`)}>
                   <div className="nav-avatar" style={{ overflow: 'hidden' }}>
                      {profileImage ? (
                        <img src={profileImage} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={18} />
                      )}
                   </div>
                   <span className="nav-role-tag">{role}</span>
                   <ChevronDown size={14} />
                </div>

                <button className="nav-logout-btn" onClick={handleLogout} title="Logout">
                   <LogOut size={20} />
                </button>
              </div>
            )}
            
            <button className="nav-mobile-btn" onClick={toggleMobileMenu}>
              {mobileOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileOpen && (
          <div className="nav-mobile-dropdown">
            <nav className="nav-mobile-links">
              {navLinks.map((link) => (
                <button key={link.labelKey} onClick={() => { navigate(link.path); setMobileOpen(false); }}>
                  {link.label}
                </button>
              ))}
              <hr />
              {!isLoggedIn ? (
                <>
                  <button onClick={() => { navigate("/login"); setMobileOpen(false); }}>Login</button>
                  <button onClick={() => { navigate("/signup"); setMobileOpen(false); }}>Sign Up</button>
                  <button className="mobile-seller-cta" onClick={() => { navigate("/seller/register"); setMobileOpen(false); }}>Become Seller</button>
                </>
              ) : (
                <>
                  <button onClick={() => { navigate(`/${role.toLowerCase()}/dashboard`); setMobileOpen(false); }}>Dashboard</button>
                  <button className="mobile-logout" onClick={handleLogout}>Logout</button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>
      <ConfirmModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={performLogout}
        title="Sign Out"
        message="Are you sure you want to sign out from Jhapcham?"
        confirmText="Sign Out"
        type="danger"
      />
    </>
  );
};

export default Navbar;
