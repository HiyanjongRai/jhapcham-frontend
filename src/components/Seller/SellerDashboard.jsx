import React, { useEffect, useState } from "react";
import "./seller.css";
import {
  Package,
  ShoppingBag,
  DollarSign,
  Clock,
  Plus,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Store,
  Zap,
  ShieldCheck,
  BarChart2,
  Bell,
  MessageCircle,
  User
} from "lucide-react";
import { useNavigate, useLocation, useOutletContext } from "react-router-dom";
import { getCurrentUserId } from "../../utils/authUtils";
import { apiGetSellerOrders } from "../AddCart/cartUtils";
import { API_BASE } from "../config/config";
import UpdateAccount from "../Profile/UpdateAccount.jsx";
import SellerSettings from "./SellerSettings.jsx";
import SellerCampaigns from "./SellerCampaigns.jsx";
import api from "../../api/axios";

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
    topSellingProducts: []
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.state?.activeTab) setActiveTab(location.state.activeTab);
  }, [location.state]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const statsRes = await fetch(`${API_BASE}/api/seller/${sellerId}/dashboard`);
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(prev => ({
            ...prev,
            totalSales: data.totalIncome || 0,
            totalOrders: data.totalOrders || 0,
            pendingOrders: data.pendingOrders || 0,
            productsCount: data.totalProducts || 0,
            topSellingProducts: data.topSellingProducts || []
          }));
        }
        const orders = await apiGetSellerOrders(sellerId);
        if (Array.isArray(orders)) {
          setRecentOrders([...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
        }
        try {
          const reportsRes = await api.get('/api/reports/seller/me');
          if (reportsRes.data) setReports(reportsRes.data);
        } catch (_) {}
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    if (sellerId) fetchData();
  }, [sellerId]);

  if (loading && !stats.totalSales && recentOrders.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div className="so-spinner" />
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading Workspace...</p>
      </div>
    );
  }

  const storeName = storeInfo?.shopName || storeInfo?.storeName || 'Your Store';
  const totalRevenue = stats.totalSales;
  const tier = totalRevenue < 50000 ? 'SILVER' : totalRevenue < 200000 ? 'GOLD' : 'PLATINUM';
  const nextTarget = totalRevenue < 50000 ? 50000 : totalRevenue < 200000 ? 200000 : 500000;
  const progress = Math.min((totalRevenue / nextTarget) * 100, 100);

  const spotlight = stats.topSellingProducts[0] || {
    name: "No products yet",
    productId: "N/A",
    price: 0,
    stockCount: 0,
    soldCount: 0,
    mainImage: null
  };

  const statCards = [
    {
      icon: <DollarSign size={22} />,
      label: "Total Revenue",
      value: `Rs. ${totalRevenue.toLocaleString()}`,
      sub: "+21.4% vs last week",
      subColor: "#10b981",
      iconBg: "rgba(0,136,204,0.1)",
      iconColor: "#0088cc",
      showSparkline: true
    },
    {
      icon: <ShoppingBag size={22} />,
      label: "Total Orders",
      value: stats.totalOrders,
      sub: "Consolidated Volume",
      iconBg: "#EEF2FF",
      iconColor: "#6366F1"
    },
    {
      icon: <Clock size={22} />,
      label: "Pending Orders",
      value: stats.pendingOrders,
      sub: stats.pendingOrders > 0 ? "Requires Action" : "All clear!",
      subColor: stats.pendingOrders > 0 ? "#f59e0b" : "#10b981",
      iconBg: "#F0F9FF",
      iconColor: "#0EA5E9"
    },
    {
      icon: <Package size={22} />,
      label: "Active Inventory",
      value: stats.productsCount,
      sub: "Live on Platform",
      iconBg: "#F1F5F9",
      iconColor: "#475569"
    }
  ];

  const quickActions = [
    { icon: <ShoppingBag size={20} />, label: 'Orders', sub: 'Manage sales', path: '/seller/orders' },
    { icon: <Package size={20} />, label: 'Inventory', sub: 'Manage products', path: '/seller/products' },
    { icon: <BarChart2 size={20} />, label: 'Reports', sub: 'View insights', tab: 'reports' },
    { icon: <Store size={20} />, label: 'Store Profile', sub: 'Edit details', path: '/seller/profile' },
  ];

  return (
    <div className="dashboard-content-inner">

      {/* ── Overview Tab ─────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          {/* Hero Section - mirrors Customer loyalty card layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, marginBottom: 28 }}>
            {/* Store Identity Card */}
            <div style={{
              background: 'linear-gradient(135deg, #1a1f2e 0%, #0a1628 60%, #0d2040 100%)',
              borderRadius: 24,
              padding: 36,
              position: 'relative',
              overflow: 'hidden',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 220
            }}>
              {/* Glow orb */}
              <div style={{
                position: 'absolute', top: -60, right: -60,
                width: 220, height: 220,
                background: 'radial-gradient(circle, rgba(0,136,204,0.35) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none'
              }} />
              <div style={{
                position: 'absolute', bottom: -40, left: 40,
                width: 140, height: 140,
                background: 'radial-gradient(circle, rgba(0,136,204,0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none'
              }} />

              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 99, padding: '6px 14px',
                  fontSize: '0.7rem', fontWeight: 800, color: '#fff',
                  textTransform: 'uppercase', letterSpacing: '0.08em'
                }}>
                  <ShieldCheck size={13} />
                  <span>{tier} PARTNER</span>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  borderRadius: 99, padding: '6px 14px',
                  fontSize: '0.7rem', fontWeight: 800, color: '#fbbf24'
                }}>
                  <Zap size={12} fill="#fbbf24" />
                  <span>{Math.floor(totalRevenue / 10).toLocaleString()} PTS</span>
                </div>
              </div>

              {/* Store name */}
              <div style={{ zIndex: 1 }}>
                 <h2 className="gt-h2" style={{
                  fontFamily: "var(--s-font)",
                  fontSize: '1.9rem', fontWeight: 800,
                  color: '#fff', letterSpacing: '-1px',
                  margin: '0 0 4px'
                }}>{ storeName}</h2>
                <p className="gt-note" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500, margin: 0 }}>
                  Official Merchant Partner · Jhapcham
                </p>
              </div>

              {/* Progress bar */}
              <div style={{ zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  <span>Next Tier: Rs. {nextTarget.toLocaleString()}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #0088cc, #00b4ff)',
                    transition: 'width 1s ease'
                  }} />
                </div>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => action.tab ? setActiveTab(action.tab) : navigate(action.path)}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 8,
                    padding: 20, borderRadius: 18, border: '1px solid var(--s-border)',
                    background: '#fff', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#0088cc'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,136,204,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--s-border)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'rgba(0,136,204,0.1)', color: '#0088cc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {action.icon}
                  </div>
                  <div>
                    <div className="gt-caption" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#222529' }}>{action.label}</div>
                    <div className="gt-note" style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>{action.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            {statCards.map((card, i) => (
              <div key={i} className="stat-card">
                <div className="stat-info">
                  <div className="stat-icon-wrap" style={{ background: card.iconBg, color: card.iconColor }}>
                    {card.icon}
                  </div>
                  <span className="stat-label gt-note">{card.label}</span>
                  <h3 className="stat-value gt-h3">{card.value}</h3>
                  <div className="stat-growth gt-note" style={{ color: card.subColor || 'var(--s-text-muted)' }}>
                    {card.sub}
                  </div>
                </div>
                {card.showSparkline && (
                  <svg className="sparkline-svg" viewBox="0 0 100 40">
                    <path d="M0 35 Q 20 10, 40 25 T 80 5 T 100 30" fill="none" stroke="#0088cc" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M0 35 Q 20 10, 40 25 T 80 5 T 100 30 V 40 H 0 Z" fill="rgba(0,136,204,0.08)" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Panels Row 1 — Orders + Chart */}
          <div className="dashboard-grid-2">
            <div className="dash-panel">
              <div className="panel-head">
                <h3 className="gt-caption">Recent Orders</h3>
                <a href="#" className="btn-view-all" onClick={e => { e.preventDefault(); navigate('/seller/orders'); }}>View All</a>
              </div>
              <div className="recent-orders-table-wrapper">
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length > 0 ? recentOrders.map(order => {
                      const oid = order.orderId || order.id;
                      const status = (order.status || 'NEW').toLowerCase().replace('cancelled', 'canceled');
                      return (
                        <tr key={oid} onClick={() => navigate(`/seller/order/${oid}`)}>
                          <td style={{ fontWeight: 700, color: '#6366f1' }}>#{String(oid).slice(-4)}</td>
                          <td style={{ fontWeight: 600 }}>{order.customerName || "Customer"}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`status-badge ${status}`}>{order.status || 'NEW'}</span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>
                            Rs. {Number(order.totalPrice || order.grandTotal || 0).toLocaleString()}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                          No orders yet. Your first sale is coming!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dash-panel">
              <div className="panel-head">
                <h3 className="gt-caption">Weekly Sales</h3>
                <div className="chart-overlay-links">
                  <span className="overlay-link" style={{ color: 'var(--s-primary)', fontWeight: 800 }}>This Week</span>
                  <span className="overlay-link">vs Last</span>
                </div>
              </div>
              <div className="sales-chart-wrap">
                <svg width="100%" height="160" viewBox="0 0 400 130">
                  <defs>
                    <linearGradient id="sgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0088cc" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0088cc" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 90 C 50 110, 80 50, 120 90 S 180 30, 240 68 S 320 110, 400 30"
                    fill="none" stroke="#0088cc" strokeWidth="3" strokeLinecap="round" />
                  <path d="M0 90 C 50 110, 80 50, 120 90 S 180 30, 240 68 S 320 110, 400 30 V 130 H 0 Z"
                    fill="url(#sgGrad)" />
                  <circle cx="240" cy="68" r="5" fill="#fff" stroke="#0088cc" strokeWidth="2" />
                  <circle cx="400" cy="30" r="5" fill="#fff" stroke="#0088cc" strokeWidth="2" />
                  <path d="M0 70 C 50 90, 150 100, 250 70 S 350 80, 400 72"
                    fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.6" />
                </svg>
                <div className="chart-labels">
                  {['WED', 'THU', 'FRI', 'SAT', 'SUN', 'MON', 'TUE'].map(d => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Panels Row 2 — Spotlight + Activity */}
          <div className="dashboard-grid-2" style={{ marginTop: 24 }}>
            <div className="dash-panel">
              <div className="panel-head">
                <h3 className="gt-caption">Top Product</h3>
                <a href="#" className="btn-view-all" onClick={e => { e.preventDefault(); navigate('/seller/products'); }}>Product Manager</a>
              </div>
              <div className="top-product-pro">
                <div className="pro-img-box">
                  {spotlight.mainImage ? (
                    <img src={`${API_BASE}/${spotlight.mainImage}`} alt={spotlight.name} />
                  ) : (
                    <img src="https://m.media-amazon.com/images/I/61t049C2tKL._AC_SX679_.jpg" alt="Product" />
                  )}
                </div>
                <div className="pro-details">
                  <h4 className="pro-name">{spotlight.name}</h4>
                  <div className="pro-meta">
                    <span>SKU: {spotlight.productId || 'N/A'}</span>
                    <span>•</span>
                    <span style={{ color: '#0088cc', fontWeight: 700 }}>In Stock: {spotlight.stockCount || 0}</span>
                  </div>

                  <div className="stock-meter">
                    <div className="meter-label">
                      <span>Sales Velocity</span>
                      <span>{spotlight.soldCount || 0} Sold</span>
                    </div>
                    <div className="meter-track">
                      <div className="meter-fill" style={{ width: `${Math.min(((spotlight.soldCount || 0) / 50) * 100, 100)}%` }} />
                    </div>
                  </div>

                  <div className="pro-stats-row">
                    <div className="pro-stat-box">
                      <span className="pro-stat-lab">Retail Price</span>
                      <span className="pro-stat-val">Rs. {(spotlight.price || 0).toLocaleString()}</span>
                    </div>
                    <div className="pro-stat-box">
                      <span className="pro-stat-lab">7D Sales</span>
                      <span className="pro-stat-val">{spotlight.soldCount || 0} Units</span>
                    </div>
                  </div>

                  <div className="pro-actions">
                    <button className="btn-pro-edit" onClick={() => navigate('/seller/products')}>Edit</button>
                    <button className="btn-pro-promote">Promote</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="dash-panel">
              <div className="panel-head">
                <h3 className="gt-caption">Activity Stream</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', cursor: 'pointer' }}>
                  Filter <ChevronRight size={13} style={{ transform: 'rotate(90deg)' }} />
                </div>
              </div>
              <div className="activity-stream">
                {[
                  { icon: <AlertCircle size={15} />, iconBg: 'rgba(239,68,68,0.1)', iconColor: '#ef4444', title: 'Order canceled by Customer', desc: `Hiyan Jang Rai · Rs. 1,900`, time: '3 mins ago' },
                  { icon: <Package size={15} />, iconBg: 'rgba(59,130,246,0.1)', iconColor: '#3b82f6', title: 'Product A added to inventory', desc: 'In Stock: 100 units', time: '2 mins ago' },
                  { icon: <ShoppingBag size={15} />, iconBg: 'rgba(99,102,241,0.1)', iconColor: '#6366f1', title: 'Product B listed', desc: 'In Stock: 50 units', time: '2 mins ago' },
                  { icon: <TrendingUp size={15} />, iconBg: 'rgba(16,185,129,0.1)', iconColor: '#10b981', title: 'Monthly sales target reached!', desc: 'Great work 🎉', time: 'Just now' },
                ].map((item, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-icon" style={{ background: item.iconBg, color: item.iconColor }}>
                      {item.icon}
                    </div>
                    <div className="activity-info">
                      <div className="activity-title gt-caption">{item.title}</div>
                      <div className="activity-desc gt-note">{item.desc}</div>
                    </div>
                    <div className="activity-time">{item.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Other Tabs ───────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="dashboard-fade-in"><SellerSettings /></div>
      )}

      {activeTab === 'account' && (
        <div className="dashboard-fade-in"><UpdateAccount onUpdateSuccess={() => {}} /></div>
      )}

      {activeTab === 'campaigns' && (
        <div className="dashboard-fade-in"><SellerCampaigns /></div>
      )}

      {activeTab === 'reports' && (
        <div className="dash-panel dashboard-fade-in">
          <div className="panel-head">
             <h3 className="gt-caption">Reports on Your Products</h3>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {report.reportedEntityImage && (
                            <img
                              src={report.reportedEntityImage.startsWith('http') ? report.reportedEntityImage : `${API_BASE}/${report.reportedEntityImage}`}
                              alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }}
                            />
                          )}
                          <span>{report.reportedEntityName}</span>
                          <span className="type-badge">{report.type}</span>
                        </div>
                      </td>
                      <td>{report.reason}</td>
                      <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                      <td><span className={`status-badge ${report.status?.toLowerCase()}`}>{report.status}</span></td>
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
