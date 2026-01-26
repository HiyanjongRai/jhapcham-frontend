import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import { API_BASE } from "../config/config";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import UpdateAccount from "../Profile/UpdateAccount.jsx";
import ConfirmModal from "../Common/ConfirmModal.jsx";
import Toast from "../Toast/Toast.jsx";

import { 
  Users, 
  Boxes, 
  AlertTriangle, 
  FileText, 
  Settings, 
  LogOut, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Eye,
  EyeOff,
  ChevronRight,
  TrendingUp,
  Store,
  Calendar,
  LayoutDashboard,
  MessageSquare,
  Search,
  X
} from "lucide-react";
import MessageModal from "../Message/MessageModal.jsx";
import ResolutionModal from "./ResolutionModal.jsx";
import CreateCampaign from "./CreateCampaign.jsx";
import CategoryManager from "./CategoryManager.jsx";

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("applications"); // Default to applications for visibility
    const [stats, setStats] = useState({ users: 0, sellers: 0, products: 0, reports: 0, applications: 0 });
    
    // Data States
    const [users, setUsers] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [products, setProducts] = useState([]);
    const [reports, setReports] = useState([]);
    const [applications, setApplications] = useState([]);
    
    // Loading and Error States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({ message: '', type: 'info', visible: false });

    // Search and Messaging State
    const [searchTerm, setSearchTerm] = useState("");
    const [messageConfig, setMessageConfig] = useState({ isOpen: false, receiverId: null, receiverName: "" });
    const [resolutionConfig, setResolutionConfig] = useState({ isOpen: false, reportId: null, status: null });

    const showToast = (message, type = 'info') => {
        setToast({ message, type, visible: true });
    };
    
    // Seller Detail Modal
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [showSellerModal, setShowSellerModal] = useState(false);

    // Custom Confirm Modal State
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "warning"
    });

    // Warning Modal State
    const [warningConfig, setWarningConfig] = useState({
        isOpen: false,
        sellerId: null,
        reason: ""
    });

    const handleIssueWarning = (sellerId) => {
        setWarningConfig({
            isOpen: true,
            sellerId: sellerId,
            reason: ""
        });
    };

    const submitWarning = async () => {
        if (!warningConfig.reason.trim()) {
            showToast("Please provide a reason for the warning", "error");
            return;
        }
        try {
            await axios.post(`${API_BASE}/api/admin/sellers/${warningConfig.sellerId}/warning`, {
                reason: warningConfig.reason
            });
            showToast("Warning issued successfully", "success");
            setWarningConfig({ isOpen: false, sellerId: null, reason: "" });
            fetchData();
        } catch (err) {
            console.error(err);
            showToast("Failed to issue warning", "error");
        }
    };
    
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            if (activeTab === "users") {
                const res = await axios.get(`${API_BASE}/api/admin/users`);
                const allUsers = res.data;
                const customersOnly = allUsers.filter(u => u.role === 'CUSTOMER');
                const sellersOnly = allUsers.filter(u => u.role === 'SELLER');
                setUsers(customersOnly);
                setStats(prev => ({ ...prev, users: customersOnly.length }));
            } else if (activeTab === "sellers") {
                const res = await axios.get(`${API_BASE}/api/admin/sellers`);
                setSellers(res.data);
                setStats(prev => ({ ...prev, sellers: res.data.length }));
            } else if (activeTab === "products") {
                const res = await axios.get(`${API_BASE}/api/admin/products`);
                setProducts(res.data);
                setStats(prev => ({ ...prev, products: res.data.length }));
            } else if (activeTab === "reports") {
                const res = await axios.get(`${API_BASE}/api/admin/reports`);
                setReports(res.data);
                setStats(prev => ({ ...prev, reports: res.data.length }));
            } else if (activeTab === "applications") {
                const res = await axios.get(`${API_BASE}/api/admin/sellers/applications/pending`);
                setApplications(res.data);
                setStats(prev => ({...prev, applications: res.data.length}));
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to load data. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleBlockUser = (userId) => {
        setConfirmConfig({
            isOpen: true,
            title: "Block User",
            message: "Are you sure you want to block this user? They will not be able to log in or use the platform.",
            type: "danger",
            onConfirm: async () => {
                try {
                    await axios.put(`${API_BASE}/api/admin/users/${userId}/block`);
                    showToast("User blocked successfully", "success");
                    fetchData();
                } catch (err) {
                    showToast("Failed to block user", "error");
                }
            }
        });
    };

    const handleUnblockUser = (userId) => {
        setConfirmConfig({
            isOpen: true,
            title: "Unblock User",
            message: "Allow this user to access their account again?",
            type: "success",
            onConfirm: async () => {
                try {
                    await axios.put(`${API_BASE}/api/admin/users/${userId}/unblock`);
                    showToast("User unblocked successfully", "success");
                    fetchData();
                } catch (err) {
                    showToast("Failed to unblock user", "error");
                }
            }
        });
    };

    const handleViewSeller = async (userId) => {
        try {
            const res = await axios.get(`${API_BASE}/api/admin/sellers/${userId}`);
            setSelectedSeller(res.data);
            setShowSellerModal(true);
        } catch (err) {
            showToast("Failed to fetch seller details", "error");
        }
    };

    const handleToggleProduct = async (productId, currentStatus) => {
        const newVisible = currentStatus !== "ACTIVE";
        try {
            await axios.put(`${API_BASE}/api/admin/products/${productId}/visibility?visible=${newVisible}`);
            showToast(`Product visibility updated`, "success");
            fetchData();
        } catch (err) {
            showToast("Failed to update product status", "error");
        }
    };

    const handleResolveReport = async (reportId, status, note) => {
         try {
            await axios.post(`${API_BASE}/api/admin/reports/${reportId}/resolve`, {
                status,
                note
            });
            showToast(`Report status updated to ${status}`, "success");
            fetchData();
        } catch (err) {
            showToast("Failed to update report status", "error");
        }
    };

    const handleSendMessage = (user, reportData = null) => {
        setMessageConfig({
            isOpen: true,
            receiverId: user.id,
            receiverName: user.fullName || user.username,
            reportContext: reportData 
        });
    };
    
    const handleApproveApp = (appId) => {
        setConfirmConfig({
            isOpen: true,
            title: "Approve Seller",
            message: "Approve this seller application? They will gain access to the seller dashboard.",
            type: "success",
            onConfirm: async () => {
                try {
                    await axios.post(`${API_BASE}/api/admin/sellers/applications/${appId}/approve`, {
                        note: "Approved by admin"
                    });
                    showToast("Application approved!", "success");
                    fetchData();
                } catch (err) {
                    showToast("Failed to approve application", "error");
                }
            }
        });
    };

    const handleRejectApp = (appId) => {
        setConfirmConfig({
            isOpen: true,
            title: "Reject Seller",
            message: "Reject this seller application? Please ensure you have reviewed their documents.",
            type: "danger",
            onConfirm: async () => {
                try {
                    await axios.post(`${API_BASE}/api/admin/sellers/applications/${appId}/reject`, {
                        note: "Rejected by admin"
                    });
                    showToast("Application rejected", "info");
                    fetchData();
                } catch (err) {
                    showToast("Failed to reject application", "error");
                }
            }
        });
    };
    
    const handleLogout = () => {
        setConfirmConfig({
            isOpen: true,
            title: "Sign Out",
            message: "Are you sure you want to sign out from the Admin Panel?",
            type: "danger",
            onConfirm: () => {
                localStorage.clear();
                navigate("/login");
            }
        });
    };

    const renderTabs = () => (
        <nav className="ad-nav">
             <button 
                className={`ad-nav-item ${activeTab === 'applications' ? 'active' : ''}`}
                onClick={() => setActiveTab('applications')}
            >
                <FileText size={18} /> Pending Sellers
                {applications.length > 0 && <span className="ad-badge-count">{applications.length}</span>}
            </button>
             <button 
                className={`ad-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
            >
                <Users size={18} /> Customers
            </button>
            <button 
                className={`ad-nav-item ${activeTab === 'sellers' ? 'active' : ''}`}
                onClick={() => setActiveTab('sellers')}
            >
                <Store size={18} /> Merchants
            </button>
            <button 
                className={`ad-nav-item ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
            >
                <Boxes size={18} /> Catalog
            </button>
            <button 
                className={`ad-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
            >
                <AlertTriangle size={18} /> Disputes
            </button>
            <button 
                className={`ad-nav-item ${activeTab === 'campaigns' ? 'active' : ''}`}
                onClick={() => setActiveTab('campaigns')}
            >
                <Calendar size={18} /> Campaigns
            </button>
            <button 
                className={`ad-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
                onClick={() => setActiveTab('categories')}
            >
                <Boxes size={18} /> Categories
            </button>
            <button 
                className={`ad-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
            >
                <Settings size={18} /> Configuration
            </button>
        </nav>
    );

    const renderUsers = () => (
        <div className="ad-content-wrapper">
            <div className="ad-table-container">
                <table className="ad-table">
                    <thead>
                        <tr>
                            <th>User Profile</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th className="ad-text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.filter(u => 
                            (u.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
                        ).map(user => (
                            <tr key={user.id} className="ad-table-row">
                                <td>
                                    <div className="ad-merchant-cell">
                                        <div className="ad-avatar-wrapper">
                                            <div className="ad-avatar-placeholder">
                                                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div className={`ad-status-dot ${user.status === 'ACTIVE' ? 'active' : 'blocked'}`}></div>
                                        </div>
                                        <div className="ad-merchant-info">
                                            <div className="ad-store-name">{user.fullName || user.username}</div>
                                            <div className="ad-owner-name">{user.email} (ID: #{user.id})</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`ad-badge-pro role-${user.role?.toLowerCase()}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <span className={`ad-badge-pro status-${user.status === 'ACTIVE' ? 'active' : 'blocked'}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="ad-text-right">
                                    <div className="ad-action-pill-group">
                                        {user.role === 'SELLER' && (
                                            <button className="ad-action-icon-btn" title="Seller Details" onClick={() => handleViewSeller(user.id)}>
                                                <ExternalLink size={16} />
                                            </button>
                                        )}
                                        <div className="ad-action-divider"></div>
                                        {user.status === 'ACTIVE' ? (
                                            <button className="ad-action-icon-btn danger" title="Block User" onClick={() => handleBlockUser(user.id)}>
                                                <Shield size={16} />
                                            </button>
                                        ) : (
                                            <button className="ad-action-icon-btn success" title="Unblock User" onClick={() => handleUnblockUser(user.id)}>
                                                <CheckCircle2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderSellers = () => (
        <div className="ad-content-wrapper">
            <div className="ad-stats-summary">
                <div className="ad-mini-stat">
                    <span className="mini-stat-label">Total Merchants</span>
                    <span className="mini-stat-value">{sellers.length}</span>
                </div>
                <div className="ad-mini-stat">
                    <span className="mini-stat-label">Active Products</span>
                    <span className="mini-stat-value">{sellers.reduce((acc, s) => acc + (s.totalProducts || 0), 0)}</span>
                </div>
                <div className="ad-mini-stat highlight">
                    <span className="mini-stat-label">Cumulative Volume</span>
                    <span className="mini-stat-value">Rs. {sellers.reduce((acc, s) => acc + (s.totalIncome || 0), 0).toLocaleString()}</span>
                </div>
            </div>

            <div className="ad-table-container">
                <table className="ad-table">
                    <thead>
                        <tr>
                            <th>Merchant Profile</th>
                            <th>Contact Info</th>
                            <th>Inventory & Volume</th>
                            <th>Fulfillment</th>
                            <th>Status</th>
                            <th className="ad-text-right">Manage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sellers.filter(s => 
                            (s.storeName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (s.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.email || "").toLowerCase().includes(searchTerm.toLowerCase())
                        ).map(seller => {
                            const deliveryRate = seller.totalOrders > 0 
                                ? Math.round((seller.totalDelivered / seller.totalOrders) * 100) 
                                : 0;
                            
                            return (
                                <tr key={seller.id} className="ad-table-row">
                                    <td>
                                        <div className="ad-merchant-cell">
                                            <div className="ad-avatar-wrapper">
                                                {seller.logoImagePath ? (
                                                    <img 
                                                        src={`${API_BASE}/${seller.logoImagePath}`} 
                                                        alt={seller.storeName} 
                                                        className="ad-merchant-logo"
                                                    />
                                                ) : (
                                                    <div className="ad-avatar-placeholder">
                                                        {seller.storeName?.charAt(0).toUpperCase() || 'S'}
                                                    </div>
                                                )}
                                                <div className={`ad-status-dot ${seller.status?.toLowerCase()}`}></div>
                                            </div>
                                            <div className="ad-merchant-info">
                                                <div className="ad-store-name">{seller.storeName}</div>
                                                <div className="ad-owner-name">Owner: {seller.fullName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="ad-id" style={{ color: 'inherit', fontWeight: 500 }}>{seller.email}</div>
                                        <div className="ad-id" style={{ fontSize: '0.75rem' }}>ID: #{seller.id}</div>
                                    </td>
                                    <td>
                                        <div className="ad-stats-compound">
                                            <div className="compound-item">
                                                <span className="label">STOCK</span>
                                                <span className="val">{seller.totalProducts}</span>
                                            </div>
                                            <div className="compound-divider"></div>
                                            <div className="compound-item">
                                                <span className="label">VOLUME</span>
                                                <span className="val">{seller.totalOrders}</span>
                                            </div>
                                            <div className="compound-divider"></div>
                                            <div className="compound-item accent">
                                                <span className="label">REVENUE</span>
                                                <span className="val">Rs. {seller.totalIncome || 0}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="ad-fulfillment-container">
                                            <div className="ad-fulfillment-meta">
                                                <span className="pct">{deliveryRate}%</span>
                                                <span className="count">{seller.totalDelivered} DLV</span>
                                            </div>
                                            <div className="ad-fulfillment-track-modern">
                                                <div className="ad-fulfillment-fill-modern" style={{ width: `${deliveryRate}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`ad-badge-pro status-${seller.status?.toLowerCase()}`}>
                                            {seller.status}
                                        </span>
                                    </td>
                                    <td className="ad-text-right">
                                        <div className="ad-action-pill-group">
                                            <button className="ad-action-icon-btn" onClick={() => handleViewSeller(seller.id)} title="View Detail">
                                                <Eye size={16} />
                                            </button>
                                            <button className="ad-action-icon-btn" onClick={() => handleSendMessage(seller)} title="Message">
                                                <MessageSquare size={16} />
                                            </button>
                                            <button className="ad-action-icon-btn warn" onClick={() => handleIssueWarning(seller.id)} title="Warning">
                                                <AlertTriangle size={16} />
                                            </button>
                                            <div className="ad-action-divider"></div>
                                            {seller.status === 'ACTIVE' ? (
                                                <button className="ad-action-icon-btn danger" onClick={() => handleBlockUser(seller.id)} title="Block">
                                                    <Shield size={16} />
                                                </button>
                                            ) : (
                                                <button className="ad-action-icon-btn success" onClick={() => handleUnblockUser(seller.id)} title="Unblock">
                                                    <CheckCircle2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderProducts = () => (
        <div className="ad-content-wrapper">
            <div className="ad-table-container">
                <table className="ad-table">
                    <thead>
                        <tr>
                            <th>Product Info</th>
                            <th>Seller</th>
                            <th>Pricing</th>
                            <th>Visibility</th>
                            <th className="ad-text-right">Manage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} className="ad-table-row">
                                <td>
                                    <div className="ad-merchant-cell">
                                        <div className="ad-avatar-wrapper">
                                            {p.imagePaths && p.imagePaths.length > 0 ? (
                                                <img 
                                                    src={`${API_BASE}/${p.imagePaths[0]}`} 
                                                    alt={p.name} 
                                                    className="ad-merchant-logo"
                                                />
                                            ) : (
                                                <div className="ad-avatar-placeholder">
                                                    <Boxes size={18} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="ad-merchant-info">
                                            <div className="ad-store-name">{p.name}</div>
                                            <div className="ad-owner-name">{p.category} (ID: #{p.id})</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="ad-owner-name" style={{ fontWeight: 600, color: '#111827' }}>{p.sellerFullName}</div>
                                </td>
                                <td>
                                    <div className="ad-stats-compound">
                                        {p.onSale ? (
                                            <div className="compound-item accent">
                                                <span className="label">SALE PRICE</span>
                                                <span className="val">Rs. {p.salePrice}</span>
                                                <span className="label" style={{ textDecoration: 'line-through', opacity: 0.5 }}>WAS Rs. {p.price}</span>
                                            </div>
                                        ) : (
                                            <div className="compound-item">
                                                <span className="label">BASE PRICE</span>
                                                <span className="val">Rs. {p.price}</span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span className={`ad-badge-pro status-${p.status === 'ACTIVE' ? 'active' : 'blocked'}`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td className="ad-text-right">
                                    <div className="ad-action-pill-group">
                                        <button 
                                            className={`ad-action-icon-btn ${p.status === 'ACTIVE' ? 'danger' : 'success'}`}
                                            onClick={() => handleToggleProduct(p.id, p.status)}
                                            title={p.status === 'ACTIVE' ? 'Hide Product' : 'Show Product'}
                                        >
                                            {p.status === 'ACTIVE' ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    const renderReports = () => (
        <div className="ad-content-wrapper">
            <div className="ad-table-container">
                <table className="ad-table">
                    <thead>
                        <tr>
                            <th>Issue Detail</th>
                            <th>Reported Subject</th>
                            <th>Reason / Case</th>
                            <th>Reporter</th>
                            <th>Resolution Status</th>
                            <th className="ad-text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map(r => (
                            <tr key={r.id} className="ad-table-row">
                                <td>
                                    <div className="ad-badge-pro role-admin" style={{ fontSize: '0.6rem' }}>{r.type}</div>
                                    <div className="ad-id" style={{ marginTop: '4px' }}>#REP-{r.id}</div>
                                </td>
                                <td>
                                    <div className="ad-merchant-cell">
                                        <div className="ad-avatar-wrapper">
                                            {r.reportedEntityImage ? (
                                                <img 
                                                    src={r.reportedEntityImage.startsWith('http') ? r.reportedEntityImage : `${API_BASE}/${r.reportedEntityImage}`} 
                                                    alt="Target" 
                                                    className="ad-merchant-logo"
                                                />
                                            ) : (
                                                <div className="ad-avatar-placeholder" style={{ fontSize: '0.7rem' }}>N/A</div>
                                            )}
                                        </div>
                                        <div className="ad-merchant-info">
                                            <div className="ad-store-name">{r.reportedEntityName || "Unknown"}</div>
                                            <div className="ad-owner-name">ID: {r.reportedEntityId}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="ad-id" style={{ maxWidth: '200px', whiteSpace: 'normal', lineHeight: '1.4' }}>
                                        {r.reason}
                                    </div>
                                </td>
                                <td>
                                    <div className="ad-store-name" style={{ fontSize: '0.85rem' }}>{r.reporterName}</div>
                                    <div className="ad-owner-name">ID: {r.reporterId}</div>
                                </td>
                                <td>
                                    <span className={`ad-badge-pro status-${r.status?.toLowerCase().replace('(', '').replace(')', '').replace(/ /g, '_')}`}>
                                        {r.status?.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="ad-text-right">
                                    <div className="ad-action-pill-group">
                                        {!['RESOLVED', 'RESOLVED_REFUNDED', 'CLOSED_REJECTED'].includes(r.status) ? (
                                            <select 
                                                className="ad-status-select-pro"
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        setResolutionConfig({
                                                            isOpen: true,
                                                            reportId: r.id,
                                                            status: e.target.value,
                                                            reason: r.reason
                                                        });
                                                        e.target.value = "";
                                                    }
                                                }}
                                                value=""
                                            >
                                                <option value="" disabled>Status</option>
                                                <option value="UNDER_INVESTIGATION">Investigate</option>
                                                <option value="RESOLVED_REFUNDED">Refund</option>
                                                <option value="CLOSED_REJECTED">Reject</option>
                                                <option value="RESOLVED">Resolve</option>
                                            </select>
                                        ) : (
                                            <span className="ad-id" style={{ padding: '0 8px', fontWeight: 600 }}>Archived</span>
                                        )}

                                        {r.sellerUserId && (
                                            <button 
                                                className="ad-action-icon-btn" 
                                                title="Message Seller" 
                                                onClick={() => handleSendMessage({ 
                                                    id: r.sellerUserId, 
                                                    fullName: r.type === 'PRODUCT' ? `Merchant of ${r.reportedEntityName}` : r.reportedEntityName 
                                                }, {
                                                    reason: r.reason,
                                                    reporter: r.reporterName,
                                                    targetName: r.reportedEntityName,
                                                    targetId: r.reportedEntityId,
                                                    targetImage: r.reportedEntityImage
                                                })}
                                            >
                                                <MessageSquare size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderApplications = () => (
        <div className="ad-content-wrapper">
            <div className="ad-table-container">
                <table className="ad-table">
                    <thead>
                        <tr>
                            <th>Store Detail</th>
                            <th>Onboarding Metadata</th>
                            <th>Verification Documents</th>
                            <th className="ad-text-right">Decision</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map(app => (
                            <tr key={app.id} className="ad-table-row">
                                <td>
                                    <div className="ad-store-name" style={{ fontSize: '1rem' }}>{app.storeName}</div>
                                    <div className="ad-owner-name">{app.address}</div>
                                    <div className="ad-id">App ID: #{app.id}</div>
                                </td>
                                <td>
                                    <div className="ad-owner-name" style={{ fontWeight: 600 }}>SUBMITTED</div>
                                    <div className="ad-id">{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A'}</div>
                                </td>
                                <td>
                                    <div className="ad-document-pill-group">
                                        {app.taxCertificatePath && (
                                            <a href={`${API_BASE}${app.taxCertificatePath}`} target="_blank" rel="noopener noreferrer" className="ad-doc-pill">TAX ID</a>
                                        )}
                                        {app.businessLicensePath && (
                                            <a href={`${API_BASE}${app.businessLicensePath}`} target="_blank" rel="noopener noreferrer" className="ad-doc-pill">LICENSE</a>
                                        )}
                                        {app.idDocumentPath && (
                                            <a href={`${API_BASE}${app.idDocumentPath}`} target="_blank" rel="noopener noreferrer" className="ad-doc-pill">IDENTITY</a>
                                        )}
                                    </div>
                                </td>
                                <td className="ad-text-right">
                                    <div className="ad-action-pill-group">
                                        <button className="ad-action-icon-btn success" title="Approve" onClick={() => handleApproveApp(app.id)}>
                                            <CheckCircle2 size={18} />
                                        </button>
                                        <button className="ad-action-icon-btn danger" title="Reject" onClick={() => handleRejectApp(app.id)}>
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {applications.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{textAlign: "center", padding: "4rem", color: '#94a3b8'}}>No screening applications found at this time.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="ad-layout">
            <aside className="ad-sidebar">
                <div className="ad-sidebar-header">
                    <h3>Admin Panel</h3>
                </div>
                {renderTabs()}
                <div className="ad-logout">
                    <button className="ad-logout-btn" onClick={handleLogout}>
                        <LogOut size={18} /> <span>Sign Out</span>
                    </button>
                </div>
            </aside>
            <main className="ad-main">
                <div className="ad-header">
                     <div>
                        <h1 className="ad-title">
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h1>
                        <p className="ad-subtitle">Manage your application {activeTab}</p>
                    </div>
                    <div className="ad-header-controls">
                        <div className="ad-search-bar">
                            <Search size={18} />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="ad-header-date">{new Date().toLocaleDateString()}</div>
                    </div>
                </div>
                
                {/* Loading State */}
                {loading && (
                    <div style={{textAlign: 'center', padding: '3rem'}}>
                        <div style={{fontSize: '1.2rem', color: '#666'}}>Loading...</div>
                    </div>
                )}
                
                {/* Error State */}
                {error && !loading && (
                    <div style={{
                        padding: '1.5rem',
                        margin: '1rem 0',
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '8px',
                        color: '#c33'
                    }}>
                        <strong>Error:</strong> {error}
                    </div>
                )}
                
                {/* Content - Only show when not loading */}
                {!loading && !error && (
                    <>
                        {activeTab === 'users' && renderUsers()}
                        {activeTab === 'sellers' && renderSellers()}
                        {activeTab === 'products' && renderProducts()}
                        {activeTab === 'reports' && renderReports()}
                        {activeTab === 'applications' && renderApplications()}
                        {activeTab === 'campaigns' && (
                            <CreateCampaign 
                                showToast={showToast} 
                                confirmConfig={confirmConfig} 
                                setConfirmConfig={setConfirmConfig} 
                            />
                        )}
                        {activeTab === 'categories' && <CategoryManager showToast={showToast} />}
                        {activeTab === 'settings' && (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                                <UpdateAccount />
                            </div>
                        )}
                    </>
                )}
            </main>
            
            {showSellerModal && selectedSeller && (
                <div className="ad-sidepanel-overlay" onClick={() => setShowSellerModal(false)}>
                    <div className="ad-sidepanel" onClick={e => e.stopPropagation()}>
                        <div className="ad-sidepanel-header">
                            <div className="header-top">
                                <h2>Merchant Profile</h2>
                                <button className="close-panel-btn" onClick={() => setShowSellerModal(false)}><X size={20}/></button>
                            </div>
                            <div className="header-main">
                                <div className="panel-avatar">
                                    {selectedSeller.logoImagePath ? (
                                        <img src={`${API_BASE}/${selectedSeller.logoImagePath}`} alt={selectedSeller.storeName} />
                                    ) : (
                                        <div className="avatar-letter">{selectedSeller.storeName?.charAt(0).toUpperCase()}</div>
                                    )}
                                </div>
                                <div className="panel-title-info">
                                    <h3>{selectedSeller.storeName}</h3>
                                    <span className="panel-id">ID: #{selectedSeller.id}</span>
                                </div>
                            </div>
                        </div>

                        <div className="ad-sidepanel-body">
                            <section className="panel-section">
                                <h4 className="section-title">ADMINISTRATIVE DETAILS</h4>
                                <div className="panel-info-grid">
                                    <div className="info-item">
                                        <span className="info-label">Operator</span>
                                        <span className="info-val">{selectedSeller.fullName}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Account Type</span>
                                        <span className="info-val">Verified Merchant</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Contact Email</span>
                                        <span className="info-val">{selectedSeller.email}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Phone</span>
                                        <span className="info-val">{selectedSeller.contactNumber || 'Not Provided'}</span>
                                    </div>
                                </div>
                            </section>

                            <section className="panel-section">
                                <h4 className="section-title">PERFORMANCE METRICS</h4>
                                <div className="panel-metrics-grid">
                                    <div className="metric-box-modern">
                                        <span className="m-val">Rs. {selectedSeller.totalIncome?.toLocaleString() || 0}</span>
                                        <span className="m-label">Gross Revenue</span>
                                    </div>
                                    <div className="metric-box-modern">
                                        <span className="m-val">{selectedSeller.totalOrders}</span>
                                        <span className="m-label">Orders Processed</span>
                                    </div>
                                    <div className="metric-box-modern">
                                        <span className="m-val">{selectedSeller.totalProducts}</span>
                                        <span className="m-label">Active Catalog</span>
                                    </div>
                                </div>
                            </section>

                            <div className="panel-actions-container">
                                <button className="panel-action-btn primary" onClick={() => handleSendMessage(selectedSeller)}>
                                    <MessageSquare size={16} /> Send Direct Message
                                </button>
                                <div className="panel-action-row-split">
                                    <button className="panel-action-btn warn" onClick={() => handleIssueWarning(selectedSeller.id)}>
                                        <AlertTriangle size={16} /> Issue Warning
                                    </button>
                                    {selectedSeller.status === 'ACTIVE' ? (
                                        <button className="panel-action-btn danger" onClick={() => handleBlockUser(selectedSeller.id)}>
                                            <Shield size={16} /> Suspend
                                        </button>
                                    ) : (
                                        <button className="panel-action-btn success" onClick={() => handleUnblockUser(selectedSeller.id)}>
                                            <CheckCircle2 size={16} /> Reactivate
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <MessageModal
                isOpen={messageConfig.isOpen}
                onClose={() => setMessageConfig(prev => ({ ...prev, isOpen: false }))}
                type="admin"
                recipientId={messageConfig.receiverId}
                recipientName={messageConfig.receiverName}
                reportContext={messageConfig.reportContext}
            />

            <ResolutionModal 
                isOpen={resolutionConfig.isOpen}
                onClose={() => setResolutionConfig(prev => ({ ...prev, isOpen: false }))}
                reportId={resolutionConfig.reportId}
                status={resolutionConfig.status}
                reason={resolutionConfig.reason}
                onConfirm={(note) => {
                    handleResolveReport(resolutionConfig.reportId, resolutionConfig.status, note);
                    setResolutionConfig(prev => ({ ...prev, isOpen: false }));
                }}
            />

            {/* Warning Modal */}
            {warningConfig.isOpen && (
                <div className="ad-modal-overlay">
                    <div className="ad-modal-content" style={{ maxWidth: '450px' }}>
                        <div className="ad-modal-header">
                            <h2 className="ad-user-name-bold" style={{ fontSize: '1.25rem' }}>Issue Official Warning</h2>
                            <button className="ad-modal-close" onClick={() => setWarningConfig({ ...warningConfig, isOpen: false })}>×</button>
                        </div>
                        <div className="ad-modal-body">
                            <p className="ad-id" style={{ marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                This action will record an official violation against the merchant. 
                                <span style={{ color: '#ff4444', fontWeight: 900 }}> 3 warnings lead to permanent suspension.</span>
                            </p>
                            
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="ad-id" style={{ display: 'block', marginBottom: '8px' }}>REASON FOR INFRACTION</label>
                                <textarea 
                                    className="ad-status-select"
                                    style={{ width: '100%', minHeight: '120px', borderRadius: '8px', padding: '1rem' }}
                                    placeholder="Describe the violation in detail..."
                                    value={warningConfig.reason}
                                    onChange={(e) => setWarningConfig({ ...warningConfig, reason: e.target.value })}
                                />
                            </div>

                            <button 
                                className="ad-logout-btn" 
                                style={{ background: '#000', color: '#fff', border: 'none', borderRadius: '8px' }}
                                onClick={submitWarning}
                            >
                                SUBMIT RECOGNIZED VIOLATION
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <ConfirmModal 
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
            />

            {toast.visible && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
                />
            )}
        </div>
    );
};

export default AdminDashboard;
