import React, { useState, useEffect, useCallback } from "react";
import "./CustomerDashboard.css";
import { API_BASE } from "../config/config";
import { getCurrentUserId, apiGetOrdersForUser, apiCustomerCancelOrder, apiAddToCart, addToGuestCart } from "../AddCart/cartUtils";
import { apiGetWishlist, apiRemoveFromWishlist } from "../WishlistPage/wishlistUtils";
import api from "../../api/axios";
import loyaltyApi from "../../api/loyaltyApi";
import { useNavigate, useSearchParams } from "react-router-dom";
import Toast from "../Toast/Toast.jsx";
import {
  ShoppingBag,
  Heart,
  Star,
  Package,
  Trash2,
  ChevronRight,
  MapPin,
  Plus,
  Check,
  CheckCircle,
  Flag,
  CreditCard,
  Truck,
  Zap,
  ShieldCheck,
  Search,
  Calendar,
  Filter,
  BarChart3,
  Download,
  RotateCw,
  Bell,
  FileText
} from "lucide-react";
import UpdateAccount from "../Profile/UpdateAccount.jsx";
import ConfirmModal from "../Common/ConfirmModal.jsx";
import ReportModal from "../Report/ReportModal.jsx";
import { apiGetAddresses, apiAddAddress, apiUpdateAddress, apiDeleteAddress } from "./addressUtils";
import CustomerSidebar from "./CustomerSidebar.jsx";
import DashboardNavbar from "../Admin/DashboardNavbar.jsx";
import Loyalty from "../Loyalty/Loyalty.jsx";
import SmsPreferences from "../SmsPreferences/SmsPreferences.jsx";
import Refunds from "../Refunds/Refunds.jsx";
import Disputes from "../Disputes/Disputes.jsx";
import InvoiceActions from "../Invoice/InvoiceActions.jsx";
import AnalyticsDashboard from "../Analytics/AnalyticsDashboard.jsx";
import PaymentMethods from "../PaymentMethods/PaymentMethods.jsx";
import Subscriptions from "../Subscriptions/Subscriptions.jsx";
import { bulkAddToCart, bulkRemoveFromWishlist, bulkCancelOrders, bulkDownloadInvoices } from "../../utils/bulkOperationsUtils.js";
import { exportOrderHistoryCSV, exportOrderHistoryPDF, exportPersonalData } from "../../utils/exportDataUtils.js";
import { getNotificationPreferences, updateNotificationPreferences } from "../../api/notificationPreferencesApi.js";

import { Outlet, useOutletContext, useLocation } from "react-router-dom";

