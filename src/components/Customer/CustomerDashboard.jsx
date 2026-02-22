import React, { useState, useEffect, useCallback } from "react";
import "./CustomerDashboard.css";
import { API_BASE } from "../config/config";
import { getCurrentUserId, apiGetOrdersForUser, apiCustomerCancelOrder } from "../AddCart/cartUtils";
import { apiGetWishlist, apiRemoveFromWishlist } from "../WishlistPage/wishlistUtils";
import api from "../../api/axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  Star,
  Settings,
  LogOut,
  Package,
  Clock,
  Trash2,
  ChevronRight,
  MapPin,
  Plus
} from "lucide-react";
import UpdateAccount from "../Profile/UpdateAccount.jsx";
import ConfirmModal from "../Common/ConfirmModal.jsx";
import { apiGetAddresses, apiAddAddress, apiUpdateAddress, apiDeleteAddress } from "./addressUtils";

export default function CustomerDashboard() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
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
  }, [userId, navigate, fetchData]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const profileRes = await api.get(`/api/users/${userId}`);
      setUserProfile(profileRes.data);
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
  }, [userId]);

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
        message: "Are you sure you want to sign out?",
        type: "danger",
        onConfirm: () => {
            localStorage.clear();
            navigate("/login");
        }
    });
  };

  if (loading) return (
    <div className="cd-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <p style={{ fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem' }}>Loading Dashboard...</p>
    </div>
  );

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
          <div className="cd-user-name">{userProfile?.fullName || "User"}</div>
          <div className="cd-user-email">{userProfile?.email}</div>
        </div>

        <nav className="cd-nav">
          {[
            { id: "overview", icon: LayoutDashboard, label: "Overview" },
            { id: "orders", icon: ShoppingBag, label: "Orders" },
            { id: "wishlist", icon: Heart, label: "Wishlist" },
            { id: "addresses", icon: MapPin, label: "Addresses" },
            { id: "reviews", icon: Star, label: "Reviews" },
            { id: "settings", icon: Settings, label: "Settings" },
          ].map(tab => (
            <button
              key={tab.id}
              className={`cd-nav-item ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </nav>

        <div className="cd-logout">
          <button className="cd-logout-btn" onClick={handleLogout}>
            <LogOut size={12} /> Sign Out
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
        <h1 className="cd-welcome">Hello, {user?.fullName?.split(' ')[0] || "User"}</h1>
        <p className="cd-date">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
      </div>

      <div className="cd-stats-grid">
        <StatCard type="orders" icon={<ShoppingBag size={14}/>} value={orders.length} label="Orders" />
        <StatCard type="progress" icon={<Clock size={14}/>} value={pendingCount} label="Pending" />
        <StatCard type="wishlist" icon={<Heart size={14}/>} value={wishlist.length} label="Wishlist" />
      </div>

      <div className="cd-section-title">
        <ShoppingBag size={14} /> Recent Orders
      </div>
      
      <div className="cd-card" style={{ padding: '0' }}>
        {orders.slice(0, 3).map(order => (
          <OrderItem key={order.orderId || order.id} order={order} />
        ))}
        {orders.length === 0 && <EmptyState text="No orders yet." />}
      </div>
    </div>
  );
};

const OrdersTab = ({ orders, onCancelOrder }) => (
  <div className="fade-in">
    <div className="cd-header">
      <h1 className="cd-welcome">Order History</h1>
      <p className="cd-date">Track and manage your purchases</p>
    </div>
    <div className="cd-card" style={{ padding: '0' }}>
      {orders.map(order => (
        <OrderItem key={order.orderId || order.id} order={order} showActions onCancel={onCancelOrder} />
      ))}
      {orders.length === 0 && <EmptyState text="You haven't ordered anything yet." />}
    </div>
  </div>
);

const WishlistTab = ({ wishlist, navigate, onRemove }) => (
  <div className="fade-in">
    <div className="cd-header">
      <h1 className="cd-welcome">Wishlist</h1>
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
              <Trash2 size={12} />
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
      {wishlist.length === 0 && <EmptyState text="Your wishlist is empty." />}
    </div>
  </div>
);

const ReviewsTab = ({ orders, navigate }) => {
  const delivered = orders.filter(o => (o.stage || o.status || "").toUpperCase() === "DELIVERED");

  return (
    <div className="fade-in">
      <div className="cd-header">
        <h1 className="cd-welcome">Reviews</h1>
        <p className="cd-date">Feedback on received items</p>
      </div>
      <div className="cd-card" style={{ padding: '0' }}>
        {delivered.map(order => {
          const mainItem = order.items?.[0];
          const productName = mainItem?.productName || mainItem?.name || mainItem?.productNameSnapshot || "Product";
          return (
            <div key={order.orderId || order.id} className="cd-review-item">
               <img src={mainItem?.imagePath ? (mainItem.imagePath.startsWith('http') ? mainItem.imagePath : `${API_BASE}/${mainItem.imagePath}`) : "https://via.placeholder.com/60"} alt="Product" className="cd-review-img" />
               <div className="cd-order-info">
                 <div className="cd-order-title">{productName}</div>
                 <div className="cd-order-meta">Delivered: {new Date(order.updateTime || order.orderDate).toLocaleDateString()}</div>
               </div>
               <button 
                 className="cd-buy-again-btn"
                 onClick={() => {
                   localStorage.setItem("reviewOrderId", order.orderId || order.id);
                   if (mainItem?.productId) localStorage.setItem("reviewProductId", mainItem.productId);
                   localStorage.setItem("reviewMode", order.review ? "edit" : "create");
                   navigate("/review");
                 }}
               >
                 {order.review ? "Update" : "Rate"}
               </button>
            </div>
          );
        })}
        {delivered.length === 0 && <EmptyState text="No delivered orders to review." />}
      </div>
    </div>
  );
};

const AccountSettingsTab = ({ user, setUserProfile }) => (
  <div className="fade-in">
    <div className="cd-header">
      <h1 className="cd-welcome">Settings</h1>
      <p className="cd-date">Manage your profile</p>
    </div>
    <div className="cd-card">
       <UpdateAccount onUpdateSuccess={(data) => setUserProfile(prev => ({...prev, ...data}))} />
    </div>
  </div>
);

/* Sub-components */

const StatCard = ({ icon, value, label }) => (
  <div className="cd-stat-card">
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

  const productNames = order.items?.length > 0 
    ? order.items.map(i => i.productName || i.name || i.productNameSnapshot || i.productIdentifier).filter(Boolean)
    : [];
  
  const title = productNames.length > 0 
    ? productNames.slice(0, 2).join(", ") + (productNames.length > 2 ? "..." : "")
    : `Order #${String(order.orderId || order.id).padStart(4, '0')}`;

  const steps = ["NEW", "PROCESSING", "SHIPPED", "DELIVERED"];
  const currentStepIndex = steps.indexOf(status) === -1 
      ? (["SHIPPED_TO_BRANCH", "OUT_FOR_DELIVERY"].includes(status) ? 2 : (status === "CANCELED" ? -1 : 0)) 
      : steps.indexOf(status);

  return (
    <div className="cd-order-wrapper" style={{ borderBottom: '1px solid #f9fafb' }}>
      <div className="cd-order-item" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
        <img 
          src={order.items?.[0]?.imagePath 
            ? (order.items[0].imagePath.startsWith('http') ? order.items[0].imagePath : `${API_BASE}/${order.items[0].imagePath}`) 
            : "https://via.placeholder.com/60"} 
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
        <div className="cd-order-price">
          Rs. {(order.totalAmount || order.grandTotal || 0).toLocaleString()}
        </div>
        <div className={`cd-status-badge status-${status.toLowerCase()}`}>{status.replace(/_/g, " ")}</div>
        <ChevronRight size={14} style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s', marginLeft: '12px' }} />
      </div>

      {expanded && (
        <div className="fade-in" style={{ padding: '16px', background: '#fdfdfd' }}>
           {status !== "CANCELED" && (
             <div className="cd-stepper">
               {["Placed", "Processed", "Shipped", "Delivered"].map((step, idx) => (
                 <div key={step} className={`cd-step ${idx <= currentStepIndex ? "active" : ""}`}>
                   <div className="cd-step-circle">{idx <= currentStepIndex ? <Package size={10}/> : idx + 1}</div>
                   <span className="cd-step-label">{step}</span>
                 </div>
               ))}
             </div>
           )}

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '20px', marginTop: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {order.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#fff', padding: '8px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                    <img 
                      src={item.imagePath 
                        ? (item.imagePath.startsWith('http') ? item.imagePath : `${API_BASE}/${item.imagePath}`) 
                        : "https://via.placeholder.com/40"} 
                      alt="" 
                      style={{ width: '40px', height: '40px', objectFit: 'contain' }} 
                    />
                    <div style={{ flex: 1 }}>
                       <div style={{ fontWeight: '700', fontSize: '0.75rem' }}>{item.productName || item.name}</div>
                       <div style={{ fontSize: '0.65rem', color: '#666' }}>{item.quantity} × Rs. {item.unitPrice?.toLocaleString()}</div>
                    </div>
                    <button className="cd-buy-again-btn" onClick={(e) => { e.stopPropagation(); navigate(`/products/${item.productId}`); }}>Buy Again</button>
                  </div>
                ))}
              </div>
              
              <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.7rem' }}><span>Subtotal</span><span>Rs. {order.itemsTotal?.toLocaleString()}</span></div>
                 {order.discountTotal > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.7rem', color: '#ef4444' }}><span>Discount</span><span>-Rs. {order.discountTotal.toLocaleString()}</span></div>}
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.7rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}><span>Shipping</span><span>{order.shippingFee > 0 ? `Rs. ${order.shippingFee}` : "Free"}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '0.9rem' }}><span>Paid</span><span>Rs. {(order.totalAmount || order.grandTotal || 0).toLocaleString()}</span></div>
                 
                 {showActions && canCancel && (
                    <button onClick={(e) => { e.stopPropagation(); onCancel(order.orderId || order.id); }} style={{ width: '100%', marginTop: '12px', background: '#fff', border: '1px solid #ef4444', color: '#ef4444', padding: '6px', fontSize: '0.65rem', fontWeight: '800', borderRadius: '4px', cursor: 'pointer' }}>CANCEL</button>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

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
                } catch(e) { console.error("Delete failed", e); }
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
                if (added.isDefault) setAddresses(addresses.map(a => ({...a, isDefault: false})).concat(added));
                else setAddresses([...addresses, added]);
            }
            setShowModal(false);
        } catch (err) { alert("Error: " + (err.message || "Unknown error")); }
    };

    return (
        <div className="fade-in">
             <div className="cd-header" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div>
                    <h1 className="cd-welcome">Addresses</h1>
                    <p className="cd-date">Manage your delivery spots</p>
                </div>
                <button className="cd-buy-again-btn" onClick={openAdd}>
                    <Plus size={12}/> New Address
                </button>
             </div>
             
             <div className="cd-address-grid">
                 {addresses.map(addr => (
                     <div key={addr.id} className={`cd-address-card ${addr.isDefault ? 'default' : ''}`}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                             <div className="cd-address-label"><MapPin size={12} /> {addr.label}</div>
                             {addr.isDefault && <span className="cd-badge-pro">DEFAULT</span>}
                         </div>
                         <div className="cd-address-content">
                             <p style={{ fontWeight: 800, fontSize: '0.85rem' }}>{addr.receiverName}</p>
                             <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{addr.street}, {addr.city}</p>
                             <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '4px' }}>{addr.receiverPhone}</p>
                         </div>
                         <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                             <button className="cd-buy-again-btn" onClick={() => openEdit(addr)} style={{ flex: 1 }}>Edit</button>
                             <button className="cd-buy-again-btn" onClick={() => handleDelete(addr.id)} style={{ color: '#ef4444', borderColor: '#ef4444' }}><Trash2 size={12}/></button>
                         </div>
                     </div>
                 ))}
             </div>
             
             {showModal && (
                 <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding: '16px'}}>
                     <div style={{background:'#fff', borderRadius:'12px', width:'100%', maxWidth:'400px', overflow:'hidden'}}>
                         <div style={{padding:'16px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <h3 style={{margin:0, fontSize:'0.9rem', fontWeight:'900', textTransform: 'uppercase'}}>{isEditing ? 'Edit Address' : 'New Address'}</h3>
                            <Plus size={20} style={{ transform: 'rotate(45deg)', cursor: 'pointer' }} onClick={() => setShowModal(false)} />
                         </div>
                         <form onSubmit={handleSubmit} style={{display:'grid', gap:'12px', padding:'16px'}}>
                             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                                 <input placeholder="Label" value={formData.label || ''} onChange={e => setFormData({...formData, label: e.target.value})} required style={{padding:'10px', border:'1px solid #ddd', borderRadius:'8px', fontSize: '0.8rem'}} />
                                 <input placeholder="Name" value={formData.receiverName || ''} onChange={e => setFormData({...formData, receiverName: e.target.value})} required style={{padding:'10px', border:'1px solid #ddd', borderRadius:'8px', fontSize: '0.8rem'}} />
                             </div>
                             <input placeholder="Phone" value={formData.receiverPhone || ''} onChange={e => setFormData({...formData, receiverPhone: e.target.value})} required style={{padding:'10px', border:'1px solid #ddd', borderRadius:'8px', fontSize: '0.8rem'}} />
                             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                                 <input placeholder="City" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} required style={{padding:'10px', border:'1px solid #ddd', borderRadius:'8px', fontSize: '0.8rem'}} />
                                 <input placeholder="State" value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} required style={{padding:'10px', border:'1px solid #ddd', borderRadius:'8px', fontSize: '0.8rem'}} />
                             </div>
                             <input placeholder="Street Address" value={formData.street || ''} onChange={e => setFormData({...formData, street: e.target.value})} required style={{padding:'10px', border:'1px solid #ddd', borderRadius:'8px', fontSize: '0.8rem'}} />
                             <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontSize: '0.75rem', fontWeight: 700}}>
                                 <input type="checkbox" checked={formData.isDefault || false} onChange={e => setFormData({...formData, isDefault: e.target.checked})} />
                                 Set as default
                             </label>
                             <button type="submit" className="continue-btn" style={{ height: '40px', fontSize: '0.75rem' }}>{isEditing ? 'Save' : 'Add'}</button>
                         </form>
                     </div>
                 </div>
             )}
        </div>
    );
};

const EmptyState = ({ text }) => (
  <div style={{ textAlign: 'center', padding: '32px', color: '#999' }}>
    <p style={{ fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.7rem' }}>{text}</p>
  </div>
);