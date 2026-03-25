import React, { useState, useEffect, useMemo } from "react";
import "./AdminDashboard.css";
import { API_BASE } from "../config/config";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import UpdateAccount from "../Profile/UpdateAccount.jsx";
import ConfirmModal from "../Common/ConfirmModal.jsx";
import Toast from "../Toast/Toast.jsx";

// Recharts for Professional Analytics
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

import {
  Users, Boxes, AlertTriangle, FileText, Settings, LogOut,
  Shield, CheckCircle2, XCircle, ExternalLink, Eye, EyeOff,
  ChevronRight, TrendingUp, Store, Calendar, LayoutDashboard,
  MessageSquare, Search, X, Package, DollarSign, Star,
  ShoppingBag, Bell, AlertCircle, CheckCheck, RefreshCw, Zap,
  BarChart3, Lock, Unlock, Trash2, ListChecks, Filter
} from "lucide-react";
import MessageModal from "../Message/MessageModal.jsx";
import ResolutionModal from "./ResolutionModal.jsx";
import CreateCampaign from "./CreateCampaign.jsx";
import CategoryManager from "./CategoryManager.jsx";
import DashboardNavbar from "./DashboardNavbar.jsx";

// ─────────────────────────────────────────
// KPI Stat Card
// ─────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="adm-stat-card">
    <div className="adm-stat-icon-wrap" style={{ background: color + "18", color }}>
      <Icon size={22} />
    </div>
    <div className="adm-stat-info">
      <span className="adm-stat-label">{label}</span>
      <span className="adm-stat-value">{value}</span>
      {sub && <span className="adm-stat-sub">{sub}</span>}
    </div>
  </div>
);

// ─────────────────────────────────────────
// Badge
// ─────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    ACTIVE:               { cls: "badge-active",    text: "Active" },
    BLOCKED:              { cls: "badge-blocked",   text: "Blocked" },
    PENDING:              { cls: "badge-pending",   text: "Pending" },
    INACTIVE:             { cls: "badge-inactive",  text: "Inactive" },
    NEW:                  { cls: "badge-new",       text: "New" },
    UNDER_INVESTIGATION:  { cls: "badge-warning",   text: "Investigating" },
    RESOLVED:             { cls: "badge-active",    text: "Resolved" },
    RESOLVED_REFUNDED:    { cls: "badge-active",    text: "Refunded" },
    CLOSED_REJECTED:      { cls: "badge-blocked",   text: "Rejected" },
    DELIVERED:            { cls: "badge-active",    text: "Delivered" },
    PLACED:               { cls: "badge-pending",   text: "Placed" },
    PROCESSING:           { cls: "badge-warning",   text: "Processing" },
    CANCELLED:            { cls: "badge-blocked",   text: "Cancelled" },
    SHIPPED:              { cls: "badge-active",    text: "Shipped" },
    SHIPPED_TO_BRANCH:    { cls: "badge-warning",   text: "In Transit" },
  };
  const m = map[status] || { cls: "badge-inactive", text: status };
  return <span className={`adm-badge ${m.cls}`}>{m.text}</span>;
};