export function CustomerOverview() {
  const ctx = useOutletContext(); return <OverviewTab {...ctx} setActiveTab={(path) => ctx.navigate(`/customer/${path}`)} />;
}
export function CustomerOrders() {
  const ctx = useOutletContext();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const itemsPerPage = 5;
  return <OrdersTab {...ctx} statusFilter={statusFilter} setStatusFilter={setStatusFilter} searchQuery={searchQuery} setSearchQuery={setSearchQuery} dateRange={dateRange} setDateRange={setDateRange} paymentFilter={paymentFilter} setPaymentFilter={setPaymentFilter} showAdvanced={showAdvanced} setShowAdvanced={setShowAdvanced} setActiveTab={(path) => ctx.navigate(`/customer/${path}`)} currentPage={currentPage} setCurrentPage={setCurrentPage} selectedOrders={selectedOrders} setSelectedOrders={setSelectedOrders} itemsPerPage={itemsPerPage} />;
}
export function CustomerWishlist() {
  const ctx = useOutletContext(); return <WishlistTab {...ctx} />;
}
export function CustomerReviews() {
  const ctx = useOutletContext(); return <ReviewsTab {...ctx} />;
}
export function CustomerSettings() {
  const ctx = useOutletContext(); return <AccountSettingsTab {...ctx} />;
}
export function CustomerAddresses() {
  const ctx = useOutletContext(); 
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });
  return <AddressesTab {...ctx} setConfirmConfig={setConfirmConfig} userId={ctx.user?.id} />;
}
export function CustomerAnalytics() {
  const ctx = useOutletContext();
  const userId = getCurrentUserId();
  return <AnalyticsTab userId={userId} setToast={ctx.setToast} />;
}
export function CustomerPaymentMethods() {
  const ctx = useOutletContext();
  const userId = getCurrentUserId();
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  return (
    <div className="fade-in">
      <div className="cd-header" style={{ marginBottom: '20px' }}>
        <h2 className="cd-welcome gt-h3">Payment Methods</h2>
        <p className="cd-date gt-note">Manage your saved payment methods</p>
      </div>
      <PaymentMethods userId={userId} onSuccess={(msg) => setToast({ show: true, message: msg, type: "success" })} />
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
export function CustomerSubscriptions() {
  const ctx = useOutletContext();
  const userId = getCurrentUserId();
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  return (
    <div className="fade-in">
      <div className="cd-header" style={{ marginBottom: '20px' }}>
        <h2 className="cd-welcome gt-h3">Auto-Reorder Subscriptions</h2>
        <p className="cd-date gt-note">Set up recurring deliveries of your favorite products</p>
      </div>
      <Subscriptions userId={userId} onSuccess={(msg) => setToast({ show: true, message: msg, type: "success" })} />
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
export function CustomerNotifications() {
  const ctx = useOutletContext();
  const userId = getCurrentUserId();
  return <NotificationPreferencesTab userId={userId} />;
}
export function CustomerDataExport() {
  const ctx = useOutletContext();
  const userId = getCurrentUserId();
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  return (
    <div className="fade-in">
      <div className="cd-header" style={{ marginBottom: '20px' }}>
        <h2 className="cd-welcome gt-h3">Data & Privacy</h2>
        <p className="cd-date gt-note">Export your data or manage your account</p>
      </div>
      <DataExportTab userId={userId} onSuccess={(msg) => setToast({ show: true, message: msg, type: "success" })} />
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}

export default function CustomerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.split('/').pop();
  const setActiveTab = (tab) => navigate(`/customer/${tab}`);
  const [userProfile, setUserProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "warning"
  });

  const userId = getCurrentUserId();

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

    try {
        const loyData = await loyaltyApi.getMyPoints();
        setLoyalty(loyData);
    } catch (err) {
        console.error("Loyalty API failed:", err);
        setLoyalty(null);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [userId, navigate, fetchData]);

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

  const handleAddToCart = async (item) => {
    try {
      if (userId) {
        await apiAddToCart(userId, item.productId, 1, null, null);
      } else {
        addToGuestCart({
          id: item.productId,
          name: item.productName || item.name,
          imagePath: item.imagePath,
          price: item.price
        }, 1, null, null);
      }
      setToast({ show: true, message: "Item added to cart!", type: "success" });
    } catch (err) {
      console.error("Add to cart error:", err);
      setToast({ show: true, message: "Failed to add item to cart.", type: "error" });
    }
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
    <div className="cd-layout" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '12px' }}>
      <div style={{ width: 30, height: 30, border: '3px solid #e7e7e7', borderTopColor: '#0088cc', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.62rem', color: '#999' }}>Loading Account...</p>
    </div>
  );

  const commonProps = { user: userProfile, orders, wishlist, addresses, loyalty, onCancelOrder: handleCancelOrder, navigate, onRemove: handleRemoveWishlist, setActiveTab, onLogout: handleLogout, onAddToCart: handleAddToCart, setUserProfile };

  return (
    <div className="cd-layout">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      
      <CustomerSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        userProfile={userProfile}
      />

      <main className="cd-main">
        <DashboardNavbar 
          title="My Account" 
          role="CUSTOMER" 
          showSearch={false} 
          customUserName={userProfile?.fullName}
        />
        <div className="cd-main-inner">
          <Outlet context={commonProps} />
        </div>
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

const OverviewTab = ({ user, orders, wishlist, addresses, loyalty, setActiveTab, onAddToCart, navigate }) => {
  const totalSpent = orders.reduce((sum, o) => sum + (Number(o.grandTotal || o.totalAmount || o.total) || 0), 0);
  
  // Real Loyalty Logic from backend
  const loyaltyPoints = loyalty?.totalPoints || 0;
  const tier = loyalty?.tier || 'BRONZE';
  const pointsToNext = loyalty?.pointsToNextTier || 500;
  const nextTarget = loyaltyPoints + pointsToNext;
  const progress = nextTarget === loyaltyPoints ? 100 : Math.min((loyaltyPoints / nextTarget) * 100, 100);

  return (
    <div className="fade-in">
      
      <div className="cd-overview-header-v2 lux-fade-in">
        <div className="cd-loyalty-card lux-glass-card">
           <div className="cd-lc-glow" />
           <div className="cd-lc-content">
              <div className="cd-lc-top">
                 <div className="cd-lc-badge lux-pill">
                    <ShieldCheck size={14} />
                    <span>{tier} MEMBER</span>
                 </div>
                 <div className="cd-lc-points lux-pill">
                    <Zap size={14} fill="#fbbf24" color="#fbbf24" />
                    <span>{loyaltyPoints.toLocaleString()} PTS</span>
                 </div>
              </div>
              <div className="cd-lc-user">
                 <h3 className="lux-greeting-h1 gt-h2">{user?.fullName || 'Valued Member'}</h3>
                 <p className="lux-meta-sub gt-note">Premium Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024'}</p>
              </div>
              <div className="cd-lc-footer">
                 <div className="cd-lc-progress-info">
                    <span>Target: {nextTarget.toLocaleString()} PTS</span>
                    <span>{Math.round(progress)}%</span>
                 </div>
                 <div className="cd-lc-progress-bar">
                    <div className="cd-lc-progress-fill" style={{ width: `${progress}%`, background: 'var(--porto-primary)' }} />
                 </div>
              </div>
           </div>
        </div>

        <div className="cd-quick-actions-grid">
           {[
             { id: 'orders', label: 'All Orders', icon: <Package size={20} />, sub: 'View status' },
             { id: 'track', label: 'Track Order', icon: <Truck size={20} />, sub: 'Real-time' },
             { id: 'payment', label: 'Payments', icon: <CreditCard size={20} />, sub: 'Transactions' },
             { id: 'wishlist', label: 'Wishlist', icon: <Heart size={20} />, sub: 'Saved items' },
           ].map(action => (
             <button key={action.id} className="cd-qa-card lux-glass-card" onClick={() => action.id === 'track' ? setActiveTab('orders') : setActiveTab(action.id)}>
                <div className="cd-qa-icon" style={{ background: 'var(--porto-primary-fade)', color: 'var(--porto-primary)' }}>{action.icon}</div>
                <div className="cd-qa-text">
                   <span className="cd-qa-label gt-caption">{action.label}</span>
                   <span className="cd-qa-sub gt-note">{action.sub}</span>
                </div>
             </button>
           ))}
        </div>
      </div>

      <div className="cd-stats-row">
        <StatCard 
          icon={<ShoppingBag size={24} />} 
          value={orders.length} 
          label="Orders" 
          color="#00b4d8"
        />
        <StatCard 
          icon={<Heart size={24} />} 
          value={wishlist.length} 
          label="Wishlist" 
          color="#00b4d8"
        />
        <StatCard 
          icon={<Star size={24} />} 
          value={`Rs. ${totalSpent.toLocaleString()}`} 
          label="Total Spent" 
          color="#00b4d8"
        />
        <StatCard 
          icon={<MapPin size={24} />} 
          value={addresses.length || '0'} 
          label="Addresses" 
          color="#00b4d8"
        />
      </div>

      <div className="cd-dashboard-grid">
        <div className="cd-grid-card cd-recent-orders">
          <div className="cd-grid-header">
            <h3 className="gt-caption">Recent Orders</h3>
            <button onClick={() => setActiveTab('orders')} className="gt-note">View Pipeline</button>
          </div>
          <div className="cd-grid-content">
            {orders.length > 0 ? (
              <div className="cd-compact-list">
                {orders.slice(0, 5).map(order => {
                  const oid = order.orderId || order.id || "000000";
                  const oidDisplay = isNaN(oid) ? oid : `ORD-${String(oid).padStart(5, '0')}`;
                  const date = order.createdAt || order.orderDate || order.updateTime;
                  const price = order.grandTotal || order.totalAmount || 0;
                  
                  const productNames = order.productNames || (order.items?.length > 0 
                    ? order.items.map(i => i.productName || i.name || i.productNameSnapshot).filter(Boolean).join(", ")
                    : `Order #${String(oid).slice(-6)}`);
                  
                  const firstImage = order.productImage || order.items?.[0]?.imagePath || order.items?.[0]?.imagePathSnapshot;
                  
                  return (
                    <div key={oid} className="cd-compact-row" onClick={() => navigate(`/customer/order/${oid}`)}>
                      <div className="cd-cr-visual">
                         <img 
                           src={firstImage ? (firstImage.startsWith('http') ? firstImage : `${API_BASE}/${firstImage}`) : "https://via.placeholder.com/50"} 
                           alt="" 
                           className="cd-cr-img"
                         />
                      </div>
                      <div className="cd-cr-main">
                         <div className="cd-cr-title" title={productNames}>
                            {productNames.length > 35 ? productNames.slice(0, 35) + "..." : productNames}
                         </div>
                         <div className="cd-cr-meta">
                            <span className="cd-cr-id">{oidDisplay}</span>
                            <span className="cd-cr-dot">•</span>
                            <span className="cd-cr-date">{date ? new Date(date).toLocaleDateString() : 'N/A'}</span>
                         </div>
                      </div>
                      <div className="cd-cr-end">
                         <div className="cd-cr-price">Rs. {Number(price).toLocaleString()}</div>
                         <button className="cd-track-btn" onClick={(e) => { e.stopPropagation(); navigate(`/customer/order/${oid}`); }}>
                            TRACK <ChevronRight size={10} strokeWidth={3} />
                         </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="cd-empty-mini">No recent orders found.</div>
            )}
          </div>
        </div>

        <div className="cd-grid-card cd-wishlist-spotlight">
          <div className="cd-grid-header">
            <h3>Saved For Later</h3>
            <button onClick={() => setActiveTab('wishlist')}>View All</button>
          </div>
          <div className="cd-grid-content">
            {wishlist.length > 0 ? (
              <div className="cd-spotlight-list">
                {wishlist.slice(0, 3).map(item => (
                  <div key={item.productId} className="cd-spotlight-item" onClick={() => navigate(`/products/${item.productId}`)}>
                     <img src={item.imagePath ? (item.imagePath.startsWith('http') ? item.imagePath : `${API_BASE}/${item.imagePath}`) : "https://via.placeholder.com/50"} alt="" />
                     <div className="cd-si-text">
                        <span className="cd-si-name">{item.productName}</span>
                        <span className="cd-si-price">Rs. {Number(item.price).toLocaleString()}</span>
                     </div>
                     <ChevronRight size={14} className="cd-si-arrow" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="cd-empty-mini">Your wishlist is empty.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const OrdersTab = ({ 
  orders, onCancelOrder, onAddToCart, 
  statusFilter, setStatusFilter, 
  searchQuery, setSearchQuery,
  dateRange, setDateRange,
  paymentFilter, setPaymentFilter,
  showAdvanced, setShowAdvanced,
  setActiveTab,
  currentPage, setCurrentPage,
  selectedOrders, setSelectedOrders,
  itemsPerPage
}) => {
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  
  const filtered = orders.filter(o => {
    // Stage/Status check
    const rawStatus = (o.stage || o.status || 'PENDING').toUpperCase();
    const status = rawStatus === 'NEW' ? 'PLACED' : rawStatus;
    
    if (statusFilter !== "ALL") {
       if (statusFilter === "ACTIVE" && ["DELIVERED", "CANCELED"].includes(status)) return false;
       if (statusFilter === "COMPLETED" && status !== "DELIVERED") return false;
       if (statusFilter === "CANCELED" && status !== "CANCELED") return false;
    }

    // Payment Filter
    if (paymentFilter !== "ALL") {
      if ((o.paymentMethod || "COD") !== paymentFilter) return false;
    }

    // Date Range Filter
    if (dateRange.start) {
      const start = new Date(dateRange.start);
      start.setHours(0,0,0,0);
      if (new Date(o.createdAt || o.orderDate) < start) return false;
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end);
      end.setHours(23,59,59,999);
      if (new Date(o.createdAt || o.orderDate) > end) return false;
    }

    // Search check
    if (searchQuery) {
       const q = searchQuery.toLowerCase();
       const oid = String(o.orderId || o.id).toLowerCase();
       const products = (o.productNames || "").toLowerCase();
       return oid.includes(q) || products.includes(q);
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filtered.slice(startIdx, startIdx + itemsPerPage);

  // Bulk operations
  const handleBulkCancel = async () => {
    if (selectedOrders.length === 0) {
      setToast({ show: true, message: "Select orders to cancel", type: "warning" });
      return;
    }
    const result = await bulkCancelOrders(getCurrentUserId(), selectedOrders);
    if (result.success) {
      setToast({ show: true, message: result.message, type: "success" });
      setSelectedOrders([]);
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedOrders.length === 0) {
      setToast({ show: true, message: "Select orders to download", type: "warning" });
      return;
    }
    const result = await bulkDownloadInvoices(getCurrentUserId(), selectedOrders);
    if (result.success) {
      setToast({ show: true, message: result.message, type: "success" });
    }
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === paginatedOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(paginatedOrders.map(o => o.orderId || o.id));
    }
  };

  const toggleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  return (
    <div className="fade-in">
      <div className="cd-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 className="cd-welcome gt-h3">Order History</h2>
          <p className="cd-date gt-note">Track and manage your purchases</p>
        </div>
        
        <div className="cd-order-filters">
           <div className="cd-filter-search">
              <Search size={14} />
              <input 
                type="text" 
                placeholder="Search ID or product..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
           </div>
           <select className="cd-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Orders</option>
              <option value="ACTIVE">Active Pipeline</option>
              <option value="COMPLETED">Delivered</option>
              <option value="CANCELED">Cancelled</option>
           </select>
           <button 
             className={`cd-adv-toggle ${showAdvanced ? 'active' : ''}`}
             onClick={() => setShowAdvanced(!showAdvanced)}
             title="Advanced Filters"
           >
              <Filter size={16} />
           </button>
        </div>
      </div>

      {showAdvanced && (
        <div className="cd-advanced-filters-panel lux-fade-in">
           <div className="cd-adv-group">
              <label>Payment Method</label>
              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                 <option value="ALL">Any Payment</option>
                 <option value="COD">Cash on Delivery</option>
                 <option value="ESEWA">eSewa Online</option>
              </select>
           </div>
           <div className="cd-adv-group">
              <label>From Date</label>
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
           </div>
           <div className="cd-adv-group">
              <label>To Date</label>
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
           </div>
           <button className="cd-adv-reset" onClick={() => { setPaymentFilter("ALL"); setDateRange({start:'', end:''}); setStatusFilter("ALL"); setSearchQuery(""); }}>Reset All</button>
        </div>
      )}

      {/* Bulk Operations Bar */}
      {selectedOrders.length > 0 && (
        <div className="cd-bulk-actions-bar">
          <span className="bulk-count">{selectedOrders.length} orders selected</span>
          <div className="bulk-buttons">
            <button className="bulk-btn" onClick={handleBulkDownload}>
              <Download size={16} /> Download Invoices
            </button>
            <button className="bulk-btn danger" onClick={handleBulkCancel}>
              <Trash2 size={16} /> Cancel Selected
            </button>
          </div>
        </div>
      )}
      
      <div className="cd-card">
        {paginatedOrders.length > 0 && (
          <div className="cd-bulk-select-header">
            <input 
              type="checkbox" 
              checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0}
              onChange={toggleSelectAll}
              title="Select all orders"
            />
            <span className="select-label">Select Orders</span>
          </div>
        )}
        
        {paginatedOrders.map(order => (
          <div key={order.orderId || order.id} className="cd-order-item-with-checkbox">
            <input 
              type="checkbox" 
              checked={selectedOrders.includes(order.orderId || order.id)}
              onChange={() => toggleSelectOrder(order.orderId || order.id)}
              className="order-checkbox"
            />
            <OrderItem key={order.orderId || order.id} order={order} showActions onCancel={onCancelOrder} onAddToCart={onAddToCart} setActiveTab={setActiveTab} />
          </div>
        ))}
        
        {filtered.length === 0 && (
          <div className="cd-empty-state-v2">
             <ShoppingBag size={48} strokeWidth={1} />
             <p>No orders matched your filters.</p>
             <button onClick={() => { setStatusFilter("ALL"); setSearchQuery(""); }}>View All Orders</button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="cd-pagination">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">Page {currentPage} of {totalPages}</span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
};

const WishlistTab = ({ wishlist, navigate, onRemove, onAddToCart }) => (
  <div className="fade-in">
    <div className="cd-header">
      <h2 className="cd-welcome">My Wishlist</h2>
      <p className="cd-date">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved</p>
    </div>

    {wishlist.length === 0 ? (
      <div className="cd-empty-mini">Your wishlist is empty.</div>
    ) : (
      <div className="cd-wishlist-table-wrap">
        <table className="cd-wishlist-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Stock Status</th>
              <th>Actions</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {wishlist.map(item => (
              <tr key={item.productId}>
                <td>
                  <div className="cd-wt-product-cell">
                    <img
                      src={item.imagePath ? (item.imagePath.startsWith('http') ? item.imagePath : `${API_BASE}/${item.imagePath}`) : 'https://via.placeholder.com/70'}
                      alt={item.productName}
                      className="cd-wt-img"
                    />
                    <span className="cd-wt-name" onClick={() => navigate(`/product/${item.productId}`)}>{item.productName}</span>
                  </div>
                </td>
                <td><span className="cd-wt-price">Rs. {Number(item.price || 0).toLocaleString()}</span></td>
                <td><span className="cd-wt-stock-in">In Stock</span></td>
                <td>
                   <div className="cd-wt-actions">
                      <button className="cd-wt-btn-solid" onClick={() => onAddToCart(item)}>Add To Cart</button>
                      <button className="cd-wt-btn-outline" onClick={() => navigate(`/products/${item.productId}`)}>Quick View</button>
                   </div>
                </td>
                <td>
                  <button className="cd-wt-remove" onClick={() => onRemove(item.productId)} title="Remove item">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const ReviewsTab = ({ orders, navigate }) => {
  const [userReviews, setUserReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const userId = getCurrentUserId();

  useEffect(() => {
    const fetchUserReviews = async () => {
      try {
        setReviewsLoading(true);
        const res = await api.get(`/api/reviews/user/${userId}`);
        setUserReviews(res.data || []);
      } catch (err) {
        console.error("Failed to fetch user reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    };
    if (userId) fetchUserReviews();
  }, [userId]);

  const delivered = orders.filter(o => 
    (o.stage || o.status || "").toUpperCase() === "DELIVERED"
  );

  // Filter delivered items that don't have a review yet
  // This logic assumes we can match by productId easily or we just show all delivered as potential review candidates
  // Let's check delivered items and see if they exist in userReviews
  const unreviewedItems = delivered.filter(order => {
    const productId = order.items?.[0]?.productId;
    return !userReviews.some(rev => rev.productId === productId);
  });

  return (
    <div className="fade-in cd-reviews-section">
      <div className="cd-header" style={{ marginBottom: '30px' }}>
        <div className="cd-header-stack">
          <h2 className="cd-welcome">Product Reviews</h2>
          <p className="cd-date">Your shared experiences and pending feedback</p>
        </div>
      </div>

      {unreviewedItems.length > 0 && (
        <div className="cd-review-group">
          <div className="cd-group-label">
            <Star size={14} fill="#f59e0b" color="#f59e0b" />
            <span>Pending Reviews ({unreviewedItems.length})</span>
          </div>
          <div className="cd-grid-card">
            <div className="cd-compact-list" style={{ padding: '0px' }}>
              {unreviewedItems.map(order => {
                const mainItem = order.items?.[0];
                const productName = mainItem?.productName || mainItem?.name || mainItem?.productNameSnapshot || "Product";
                const firstImage = mainItem?.imagePath || mainItem?.imagePathSnapshot;

                return (
                  <div key={order.orderId || order.id} className="cd-review-item">
                    <div className="cd-review-media">
                       <img 
                          src={firstImage ? (firstImage.startsWith('http') ? firstImage : `${API_BASE}/${firstImage}`) : "https://via.placeholder.com/60"} 
                          alt="" 
                          className="cd-review-img" 
                       />
                       <div className="cd-badge-pro">UNREVIEWED</div>
                    </div>
                    <div className="cd-review-main">
                      <div className="cd-review-product-name">{productName}</div>
                      <div className="cd-review-order-info">Ordered on {new Date(order.orderDate || order.createdAt).toLocaleDateString()}</div>
                      <div className="cd-review-cta-text">Share your thoughts with other shoppers!</div>
                    </div>
                    <div className="cd-review-actions">
                      <button 
                        className="cd-wt-btn-solid"
                        onClick={() => {
                          localStorage.setItem("reviewOrderId", order.orderId || order.id);
                          if (mainItem?.productId) localStorage.setItem("reviewProductId", mainItem.productId);
                          localStorage.setItem("reviewMode", "create");
                          navigate("/review");
                        }}
                      >
                         RATE PRODUCT
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="cd-review-group" style={{ marginTop: '40px' }}>
        <div className="cd-group-label">
          <CheckCircle size={14} color="#10b981" />
          <span>My Published Reviews ({userReviews.length})</span>
        </div>
        
        {reviewsLoading ? (
           <div className="cd-empty-mini">Loading your reviews...</div>
        ) : userReviews.length > 0 ? (
          <div className="cd-review-archive-grid">
            {userReviews.map(review => (
              <div key={review.id} className="cd-review-card-modern">
                <div className="cd-rev-card-header">
                   <div className="cd-rev-stars">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={12} fill={s <= review.rating ? "#f59e0b" : "none"} color="#f59e0b" />
                      ))}
                   </div>
                   <span className="cd-rev-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="cd-rev-product-strip">
                   <img src={review.productImage ? (review.productImage.startsWith('http') ? review.productImage : `${API_BASE}/${review.productImage}`) : "https://via.placeholder.com/40"} alt="" />
                   <span>{review.productName}</span>
                </div>
                <p className="cd-rev-comment">"{review.comment}"</p>
                {review.imagePath && (
                   <div className="cd-rev-attachment">
                      <img src={`${API_BASE}/${review.imagePath}`} alt="review proof" />
                   </div>
                )}
                <div className="cd-rev-footer">
                   <button className="cd-rev-edit-btn" onClick={() => {
                      localStorage.setItem("reviewMode", "edit");
                      localStorage.setItem("reviewData", JSON.stringify(review));
                      localStorage.setItem("reviewProductId", review.productId);
                      navigate("/review");
                   }}>Update Review</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="cd-card cd-empty-reviews" style={{ background: '#fff', border: '1px dashed #e2e8f0', borderRadius:'16px' }}>
            <EmptyState text="You haven't written any reviews yet." />
          </div>
        )}
      </div>
    </div>
  );
};

const AccountSettingsTab = ({ user, setUserProfile }) => (
  <div className="fade-in">
    <div className="cd-header">
      <h1 className="cd-welcome gt-h3">Settings</h1>
      <p className="cd-date gt-note">Manage your profile</p>
    </div>
    <div className="cd-card">
       <UpdateAccount onUpdateSuccess={(data) => setUserProfile(prev => ({...prev, ...data}))} />
    </div>
  </div>
);

const StatCard = ({ icon, value, label, color }) => (
  <div className="cd-stat-card">
    <div className="cd-stat-icon" style={{ backgroundColor: `${color}15`, color: color }}>
      {icon}
    </div>
    <div className="cd-stat-info">
      <span className="cd-stat-label gt-note">{label}</span>
      <h3 className="cd-stat-value gt-h3">{value}</h3>
    </div>
  </div>
);

const OrderItem = ({ order, showActions, onCancel, onAddToCart, setActiveTab }) => {
  const [expanded, setExpanded] = useState(false);
  const [reportConfig, setReportConfig] = useState({ isOpen: false, item: null });
  const navigate = useNavigate();
  const rawStatus = (order.stage || order.status || 'PENDING').toUpperCase();
  
  // Normalize status for badges and stepper
  const status = rawStatus === 'NEW' ? 'PLACED' : rawStatus;
  const canCancel = ["PLACED", "PENDING", "PROCESSING"].includes(status);

  const oid = order.orderId || order.id;
  const oidDisplay = isNaN(oid) ? oid : `ORD-${String(oid).padStart(5, '0')}`;
  
  const productNames = order.items?.length > 0 
    ? order.items.map(i => i.productName || i.name || i.productNameSnapshot).filter(Boolean)
    : [];
  
  const title = productNames.length > 0 
    ? productNames.slice(0, 2).join(", ") + (productNames.length > 2 ? "..." : "")
    : oidDisplay;

  const steps = ["PLACED", "PROCESSING", "SHIPPED", "DELIVERED"];
  const currentStepIndex = steps.indexOf(status) === -1 
      ? (["SHIPPED_TO_BRANCH", "OUT_FOR_DELIVERY"].includes(status) ? 2 : (status === "CANCELED" ? -1 : 0)) 
      : steps.indexOf(status);

  return (
    <div className={`cd-order-card-v3 ${expanded ? 'is-expanded' : ''}`}>
      <div className="cd-oc-header" onClick={() => setExpanded(!expanded)}>
        <div className="cd-oc-main-info">
          <div className="cd-oc-visuals">
             <div className="cd-oc-img-stack">
                {order.items?.slice(0, 3).map((item, i) => (
                  <img 
                    key={i}
                    src={item.imagePath ? (item.imagePath.startsWith('http') ? item.imagePath : `${API_BASE}/${item.imagePath}`) : "https://via.placeholder.com/80"} 
                    alt=""
                    className={`cd-oc-stack-img img-${i}`}
                  />
                ))}
                {order.items?.length > 3 && <div className="cd-oc-stack-more">+{order.items.length - 3}</div>}
             </div>
          </div>
          <div className="cd-oc-details">
            <div className="cd-oc-id-row">
               <span className="cd-oc-id gt-caption">{oidDisplay}</span>
               <span className={`cd-oc-status-pill status-${status.toLowerCase()}`}>
                  <span className="dot"></span> {status.replace(/_/g, " ")}
               </span>
            </div>
            <h4 className="cd-oc-title gt-h3">{title}</h4>
            <div className="cd-oc-meta gt-note">
               <Calendar size={12} />
               <span>Ordered {new Date(order.orderDate || order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
               <span className="dot">•</span>
               <span>{order.items?.length || 0} Items</span>
            </div>
          </div>
        </div>

        <div className="cd-oc-price-zone">
           <div className="cd-oc-amount">
              <span className="label gt-note">Grand Total</span>
              <span className="value">Rs. {Number(order.grandTotal || order.totalAmount || 0).toLocaleString()}</span>
           </div>
           <div className={`cd-oc-chevron ${expanded ? 'up' : ''}`}>
              <ChevronRight size={18} />
           </div>
        </div>
      </div>

      {expanded && (
        <div className="cd-order-expanded fade-in">
           {status !== "CANCELED" && (
             <div className="cd-stepper">
               {["Placed", "Processed", "Shipped", "Delivered"].map((step, idx) => (
                 <div key={step} className={`cd-step ${idx <= currentStepIndex ? "active" : ""}`}>
                   <div className="cd-step-circle">{idx <= currentStepIndex ? <Check size={18}/> : idx + 1}</div>
                   <span className="cd-step-label">{step}</span>
                 </div>
               ))}
             </div>
           )}

           <div className="cd-order-grid">
              <div className="cd-order-items-list">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="cd-compact-row" onClick={() => navigate(`/product/${item.productId}`)}>
                    <img 
                      src={item.imagePath ? (item.imagePath.startsWith('http') ? item.imagePath : `${API_BASE}/${item.imagePath}`) : "https://via.placeholder.com/50"} 
                      alt="" 
                      className="cd-order-img-mini"
                    />
                    <div className="cd-cr-info" style={{ marginLeft: '12px', flex: 1 }}>
                       <div className="cd-cr-id">{item.productName || item.name}</div>
                       <div className="cd-cr-date">Quantity: {item.quantity} · Rs. {item.unitPrice?.toLocaleString()}</div>
                    </div>
                    {status === 'DELIVERED' && (
                       <button 
                         className="lux-mini-btn" 
                         style={{ fontSize: '0.65rem', padding: '4px 10px', borderRadius: '8px', background: 'var(--porto-primary-fade)', color: 'var(--porto-primary)', border: 'none', fontWeight: '800' }}
                         onClick={(e) => {
                           e.stopPropagation();
                           setReportConfig({ isOpen: true, item: item });
                         }}
                       >
                         REPORT ISSUE
                       </button>
                    )}
                    <button className="cd-buy-again-btn" onClick={(e) => { 
                      e.stopPropagation(); 
                      if (onAddToCart) {
                        onAddToCart({
                          productId: item.productId,
                          productName: item.productName || item.name,
                          imagePath: item.imagePath,
                          price: item.unitPrice
                        });
                      } else {
                        navigate(`/products/${item.productId}`);
                      }
                    }}>Buy Again</button>
                  </div>
                ))}
              </div>
              
            <div className="cd-order-summary-box">
                  <div className="cd-summary-row"><span>Subtotal</span><span>Rs. {Number(order.itemsTotal || 0).toLocaleString()}</span></div>
                  {(order.discountTotal || 0) > 0 && <div className="cd-summary-row" style={{ color: '#ef4444' }}><span>Discount</span><span>-Rs. {Number(order.discountTotal).toLocaleString()}</span></div>}
                  <div className="cd-summary-row"><span>Shipping</span><span>{Number(order.shippingFee || 0) > 0 ? `Rs. ${Number(order.shippingFee).toLocaleString()}` : "Free"}</span></div>
                  <div className="cd-summary-row cd-summary-total"><span>Total</span><span>Rs. {Number(order.grandTotal || order.totalAmount || 0).toLocaleString()}</span></div>
                 
                 <div className={`cd-payment-info ${order.paymentReference ? 'paid' : 'pending'}`}>
                    {order.paymentMethod === 'ESEWA' ? (
                      order.paymentReference ? <><Check size={16}/> Paid via eSewa</> : (
                         status === 'CANCELED' ? ' Cancelled' : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '12px' }}>
                               <span style={{ color: '#d97706', fontWeight: 700, fontSize: '0.75rem' }}>⏳ Pending eSewa Payment</span>
                               <button 
                                 className="ua-primary-btn" 
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    api.post(`/api/payment/esewa/initiate`, { orderId: order.orderId || order.id })
                                       .then(res => {
                                          const form = document.createElement("form");
                                          form.setAttribute("method", "POST");
                                          form.setAttribute("action", res.data.epayUrl);
                                          Object.entries(res.data).forEach(([k, v]) => {
                                             if (k === 'epayUrl') return;
                                             const input = document.createElement("input");
                                             input.setAttribute("type", "hidden");
                                             input.setAttribute("name", k);
                                             input.setAttribute("value", v);
                                             form.appendChild(input);
                                          });
                                          document.body.appendChild(form);
                                          form.submit();
                                       })
                                       .catch(err => alert("Payment session failed to start. Please try again."));
                                 }}
                                 style={{ padding: '10px', fontSize: '0.7rem', background: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '8px', border: 'none', color: '#fff', cursor: 'pointer' }}
                               >
                                  <img src="https://esewa.com.np/common/images/esewa_logo.png" alt="" style={{ height: '12px', filter: 'brightness(0) invert(1)' }}/>
                                  PAY SECURELY NOW
                               </button>
                            </div>
                         )
                      )
                    ) : (
                      <><Package size={16}/> Cash on Delivery</>
                    )}
                 </div>

                 {/* Invoice Download Actions */}
                 {status === 'DELIVERED' && (
                    <InvoiceActions 
                      order={order} 
                      onSuccess={(msg) => {
                        // Show success message
                      }}
                    />
                 )}
                 
                 {showActions && canCancel && (
                    <button className="ua-primary-btn" onClick={(e) => { e.stopPropagation(); onCancel(order.orderId || order.id); }} style={{ background: '#fff', border: '2px solid #ef4444', color: '#ef4444', padding: '12px', fontSize: '0.8rem', marginTop: '20px' }}>CANCEL ORDER</button>
                 )}
                 {showActions && !canCancel && status !== 'DELIVERED' && (
                    <button className="ua-primary-btn" onClick={(e) => { e.stopPropagation(); navigate(`/customer/order/${oid}`); }} style={{ background: '#fff', border: '1px solid #94A3B8', color: '#64748B', padding: '12px', fontSize: '0.8rem', marginTop: '20px' }}>
                       TRACK SHIPMENT
                    </button>
                 )}
                 {status === 'DELIVERED' && (
                    <button className="ua-primary-btn" onClick={(e) => { e.stopPropagation(); setActiveTab('refunds'); }} style={{ background: 'var(--porto-primary)', color: '#fff', padding: '12px', fontSize: '0.8rem', marginTop: '20px', border: 'none' }}>
                       VIEW RETURN STATUS
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}

      {reportConfig.isOpen && reportConfig.item && (
         <ReportModal
           isOpen={reportConfig.isOpen}
           onClose={() => setReportConfig({ isOpen: false, item: null })}
           orderId={order.orderId || order.id}
           orderItemId={reportConfig.item.id}
           entityName={reportConfig.item.productName || reportConfig.item.name}
         />
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
            <div className="cd-header" style={{ borderBottom: 'none', marginBottom: '10px' }}>
              <div>
                <h2 className="cd-welcome">Address Book</h2>
                <p className="cd-date">Manage your delivery locations</p>
              </div>
              <button className="cd-wt-btn-solid" onClick={openAdd} style={{ padding: '10px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} />
                Add Address
              </button>
            </div>

            <div className="cd-address-grid">
               {addresses.map(addr => (
                  <div key={addr.id} className={`cd-address-card ${addr.isDefault ? 'default' : ''}`}>
                    <div className="cd-address-label">
                       <MapPin size={14} />
                       {addr.label} {addr.isDefault && "(Default)"}
                    </div>
                    <div className="cd-address-content">
                       <h4>{addr.receiverName || "Delivery Location"}</h4>
                       <p>{addr.street}, {addr.city}</p>
                       <p>{addr.state} {addr.zipCode}</p>
                       <p className="cd-address-phone">{addr.receiverPhone}</p>
                    </div>
                    <div className="cd-address-actions">
                       <button className="cd-address-edit-btn cd-wt-btn-outline" onClick={() => openEdit(addr)}>Edit Address</button>
                       <button className="cd-address-delete-btn cd-wt-btn-outline" onClick={() => handleDelete(addr.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
               ))}
               {addresses.length === 0 && <div className="cd-empty-mini">No addresses saved.</div>}
            </div>

            {showModal && (
                <div className="cd-modal-overlay" style={{ zIndex: 2000 }}>
                    <div className="cd-modal-card">
                        <div className="cd-modal-header">
                           <h3>{isEditing ? 'Edit Address' : 'New Physical Address'}</h3>
                           <button onClick={() => setShowModal(false)}></button>
                        </div>
                        <form onSubmit={handleSubmit} className="cd-modal-form" style={{ padding: '24px', display: 'grid', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                              <div className="ua-form-group">
                                  <label className="ua-label">Address Label</label>
                                  <input className="ua-input" value={formData.label || ''} onChange={e => setFormData({...formData, label: e.target.value})} placeholder="e.g. Home" required />
                              </div>
                              <div className="ua-form-group">
                                  <label className="ua-label">Recipient Name</label>
                                  <input className="ua-input" value={formData.receiverName || ''} onChange={e => setFormData({...formData, receiverName: e.target.value})} placeholder="Full Name" required />
                              </div>
                            </div>

                            <div className="ua-form-group">
                                <label className="ua-label">Phone Number</label>
                                <input className="ua-input" value={formData.receiverPhone || ''} onChange={e => setFormData({...formData, receiverPhone: e.target.value})} placeholder="98XXXXXXXX" required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="ua-form-group"><label className="ua-label">City</label><input className="ua-input" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} required /></div>
                                <div className="ua-form-group"><label className="ua-label">State</label><input className="ua-input" value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} required /></div>
                            </div>
                            
                            <div className="ua-form-group">
                                <label className="ua-label">Street Address</label>
                                <input className="ua-input" value={formData.street || ''} onChange={e => setFormData({...formData, street: e.target.value})} placeholder="Tole, House No." required />
                            </div>

                            <div className="cd-checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={formData.isDefault || false} onChange={e => setFormData({...formData, isDefault: e.target.checked})} id="isDefault" />
                                <label htmlFor="isDefault" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Set as primary shipping address</label>
                            </div>

                            <button type="submit" className="ua-primary-btn" style={{ marginTop: '10px' }}>
                                {isEditing ? 'UPDATE ADDRESS' : 'SAVE ADDRESS'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const AnalyticsTab = ({ userId }) => (
  <div className="fade-in">
    <AnalyticsDashboard userId={userId} />
  </div>
);

const NotificationPreferencesTab = ({ userId }) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const data = await getNotificationPreferences(userId);
      setPreferences(data);
    } catch (error) {
      console.error('Preferences error:', error);
    }
    setLoading(false);
  };

  const handleToggle = async (key, channel) => {
    if (!preferences) return;
    
    const updated = {
      ...preferences,
      [key]: {
        ...preferences[key],
        [channel]: !preferences[key][channel]
      }
    };
    
    setPreferences(updated);
    
    const result = await updateNotificationPreferences(userId, updated);
    if (result.success) {
      setToast({ show: true, message: "Preferences updated", type: "success" });
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading preferences...</div>;

  return (
    <div className="fade-in cd-notifications-container">
      <div className="cd-header" style={{ marginBottom: '30px' }}>
        <h2 className="cd-welcome gt-h3">Notification Preferences</h2>
        <p className="cd-date gt-note">Control how you receive updates from us</p>
      </div>

      {preferences && (
        <div className="cd-notification-sections">
          {/* Order Notifications */}
          <div className="cd-notification-section">
            <h3 className="section-title">📦 Order Notifications</h3>
            {['orderPlaced', 'orderShipped', 'orderDelivered', 'orderCancelled'].map(key => {
              const pref = preferences[key] || {};
              return (
                <div key={key} className="cd-notification-item">
                  <span className="item-name">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <div className="channel-toggles">
                    {['email', 'sms', 'push'].map(channel => (
                      <label key={channel} className="toggle-label">
                        <input 
                          type="checkbox" 
                          checked={pref[channel] || false}
                          onChange={() => handleToggle(key, channel)}
                        />
                        <span className="toggle-text">{channel.toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Promotions */}
          <div className="cd-notification-section">
            <h3 className="section-title">🎁 Promotions & Offers</h3>
            {['promotionalOffers', 'flashSales', 'personalizedRecommendations'].map(key => {
              const pref = preferences[key] || {};
              return (
                <div key={key} className="cd-notification-item">
                  <span className="item-name">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <div className="channel-toggles">
                    {['email', 'sms', 'push'].map(channel => (
                      <label key={channel} className="toggle-label">
                        <input 
                          type="checkbox" 
                          checked={pref[channel] || false}
                          onChange={() => handleToggle(key, channel)}
                        />
                        <span className="toggle-text">{channel.toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Account Security */}
          <div className="cd-notification-section">
            <h3 className="section-title">🔒 Account Security</h3>
            {['accountSecurityAlerts', 'passwordChanged', 'newDevice'].map(key => {
              const pref = preferences[key] || {};
              return (
                <div key={key} className="cd-notification-item">
                  <span className="item-name">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <div className="channel-toggles">
                    {['email', 'sms', 'push'].map(channel => (
                      <label key={channel} className="toggle-label">
                        <input 
                          type="checkbox" 
                          checked={pref[channel] || false}
                          onChange={() => handleToggle(key, channel)}
                        />
                        <span className="toggle-text">{channel.toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}
    </div>
  );
};

const DataExportTab = ({ userId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  const handleExport = async (format) => {
    setLoading(true);
    let result;
    if (format === 'csv') {
      result = await exportOrderHistoryCSV(userId);
    } else if (format === 'pdf') {
      result = await exportOrderHistoryPDF(userId);
    } else {
      result = await exportPersonalData(userId);
    }
    setLoading(false);
    
    if (result.success) {
      setToast({ show: true, message: result.message, type: "success" });
    } else {
      setToast({ show: true, message: result.message || "Export failed", type: "error" });
    }
  };

  return (
    <div className="fade-in cd-data-export-container">
      <div className="cd-export-section">
        <h3 className="gt-h3">📥 Export Your Data</h3>
        <p className="gt-note">Download your order history and personal information</p>
        
        <div className="cd-export-options">
          <div className="export-card">
            <FileText size={32} />
            <h4>Order History (CSV)</h4>
            <p>Spreadsheet format, easy to analyze</p>
            <button 
              className="export-btn"
              onClick={() => handleExport('csv')}
              disabled={loading}
            >
              <Download size={16} /> Download CSV
            </button>
          </div>

          <div className="export-card">
            <FileText size={32} />
            <h4>Order History (PDF)</h4>
            <p>Print-friendly format</p>
            <button 
              className="export-btn"
              onClick={() => handleExport('pdf')}
              disabled={loading}
            >
              <Download size={16} /> Download PDF
            </button>
          </div>

          <div className="export-card">
            <FileText size={32} />
            <h4>Personal Data</h4>
            <p>Complete account information</p>
            <button 
              className="export-btn"
              onClick={() => handleExport('json')}
              disabled={loading}
            >
              <Download size={16} /> Download JSON
            </button>
          </div>
        </div>
      </div>

      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}
    </div>
  );
};

const EmptyState = ({ text }) => (
  <div style={{ textAlign: 'center', padding: '32px', color: '#999' }}>
    <p style={{ fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.7rem' }}>{text}</p>
  </div>
);
