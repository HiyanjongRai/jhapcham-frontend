import React, { useEffect, useState } from "react";
import "./seller.css";
import {
  Package,
  ShoppingBag,
  DollarSign,
  Clock,
  Flag
} from "lucide-react";
import { useNavigate, useLocation, useOutletContext } from "react-router-dom";
import { getCurrentUserId } from "../config/authUtils";
import { apiGetSellerOrders } from "../AddCart/cartUtils";
import { API_BASE } from "../config/config";
import UpdateAccount from "../Profile/UpdateAccount.jsx";
import SellerSettings from "./SellerSettings.jsx";

export default function SellerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { storeInfo } = useOutletContext();
  const sellerId = getCurrentUserId();

  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "overview");
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    productsCount: 0,
    weeklySales: [0, 0, 0, 0, 0, 0, 0],
    topSellingProducts: []
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync activeTab with location state
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

   // Data Loading
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Dashboard Stats
        const statsRes = await fetch(`${API_BASE}/api/seller/${sellerId}/dashboard`);
        if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats({
                totalSales: statsData.totalIncome || 0,
                totalOrders: statsData.totalOrders || 0,
                pendingOrders: statsData.pendingOrders || 0,
                productsCount: statsData.totalProducts || 0,
                weeklySales: statsData.weeklySales || [0, 0, 0, 0, 0, 0, 0],
                topSellingProducts: statsData.topSellingProducts || []
            });
        }

        // Fetch Recent Orders
        const orders = await apiGetSellerOrders(sellerId);
        if (Array.isArray(orders)) {
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
  }, [sellerId]);

  // Fetch Reports when tab is active
  useEffect(() => {
    if (activeTab === 'reports' && sellerId) {
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

  const getWeekDays = () => {
     const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
     const today = new Date().getDay();
     const result = [];
     for(let i=6; i>=0; i--) {
        let d = (today - i + 7) % 7;
        result.push(days[d]);
     }
     return result;
  };

  const weekLabels = getWeekDays();
  const maxSale = Math.max(...stats.weeklySales, 1);

  if (loading && !stats.totalSales && recentOrders.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
         <div className="so-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-content-inner">
      <div className="dash-header-row">
         <div>
            <h2>Dashboard Overview</h2>
            <p className="text-gray">Welcome back, <strong>{storeInfo?.storeName || 'Merchant'}</strong>! Here's your store performance.</p>
         </div>
         
         <div style={{display:'flex', gap:'10px'}}>
           <button className="btn-secondary-outline" onClick={() => setActiveTab('settings')}>Store Settings</button>
           <button className="btn-primary" onClick={() => navigate('/seller/add-product')}>+ Add Product</button>
         </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
             <div className="stat-card">
                <div className="stat-icon purple"><DollarSign size={24} /></div>
                <div className="stat-info">
                   <span className="stat-label">Total Sales</span>
                   <h3 className="stat-value">Rs. {stats.totalSales.toLocaleString()}</h3>
                </div>
             </div>
             
             <div className="stat-card">
                <div className="stat-icon blue"><ShoppingBag size={24} /></div>
                <div className="stat-info">
                   <span className="stat-label">Total Orders</span>
                   <h3 className="stat-value">{stats.totalOrders}</h3>
                </div>
             </div>

             <div className="stat-card">
                <div className="stat-icon orange"><Clock size={24} /></div>
                <div className="stat-info">
                   <span className="stat-label">Pending Orders</span>
                   <h3 className="stat-value">{stats.pendingOrders}</h3>
                </div>
             </div>

             <div className="stat-card">
                <div className="stat-icon green"><Package size={24} /></div>
                <div className="stat-info">
                   <span className="stat-label">Total Products</span>
                   <h3 className="stat-value">{stats.productsCount}</h3>
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
                                  <td>Rs. {(order.totalPrice || order.grandTotal || 0).toFixed(2)}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                    ) : (
                      <p className="empty-text">No orders yet.</p>
                    )}
                 </div>
              </div>

              {/* Sales Chart */}
              <div className="dashboard-panel">
                 <div className="panel-header">
                    <h3>Weekly Sales</h3>
                    <div className="chart-legend">
                      <span className="legend-dot"></span>
                      <span className="legend-text">Sales (Rs)</span>
                    </div>
                 </div>
                 <div className="mock-chart-container">
                    <div className="chart-bars">
                       {stats.weeklySales.map((sale, i) => (
                          <div 
                            key={i} 
                            className="chart-bar" 
                            style={{ height: `${(sale / maxSale) * 100}%` }} 
                            title={`${weekLabels[i]}: Rs. ${sale}`}
                          >
                              <div className="bar-tooltip">Rs. {sale}</div>
                          </div>
                       ))}
                    </div>
                    <div className="chart-labels">
                       {weekLabels.map(label => <span key={label}>{label}</span>)}
                    </div>
                 </div>
              </div>
          </div>

          {/* Top Products Section */}
          <div className="dashboard-panel" style={{ marginTop: '24px' }}>
              <div className="panel-header">
                  <h3>Your Top Products</h3>
                  <button className="btn-text" onClick={() => navigate('/seller/products')}>Product Manager</button>
              </div>
              <div className="top-products-grid">
                  {stats.topSellingProducts.length > 0 ? stats.topSellingProducts.map(prod => (
                      <div key={prod.productId} className="mini-product-card" onClick={() => navigate(`/products/${prod.productId}`)}>
                          <div className="mini-prod-img">
                              {prod.mainImage ? (
                                  <img src={`${API_BASE}/${prod.mainImage}`} alt={prod.name} />
                              ) : (
                                  <Package size={24} color="#ccc" />
                              )}
                          </div>
                          <div className="mini-prod-info">
                              <span className="mini-prod-name">{prod.name}</span>
                              <span className="mini-prod-price">Rs. {prod.price}</span>
                          </div>
                      </div>
                  )) : (
                      <p className="empty-text">Update your inventory to see products here.</p>
                  )}
              </div>
          </div>
        </>
      ) : null}

      {activeTab === 'settings' && (
        <div className="dashboard-fade-in">
           <SellerSettings />
        </div>
      )}

      {activeTab === 'account' && (
        <div className="dashboard-fade-in">
           <UpdateAccount onUpdateSuccess={() => {}} />
        </div>
      )}

      {activeTab === 'reports' && (
          <div className="dashboard-panel dashboard-fade-in">
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
                                                  <img src={report.reportedEntityImage.startsWith('http') ? report.reportedEntityImage : `${API_BASE}/${report.reportedEntityImage}`} 
                                                       alt="" style={{width:'32px', height:'32px', borderRadius:'4px', objectFit:'cover'}} />
                                              )}
                                              <span>{report.reportedEntityName}</span>
                                              <span className="type-badge">
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
  );
}
