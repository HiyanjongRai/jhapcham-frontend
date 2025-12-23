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
  LayoutDashboard
} from "lucide-react";

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("applications"); // Default to applications for visibility
    const [stats, setStats] = useState({ users: 0, products: 0, reports: 0, applications: 0 });
    
    // Data States
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [reports, setReports] = useState([]);
    const [applications, setApplications] = useState([]);
    
    // Loading and Error States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({ message: '', type: 'info', visible: false });

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
                setUsers(res.data);
                setStats(prev => ({ ...prev, users: res.data.length }));
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

    const handleResolveReport = async (reportId) => {
         try {
            await axios.post(`${API_BASE}/api/admin/reports/${reportId}/resolve`);
            showToast("Report resolved", "success");
            fetchData();
        } catch (err) {
            showToast("Failed to resolve report", "error");
        }
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
                <Users size={18} /> Users & Sellers
                {users.length > 0 && <span className="ad-badge-count">{users.length}</span>}
            </button>
            <button 
                className={`ad-nav-item ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
            >
                <Boxes size={18} /> Products
                {products.length > 0 && <span className="ad-badge-count">{products.length}</span>}
            </button>
            <button 
                className={`ad-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
            >
                <AlertTriangle size={18} /> Reports
                {reports.length > 0 && (
                    <span className={`ad-badge-count ${reports.filter(r => r.status !== 'RESOLVED').length > 0 ? 'warning' : ''}`}>
                        {reports.length}
                    </span>
                )}
            </button>
            <button 
                className={`ad-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
            >
                <Settings size={18} /> Settings
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
                    {users.map(user => (
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
                                <div className="ad-user-name">{p.name}</div>
                                <div className="ad-user-email">{p.category}</div>
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
                            <td>{r.reason}</td>
                             <td>{r.reporterName}</td>
                             <td>
                                <span className={`ad-badge badge-${r.status === 'RESOLVED' ? 'active' : 'pending'}`}>
                                    {r.status}
                                </span>
                            </td>
                            <td>
                                {r.status !== 'RESOLVED' && (
                                    <button className="ad-action-btn action-unblock" title="Resolve Report" onClick={() => handleResolveReport(r.id)}>
                                        <CheckCircle2 size={16} />
                                    </button>
                                )}
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
                    <div className="ad-header-date">{new Date().toLocaleDateString()}</div>
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
