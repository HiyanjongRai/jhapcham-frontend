import React, { useEffect, useState } from "react";
import "./CustomerDashboard.css";
import { API_BASE } from "../config/config";
import { getCurrentUserId } from "../AddCart/cartUtils";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  Star,
  Settings,
  LogOut,
  User,
  Package,
  Clock,
  XCircle
} from "lucide-react";

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [userProfile, setUserProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = getCurrentUserId();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Parallel fetch for better performance
      const [profileRes, ordersRes, wishlistRes, reviewsRes] = await Promise.all([
        fetch(`${API_BASE}/users/profile/${userId}`),
        fetch(`${API_BASE}/orders/user/${userId}`), // FIXED: Use correct orders endpoint
        fetch(`${API_BASE}/wishlist?userId=${userId}`),
        fetch(`${API_BASE}/api/reviews/user/${userId}`)
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserProfile(profileData);
      }
      
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        console.log('Orders Data:', ordersData);
        
        // Deduplicate orders by orderId
        const uniqueOrdersMap = new Map();
        ordersData.forEach(order => {
          if (!uniqueOrdersMap.has(order.orderId)) {
            uniqueOrdersMap.set(order.orderId, order);
          }
        });
        const uniqueOrders = Array.from(uniqueOrdersMap.values());
        
        // Check if reviewsRes is ok and map reviews to orders
        let reviewsMap = {};
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          console.log('Reviews Data:', reviewsData);
          // Map orderId -> review
          reviewsData.forEach(r => {
            if (r.order && r.order.id) {
              reviewsMap[r.order.id] = r;
            } else if (r.orderId) {
               reviewsMap[r.orderId] = r;
            }
          });
        }
        
        // Attach review data to orders if possible, or store separately
        const ordersWithReviews = uniqueOrders.map(order => ({
          ...order,
          review: reviewsMap[order.orderId] || null
        }));
        
        console.log('Final Orders with Reviews:', ordersWithReviews);
        setOrders(ordersWithReviews);
      } else {
        console.error('Orders API failed');
      }
      
      if (wishlistRes.ok) {
        const wishlistData = await wishlistRes.json();
        setWishlist(wishlistData);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/cancel?userId=${userId}&role=CUSTOMER`, {
        method: "PUT",
      });

      if (res.ok) {
        alert("Order cancelled successfully");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("An error occurred");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) return <div className="cd-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab user={userProfile} orders={orders} wishlist={wishlist} onCancelOrder={handleCancelOrder} />;
      case "orders":
        return <OrdersTab orders={orders} onCancelOrder={handleCancelOrder} />;
      case "wishlist":
        return <WishlistTab wishlist={wishlist} navigate={navigate} />;
      case "reviews":
        return <ReviewsTab orders={orders} navigate={navigate} />;
      case "settings":
        return <SettingsTab user={userProfile} navigate={navigate} />;
      default:
        return <OverviewTab user={userProfile} orders={orders} wishlist={wishlist} onCancelOrder={handleCancelOrder} />;
    }
  };

  return (
    <div className="cd-layout">
      {/* Sidebar */}
      <aside className="cd-sidebar">
        <div className="cd-profile-summary">
          <img
            src={userProfile?.profileImagePath ? `${API_BASE}/uploads/customer-profile/${userProfile.profileImagePath}` : "https://via.placeholder.com/150"}
            alt="Profile"
            className="cd-avatar"
          />
          <div className="cd-user-name">{userProfile?.firstName} {userProfile?.lastName}</div>
          <div className="cd-user-email">{userProfile?.email}</div>
        </div>

        <nav className="cd-nav">
          <button
            className={`cd-nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <LayoutDashboard size={20} /> Overview
          </button>
          <button
            className={`cd-nav-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <ShoppingBag size={20} /> My Orders
          </button>
          <button
            className={`cd-nav-item ${activeTab === "wishlist" ? "active" : ""}`}
            onClick={() => setActiveTab("wishlist")}
          >
            <Heart size={20} /> Wishlist
          </button>
          <button
            className={`cd-nav-item ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            <Star size={20} /> Reviews
          </button>
          <button
            className={`cd-nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={20} /> Settings
          </button>
        </nav>

        <div className="cd-logout">
          <button className="cd-logout-btn" onClick={handleLogout}>
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="cd-main">
        {renderContent()}
      </main>
    </div>
  );
}

// Sub-components for cleaner code

const OrderItemsList = ({ items }) => (
  <div style={{ padding: '1.5rem', background: '#fafafa' }}>
    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Items</h4>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {items.map((item, index) => (
        <div key={index} style={{ display: 'flex', gap: '1rem', background: 'white', padding: '1rem', borderRadius: '8px', alignItems: 'center' }}>
          <img 
            src={item.productImage ? `${API_BASE}/product-images/${item.productImage}` : `${API_BASE}/product-images/${item.productImage}`}
            alt={item.productName || 'Product'}
            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', background: '#f5f5f5' }}
          />
          <div style={{ flex: 1 }}>
            <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: '600', color: '#000' }}>
              {item.productName || 'Product Name'}
            </h5>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
               {item.selectedColor && (
                 <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                   <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.selectedColor, border: '1px solid #ddd' }}></span>
                   {item.selectedColor}
                 </span>
               )}
               {item.selectedStorage && <span>{item.selectedStorage}</span>}
            </div>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#666' }}>
              Quantity: <strong>{item.quantity}</strong>
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#000' }}>
              ${(item.price || 0).toFixed(2)} × {item.quantity} = ${((item.price || 0) * item.quantity).toFixed(2)}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const OverviewTab = ({ user, orders, wishlist, onCancelOrder }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);
  const pendingOrders = orders.filter(o => o.stage !== "DELIVERED" && o.stage !== "CANCELLED").length;
  const completedOrders = orders.filter(o => (o.stage || "").toUpperCase() === "DELIVERED").length;

  const toggleOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="fade-in">
      <div className="cd-header">
        <h1 className="cd-welcome">Welcome back, {user?.firstName}!</h1>
        <p className="cd-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="cd-stats-grid">
        <div className="cd-stat-card">
          <div className="cd-stat-icon"><ShoppingBag /></div>
          <div className="cd-stat-info">
            <h3>{orders.length}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="cd-stat-card">
          <div className="cd-stat-icon"><Clock /></div>
          <div className="cd-stat-info">
            <h3>{pendingOrders}</h3>
            <p>Pending Orders</p>
          </div>
        </div>
        <div className="cd-stat-card">
          <div className="cd-stat-icon"><Heart /></div>
          <div className="cd-stat-info">
            <h3>{wishlist.length}</h3>
            <p>Wishlist Items</p>
          </div>
        </div>
      </div>

      <div className="cd-section-title">Recent Orders</div>
      <div className="cd-card">
        {orders.slice(0, 5).map(order => (
          <div key={order.orderId} style={{ marginBottom: '1rem', border: '1px solid #f0f0f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div 
              className="cd-order-item" 
              onClick={() => toggleOrder(order.orderId)}
              style={{ cursor: 'pointer', margin: 0, borderBottom: expandedOrder === order.orderId ? '1px solid #f0f0f0' : 'none' }}
            >
              {/* Product Image */}
              {order.items && order.items.length > 0 && (
                <img 
                  src={order.items[0].imagePath ? `${API_BASE}/product-images/${order.items[0].imagePath}` : `${API_BASE}/product-images/${order.items[0].imagePath}`}
                  alt={order.items[0].productName}
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', marginRight: '1rem' }}
                />
              )}
              
              <div style={{ flex: 1 }}>
                <div className="cd-order-id">
                  {order.items && order.items.length > 0 
                    ? order.items.map(i => i.productName).join(", ") 
                    : `Order #${order.orderId}`}
                </div>
                <div className="cd-order-date">
                  {order.orderDate || order.createdAt 
                    ? new Date(order.orderDate || order.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })
                    : 'Date not available'
                  }
                </div>
                {order.items && <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.35rem' }}>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</div>}
              </div>
              <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                ${(order.totalAmount || order.totalPrice || 0).toFixed(2)}
              </div>
              {/* Cancel Button */}
              {((order.status === 'PENDING' || order.status === 'PROCESSING') || (order.stage === 'PENDING' || order.stage === 'PROCESSING')) && (
                 <button 
                   onClick={(e) => { e.stopPropagation(); onCancelOrder(order.orderId); }}
                   className="cd-cancel-btn"
                   title="Cancel Order"
                   style={{ marginRight: '1rem', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                 >
                   <XCircle size={20} />
                 </button>
              )}
              <span className={`cd-status-badge status-${order.stage?.toLowerCase() || order.status?.toLowerCase()}`}>
                {order.stage || order.status || 'PENDING'}
              </span>
              <Package size={20} style={{ marginLeft: '1rem', color: '#999', transform: expandedOrder === order.orderId ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
            </div>
            
            {/* Product Details */}
            {expandedOrder === order.orderId && order.items && order.items.length > 0 && (
              <OrderItemsList items={order.items} />
            )}
          </div>
        ))}
        {orders.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>No recent orders.</p>}
      </div>
    </div>
  );
};

const OrdersTab = ({ orders, onCancelOrder }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);

  const toggleOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="fade-in">
      <div className="cd-header">
        <h1 className="cd-welcome">My Orders</h1>
        <p className="cd-date">{orders.length} total {orders.length === 1 ? 'order' : 'orders'}</p>
      </div>
      <div className="cd-card">
        {orders.map(order => (
          <div key={order.orderId} style={{ marginBottom: '1rem', border: '1px solid #f0f0f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div 
              className="cd-order-item"
              onClick={() => toggleOrder(order.orderId)}
              style={{ cursor: 'pointer', margin: 0, borderBottom: expandedOrder === order.orderId ? '1px solid #f0f0f0' : 'none' }}
            >
              {/* Product Image */}
              {order.items && order.items.length > 0 && (
                <img 
                  src={order.items[0].imagePath ? `${API_BASE}/product-images/${order.items[0].imagePath}` : `${API_BASE}/product-images/${order.items[0].imagePath}`}
                  alt={order.items[0].productName}
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', marginRight: '1rem' }}
                />
              )}
              
              <div style={{ flex: 1 }}>
                <div className="cd-order-id">
                  {order.items && order.items.length > 0 
                    ? order.items.map(i => i.productName).join(", ") 
                    : `Order #${order.orderId}`}
                </div>
                <div className="cd-order-date">
                  {order.orderDate || order.createdAt 
                    ? new Date(order.orderDate || order.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Date not available'
                  }
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                  {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                </div>
              </div>
              <div style={{ textAlign: 'right', marginRight: '2rem' }}>
                <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>${(order.totalAmount || order.totalPrice || 0).toFixed(2)}</div>
              </div>
              
              {/* Cancel Button */}
              {((order.status === 'PENDING' || order.status === 'PROCESSING') || (order.stage === 'PENDING' || order.stage === 'PROCESSING')) && (
                 <button 
                   onClick={(e) => { e.stopPropagation(); onCancelOrder(order.orderId); }}
                   className="cd-cancel-btn"
                   title="Cancel Order"
                   style={{ marginRight: '1rem', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                 >
                   <XCircle size={20} />
                 </button>
              )}
              <span className={`cd-status-badge status-${order.stage?.toLowerCase() || order.status?.toLowerCase()}`}>
                {order.stage || order.status || 'PENDING'}
              </span>
              <Package size={20} style={{ marginLeft: '1rem', color: '#999', transform: expandedOrder === order.orderId ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
            </div>

            {/* Product Details */}
            {expandedOrder === order.orderId && order.items && order.items.length > 0 && (
              <OrderItemsList items={order.items} />
            )}
          </div>
        ))}
        {orders.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>You haven't placed any orders yet.</p>}
      </div>
    </div>
  );
};

const WishlistTab = ({ wishlist, navigate }) => (
  <div className="fade-in">
    <div className="cd-header">
      <h1 className="cd-welcome">My Wishlist</h1>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
      {wishlist.map(item => (
        <div key={item.id} className="cd-card" style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => navigate(`/products/${item.productId}`)}>
          <img
            src={`${API_BASE}/product-images/${item.imagePath}`}
            alt={item.productName}
            style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
          />
          <h4 style={{ margin: '0 0 0.5rem 0' }}>{item.productName}</h4>
          <p style={{ margin: 0, fontWeight: '600' }}>${item.price}</p>
        </div>
      ))}
    </div>
    {wishlist.length === 0 && <p>Your wishlist is empty.</p>}
  </div>
);



const ReviewsTab = ({ orders, navigate }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);
  
  // Check both 'stage' and 'status' fields for DELIVERED orders
  const deliveredOrders = orders.filter(o => {
    const stage = (o.stage || "").toUpperCase();
    const status = (o.status || "").toUpperCase();
    return stage === "DELIVERED" || status === "DELIVERED";
  });
  
  console.log('All Orders:', orders);
  console.log('Delivered Orders:', deliveredOrders);

  const handleReview = (orderId, existingReview, e) => {
    e.stopPropagation();
    localStorage.setItem("reviewOrderId", orderId);
    
    if (existingReview) {
      localStorage.setItem("reviewMode", "edit");
      localStorage.setItem("reviewData", JSON.stringify(existingReview));
    } else {
      localStorage.setItem("reviewMode", "create");
      localStorage.removeItem("reviewData");
    }
    
    navigate("/review");
  };

  const toggleOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="fade-in">
      <div className="cd-header">
        <h1 className="cd-welcome">My Reviews</h1>
        <p className="cd-date">Share your experience with your purchased products.</p>
      </div>
      <div className="cd-card">
        {deliveredOrders.map(order => (
          <div key={order.orderId} style={{ marginBottom: '1rem', border: '1px solid #f0f0f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div 
              className="cd-order-item"
              onClick={() => toggleOrder(order.orderId)}
              style={{ cursor: 'pointer', margin: 0, borderBottom: expandedOrder === order.orderId ? '1px solid #f0f0f0' : 'none' }}
            >
              {/* Product Image */}
              {order.items && order.items.length > 0 && (
                <img 
                  src={order.items[0].imagePath ? `${API_BASE}/product-images/${order.items[0].imagePath}` : 'https://via.placeholder.com/60'}
                  alt={order.items[0].productName}
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', marginRight: '1rem' }}
                />
              )}
              
              <div style={{ flex: 1 }}>
                <div className="cd-order-id">
                  {order.items && order.items.length > 0 
                    ? order.items.map(i => i.productName).join(", ") 
                    : `Order #${order.orderId}`}
                </div>
                <div className="cd-order-date">
                  Delivered on {order.updateTime || order.orderDate || order.createdAt
                    ? new Date(order.updateTime || order.orderDate || order.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })
                    : 'Date not available'
                  }
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                  {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {order.review ? (
                  <button
                    className="btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', border: '1px solid #000', borderRadius: '8px', color: '#000', cursor: 'pointer' }}
                    onClick={(e) => handleReview(order.orderId, order.review, e)}
                  >
                    <Star size={16} fill="#000" /> Edit Review
                  </button>
                ) : (
                  <button
                    className="btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#000', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                    onClick={(e) => handleReview(order.orderId, null, e)}
                  >
                    <Star size={16} /> Write Review
                  </button>
                )}
                <Package size={20} style={{ color: '#999', transform: expandedOrder === order.orderId ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
              </div>
            </div>

            {/* Product Details */}
            {expandedOrder === order.orderId && order.items && order.items.length > 0 && (
              <OrderItemsList items={order.items} />
            )}
          </div>
        ))}
        {deliveredOrders.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>No delivered orders to review yet.</p>}
      </div>
    </div>
  );
};

const SettingsTab = ({ user, navigate }) => (
  <div className="fade-in">
    <div className="cd-header">
      <h1 className="cd-welcome">Account Settings</h1>
    </div>
    <div className="cd-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
        <img
          src={user?.profileImagePath ? `${API_BASE}/uploads/customer-profile/${user.profileImagePath}` : "https://via.placeholder.com/150"}
          alt="Profile"
          style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <div>
          <h3 style={{ margin: 0 }}>{user?.firstName} {user?.lastName}</h3>
          <p style={{ margin: '0.5rem 0', color: '#666' }}>{user?.email}</p>
          <button
            className="btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            onClick={() => navigate("/update-account")}
          >
            Edit Profile
          </button>
        </div>
      </div>

      <div className="cd-section-title">Personal Information</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', color: '#666', marginBottom: '0.25rem' }}>First Name</label>
          <div style={{ fontWeight: '500' }}>{user?.firstName}</div>
        </div>
        <div>
          <label style={{ display: 'block', color: '#666', marginBottom: '0.25rem' }}>Last Name</label>
          <div style={{ fontWeight: '500' }}>{user?.lastName}</div>
        </div>
        <div>
          <label style={{ display: 'block', color: '#666', marginBottom: '0.25rem' }}>Email</label>
          <div style={{ fontWeight: '500' }}>{user?.email}</div>
        </div>
        <div>
          <label style={{ display: 'block', color: '#666', marginBottom: '0.25rem' }}>Phone</label>
          <div style={{ fontWeight: '500' }}>{user?.phone || "N/A"}</div>
        </div>
      </div>
    </div>
  </div>
);
