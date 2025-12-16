import React, { useEffect, useState } from "react";
import "./seller.css";
import {
  Home,
  Package,
  Users,
  ShoppingBag,
  Truck,
  Settings,
  Share2,
  MessageCircle,
  HelpCircle,
  DollarSign,
  TrendingUp,
  Clock
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUserId } from "../config/authUtils";
import { apiGetSellerOrders } from "../AddCart/cartUtils";
import { API_BASE } from "../config/config";

export default function SellerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const sellerId = getCurrentUserId();

  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    productsCount: 0 
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

   // Stats Loading
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Check Application Status First
        const statusRes = await fetch(`${API_BASE}/api/seller/${sellerId}/application-status`);
        if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.status === "PENDING" || statusData.status === "NONE" || statusData.status === "REJECTED") {
                 // Redirect to application page if not approved
                 // BUT only if we are not already there (which we aren't, this is Dashboard)
                 if (statusData.status === "PENDING") {
                     navigate("/seller-application", { state: { message: "Your application is pending. You can update documents if needed." } });
                     return; 
                 } else if (statusData.status === "NONE") {
                     navigate("/seller-application");
                     return;
                 }
                 // If REJECTED, maybe show in dashboard or redirect? stuck to dashboard for now or show alert
            }
        }

        // 1. Fetch Dashboard Stats (Server-side calculation)
        // Endpoint: GET /api/seller/{sellerUserId}/dashboard
        const statsRes = await fetch(`${API_BASE}/api/seller/${sellerId}/dashboard`);
        if (statsRes.ok) {
            const statsData = await statsRes.json();
            // Map backend DTO to local state
            setStats({
                totalSales: statsData.totalIncome || 0,
                totalOrders: statsData.totalOrders || 0,
                pendingOrders: statsData.pendingOrders || 0,
                productsCount: statsData.totalProducts || 0
            });
        }

        // 2. Fetch Recent Orders List (for the table)
        // We still need the list, but we don't need to calculate stats from it anymore
        const orders = await apiGetSellerOrders(sellerId);
        
        if (Array.isArray(orders)) {
             // Sort by date desc for recent
             const sorted = [...orders].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
             setRecentOrders(sorted.slice(0, 5));
        }

      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    if (sellerId) fetchData();
  }, [sellerId, navigate]);

  const menuItems = [
    { icon: <Home size={18} />, label: "Overview", path: "/seller/dashboard" }, // Fixed path
    { icon: <Package size={18} />, label: "Add Products", path: "/seller/add-product" },
    { icon: <Package size={18} />, label: "Products", path: "/seller/products" },
    { icon: <Users size={18} />, label: "Customer", path: "/seller/customers" }, // Note: No route for this yet in App.js
    { icon: <ShoppingBag size={18} />, label: "Orders", path: "/seller/orders" },
    { icon: <Truck size={18} />, label: "Shipment", path: "/seller/shipment" }, // Note: No route for this yet
    { icon: <Settings size={18} />, label: "Store Setting", path: "/seller/settings" },
    { icon: <Share2 size={18} />, label: "Platform Partner", path: "/seller/partners" }, // No route
    { icon: <MessageCircle size={18} />, label: "Feedback", path: "/seller/feedback" }, // No route
    { icon: <HelpCircle size={18} />, label: "Help & Support", path: "/seller/help" }, // No route
  ];

  const handleMenuClick = (path) => {
    navigate(path);
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span>Seller Panel</span>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                className={"sidebar-menu-item" + (isActive ? " active" : "")}
                onClick={() => handleMenuClick(item.path)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="dashboard-content">
        <div className="dash-header-row">
           <div>
              <h2>Dashboard Overview</h2>
              <p className="text-gray">Welcome back! Here's what's happening with your store today.</p>
           </div>
           
           <div style={{display:'flex', gap:'10px'}}>
             <button className="btn-secondary" onClick={() => navigate('/seller/settings')} style={{backgroundColor:'#f0f0f0', color:'#333', border:'1px solid #ccc'}}>Edit Profile</button>
             <button className="btn-primary" onClick={() => navigate('/seller/add-product')}>+ Add Product</button>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
           <div className="stat-card">
              <div className="stat-icon purple"><DollarSign size={24} /></div>
              <div className="stat-info">
                 <span className="stat-label">Total Sales</span>
                 <h3 className="stat-value">Rs. {stats.totalSales.toLocaleString()}</h3>
                 <span className="stat-trend positive">Gross Income</span>
              </div>
           </div>
           
           <div className="stat-card">
              <div className="stat-icon blue"><ShoppingBag size={24} /></div>
              <div className="stat-info">
                 <span className="stat-label">Total Orders</span>
                 <h3 className="stat-value">{stats.totalOrders}</h3>
                 <span className="stat-trend positive">Lifetime orders</span>
              </div>
           </div>

           <div className="stat-card">
              <div className="stat-icon orange"><Clock size={24} /></div>
              <div className="stat-info">
                 <span className="stat-label">Pending Orders</span>
                 <h3 className="stat-value">{stats.pendingOrders}</h3>
                 <span className="stat-trend warning">Action needed</span>
              </div>
           </div>

           <div className="stat-card">
              <div className="stat-icon green"><Package size={24} /></div>
              <div className="stat-info">
                 <span className="stat-label">Total Products</span>
                 <h3 className="stat-value">{stats.productsCount}</h3>
                 <span className="stat-trend">Inventory Count</span>
              </div>
           </div>
        </div>

        <div className="dashboard-grid-2">
            
            {/* Recent Orders */}
            <div className="dashboard-panel">
               <div className="panel-header">
                  <h3>Recent Orders</h3>
                  <button className="btn-text" onClick={() => navigate('/seller/orders')}>View All</button>
               </div>
               <div className="recent-orders-table-wrapper">
                  {recentOrders.length > 0 ? (
                    <table className="simple-table">
                       <thead>
                          <tr>
                             <th>Order ID</th>
                             <th>Customer</th>
                             <th>Status</th>
                             <th>Amount</th>
                          </tr>
                       </thead>
                       <tbody>
                          {recentOrders.map(order => (
                             <tr key={order.id || order.orderId}>
                                <td>#{String(order.id || order.orderId).slice(-6)}</td>
                                <td>{order.customerName || "Guest"}</td>
                                <td>
                                   <span className={`status-badge ${order.status?.toLowerCase()}`}>
                                      {order.status}
                                   </span>
                                </td>
                                <td>${(order.grandTotal || 0).toFixed(2)}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                  ) : (
                    <p className="empty-text">No orders yet.</p>
                  )}
               </div>
            </div>

            {/* Sales Chart Placeholder */}
            <div className="dashboard-panel">
               <div className="panel-header">
                  <h3>Weekly Sales</h3>
                  <select className="small-select">
                     <option>This Week</option>
                     <option>Last Week</option>
                  </select>
               </div>
               <div className="mock-chart-container">
                  {/* CSS Bar Chart */}
                  <div className="chart-bars">
                     <div className="chart-bar" style={{height: '40%'}} title="Mon"></div>
                     <div className="chart-bar" style={{height: '65%'}} title="Tue"></div>
                     <div className="chart-bar" style={{height: '50%'}} title="Wed"></div>
                     <div className="chart-bar" style={{height: '80%'}} title="Thu"></div>
                     <div className="chart-bar" style={{height: '60%'}} title="Fri"></div>
                     <div className="chart-bar" style={{height: '90%'}} title="Sat"></div>
                     <div className="chart-bar" style={{height: '45%'}} title="Sun"></div>
                  </div>
                  <div className="chart-labels">
                     <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
               </div>
            </div>

        </div>

      </div>
    </div>
  );
}
