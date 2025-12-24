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
  Search
} from "lucide-react";
import MessageModal from "../Message/MessageModal.jsx";
import ResolutionModal from "./ResolutionModal.jsx";

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
                className={`ad-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
            >
                <Settings size={18} /> Configuration
            </button>
        </nav>
    );

    const renderUsers = () => (
        <div className="ad-table-container">
            <table className="ad-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.filter(u => 
                        (u.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(user => (
                        <tr key={user.id}>
                            <td className="ad-id">#{user.id}</td>
                            <td>
                                <div className="ad-user-cell">
                                    <div className="ad-user-avatar">
                                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div>
                                        <div className="ad-user-name">{user.fullName || user.username}</div>
                                        <div className="ad-user-email">{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span className={`ad-badge badge-${user.role.toLowerCase()}`}>
                                    {user.role}
                                </span>
                            </td>
                            <td>
                                <span className={`ad-badge badge-${user.status === 'ACTIVE' ? 'active' : 'blocked'}`}>
                                    {user.status}
                                </span>
                            </td>
                            <td>
                                <div className="ad-action-buttons">
                                    {user.role === 'SELLER' && (
                                        <button className="ad-action-btn action-view" title="Seller Details" onClick={() => handleViewSeller(user.id)}>
                                            <ExternalLink size={16} />
                                        </button>
                                    )}
                                    {user.status === 'ACTIVE' ? (
                                        <button className="ad-action-btn action-block" title="Block User" onClick={() => handleBlockUser(user.id)}>
                                            <Shield size={16} />
                                        </button>
                                    ) : (
                                        <button className="ad-action-btn action-unblock" title="Unblock User" onClick={() => handleUnblockUser(user.id)}>
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
    );

    const renderSellers = () => (
        <div className="ad-table-container">
            <table className="ad-table">
                <thead>
                    <tr>
                        <th>Store / Seller</th>
                        <th>Status</th>
                        <th>Products</th>
                        <th>Orders</th>
                        <th>Revenue</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sellers.filter(s => 
                        (s.storeName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (s.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.email || "").toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(seller => (
                        <tr key={seller.id}>
                            <td>
                                <div className="ad-user-cell">
                                    <div className="ad-user-avatar purple" style={{ background: '#7c3aed' }}>
                                        <Store size={20} />
                                    </div>
                                    <div>
                                        <div className="ad-user-name">{seller.storeName}</div>
                                        <div className="ad-user-email">{seller.fullName} • {seller.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span className={`ad-badge badge-${seller.status?.toLowerCase()}`}>
                                    {seller.status}
                                </span>
                            </td>
                            <td>{seller.totalProducts}</td>
                            <td>{seller.totalOrders} ({seller.totalDelivered} deliv.)</td>
                            <td><strong>Rs. {seller.totalIncome?.toLocaleString()}</strong></td>
                            <td>
                                <div className="ad-action-buttons">
                                    <button className="ad-action-btn" title="View Details" onClick={() => handleViewSeller(seller.id)}>
                                        <Eye size={16} />
                                    </button>
                                    <button className="ad-action-btn" title="Message Seller" onClick={() => handleSendMessage(seller)}>
                                        <MessageSquare size={16} />
                                    </button>
                                    {seller.status === 'ACTIVE' ? (
                                        <button className="ad-action-btn action-block" onClick={() => handleBlockUser(seller.id)}>
                                            <Shield size={16} />
                                        </button>
                                    ) : (
                                        <button className="ad-action-btn action-unblock" onClick={() => handleUnblockUser(seller.id)}>
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
    );

    const renderProducts = () => (
        <div className="ad-table-container">
            <table className="ad-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Product</th>
                        <th>Seller</th>
                        <th>Price</th>
                        <th>Visible?</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                        <tr key={p.id}>
                            <td className="ad-id">#{p.id}</td>
                            <td>
                                <div className="ad-user-cell">
                                     {p.imagePaths && p.imagePaths.length > 0 ? (
                                        <img 
                                            src={`${API_BASE}/${p.imagePaths[0]}`} 
                                            alt={p.name} 
                                            className="ad-prod-mini-img"
                                        />
                                     ) : (
                                         <div className="ad-user-avatar"><Boxes size={18} /></div>
                                     )}
                                     <div>
                                        <div className="ad-user-name">{p.name}</div>
                                        <div className="ad-user-email">{p.category}</div>
                                     </div>
                                </div>
                            </td>
                            <td>{p.sellerFullName}</td>
                            <td>Rs. {p.price}</td>
                            <td>
                                <span className={`ad-badge badge-${p.status === 'ACTIVE' ? 'active' : 'blocked'}`}>
                                    {p.status}
                                </span>
                            </td>
                            <td>
                                <button 
                                    className={`ad-action-btn ${p.status === 'ACTIVE' ? 'action-block' : 'action-unblock'}`}
                                    onClick={() => handleToggleProduct(p.id, p.status)}
                                    title={p.status === 'ACTIVE' ? 'Hide Product' : 'Show Product'}
                                >
                                    {p.status === 'ACTIVE' ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
    
    const renderReports = () => (
        <div className="ad-table-container">
            <table className="ad-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Target ID</th>
                        <th>Reason</th>
                        <th>Reporter</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                     {reports.map(r => (
                        <tr key={r.id}>
                            <td className="ad-id">#{r.id}</td>
                            <td>{r.type}</td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {r.reportedEntityImage ? (
                                        <img 
                                            src={r.reportedEntityImage.startsWith('http') ? r.reportedEntityImage : `${API_BASE}/${r.reportedEntityImage}`} 
                                            alt="Target" 
                                            style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#888' }}>
                                            N/A
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{r.reportedEntityName || "Unknown"}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>ID: {r.reportedEntityId}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                {r.reason && r.reason.includes(': ') ? (
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                                            {r.reason.split(': ')[0]}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
                                            {r.reason.split(': ').slice(1).join(': ')}
                                        </div>
                                    </div>
                                ) : (
                                    r.reason
                                )}
                            </td>
                             <td>
                                <div className="ad-user-name">{r.reporterName}</div>
                                <div className="ad-user-email">ID: {r.reporterId}</div>
                             </td>
                            <td>
                                <span className={`ad-badge badge-${r.status?.toLowerCase().replace('(', '').replace(')', '').replace(/ /g, '_')}`}>
                                    {r.status?.replace(/_/g, ' ')}
                                </span>
                            </td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {!['RESOLVED', 'RESOLVED_REFUNDED', 'CLOSED_REJECTED'].includes(r.status) ? (
                                        <select 
                                            className="ad-status-select"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    setResolutionConfig({
                                                        isOpen: true,
                                                        reportId: r.id,
                                                        status: e.target.value,
                                                        reason: r.reason
                                                    });
                                                    // Optional: reset select value
                                                    e.target.value = "";
                                                }
                                            }}
                                            value=""
                                        >
                                            <option value="" disabled>Update Status</option>
                                            <option value="UNDER_INVESTIGATION">Under Investigation</option>
                                            <option value="RESOLVED_REFUNDED">Resolved (Refunded)</option>
                                            <option value="CLOSED_REJECTED">Closed (Rejected)</option>
                                            <option value="RESOLVED">Mark Resolved</option>
                                        </select>
                                    ) : (
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, padding: '8px 12px' }}>
                                            Finalized
                                        </div>
                                    )}

                                    {r.sellerUserId && (
                                        <button 
                                            className="ad-action-btn" 
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
                                            style={{ border: '1px solid #e2e8f0' }}
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
    );

    const renderApplications = () => (
        <div className="ad-table-container">
            <table className="ad-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Store Name</th>
                        <th>Documents</th>
                        <th>Submitted</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {applications.map(app => (
                        <tr key={app.id}>
                            <td className="ad-id">#{app.id}</td>
                            <td>
                                <div className="ad-user-name">{app.storeName}</div>
                                <div className="ad-user-email">{app.address}</div>
                            </td>
                            <td>
                                <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
                                    {app.taxCertificatePath && (
                                        <a href={`${API_BASE}${app.taxCertificatePath}`} target="_blank" rel="noopener noreferrer" className="ad-link">Tax Cert</a>
                                    )}
                                    {app.businessLicensePath && (
                                        <a href={`${API_BASE}${app.businessLicensePath}`} target="_blank" rel="noopener noreferrer" className="ad-link">License</a>
                                    )}
                                    {app.idDocumentPath && (
                                        <a href={`${API_BASE}${app.idDocumentPath}`} target="_blank" rel="noopener noreferrer" className="ad-link">ID Doc</a>
                                    )}
                                </div>
                            </td>
                            <td>{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A'}</td>
                            <td>
                                <div className="ad-action-buttons">
                                    <button className="ad-action-btn action-approve" title="Approve" onClick={() => handleApproveApp(app.id)}>
                                        <CheckCircle2 size={18} />
                                    </button>
                                    <button className="ad-action-btn action-reject" title="Reject" onClick={() => handleRejectApp(app.id)}>
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {applications.length === 0 && (
                        <tr>
                            <td colSpan="5" style={{textAlign: "center", padding: "2rem"}}>No pending applications</td>
                        </tr>
                    )}
                </tbody>
            </table>
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
                        {activeTab === 'settings' && (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                                <UpdateAccount />
                            </div>
                        )}
                    </>
                )}
            </main>
            
            {showSellerModal && selectedSeller && (
                <div className="ad-modal-overlay">
                    <div className="ad-modal-content">
                        <div className="ad-modal-header">
                            <h2>Seller Details</h2>
                            <button className="ad-modal-close" onClick={() => setShowSellerModal(false)}>×</button>
                        </div>
                        <div className="ad-modal-body">
                            <p><strong>Store Name:</strong> {selectedSeller.storeName}</p>
                            <p><strong>Owner:</strong> {selectedSeller.fullName}</p>
                            <p><strong>Email:</strong> {selectedSeller.email}</p>
                            <p><strong>Contact:</strong> {selectedSeller.contactNumber}</p>
                             <hr />
                            <div className="ad-stats-grid" style={{gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px'}}>
                               <div className="ad-stat-card ad-stat-card-highlight">
                                    <div>
                                        <div className="ad-stat-label">Total Orders</div>
                                        <div className="ad-stat-value">{selectedSeller.totalOrders}</div>
                                    </div>
                               </div>
                                <div className="ad-stat-card">
                                    <div>
                                        <div className="ad-stat-label">Products</div>
                                        <div className="ad-stat-value">{selectedSeller.totalProducts}</div>
                                    </div>
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
