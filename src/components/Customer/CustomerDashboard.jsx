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
  Trash2,
  ChevronRight,
  MapPin,
  Plus
} from "lucide-react";
import UpdateAccount from "../Profile/UpdateAccount.jsx";
import ConfirmModal from "../Common/ConfirmModal.jsx";
import { apiGetAddresses, apiAddAddress, apiUpdateAddress, apiDeleteAddress } from "./addressUtils";

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [userProfile, setUserProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "warning"
  });

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
    try {
      const profileRes = await api.get(`/api/users/${userId}`);
      setUserProfile(profileRes.data);
      if (profileRes.data.email) {
          localStorage.setItem("userEmail", profileRes.data.email);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }

    try {
      const ordersData = await apiGetOrdersForUser(userId);
      setOrders(ordersData || []);
    } catch (err) {
      console.error("Orders API failed:", err);
      setOrders([]);
    }
    
    try {
      const wishlistData = await apiGetWishlist(userId);
      const mappedWishlist = Array.isArray(wishlistData) ? wishlistData.map(item => ({
          ...item,
          productId: item.id || item.productId,
          productName: item.name || item.productName,
          imagePath: item.imagePaths && item.imagePaths.length > 0 ? item.imagePaths[0] : (item.imagePath || "")
      })) : [];
      setWishlist(mappedWishlist);
    } catch (err) {
      console.error("Wishlist API failed:", err);
      setWishlist([]);
    }

    try {
        const addrData = await apiGetAddresses(userId);
        setAddresses(addrData || []);
    } catch (err) {
        console.error("Addresses API failed:", err);
        setAddresses([]);
    }

    setLoading(false);
  };

  const handleCancelOrder = (orderId) => {
    setConfirmConfig({
        isOpen: true,
        title: "Cancel Order",
        message: "Are you sure you want to cancel this order? This action cannot be undone.",
        type: "danger",
        onConfirm: async () => {
            try {
                await apiCustomerCancelOrder(userId, orderId);
                fetchData();
            } catch (error) {
                console.error("Error cancelling order:", error);
            }
        }
    });
  };

  const handleRemoveWishlist = (productId) => {
    setConfirmConfig({
        isOpen: true,
        title: "Remove from Wishlist",
        message: "Are you sure you want to remove this item from your wishlist?",
        type: "danger",
        onConfirm: async () => {
            try {
                await apiRemoveFromWishlist(userId, productId);
                setWishlist(prev => prev.filter(item => item.productId !== productId));
            } catch(err) {
                console.error("Remove from wishlist error:", err);
            }
        }
    });
  };

  const handleLogout = () => {
    setConfirmConfig({
        isOpen: true,
        title: "Sign Out",
        message: "Are you sure you want to sign out from your Jhapcham account?",
        type: "danger",
        onConfirm: () => {
            localStorage.clear();
            navigate("/login");
        }
    });
  };

  if (loading) return <div className="cd-layout" style={{ justifyContent: 'center', alignItems: 'center', background: '#fff' }}>
    <div style={{ textAlign: 'center' }}>
      <div className="cd-stat-icon" style={{ margin: '0 auto 1rem auto', animation: 'pulse 1.5s infinite' }}>
        <Clock size={24} />
      </div>
      <p style={{ fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading Dashboard...</p>
    </div>
  </div>;

  const renderContent = () => {
    const commonProps = { user: userProfile, orders, wishlist, onCancelOrder: handleCancelOrder, navigate, onRemove: handleRemoveWishlist };
    switch (activeTab) {
      case "overview": return <OverviewTab {...commonProps} />;
      case "orders": return <OrdersTab {...commonProps} />;
      case "wishlist": return <WishlistTab {...commonProps} />;
      case "addresses": return <AddressesTab userId={userId} addresses={addresses} setAddresses={setAddresses} setConfirmConfig={setConfirmConfig} />;
      case "reviews": return <ReviewsTab {...commonProps} />;
      case "settings": return <AccountSettingsTab {...commonProps} setUserProfile={setUserProfile} />;
      default: return <OverviewTab {...commonProps} />;
    }
  };

  return (
    <div className="cd-layout">
      <aside className="cd-sidebar">
        <div className="cd-profile-summary">
          <div className="cd-avatar-wrapper">
            <img
              src={userProfile?.profileImagePath 
                ? (userProfile.profileImagePath.startsWith('http') ? userProfile.profileImagePath : `${API_BASE}/uploads/${userProfile.profileImagePath}`)
                : "https://via.placeholder.com/150"}
              alt="Profile"
              className="cd-avatar"
            />
          </div>
          <div className="cd-user-name">{userProfile?.fullName || "User Account"}</div>
          <div className="cd-user-email">{userProfile?.email}</div>
        </div>

        <nav className="cd-nav">
          {[
            { id: "overview", icon: LayoutDashboard, label: "Overview" },
            { id: "orders", icon: ShoppingBag, label: "Order History" },
            { id: "wishlist", icon: Heart, label: "My Wishlist" },
            { id: "addresses", icon: MapPin, label: "Addresses" },
            { id: "reviews", icon: Star, label: "Product Reviews" },
            { id: "settings", icon: Settings, label: "Account Settings" },
          ].map(tab => (
            <button
              key={tab.id}
              className={`cd-nav-item ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="cd-nav-indicator"></div>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </nav>

        <div className="cd-logout">
          <button className="cd-logout-btn" onClick={handleLogout}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="cd-main">
        {renderContent()}
      </main>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
      />
    </div>
  );
}

/* Tab Components */

const OverviewTab = ({ user, orders, wishlist }) => {
  const pendingCount = orders.filter(o => !["DELIVERED", "CANCELED"].includes((o.stage || o.status || "").toUpperCase())).length;

  return (
    <div className="fade-in">
      <div className="cd-header">
        <h1 className="cd-welcome">Welcome, {user?.fullName?.split(' ')[0] || "User"}</h1>
        <p className="cd-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="cd-stats-grid">
        <StatCard type="orders" icon={<ShoppingBag size={20}/>} value={orders.length} label="Total Orders" />
        <StatCard type="progress" icon={<Clock size={20}/>} value={pendingCount} label="In Progress" />
        <StatCard type="wishlist" icon={<Heart size={20}/>} value={wishlist.length} label="Wishlist Items" />
      </div>

      <div className="cd-section-title">
        <ShoppingBag size={18} /> Recent Tracked Orders
      </div>
      
      <div className="cd-card" style={{ padding: '0' }}>
        {orders.slice(0, 3).map(order => (
          <OrderItem key={order.orderId || order.id} order={order} />
        ))}
        {orders.length === 0 && <EmptyState icon={<ShoppingBag size={40}/>} text="No orders placed yet." />}
      </div>
    </div>
  );
};

const OrdersTab = ({ orders, onCancelOrder }) => (
  <div className="fade-in">
    <div className="cd-header">
      <h1 className="cd-welcome">Order History</h1>
      <p className="cd-date">Review and manage your purchases</p>
    </div>
    <div className="cd-card" style={{ padding: '0' }}>
      {orders.map(order => (
        <OrderItem key={order.orderId || order.id} order={order} showActions onCancel={onCancelOrder} />
      ))}
      {orders.length === 0 && <EmptyState icon={<ShoppingBag size={40}/>} text="You haven't ordered anything yet." />}
    </div>
  </div>
);

const WishlistTab = ({ wishlist, navigate, onRemove }) => (
  <div className="fade-in">
    <div className="cd-header">
      <h1 className="cd-welcome">Your Wishlist</h1>
      <p className="cd-date">{wishlist.length} items saved</p>
    </div>
    <div className="cd-wishlist-grid">
      {wishlist.map(item => (
        <div key={item.productId} className="cd-wish-card">
          <div className="cd-wish-img-container">
            <img 
              src={item.imagePath ? (item.imagePath.startsWith('http') ? item.imagePath : `${API_BASE}/${item.imagePath}`) : "https://via.placeholder.com/240"}
              alt={item.productName}
              className="cd-wish-img"
              onClick={() => navigate(`/products/${item.productId}`)}
            />
            <button className="cd-wish-remove" onClick={() => onRemove(item.productId)}>
              <Trash2 size={14} />
            </button>
          </div>
          <div className="cd-wish-info">
            <h4 className="cd-wish-title">{item.productName}</h4>
            <div className="cd-wish-footer">
              <span className="cd-wish-price">Rs. {Number(item.price || 0).toLocaleString()}</span>
              <button className="cd-wish-btn" onClick={() => navigate(`/products/${item.productId}`)}>Buy Now</button>
            </div>
          </div>
        </div>
      ))}
      {wishlist.length === 0 && <EmptyState icon={<Heart size={40}/>} text="Your wishlist is empty." />}
    </div>
  </div>
);

const ReviewsTab = ({ orders, navigate }) => {
  const delivered = orders.filter(o => (o.stage || o.status || "").toUpperCase() === "DELIVERED");

  return (
    <div className="fade-in">
      <div className="cd-header">
        <h1 className="cd-welcome">Product Reviews</h1>
        <p className="cd-date">Share feedback on items you've received</p>
      </div>
      <div className="cd-card" style={{ padding: '0' }}>
        {delivered.map(order => {
          const mainItem = order.items?.[0];
          const productName = mainItem?.productName || mainItem?.name || mainItem?.productNameSnapshot || "Product";
          return (
            <div key={order.orderId || order.id} className="cd-review-item">
               <img src={mainItem?.imagePath ? (mainItem.imagePath.startsWith('http') ? mainItem.imagePath : `${API_BASE}/${mainItem.imagePath}`) : "https://via.placeholder.com/80"} alt="Product" className="cd-review-img" />
               <div className="cd-review-info">
                 <div className="cd-review-name">{productName}</div>
                 <div className="cd-review-meta">Delivered: {new Date(order.updateTime || order.orderDate).toLocaleDateString()}</div>
               </div>
               <button 
                 className={`cd-action-btn ${order.review ? "outline" : "primary"}`}
                 onClick={() => {
                   localStorage.setItem("reviewOrderId", order.orderId || order.id);
                   if (mainItem?.productId) localStorage.setItem("reviewProductId", mainItem.productId);
                   localStorage.setItem("reviewMode", order.review ? "edit" : "create");
                   if (order.review) localStorage.setItem("reviewData", JSON.stringify(order.review));
                   navigate("/review");
                 }}
               >
                 <Star size={14} fill={order.review ? "currentColor" : "none"} />
                 {order.review ? "Edit" : "Rate Product"}
               </button>
            </div>
          );
        })}
        {delivered.length === 0 && <EmptyState icon={<Star size={40}/>} text="No delivered orders to review." />}
      </div>
    </div>
  );
};

const AccountSettingsTab = ({ user, setUserProfile }) => (
  <div className="fade-in">
    <div className="cd-header">
      <h1 className="cd-welcome">Account Settings</h1>
      <p className="cd-date">Identity and login management</p>
    </div>
    
    <div className="cd-settings-grid">
      <div className="cd-card cd-settings-form">
         <h4 className="cd-settings-title">Profile Information</h4>
         <UpdateAccount onUpdateSuccess={(data) => setUserProfile(prev => ({...prev, ...data}))} />
      </div>
      
      <div className="cd-security-card">
        <h4 className="cd-settings-title">Security & Privacy</h4>
        <div className="cd-security-list">
           <SecurityItem label="Email Verified" status={true} />
           <SecurityItem label="Two-Factor Auth" status={false} />
           <SecurityItem label="Secure Password" status={true} />
           <SecurityItem label="Active Session" status={true} />
        </div>
        <div className="cd-security-footer">
          <p>Protecting your data is our top priority.</p>
        </div>
      </div>
    </div>
  </div>
);

/* Small Sub-components */

const StatCard = ({ icon, value, label, type }) => (
  <div className={`cd-stat-card cd-stat-${type}`}>
    <div className="cd-stat-icon">{icon}</div>
    <div className="cd-stat-info">
      <h3>{value}</h3>
      <p>{label}</p>
    </div>
  </div>
);

const OrderItem = ({ order, showActions, onCancel }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const status = (order.stage || order.status || 'PENDING').toUpperCase();
  const canCancel = ["NEW", "PENDING", "PROCESSING"].includes(status);

  // Resilient product name mapping
  const productNames = order.items?.length > 0 
    ? order.items.map(i => i.productName || i.name || i.productNameSnapshot || i.productIdentifier).filter(Boolean)
    : [];
  
  const title = productNames.length > 0 
    ? productNames.slice(0, 2).join(", ") + (productNames.length > 2 ? "..." : "")
    : `Order #${String(order.orderId || order.id).padStart(4, '0')}`;

  // Stepper Logic
  const steps = ["NEW", "PROCESSING", "SHIPPED", "DELIVERED"];
  const currentStepIndex = steps.indexOf(status) === -1 
      ? (["SHIPPED_TO_BRANCH", "OUT_FOR_DELIVERY"].includes(status) ? 2 : (status === "CANCELED" ? -1 : 0)) 
      : steps.indexOf(status);

  return (
    <div style={{ borderBottom: '1px solid #f1f1f1' }}>
      <div className="cd-order-item" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
        <img 
          src={order.items?.[0]?.imagePath 
            ? (order.items[0].imagePath.startsWith('http') ? order.items[0].imagePath : `${API_BASE}/${order.items[0].imagePath}`) 
            : "https://via.placeholder.com/80"} 
          alt="Product" 
          className="cd-order-img" 
        />
        <div className="cd-order-info">
          <div className="cd-order-title">{title}</div>
          <div className="cd-order-meta">
            <span>{new Date(order.orderDate || order.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>{order.items?.length || 0} Items</span>
          </div>
        </div>
        <div className="cd-order-price" style={{ marginRight: '2rem' }}>
          Rs. {(order.totalAmount || order.grandTotal || 0).toLocaleString()}
        </div>
        <div className={`cd-status-badge status-${status.toLowerCase()}`}>{status.replace(/_/g, " ")}</div>
        <ChevronRight size={20} style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s', marginLeft: '1rem', color: '#ccc' }} />
      </div>

      {expanded && (
        <div className="fade-in" style={{ padding: '2rem', background: '#fafafa', borderTop: '1px solid #eee' }}>
           {/* Order Tracker Stepper */}
           {status !== "CANCELED" && (
             <div className="cd-stepper">
               {["Placed", "Processing", "Shipped", "Delivered"].map((step, idx) => (
                 <div key={step} className={`cd-step ${idx <= currentStepIndex ? "active" : ""}`}>
                   <div className="cd-step-circle">{idx <= currentStepIndex ? <Package size={12}/> : idx + 1}</div>
                   <div className="cd-step-line"></div>
                   <span className="cd-step-label">{step}</span>
                 </div>
               ))}
             </div>
           )}

           <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem', marginTop: '2rem' }}>
             <div>
                <h5 style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '900', color: '#999', margin: '0 0 1.5rem 0' }}>Order Items</h5>
                {order.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <img 
                      src={item.imagePath 
                        ? (item.imagePath.startsWith('http') ? item.imagePath : `${API_BASE}/${item.imagePath}`) 
                        : "https://via.placeholder.com/50"} 
                      alt="Product" 
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }} 
                    />
                    <div style={{ flex: 1 }}>
                       <div style={{ fontWeight: '800', fontSize: '1rem', color: '#000', marginBottom: '0.25rem' }}>
                          {item.productName || item.name || item.productNameSnapshot || "Product Item"}
                       </div>
                       <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
                         {item.quantity} × Rs. {item.unitPrice?.toLocaleString()}
                       </div>
                    </div>
                    {/* Buy Again Button */}
                    <button 
                        className="cd-buy-again-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/products/${item.productId || item.productIdSnapshot}`);
                        }}
                    >
                        Buy Again
                    </button>
                  </div>
                ))}
             </div>
             
             <div>
                <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem', color: '#666' }}><span>Subtotal</span><span>Rs. {order.itemsTotal?.toLocaleString()}</span></div>
                   {order.discountTotal > 0 && (
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem', color: '#ff4d4f' }}><span>Discount</span><span>-Rs. {order.discountTotal.toLocaleString()}</span></div>
                   )}
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem', color: '#666', borderBottom: '1px dashed #eee', paddingBottom: '1rem' }}><span>Shipping</span><span>{order.shippingFee > 0 ? `Rs. ${order.shippingFee}` : "Free"}</span></div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.2rem', color: '#000' }}><span>Total Paid</span><span>Rs. {(order.totalAmount || order.grandTotal || 0).toLocaleString()}</span></div>
                </div>
                
                {showActions && canCancel && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); onCancel(order.orderId || order.id); }}
                     style={{ width: '100%', marginTop: '1rem', background: '#fff', border: '1px solid #ff4d4f', color: '#ff4d4f', padding: '0.85rem', fontWeight: '700', cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s' }}
                     onMouseOver={(e) => {e.currentTarget.style.background = '#ff4d4f'; e.currentTarget.style.color = '#fff';}}
                     onMouseOut={(e) => {e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#ff4d4f';}}
                   >
                     CANCEL ORDER
                   </button>
                )}
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

const EmptyState = ({ icon, text }) => (
  <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>
    <div style={{ opacity: 0.2, marginBottom: '1rem' }}>{icon}</div>
    <p style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem' }}>{text}</p>
  </div>
);

const AddressesTab = ({ userId, addresses, setAddresses, setConfirmConfig }) => {
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    const openAdd = () => {
        setFormData({ label: "Home", country: "Nepal", isDefault: false });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEdit = (addr) => {
        setFormData({ ...addr });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        setConfirmConfig({
            isOpen: true,
            title: "Delete Address",
            message: "Are you sure you want to delete this address?",
            type: "danger",
            onConfirm: async () => {
                try {
                   await apiDeleteAddress(id);
                   setAddresses(addresses.filter(a => a.id !== id));
                } catch(e) {
                   console.error("Delete failed", e);
                }
            }
        });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                const updated = await apiUpdateAddress(formData.id, formData);
                setAddresses(addresses.map(a => a.id === updated.id ? updated : (updated.isDefault ? {...a, isDefault: false} : a)));
            } else {
                const added = await apiAddAddress(userId, formData);
                if (added.isDefault) {
                     setAddresses(addresses.map(a => ({...a, isDefault: false})).concat(added));
                } else {
                     setAddresses([...addresses, added]);
                }
            }
            setShowModal(false);
        } catch (err) {
            alert("Failed to save address: " + (err.message || "Unknown error"));
        }
    };

    return (
        <div className="fade-in">
             <div className="cd-header" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div>
                    <h1 className="cd-welcome">Address Book</h1>
                    <p className="cd-date">Manage your shipping destinations</p>
                </div>
                <button className="cd-review-btn cd-review-btn-primary" onClick={openAdd}>
                    <Plus size={16}/> Add New
                </button>
             </div>
             
             <div className="cd-address-grid">
                 {addresses.map(addr => (
                     <div key={addr.id} className={`cd-address-card ${addr.isDefault ? 'default' : ''}`}>
                         <div className="cd-address-header">
                             <div className="cd-address-label">
                               <MapPin size={14} />
                               <span>{addr.label}</span>
                             </div>
                             {addr.isDefault && <span className="cd-badge-pro">DEFAULT</span>}
                         </div>
                         <div className="cd-address-content">
                             <p className="cd-receiver">{addr.receiverName}</p>
                             <p className="cd-street">{addr.street}, {addr.city}</p>
                             <p className="cd-state-zip">{addr.state}</p>
                             <p className="cd-phone">{addr.receiverPhone}</p>
                         </div>
                         <div className="cd-address-actions">
                             <button className="cd-mini-btn" onClick={() => openEdit(addr)}>Edit</button>
                             <button className="cd-mini-btn danger" onClick={() => handleDelete(addr.id)}><Trash2 size={12}/></button>
                         </div>
                     </div>
                 ))}
             </div>
             
             {showModal && (
                 <div className="cd-modal-overlay" style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center'}}>
                     <div className="cd-modal" style={{background:'#fff', borderRadius:'12px', width:'100%', maxWidth:'500px', overflow:'hidden', boxShadow:'0 20px 50px rgba(0,0,0,0.2)'}}>
                         <div className="cd-modal-header" style={{padding:'1.5rem', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <h3 style={{margin:0, fontSize:'1.2rem', fontWeight:'800'}}>{isEditing ? 'Edit Address' : 'Add New Address'}</h3>
                            <button onClick={() => setShowModal(false)} style={{background:'none', border:'none', cursor:'pointer'}}><XCircle size={24}/></button>
                         </div>
                         <form onSubmit={handleSubmit} style={{display:'grid', gap:'1rem', padding:'1.5rem'}}>
                             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                                 <input placeholder="Label (e.g. Home)" value={formData.label || ''} onChange={e => setFormData({...formData, label: e.target.value})} required className="cd-input" style={{padding:'0.75rem', border:'1px solid #ddd', borderRadius:'8px'}} />
                                 <input placeholder="Receiver Name" value={formData.receiverName || ''} onChange={e => setFormData({...formData, receiverName: e.target.value})} required className="cd-input" style={{padding:'0.75rem', border:'1px solid #ddd', borderRadius:'8px'}} />
                             </div>
                             <input placeholder="Phone Number" value={formData.receiverPhone || ''} onChange={e => setFormData({...formData, receiverPhone: e.target.value})} required className="cd-input" style={{padding:'0.75rem', border:'1px solid #ddd', borderRadius:'8px'}} />
                             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                                 <input placeholder="City" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} required className="cd-input" style={{padding:'0.75rem', border:'1px solid #ddd', borderRadius:'8px'}} />
                                 <input placeholder="State / Zone" value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} required className="cd-input" style={{padding:'0.75rem', border:'1px solid #ddd', borderRadius:'8px'}} />
                             </div>
                             <input placeholder="Street / Chowk" value={formData.street || ''} onChange={e => setFormData({...formData, street: e.target.value})} required className="cd-input" style={{padding:'0.75rem', border:'1px solid #ddd', borderRadius:'8px'}} />
                             <input placeholder="Landmark (Optional)" value={formData.landMark || ''} onChange={e => setFormData({...formData, landMark: e.target.value})} className="cd-input" style={{padding:'0.75rem', border:'1px solid #ddd', borderRadius:'8px'}} />
                             
                             <label style={{display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', userSelect:'none'}}>
                                 <input type="checkbox" checked={formData.isDefault || false} onChange={e => setFormData({...formData, isDefault: e.target.checked})} style={{width:'18px', height:'18px'}} />
                                 Set as default shipping address
                             </label>
                             
                             <button type="submit" className="cd-review-btn cd-review-btn-primary" style={{width:'100%', marginTop:'1rem', height:'48px', fontSize:'1rem'}}>
                                 {isEditing ? 'Save Changes' : 'Add Address'}
                             </button>
                         </form>
                     </div>
                 </div>
             )}
        </div>
    );
};

const SecurityItem = ({ label, status }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: status ? '#fff' : '#444' }}></div>
    <span style={{ fontSize: '0.85rem', fontWeight: '700', opacity: status ? 1 : 0.5 }}>{label}</span>
  </div>
);