import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faCartArrowDown,
  faList,
} from "@fortawesome/free-solid-svg-icons";
import { MessageCircle } from "lucide-react";
import { API_BASE } from "../config/config";

const navLinks = [
  { label: "Shop", labelKey: "Shop", path: "/" },
  { label: "On Sale", labelKey: "On Sale", path: "/on-sale" },
  { label: "New Arrivals", labelKey: "New Arrivals", path: "/new-arrivals" },
  { label: "Brands", labelKey: "Brands", path: "/brands" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [underlineStyle, setUnderlineStyle] = useState({});
  const [cartCount, setCartCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const linksRef = useRef([]);
  const navigate = useNavigate();

  const encodedId = localStorage.getItem("userId");
  const role = localStorage.getItem("userRole");
  const isLoggedIn = !!encodedId;

  // Load cart count when navbar loads
  useEffect(() => {
    const count = Number(localStorage.getItem("cartCount")) || 0;
    setCartCount(count);
  }, []);

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
        const userId = atob(encodedId);
        const response = await fetch(`${API_BASE}/api/messages/receiver/${userId}`);
        if (response.ok) {
          const messages = await response.json();
          // Count only UNREAD messages (where isRead is false or undefined)
          const unreadCount = messages.filter(msg => !msg.isRead).length;
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

  const toggleMobileMenu = () => setMobileOpen(!mobileOpen);

  const handleMouseEnter = (index) => {
    const link = linksRef.current[index];
    if (!link) return;
    setUnderlineStyle({
      width: `${link.offsetWidth}px`,
      left: `${link.offsetLeft}px`,
      opacity: 1,
    });
  };

  const handleMouseLeave = () =>
    setUnderlineStyle((prev) => ({ ...prev, opacity: 0 }));

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      <header className="nav">
        {/* LEFT SIDE */}
        <div className="nav-left">
          <div className="nav-logo" onClick={() => navigate("/")}>
            JHAPCHAM
          </div>

          <nav className="nav-links" onMouseLeave={handleMouseLeave}>
            {navLinks.map((link, index) => (
              <button
                key={link.labelKey}
                ref={(el) => (linksRef.current[index] = el)}
                className="nav-link"
                onMouseEnter={() => handleMouseEnter(index)}
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </button>
            ))}
            <span className="nav-underline" style={underlineStyle}></span>
          </nav>
        </div>

        {/* RIGHT SIDE */}
        <div className="nav-right">
          {/* NOT LOGGED IN */}
          {!isLoggedIn && (
            <>
              <button className="icon-btn cart-btn" onClick={() => navigate("/cart")}>
                <FontAwesomeIcon icon={faCartArrowDown} />
                {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              </button>

              <button className="seller-btn" onClick={() => navigate("/seller/register")}>
                Become Seller
              </button>

              <button className="logout-btn" onClick={() => navigate("/signup")}>
                Sign Up
              </button>
            </>
          )}

          {/* CUSTOMER */}
          {isLoggedIn && role === "CUSTOMER" && (
            <>
              <button className="icon-btn cart-btn" onClick={() => navigate("/cart")}>
                <FontAwesomeIcon icon={faCartArrowDown} />
                {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              </button>

              <button 
                className="icon-btn cart-btn" 
                onClick={() => navigate("/messages")}
                title="Messages"
              >
                <MessageCircle size={20} />
                {messageCount > 0 && <span className="cart-count">{messageCount}</span>}
              </button>

              <button className="nav-link" onClick={() => navigate("/customer/dashboard")}>
                Dashboard
              </button>
              
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}

          {/* SELLER */}
          {isLoggedIn && role === "SELLER" && (
            <>
              <button 
                className="icon-btn cart-btn" 
                onClick={() => navigate("/messages")}
                title="Messages"
              >
                <MessageCircle size={20} />
                {messageCount > 0 && <span className="cart-count">{messageCount}</span>}
              </button>

              <button className="nav-link" onClick={() => navigate("/seller/dashboard")}>
                Dashboard
              </button>
              
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}

          {/* ADMIN */}
          {isLoggedIn && role === "ADMIN" && (
            <>
              <button className="nav-link" onClick={() => navigate("/admin/dashboard")}>
                Dashboard
              </button>
              
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>
    </>
  );
};

export default Navbar;
