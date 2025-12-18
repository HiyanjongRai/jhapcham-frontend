import React, { useState, useEffect } from "react";
import "./CustomerDashboard.css";
import { API_BASE } from "../config/config";
import { getCurrentUserId, apiGetOrdersForUser, apiCustomerCancelOrder } from "../AddCart/cartUtils";
import { apiGetWishlist, apiRemoveFromWishlist } from "../WishlistPage/wishlistUtils";
import api from "../../api/axios";
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
  XCircle,
  Trash2
} from "lucide-react";
import UpdateAccount from "../Profile/UpdateAccount.jsx";

export default function CustomerDashboard() {
  // Dashboard Component
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
    setLoading(true);
    
    // 1. Fetch User Profile
    try {
      const profileRes = await api.get(`/api/users/${userId}`);
      setUserProfile(profileRes.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }

    // 2. Fetch Orders
    try {
      const ordersData = await apiGetOrdersForUser(userId);
      setOrders(ordersData || []);
    } catch (err) {
      console.error("Orders API failed:", err);
      setOrders([]);
    }
    
    // 3. Fetch Wishlist
    try {
      console.log("Fetching wishlist for userId:", userId);
      const wishlistData = await apiGetWishlist(userId);
      console.log("Wishlist data received raw:", wishlistData);
      
      // Map DTO to dashboard format
      const mappedWishlist = Array.isArray(wishlistData) ? wishlistData.map(item => ({
          ...item,
          productId: item.id || item.productId,
          productName: item.name || item.productName,
          imagePath: item.imagePaths && item.imagePaths.length > 0 ? item.imagePaths[0] : (item.imagePath || "")
      })) : [];
      
      console.log("Mapped wishlist:", mappedWishlist);
      setWishlist(mappedWishlist);
    } catch (err) {
      console.error("Wishlist API failed:", err);
      setWishlist([]);
    }

    // 4. Fetch Reviews (Optionally, don't let it block)
    try {
      await api.get(`/api/reviews/user/${userId}`);
    } catch (err) {
      console.warn("Reviews API failed (this is normal if user has no reviews):", err);
    }

    setLoading(false);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      await apiCustomerCancelOrder(userId, orderId);
      alert("Order cancelled successfully");
      fetchData();
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert(error.message || "An error occurred");
    }
  };

  const handleRemoveWishlist = async (productId) => {
    if(!window.confirm("Remove item from wishlist?")) return;
    try {
        await apiRemoveFromWishlist(userId, productId);
        setWishlist(prev => prev.filter(item => item.productId !== productId));
    } catch(err) {
        alert("Failed to remove item");
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
        return <WishlistTab wishlist={wishlist} navigate={navigate} onRemove={handleRemoveWishlist} />;
      case "reviews":
        return <ReviewsTab orders={orders} navigate={navigate} />;
      case "settings":
        return <UpdateAccount onUpdateSuccess={(updatedData) => setUserProfile({...userProfile, ...updatedData})} />;
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
            src={
              userProfile?.profileImagePath 
                ? (userProfile.profileImagePath.startsWith('http') 
                    ? userProfile.profileImagePath 
                    : `${API_BASE}/uploads/${userProfile.profileImagePath}`)
                : "https://via.placeholder.com/150"
            }
            alt="Profile"
            className="cd-avatar"
          />
          <div className="cd-user-name">{userProfile?.fullName || "User"}</div>
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

const WishlistTab = ({ wishlist, navigate, onRemove }) => (
  <div className="fade-in">
    <div className="cd-header">
      <h1 className="cd-welcome">My Wishlist</h1>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
      {wishlist.map(item => (
        <div key={item.productId} className="cd-card" style={{ padding: '0', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'relative', height: '220px'}}>
             <img
                src={item.imagePath ? (item.imagePath.startsWith('http') ? item.imagePath : `${API_BASE}/${item.imagePath}`) : "https://via.placeholder.com/220"}
                alt={item.productName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onClick={() => navigate(`/products/${item.productId}`)}
             />
             <button 
                onClick={(e) => { e.stopPropagation(); onRemove(item.productId); }}
                style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'white', borderRadius: '50%',
                    width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #eee', cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
                title="Remove from Wishlist"
             >
                <Trash2 size={18} color="#ef4444" />
             </button>
          </div>
          <div style={{ padding: '1rem' }} onClick={() => navigate(`/products/${item.productId}`)}>
             <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.productName}</h4>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem', color: '#1a1a1a' }}>${item.price}</p>
                <button 
                  style={{ 
                      background: '#1a1a1a', color: 'white', border: 'none', 
                      borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' 
                  }}
                >
                    View
                </button>
             </div>
          </div>
        </div>
      ))}
    </div>
    {wishlist.length === 0 && <p style={{color: '#666', marginTop: '2rem'}}>Your wishlist is empty.</p>}
  </div>
);

const OrderItemsList = ({ items }) => (
  <div style={{ padding: '1.5rem', background: '#fafafa' }}>
    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Items</h4>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {items.map((item, index) => (
        <div key={index} style={{ display: 'flex', gap: '1rem', background: 'white', padding: '1rem', borderRadius: '8px', alignItems: 'center' }}>
          <img 
            src={item.imagePath ? (item.imagePath.startsWith('http') ? item.imagePath : `${API_BASE}/${item.imagePath}`) : "https://via.placeholder.com/80"}
            alt={item.name || item.productName || 'Product'}
            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', background: '#f5f5f5' }}
          />
          <div style={{ flex: 1 }}>
            <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: '600', color: '#000' }}>
              {item.name || item.productName || 'Product Name'}
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
              ${(item.unitPrice || 0).toFixed(2)} × {item.quantity} = ${((item.unitPrice || 0) * item.quantity).toFixed(2)}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const PriceBreakdown = ({ order }) => (
  <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
          <span>Subtotal</span>
          <span>${(order.itemsTotal || 0).toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
          <span>Shipping Fee</span>
          <span>${(order.shippingFee || 0).toFixed(2)}</span>
      </div>
      {order.discountTotal > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'green' }}>
            <span>Discount</span>
            <span>- ${(order.discountTotal || 0).toFixed(2)}</span>
        </div>
      )}
      <div style={{ borderTop: '1px solid #eee', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem' }}>
          <span>Grand Total</span>
          <span>${(order.grandTotal || 0).toFixed(2)}</span>
      </div>
  </div>
);

const OverviewTab = ({ user, orders, wishlist, onCancelOrder }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);
  const pendingOrders = orders.filter(o => o.stage !== "DELIVERED" && o.stage !== "CANCELLED").length;

  const toggleOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="fade-in">
      <div className="cd-header">
        <h1 className="cd-welcome">Welcome back, {user?.fullName?.split(' ')[0] || "User"}!</h1>
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
        {orders.slice(0, 5).map(order => {
          const oid = order.id || order.orderId;
          return (
          <div key={oid} style={{ marginBottom: '1rem', border: '1px solid #f0f0f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div 
              className="cd-order-item" 
              onClick={() => toggleOrder(oid)}
              style={{ cursor: 'pointer', margin: 0, borderBottom: expandedOrder === oid ? '1px solid #f0f0f0' : 'none' }}
            >
              {/* Product Image */}
              {order.items && order.items.length > 0 && (
                <img 
                  src={(order.items[0].imagePath || order.items[0].imagePathSnapshot)
                        ? `${API_BASE}/${order.items[0].imagePath || order.items[0].imagePathSnapshot}` 
                        : "https://via.placeholder.com/60"}
                  alt={order.items[0].name || order.items[0].productName || "Product"}
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', marginRight: '1rem' }}
                />
              )}
              
              <div style={{ flex: 1 }}>
                <div className="cd-order-id">
                  {order.items && order.items.length > 0 
                    ? order.items.map(i => i.name || i.productName || i.productNameSnapshot).join(", ") 
                    : `Order #${oid}`}
                </div>
                <div className="cd-order-date">
                  {order.createdAt || order.orderDate
                    ? new Date(order.createdAt || order.orderDate).toLocaleDateString('en-US', { 
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
                ${(order.grandTotal || order.totalPrice || order.totalAmount || 0).toFixed(2)}
              </div>
              {/* Cancel Button */}
              {((order.status === 'PENDING' || order.status === 'PROCESSING') || (order.stage === 'PENDING' || order.stage === 'PROCESSING')) && (
                 <button 
                   onClick={(e) => { e.stopPropagation(); onCancelOrder(oid); }}
                   className="cd-cancel-btn"
                   title="Cancel Order"
                   style={{ marginRight: '1rem', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                 >
                   <XCircle size={20} />
                 </button>
              )}
              <span className={`cd-status-badge status-${(order.stage || order.status || 'PENDING').toLowerCase()}`}>
                {order.stage || order.status || 'PENDING'}
              </span>
              <Package size={20} style={{ marginLeft: '1rem', color: '#999', transform: expandedOrder === oid ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
            </div>
            
            {/* Product Details */}
            {expandedOrder === oid && (
              <div style={{ padding: '0 1rem 1rem 1rem', background: '#fafafa' }}>
                <div style={{ marginBottom: '1rem', marginTop: '1rem', padding: '0.75rem', background: 'white', borderRadius: '8px', border: '1px solid #eee', fontSize: '0.9rem' }}>
                   <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <div><strong>Shipping To:</strong> {order.shippingAddress}</div>
                      <div><strong>Payment Method:</strong> {order.paymentMethod || "COD"}</div>
                   </div>
                   {order.orderNote && (
                     <div style={{ marginTop: '0.5rem', color: '#666', fontStyle: 'italic' }}>
                       <strong>Note:</strong> {order.orderNote}
                     </div>
                   )}
                </div>
                {order.items && order.items.length > 0 && <OrderItemsList items={order.items} />}
                <PriceBreakdown order={order} />
              </div>
            )}
          </div>
          );
        })}
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
          <div key={order.orderId || order.id} style={{ marginBottom: '1rem', border: '1px solid #f0f0f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div 
              className="cd-order-item"
              onClick={() => toggleOrder(order.orderId || order.id)}
              style={{ cursor: 'pointer', margin: 0, borderBottom: expandedOrder === (order.orderId || order.id) ? '1px solid #f0f0f0' : 'none' }}
            >
              {/* Product Image */}
              {order.items && order.items.length > 0 && (
                <img 
                  src={(order.items[0].imagePath || order.items[0].imagePathSnapshot)
                        ? `${API_BASE}/${order.items[0].imagePath || order.items[0].imagePathSnapshot}` 
                        : "https://via.placeholder.com/60"}
                  alt={order.items[0].name || order.items[0].productName}
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', marginRight: '1rem' }}
                />
              )}
              
              <div style={{ flex: 1 }}>
                <div className="cd-order-id">
                  {order.items && order.items.length > 0 
                    ? order.items.map(i => i.name || i.productName || i.productNameSnapshot).join(", ") 
                    : `Order #${order.orderId || order.id}`}
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
                <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>${(order.grandTotal || order.totalAmount || order.totalPrice || 0).toFixed(2)}</div>
              </div>
              
              {/* Cancel Button */}
              {((order.status === 'NEW' || order.status === 'PENDING' || order.status === 'PROCESSING') || (order.stage === 'NEW' || order.stage === 'PENDING' || order.stage === 'PROCESSING')) && (
                 <button 
                   onClick={(e) => { e.stopPropagation(); onCancelOrder(order.orderId || order.id); }}
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
              <Package size={20} style={{ marginLeft: '1rem', color: '#999', transform: expandedOrder === (order.orderId || order.id) ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
            </div>

            {/* Product Details */}
            {expandedOrder === (order.orderId || order.id) && (
              <div style={{ padding: '0 1rem 1rem 1rem', background: '#fafafa' }}>
                <div style={{ marginBottom: '1rem', marginTop: '1rem', padding: '0.75rem', background: 'white', borderRadius: '8px', border: '1px solid #eee', fontSize: '0.9rem' }}>
                   <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <div><strong>Shipping To:</strong> {order.shippingAddress}</div>
                      <div><strong>Payment Method:</strong> {order.paymentMethod || "COD"}</div>
                   </div>
                   {order.orderNote && (
                     <div style={{ marginTop: '0.5rem', color: '#666', fontStyle: 'italic' }}>
                       <strong>Note:</strong> {order.orderNote}
                     </div>
                   )}
                </div>
                {order.items && order.items.length > 0 && <OrderItemsList items={order.items} />}
                <PriceBreakdown order={order} />
              </div>
            )}
          </div>
        ))}
        {orders.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>You haven't placed any orders yet.</p>}
      </div>
    </div>
  );
};

const ReviewsTab = ({ orders, navigate }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);
  
  // Check both 'stage' and 'status' fields for DELIVERED orders
  const deliveredOrders = orders.filter(o => {
    const stage = (o.stage || "").toUpperCase();
    const status = (o.status || "").toUpperCase();
    return stage === "DELIVERED" || status === "DELIVERED";
  });

  const handleReview = (orderId, productId, existingReview, e) => {
    e.stopPropagation();
    localStorage.setItem("reviewOrderId", orderId);
    if (productId) {
        localStorage.setItem("reviewProductId", productId);
    }
    
    if (existingReview) {
      localStorage.setItem("reviewMode", "edit");
      localStorage.setItem("reviewData", JSON.stringify(existingReview));
      if (!productId && existingReview.productId) {
           localStorage.setItem("reviewProductId", existingReview.productId);
      }
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
                  src={order.items[0].imagePath ? (order.items[0].imagePath.startsWith('http') ? order.items[0].imagePath : `${API_BASE}/${order.items[0].imagePath}`) : "https://via.placeholder.com/60"}
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
                    onClick={(e) => handleReview(order.orderId, order.items?.[0]?.productId, order.review, e)}
                  >
                    <Star size={16} fill="#000" /> Edit Review
                  </button>
                ) : (
                  <button
                    className="btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#000', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                    onClick={(e) => handleReview(order.orderId, order.items?.[0]?.productId, null, e)}
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
          src={
              user?.profileImagePath 
                ? (user.profileImagePath.startsWith('http') 
                    ? user.profileImagePath 
                    : `${API_BASE}/uploads/${user.profileImagePath}`)
                : "https://via.placeholder.com/150"
          }
          alt="Profile"
          style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <div>
          <h3 style={{ margin: 0 }}>{user?.fullName}</h3>
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
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', color: '#666', marginBottom: '0.25rem' }}>Full Name</label>
          <div style={{ fontWeight: '500' }}>{user?.fullName}</div>
        </div>
        <div>
          <label style={{ display: 'block', color: '#666', marginBottom: '0.25rem' }}>Email</label>
          <div style={{ fontWeight: '500' }}>{user?.email}</div>
        </div>
        <div>
          <label style={{ display: 'block', color: '#666', marginBottom: '0.25rem' }}>Phone</label>
          <div style={{ fontWeight: '500' }}>{user?.contactNumber || "N/A"}</div>
        </div>
      </div>
    </div>
  </div>
);