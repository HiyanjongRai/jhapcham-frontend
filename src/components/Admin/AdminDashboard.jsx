import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import { API_BASE } from "../config/config";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";

// Icons (Simple SVGs)
const UserIcon = () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const ProductIcon = () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const ReportIcon = () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const ClipboardIcon = () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const LogoutIcon = () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

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
    
    // Seller Detail Modal
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [showSellerModal, setShowSellerModal] = useState(false);
    
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
                const res = await axios.get(`${API_BASE}/api/auth/admin/seller-applications/pending`);
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

    const handleBlockUser = async (userId) => {
        if(!window.confirm("Are you sure you want to block this user?")) return;
        try {
            await axios.put(`${API_BASE}/api/admin/users/${userId}/block`);
            fetchData();
        } catch (err) {
            alert("Failed to block user");
        }
    };

    const handleUnblockUser = async (userId) => {
        if(!window.confirm("Are you sure you want to unblock this user?")) return;
        try {
            await axios.put(`${API_BASE}/api/admin/users/${userId}/unblock`);
            fetchData();
        } catch (err) {
            alert("Failed to unblock user");
        }
    };

    const handleViewSeller = async (userId) => {
        try {
            const res = await axios.get(`${API_BASE}/api/admin/sellers/${userId}`);
            setSelectedSeller(res.data);
            setShowSellerModal(true);
        } catch (err) {
            alert("Failed to fetch seller details");
        }
    };

    const handleToggleProduct = async (productId, currentStatus) => {
        const newVisible = currentStatus !== "ACTIVE";
        try {
            await axios.put(`${API_BASE}/api/admin/products/${productId}/visibility?visible=${newVisible}`);
            fetchData();
        } catch (err) {
            alert("Failed to update product status");
        }
    };

    const handleResolveReport = async (reportId) => {
         try {
            await axios.put(`${API_BASE}/api/admin/reports/${reportId}/resolve`);
            fetchData();
        } catch (err) {
            alert("Failed to resolve report");
        }
    };
    
    const handleApproveApp = async (appId) => {
        if(!window.confirm("Approve this seller application?")) return;
        try {
            await axios.put(`${API_BASE}/api/auth/admin/seller-applications/${appId}/approve`);
            fetchData();
        } catch (err) {
            alert("Failed to approve application");
        }
    };

    const handleRejectApp = async (appId) => {
        if(!window.confirm("Reject this seller application?")) return;
        try {
            await axios.put(`${API_BASE}/api/auth/admin/seller-applications/${appId}/reject`);
            fetchData();
        } catch (err) {
            alert("Failed to reject application");
        }
    };
    
    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const renderTabs = () => (
        <nav className="ad-nav">
             <button 
                className={`ad-nav-item ${activeTab === 'applications' ? 'active' : ''}`}
                onClick={() => setActiveTab('applications')}
            >
                <ClipboardIcon /> Pending Sellers
                <span className="ad-badge-count">{applications.length || 0}</span>
            </button>
            <button 
                className={`ad-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
            >
                <UserIcon /> Users & Sellers
                <span className="ad-badge-count">{users.length}</span>
            </button>
            <button 
                className={`ad-nav-item ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
            >
                <ProductIcon /> Products
                <span className="ad-badge-count">{products.length}</span>
            </button>
            <button 
                className={`ad-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
            >
                <ReportIcon /> Reports
                <span className="ad-badge-count">{reports.length}</span>
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
                                        <button className="ad-btn ad-btn-secondary" onClick={() => handleViewSeller(user.id)}>
                                            Details
                                        </button>
                                    )}
                                    {user.status === 'ACTIVE' ? (
                                        <button className="ad-btn ad-btn-reject" onClick={() => handleBlockUser(user.id)}>
                                            Block
                                        </button>
                                    ) : (
                                        <button className="ad-btn ad-btn-approve" onClick={() => handleUnblockUser(user.id)}>
                                            Unblock
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
                                    className={`ad-btn ${p.status === 'ACTIVE' ? 'ad-btn-reject' : 'ad-btn-approve'}`}
                                    onClick={() => handleToggleProduct(p.id, p.status)}
                                >
                                    {p.status === 'ACTIVE' ? 'Hide' : 'Show'}
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
                            <td>{r.reportedEntityId}</td>
                            <td>{r.reason}</td>
                             <td>{r.reporterName}</td>
                             <td>
                                <span className={`ad-badge badge-${r.status === 'RESOLVED' ? 'active' : 'pending'}`}>
                                    {r.status}
                                </span>
                            </td>
                            <td>
                                {r.status !== 'RESOLVED' && (
                                    <button className="ad-btn ad-btn-approve" onClick={() => handleResolveReport(r.id)}>
                                        Resolve
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
                                        <a href={`${API_BASE}/uploads/${app.taxCertificatePath}`} target="_blank" rel="noopener noreferrer" className="ad-link">Tax Cert</a>
                                    )}
                                    {app.businessLicensePath && (
                                        <a href={`${API_BASE}/uploads/${app.businessLicensePath}`} target="_blank" rel="noopener noreferrer" className="ad-link">License</a>
                                    )}
                                    {app.idDocumentPath && (
                                        <a href={`${API_BASE}/uploads/${app.idDocumentPath}`} target="_blank" rel="noopener noreferrer" className="ad-link">ID Doc</a>
                                    )}
                                </div>
                            </td>
                            <td>{new Date(app.submittedAt).toLocaleDateString()}</td>
                            <td>
                                <div className="ad-action-buttons">
                                    <button className="ad-btn ad-btn-approve" onClick={() => handleApproveApp(app.id)}>
                                        Approve
                                    </button>
                                    <button className="ad-btn ad-btn-reject" onClick={() => handleRejectApp(app.id)}>
                                        Reject
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
                        <LogoutIcon /> Logout
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
        </div>
    );
};

export default AdminDashboard;
