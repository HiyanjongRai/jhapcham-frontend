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
  Bell,
  Truck,
  ShieldCheck,
  Zap,
  Globe,
  ArrowRight
} from "lucide-react";
import ConfirmModal from "../Common/ConfirmModal.jsx";
import { API_BASE } from "../config/config";
import { apiGetCart, loadGuestCart } from "../AddCart/cartUtils";
import axios from "../../api/axios";
import logo from "../Images/Logo/logo1.png";

const navLinks = [
  { label: "Shop", labelKey: "Shop", path: "/", hasMegaMenu: true },
  { label: "On Sale", labelKey: "On Sale", path: "/on-sale" },
  { label: "New Arrivals", labelKey: "New Arrivals", path: "/new-arrivals" },
  { label: "Brands", labelKey: "Brands", path: "/brands" },
  { label: "Campaigns", labelKey: "Campaigns", path: "/campaigns" },
];

const Navbar = ({ onOpenCart }) => {

  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [navCampaigns, setNavCampaigns] = useState([]);

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

  // Load Categories and Brands for Mega Menu
  useEffect(() => {
    const fetchMegaMenuData = async () => {
      // Categories
      try {
        const catRes = await axios.get("/api/categories");
        if (catRes.data) setCategories(catRes.data);
      } catch (err) {
        console.warn("Categories fetch failed", err);
      }

      // Brands (derived from products)
      try {
        const prodRes = await axios.get("/api/products");
        if (prodRes.data && Array.isArray(prodRes.data)) {
          const uniqueBrands = [...new Set(prodRes.data.map(p => p.brand).filter(Boolean))];
          setBrands(uniqueBrands.sort());
        }
      } catch (err) {
        console.warn("Brands derivation failed", err);
      }

      // Brands (derived from products)
      try {
        const prodRes = await axios.get("/api/products");
        if (prodRes.data && Array.isArray(prodRes.data)) {
          const uniqueBrands = [...new Set(prodRes.data.map(p => p.brand).filter(Boolean))];
          setBrands(uniqueBrands.sort());
        }
      } catch (err) {
        console.warn("Brands derivation failed", err);
      }
    };
    fetchMegaMenuData();
  }, []);

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

  // Search Suggestions Logic
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(`/api/products?search=${encodeURIComponent(searchQuery)}`);
        setSuggestions(res.data.slice(0, 6)); // limit to 6
      } catch (err) {
        console.error("Suggestions fetch failed", err);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);


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
      {/* Top Announcement Bar - Infinity Scroll */}
      <div className="top-announcement-bar">
        <div className="scroll-container">
          <div className="scroll-item">
            <Truck size={14} className="scroll-icon" />
            <span>Free delivery on orders over <span className="highlight">Rs. 5000</span></span>
          </div>
          <div className="scroll-item">
            <Zap size={14} className="scroll-icon" />
            <span>Flash Sale: Up to <span className="highlight">50% Off</span> on electronics</span>
          </div>
          <div className="scroll-item">
            <ShieldCheck size={14} className="scroll-icon" />
            <span>100% Genuine Products & Secure Payments</span>
          </div>
          <div className="scroll-item">
            <Globe size={14} className="scroll-icon" />
            <span>Fast Shipping across Nepal</span>
          </div>
          <div className="scroll-item">
            <Zap size={14} className="scroll-icon" />
            <span>New Arrivals: Check out the Summer Collection</span>
          </div>
          <div className="scroll-item">
            <Truck size={14} className="scroll-icon" />
            <span>Easy 7-day returns on all items</span>
          </div>
          <div className="scroll-item">
            <Zap size={14} className="scroll-icon" />
            <span>Exclusive Deals for Mobile App Users</span>
          </div>
          <div className="scroll-item">
            <ShieldCheck size={14} className="scroll-icon" />
            <span>Verified Seller Network - Buy with Confidence</span>
          </div>
        </div>
      </div>

      <header className="nav">
        {/* LEFT SIDE: Logo & Links */}
        <div className="nav-container">
          <div className="nav-left">
            <div className="nav-logo-wrapper" onClick={() => navigate("/")}>
              <img src={logo} alt="Jhapcham Logo" className="nav-logo-img" />
            </div>

            <nav className="nav-desktop-links">
              {navLinks.map((link) => (
                <div 
                  key={link.labelKey} 
                  className="nav-link-wrapper"
                  onMouseEnter={() => link.hasMegaMenu && setActiveMegaMenu(link.labelKey)}
                  onMouseLeave={() => setActiveMegaMenu(null)}
                >
                  <button
                    className={`nav-link ${link.hasMegaMenu ? 'has-dropdown' : ''}`}
                    onClick={() => navigate(link.path)}
                  >
                    {link.label}
                    {link.hasMegaMenu && <ChevronDown size={12} className="nav-chevron" />}
                  </button>

                  {link.hasMegaMenu && activeMegaMenu === link.labelKey && (
                    <div className="mega-menu-dropdown">
                      <div className="mega-menu-container">
                        {link.labelKey === "Shop" ? (
                          <>
                            <div className="mega-menu-sidebar">
                              <h3>SHOP BY CATEGORIES</h3>
                              <ul>
                                {categories.length > 0 ? (
                                    categories.slice(0, 8).map(cat => (
                                        <li key={cat.id} onClick={() => { 
                                          if (cat?.name) {
                                            navigate(`/products?category=${encodeURIComponent(cat.name)}`); 
                                            setActiveMegaMenu(null); 
                                          }
                                        }}>
                                            {cat?.name?.toUpperCase() || "CATEGORY"}
                                        </li>
                                    ))
                                ) : (
                                    <li>Loading...</li>
                                )}
                              </ul>
                              <button className="all-sneakers-btn" onClick={() => { navigate('/products'); setActiveMegaMenu(null); }}>
                                ALL PRODUCTS <ArrowRight size={16} />
                              </button>
                            </div>

                            <div className="mega-menu-content">
                              <div className="mega-menu-section-header">
                                <h3>SHOP BY BRANDS</h3>
                              </div>
                              
                              <div className="mega-menu-grid">
                                {brands.length > 0 ? (
                                    brands.slice(0, 10).map(brand => (
                                        <div className="mega-menu-column" key={brand}>
                                          <h4 className="column-title clickable" onClick={() => { 
                                            if (brand) {
                                              navigate(`/products?brand=${encodeURIComponent(brand)}`); 
                                              setActiveMegaMenu(null); 
                                            }
                                          }}>
                                            {brand && brand.toUpperCase()}
                                          </h4>
                                        </div>
                                    ))
                                ) : (
                                    <div className="mega-menu-column">
                                      <h4 className="column-title">Loading brands...</h4>
                                    </div>
                                )}
                              </div>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* CENTER: Search Bar */}
          <div className="nav-center">
            <form className="nav-search-container" onSubmit={(e) => {
                e.preventDefault();
                if(searchQuery.trim()) {
                  navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
                  setShowSuggestions(false);
                }
            }}>
                <Search className="search-icon" size={16} />
                <input 
                  type="text" 
                  placeholder="Search for products, brands..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                <button type="submit" className="search-submit-btn">Search</button>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="search-suggestions-dropdown">
                    {suggestions.map((item) => (
                      <div 
                        key={item.id} 
                        className="suggestion-item"
                        onClick={() => {
                          navigate(`/products/${item.id}`);
                          setSearchQuery("");
                          setShowSuggestions(false);
                        }}
                      >
                        <div className="suggestion-img">
                          <img src={`${API_BASE}/${item.imagePath || (item.imagePaths && item.imagePaths[0])}`} alt="" />
                        </div>
                        <div className="suggestion-info">
                          <span className="suggestion-name">{item.name}</span>
                          <span className="suggestion-price">Rs. {Number(item.salePrice || item.price).toLocaleString()}</span>
                        </div>
                        <ChevronDown size={14} className="suggestion-arrow" />
                      </div>
                    ))}
                    <div className="suggestion-footer" onClick={() => navigate(`/products?search=${encodeURIComponent(searchQuery)}`)}>
                      View all results for "{searchQuery}"
                    </div>
                  </div>
                )}
            </form>
          </div>


          {/* RIGHT SIDE: Actions */}
          <div className="nav-right">
            {!isLoggedIn ? (
              <>
                {!isSeller && (
                  <button className="nav-icon-btn" onClick={() => navigate("/cart")}>
                    <ShoppingBag size={20} />
                    {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
                  </button>

                )}

                <div className="nav-auth-btns">
                  <button className="nav-btn-text" onClick={() => navigate("/login")}>Login</button>
                  <button className="nav-btn-primary" onClick={() => navigate("/signup")}>Sign Up</button>
                </div>
                
                  <button className="nav-seller-link" onClick={() => navigate("/seller/register")}>
                  <Store size={16} />
                  <span>Become Seller</span>
                </button>
              </>
            ) : (
              <div className="nav-logged-in">
                {!isSeller && (
                  <button className="nav-icon-btn" onClick={() => navigate("/cart")}>
                    <ShoppingBag size={20} />
                    {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
                  </button>

                )}

                <button className="nav-icon-btn" onClick={() => navigate("/messages")}>
                  <MessageCircle size={20} />
                  {messageCount > 0 && <span className="nav-badge">{messageCount}</span>}
                </button>

                <button className="nav-icon-btn" onClick={() => navigate("/notifications")} title="Notifications">
                  <Bell size={20} />
                  {notificationCount > 0 && <span className="nav-badge">{notificationCount}</span>}
                </button>

                <div className="nav-user-profile" onClick={() => navigate(`/${role.toLowerCase()}/dashboard`)}>
                   <div className="nav-avatar" style={{ overflow: 'hidden' }}>
                      {profileImage ? (
                        <img src={profileImage} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={16} />
                      )}
                   </div>
                   <span className="nav-role-tag">{role}</span>
                   <ChevronDown size={12} />
                </div>

                <button className="nav-logout-btn" onClick={handleLogout} title="Logout">
                   <LogOut size={18} />
                </button>
              </div>
            )}
            
            <button className="nav-mobile-btn" onClick={toggleMobileMenu}>
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileOpen && (
          <div className="nav-mobile-dropdown">
            <div className="mobile-search-wrapper">
              <form onSubmit={(e) => {
                  e.preventDefault();
                  if(searchQuery.trim()) {
                    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
                    setMobileOpen(false);
                    setSearchQuery("");
                  }
              }}>
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="mobile-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} 
                />
              </form>
            </div>
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
                  <button onClick={() => { navigate(`/${(role || 'customer').toLowerCase()}/dashboard`); setMobileOpen(false); }}>Dashboard</button>
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