// ─────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [reports, setReports] = useState([]);
  const [applications, setApplications] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState({ message: "", type: "info", visible: false });
  const showToast = (msg, type = "info") => setToast({ message: msg, type, visible: true });

  const [messageConfig, setMessageConfig] = useState({ isOpen: false, recipientId: null, recipientName: "" });
  const [resolutionConfig, setResolutionConfig] = useState({ isOpen: false, reportId: null, status: '', reason: '' });
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {}, type: "warning" });
  const [warningConfig, setWarningConfig] = useState({ isOpen: false, sellerId: null, reason: "" });

  const navigate = useNavigate();

  // Load analytics on mount
  const fetchAnalytics = () => {
    axios.get(`${API_BASE}/api/admin/analytics`)
      .then(r => setAnalytics(r.data))
      .catch(() => {});
  };

  useEffect(() => { fetchAnalytics(); }, []);
  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setSearchTerm("");
    try {
      if (activeTab === "users") {
        const res = await axios.get("/api/admin/users");
        setUsers(res.data.filter(u => u.role === "CUSTOMER"));
      } else if (activeTab === "sellers") {
        const res = await axios.get("/api/admin/sellers");
        setSellers(res.data);
      } else if (activeTab === "products") {
        const res = await axios.get("/api/admin/products");
        setProducts(res.data);
      } else if (activeTab === "reports") {
        const res = await axios.get("/api/admin/reports");
        setReports(res.data);
      } else if (activeTab === "applications") {
        const res = await axios.get("/api/admin/sellers/applications/pending");
        setApplications(res.data);
      } else if (activeTab === "orders") {
        const res = await axios.get("/api/admin/orders");
        setOrders(res.data);
      } else if (activeTab === "reviews") {
        const res = await axios.get("/api/admin/reviews");
        setReviews(res.data);
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers ──
  const blockUser = (userId) => setConfirmConfig({
    isOpen: true, title: "Block User",
    message: "Block this user? They will not be able to log in.",
    type: "danger",
    onConfirm: async () => {
      await axios.put(`${API_BASE}/api/admin/users/${userId}/block`);
      showToast("User blocked", "success"); fetchData();
    }
  });

  const unblockUser = (userId) => setConfirmConfig({
    isOpen: true, title: "Reactivate User",
    message: "Allow this user to access their account again?",
    type: "success",
    onConfirm: async () => {
      await axios.put(`${API_BASE}/api/admin/users/${userId}/unblock`);
      showToast("User reactivated", "success"); fetchData();
    }
  });

  const toggleProduct = async (id, status) => {
    const newVisible = status !== "ACTIVE";
    await axios.put(`${API_BASE}/api/admin/products/${id}/visibility?visible=${newVisible}`);
    showToast("Product visibility updated", "success"); fetchData();
  };

  const deleteReview = (id) => setConfirmConfig({
    isOpen: true, title: "Delete Review",
    message: "Permanently delete this customer review?",
    type: "danger",
    onConfirm: async () => {
      await axios.delete(`${API_BASE}/api/admin/reviews/${id}`);
      showToast("Review deleted", "success"); fetchData();
    }
  });

  const updateOrderStatus = async (id, status) => {
    try {
      await axios.put(`/api/admin/orders/${id}/status?status=${status}`);
      showToast(`Order status updated to ${status}`, "success");
      fetchData();
    } catch { showToast("Failed to update status", "error"); }
  };

  const viewSeller = (id) => navigate(`/admin/merchant/${id}`);
  const viewCustomer = (id) => navigate(`/admin/customer/${id}`);

  const approveApp = (id) => setConfirmConfig({
    isOpen: true, title: "Approve Merchant",
    message: "Allow this merchant to start selling on Jhapcham?",
    type: "success",
    onConfirm: async () => {
      await axios.post(`${API_BASE}/api/admin/sellers/applications/${id}/approve`);
      showToast("Application approved", "success"); fetchData();
    }
  });

  const rejectApp = (id) => setConfirmConfig({
    isOpen: true, title: "Reject Merchant",
    message: "Are you sure you want to reject this merchant application?",
    type: "danger",
    onConfirm: async () => {
      await axios.post(`${API_BASE}/api/admin/sellers/applications/${id}/reject`);
      showToast("Application rejected", "info"); fetchData();
    }
  });

  const resolveReport = async (id, status, note) => {
    try {
      await axios.post(`${API_BASE}/api/admin/reports/${id}/resolve`, { status, note });
      showToast("Report resolved successfully", "success");
      setResolutionConfig({ ...resolutionConfig, isOpen: false });
      fetchData();
    } catch { showToast("Failed to resolve report", "error"); }
  };

  const handleLogout = () => setConfirmConfig({
    isOpen: true, title: "Sign Out",
    message: "Are you sure you want to sign out?",
    type: "danger",
    onConfirm: () => { localStorage.clear(); navigate("/login"); }
  });

  const filtered = (arr, keys) => arr.filter(item =>
    keys.some(k => String(item[k] || "").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ── Analytics Data Mapping ──
  const revenueData = useMemo(() => {
    if (!analytics?.monthlyRevenue) return [];
    return Object.entries(analytics.monthlyRevenue)
      .sort((a,b) => a[0].localeCompare(b[0]))
      .map(([month, rev]) => ({ month, rev }));
  }, [analytics]);

  const orderTrendData = useMemo(() => {
    if (!analytics?.dailyOrders) return [];
    return Object.entries(analytics.dailyOrders)
      .sort((a,b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date: date.split('-').slice(1).join('/'), count }));
  }, [analytics]);

  // ── Nav items ──
  const navItems = [
    { group: "General", items: [
      { id: "overview",      label: "Overview",      icon: LayoutDashboard },
      { id: "orders",        label: "Orders",        icon: ShoppingBag },
      { id: "products",      label: "Catalog",       icon: Boxes },
      { id: "messages",      label: "Messages",      icon: MessageSquare },
    ]},
    { group: "Partners", items: [
      { id: "sellers",       label: "Merchants",     icon: Store },
      { id: "applications",  label: "Applications",  icon: FileText, badge: applications.length },
    ]},
    { group: "Operations", items: [
      { id: "reports",       label: "Disputes",      icon: AlertTriangle, badge: reports.filter(r => ["NEW","UNDER_INVESTIGATION"].includes(r.status)).length },
      { id: "reviews",       label: "Moderation",    icon: Star },
      { id: "users",         label: "Customers",     icon: Users },
    ]},
    { group: "Content", items: [
      { id: "campaigns",     label: "Campaigns",     icon: Zap },
      { id: "categories",    label: "Categories",    icon: ListChecks },
    ]},
    { group: "System", items: [
      { id: "settings",      label: "Settings",      icon: Settings },
    ]}
  ];

  const tabTitles = {
    overview: "Platform Summary", applications: "Merchant Applications",
    users: "Customer Directory", sellers: "Marketplace Merchants",
    products: "Product Catalog", reports: "Resolution Center",
    campaigns: "Campaign Hub", categories: "Inventory Structure",
    settings: "Admin Account", orders: "Platform Orders", reviews: "Review Moderation"
  };

  // ─── Tab Components ───

  const renderOverview = () => (
    <div className="adm-overview">
      <div className="adm-welcome-banner">
        <div>
          <h2 className="adm-welcome-title">Platform Summary 👋</h2>
          <p className="adm-welcome-sub">Live health status of your ecosystem.</p>
        </div>
        <button className="adm-refresh-btn" onClick={fetchAnalytics}>
          <RefreshCw size={16} /> Update
        </button>
      </div>

      <div className="adm-stat-grid">
        <StatCard icon={Users}       label="Customers"   value={analytics?.totalUsers ?? "—"}    color="#3b82f6" />
        <StatCard icon={Store}       label="Merchants"  value={analytics?.totalSellers ?? "—"}  color="#8b5cf6" />
        <StatCard icon={ShoppingBag} label="Total Orders"      value={analytics?.totalOrders ?? "—"}   color="#0088cc" />
        <StatCard icon={DollarSign}  label="Platform GMV"      value={analytics ? `Rs. ${analytics.totalRevenue.toLocaleString()}` : "—"} color="#10b981" />
        <StatCard icon={Boxes}       label="Products"   value={analytics?.totalProducts ?? "—"} color="#f59e0b" />
        <StatCard icon={Star}        label="Reviews"     value={analytics?.totalReviews ?? "—"}  color="#ec4899" />
      </div>

      <div className="adm-charts-grid">
        <div className="adm-chart-card">
          <div className="adm-chart-header">
            <h3>Revenue Growth</h3>
            <span className="adm-chart-tag">Last 12 Months</span>
          </div>
          <div className="adm-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0088cc" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0088cc" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  formatter={(value) => [`Rs. ${value.toLocaleString()}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="rev" stroke="#0088cc" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="adm-chart-card">
          <div className="adm-chart-header">
            <h3>Order Volume</h3>
            <span className="adm-chart-tag">Daily Trend</span>
          </div>
          <div className="adm-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={orderTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="adm-action-alerts">
        {analytics?.pendingApplications > 0 && (
          <div className="adm-action-alert alert-warning" onClick={() => setActiveTab("applications")}>
            <div className="alert-icon-circle"><FileText size={18} /></div>
            <div className="alert-content">
              <h4>Seller Applications</h4>
              <span>{analytics.pendingApplications} applications pending validation.</span>
            </div>
            <ChevronRight size={16} />
          </div>
        )}
        {analytics?.openReports > 0 && (
          <div className="adm-action-alert alert-danger" onClick={() => setActiveTab("reports")}>
            <div className="alert-icon-circle"><AlertCircle size={18} /></div>
            <div className="alert-content">
              <h4>Dispute Center</h4>
              <span>{analytics.openReports} open tickets require investigation.</span>
            </div>
            <ChevronRight size={16} />
          </div>
        )}
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="adm-table-card">
      <div className="adm-table-filters">
        <Filter size={16}/>
        <span>Showing platform-wide orders</span>
      </div>
      {filtered(orders, ["customerName", "status"]).map(o => (
        <div className="adm-row clickable" key={o.orderId} onClick={() => navigate(`/admin/order/${o.orderId}`)}>
          <div className="adm-row-info">
            <span className="adm-row-title">#{o.orderId} · {o.customerName}</span>
            <span className="adm-row-sub">{new Date(o.createdAt).toLocaleString()} · {o.paymentMethod}</span>
          </div>
          <div className="adm-price-block">
            <span className="adm-price">Rs. {o.grandTotal.toLocaleString()}</span>
          </div>
          <Badge status={o.status} />
          <div className="adm-row-actions" onClick={e => e.stopPropagation()}>
            <button className="adm-icon-btn" title="View Details" onClick={() => navigate(`/admin/order/${o.orderId}`)}><ExternalLink size={14}/></button>
          </div>
        </div>
      ))}
      {orders.length === 0 && <div className="adm-empty">No orders found.</div>}
    </div>
  );

  const renderReviews = () => (
    <div className="adm-table-card">
      {filtered(reviews, ["userName", "productName", "comment"]).map(r => (
        <div className="adm-row review-row" key={r.id}>
          <div className="adm-row-info">
            <div className="adm-review-top">
              <span className="adm-row-title">{r.userName}</span>
              <div className="adm-stars">
                 {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < r.rating ? "#f59e0b" : "none"} color={i < r.rating ? "#f59e0b" : "#cbd5e1"}/>)}
              </div>
            </div>
            <span className="adm-row-sub">Product: {r.productName} · {new Date(r.createdAt).toLocaleDateString()}</span>
            <p className="adm-review-comment">"{r.comment}"</p>
          </div>
          <div className="adm-row-actions">
            <button className="adm-icon-btn danger" title="Delete Review" onClick={() => deleteReview(r.id)}><Trash2 size={16}/></button>
          </div>
        </div>
      ))}
      {reviews.length === 0 && <div className="adm-empty">No reviews to moderate.</div>}
    </div>
  );

  const renderUsers = () => (
    <div className="adm-table-card">
      {filtered(users, ["fullName","email"]).map(u => (
        <div className="adm-row clickable" key={u.id} onClick={() => viewCustomer(u.id)}>
          <div className="adm-row-avatar">{u.fullName?.charAt(0).toUpperCase() || "U"}</div>
          <div className="adm-row-info">
            <span className="adm-row-title">{u.fullName}</span>
            <span className="adm-row-sub">{u.email} · #{u.id}</span>
          </div>
          <Badge status={u.status} />
          <div className="adm-row-actions" onClick={e => e.stopPropagation()}>
            <button className="adm-icon-btn" title="Send Message" onClick={() => setMessageConfig({ isOpen: true, recipientId: u.id, recipientName: u.fullName })}><MessageSquare size={16}/></button>
            {u.status === "ACTIVE"
              ? <button className="adm-icon-btn danger" title="Block" onClick={() => blockUser(u.id)}><Lock size={16}/></button>
              : <button className="adm-icon-btn success" title="Unblock" onClick={() => unblockUser(u.id)}><Unlock size={16}/></button>
            }
          </div>
        </div>
      ))}
    </div>
  );

  const renderSellers = () => (
    <div className="adm-table-card">
      {filtered(sellers, ["storeName","fullName"]).map(s => (
        <div className="adm-row clickable" key={s.id} onClick={() => viewSeller(s.id)}>
          <div className="adm-row-avatar">
            {s.logoImagePath ? <img src={`${API_BASE}/${s.logoImagePath}`} alt=""/> : s.storeName?.charAt(0)}
          </div>
          <div className="adm-row-info">
            <span className="adm-row-title">{s.storeName}</span>
            <span className="adm-row-sub">{s.fullName} · {s.email}</span>
          </div>
          <Badge status={s.status} />
          <div className="adm-row-actions" onClick={e => e.stopPropagation()}>
            <button className="adm-icon-btn" onClick={() => setMessageConfig({ isOpen: true, recipientId: s.id, recipientName: s.storeName })} title="Message Store"><MessageSquare size={16}/></button>
            <button className="adm-icon-btn" onClick={()=>navigate(`/shop/${s.id}`)} title="Go to Store Front"><ExternalLink size={16}/></button>
            <button className="adm-icon-btn success" onClick={()=>viewSeller(s.id)} title="View Analytics"><Eye size={16}/></button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderProducts = () => (
    <div className="adm-table-card">
      {filtered(products, ["name","category"]).map(p => (
        <div className="adm-row clickable" key={p.id} onClick={() => navigate(`/product/${p.id}`)}>
          <div className="adm-row-avatar">
            {p.imagePaths?.[0] ? <img src={`${API_BASE}/${p.imagePaths[0]}`} alt=""/> : <Boxes size={20}/>}
          </div>
          <div className="adm-row-info">
            <span className="adm-row-title">{p.name}</span>
            <span className="adm-row-sub">{p.category} · {p.sellerFullName}</span>
          </div>
          <Badge status={p.status} />
          <div className="adm-row-actions" onClick={e => e.stopPropagation()}>
             <button className={`adm-icon-btn ${p.status === "ACTIVE" ? "danger" : "success"}`} onClick={() => toggleProduct(p.id, p.status)} title={p.status === "ACTIVE" ? "Hide from Store" : "Show in Store"}>
                {p.status === "ACTIVE" ? <EyeOff size={16}/> : <Eye size={16}/>}
             </button>
             <button className="adm-icon-btn" onClick={() => navigate(`/product/${p.id}`)} title="View Product Page"><ExternalLink size={14}/></button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderReports = () => (
    <div className="adm-table-card">
       {reports.map(r => (
         <div className="adm-row" key={r.id}>
           <div className="adm-row-info">
             <span className="adm-row-title">{r.reportedEntityName}</span>
             <span className="adm-row-sub">{r.type} · by {r.reporterName}</span>
             <p className="adm-row-desc">{r.reason}</p>
           </div>
           <Badge status={r.status} />
           <div className="adm-row-actions">
              <select className="adm-select small" value="" onChange={(e)=> {
                 if(!e.target.value) return;
                 setResolutionConfig({ isOpen: true, reportId: r.id, status: e.target.value, reason: r.reason });
                 e.target.value = "";
              }}>
                <option value="">Actions</option>
                <option value="UNDER_INVESTIGATION">Investigate</option>
                <option value="RESOLVED">Resolve</option>
                <option value="RESOLVED_REFUNDED">Refund</option>
              </select>
           </div>
         </div>
       ))}
    </div>
  );

  const renderApplications = () => (
    <div className="adm-table-card">
      {applications.map(a => (
        <div className="adm-row" key={a.id}>
          <div className="adm-row-info">
            <span className="adm-row-title">{a.storeName}</span>
            <span className="adm-row-sub">{a.address} · {new Date(a.submittedAt).toLocaleDateString()}</span>
          </div>
          <div className="adm-row-actions">
            <button className="adm-action-btn approve" onClick={() => approveApp(a.id)}>Approve</button>
            <button className="adm-action-btn reject"  onClick={() => rejectApp(a.id)}>Reject</button>
          </div>
        </div>
      ))}
      {applications.length === 0 && <div className="adm-empty-state"><h3>Fine Work!</h3><p>No seller applications pending.</p></div>}
    </div>
  );

  return (
    <div className="adm-layout">
      <aside className="adm-sidebar">
        <div className="adm-sidebar-brand">
          <div className="adm-brand-logo"><Zap size={18}/></div>
          <div className="adm-brand-text">
            <div className="adm-brand-name">Jhapcham</div>
            <div className="adm-brand-role">Admin Console</div>
          </div>
        </div>
        <nav className="adm-nav">
          {navItems.map(group => (
            <div key={group.group} className="adm-nav-group">
              <h4 className="adm-nav-label">{group.group}</h4>
              {group.items.map(item => (
                <button
                  key={item.id}
                  className={`adm-nav-item ${activeTab === item.id ? "active" : ""}`}
                  onClick={() => item.id === "messages" ? navigate("/messages") : setActiveTab(item.id)}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                  {item.badge > 0 && <span className="adm-nav-badge">{item.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <button className="adm-logout-btn" onClick={handleLogout}>
          <LogOut size={16}/> Sign Out
        </button>
      </aside>

      <main className="adm-main">
        <DashboardNavbar 
          title={tabTitles[activeTab]} 
          role="ADMIN"
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          showSearch={["users","sellers","products","orders"].includes(activeTab)}
        />

        <section className="adm-content">
          {loading ? <div className="adm-loader">Spinning up...</div> : (
            <>
              {activeTab === "overview"      && renderOverview()}
              {activeTab === "orders"        && renderOrders()}
              {activeTab === "products"      && renderProducts()}
              {activeTab === "sellers"       && renderSellers()}
              {activeTab === "applications"  && renderApplications()}
              {activeTab === "reports"       && renderReports()}
              {activeTab === "reviews"       && renderReviews()}
              {activeTab === "users"         && renderUsers()}
              {activeTab === "campaigns"     && <CreateCampaign showToast={showToast} confirmConfig={confirmConfig} setConfirmConfig={setConfirmConfig}/>}
              {activeTab === "categories"    && <CategoryManager showToast={showToast}/>}
              {activeTab === "settings"      && <UpdateAccount/>}
            </>
          )}
        </section>
      </main>

      {/* Shared Modals */}
      <ConfirmModal {...confirmConfig} onClose={()=>setConfirmConfig({...confirmConfig, isOpen:false})} />
      <MessageModal {...messageConfig} type="admin" onClose={()=>setMessageConfig({...messageConfig, isOpen:false})} />
      <ResolutionModal
         isOpen={resolutionConfig.isOpen}
         onClose={() => setResolutionConfig({ ...resolutionConfig, isOpen: false })}
         onConfirm={(note)=>resolveReport(resolutionConfig.reportId, resolutionConfig.status, note)}
         title={`Resolve Dispute: ${resolutionConfig.status}`}
         reason={resolutionConfig.reason}
      />
      {toast.visible && <Toast {...toast} onClose={()=>setToast({...toast, visible:false})}/>}

    </div>
  );
};

export default AdminDashboard;
