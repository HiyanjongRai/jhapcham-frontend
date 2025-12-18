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

  Clock,
  Flag
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUserId } from "../config/authUtils";
import { apiGetSellerOrders } from "../AddCart/cartUtils";
import { API_BASE } from "../config/config";
import UpdateAccount from "../Profile/UpdateAccount.jsx";

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
  const [activeTab, setActiveTab] = useState("overview");
  const [recentOrders, setRecentOrders] = useState([]);
  const [reports, setReports] = useState([]);
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
    if (sellerId) fetchData();
  }, [sellerId, navigate]);

  // Fetch Reports when tab is active
  useEffect(() => {
    if (activeTab === 'reports' && sellerId) {
        // Fetch reports
        const fetchReports = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/reports/seller/me`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setReports(data);
                }
            } catch (err) {
                console.error("Failed to fetch reports", err);
            }
        };
        fetchReports();
    }
  }, [activeTab, sellerId]);

  const menuItems = [
    { icon: <Home size={18} />, label: "Overview", path: "/seller/dashboard" }, // Fixed path
    { icon: <Package size={18} />, label: "Add Products", path: "/seller/add-product" },
    { icon: <Package size={18} />, label: "Products", path: "/seller/products" },
    { icon: <Users size={18} />, label: "Customer", path: "/seller/customers" }, // Note: No route for this yet in App.js
    { icon: <ShoppingBag size={18} />, label: "Orders", path: "/seller/orders" },
    { icon: <Truck size={18} />, label: "Shipment", path: "/seller/shipment" }, 
    { icon: <Settings size={18} />, label: "Store Setting", tab: "settings" },
    { icon: <Share2 size={18} />, label: "Platform Partner", path: "/seller/partners" }, 
    { icon: <Share2 size={18} />, label: "Platform Partner", path: "/seller/partners" },
    { icon: <Flag size={18} />, label: "Reports", tab: "reports" }, 
    { icon: <MessageCircle size={18} />, label: "Feedback", path: "/seller/feedback" }, // No route
    { icon: <HelpCircle size={18} />, label: "Help & Support", path: "/seller/help" }, // No route
  ];

  const handleMenuClick = (item) => {
    if (item.tab) {
      setActiveTab(item.tab);
    } else {
      setActiveTab("overview");
      navigate(item.path);
    }
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
                className={"sidebar-menu-item" + ((activeTab === item.tab || location.pathname === item.path) ? " active" : "")}
                onClick={() => handleMenuClick(item)}
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
             <button className="btn-secondary" onClick={() => setActiveTab('settings')} style={{backgroundColor:'#f0f0f0', color:'#333', border:'1px solid #ccc'}}>Edit Profile</button>
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
                                <td>{order.customer?.fullName || order.customer?.username || order.customerName || "Guest"}</td>
                                <td>
                                   <span className={`status-badge ${order.status?.toLowerCase()}`}>
                                      {order.status}
                                   </span>
                                </td>
                                <td>${(order.totalPrice || order.grandTotal || 0).toFixed(2)}</td>
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

        {activeTab === 'settings' && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
             <UpdateAccount />
          </div>
        )}

        {activeTab === 'reports' && (
            <div className="dashboard-panel" style={{ marginTop: '2rem' }}>
                <div className="panel-header">
                    <h3>Reports on Your Products</h3>
                </div>
                <div className="recent-orders-table-wrapper">
                    {reports.length > 0 ? (
                        <table className="simple-table">
                            <thead>
                                <tr>
                                    <th>Report ID</th>
                                    <th>Entity</th>
                                    <th>Reason</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map(report => (
                                    <tr key={report.id}>
                                        <td>#{report.id}</td>
                                        <td>
                                            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                                {report.reportedEntityImage && (
                                                    <img src={report.reportedEntityImage.startsWith('http') ? report.reportedEntityImage : `${API_BASE}/uploads/${report.reportedEntityImage}`} 
                                                         alt="" style={{width:'32px', height:'32px', borderRadius:'4px', objectFit:'cover'}} />
                                                )}
                                                <span>{report.reportedEntityName}</span>
                                                <span style={{fontSize:'0.8em', background:'#eee', padding:'2px 6px', borderRadius:'4px', marginLeft:'5px'}}>
                                                    {report.type}
                                                </span>
                                            </div>
                                        </td>
                                        <td>{report.reason}</td>
                                        <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-badge ${report.status?.toLowerCase()}`}>
                                                {report.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="empty-text">No reports found.</p>
                    )}
                </div>
            </div>
        )}

      </div>
    </div>
  );
}
