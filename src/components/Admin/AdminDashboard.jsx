import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../config/config";
import "./AdminDashboard.css";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Settings,
  LogOut,
  FileText,
  CheckCircle,
  XCircle,
  Shield,
  TrendingUp,
  DollarSign,
  Package,
  AlertCircle,
  ExternalLink,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingApplications: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching applications...');
      const appsRes = await axios.get(`${API_BASE}/api/admin/sellers/applications/pending`);
      console.log('Applications response:', appsRes.data);
      
      const apps = appsRes.data.map(app => ({ 
        id: app.applicationId,
        user: {
          id: app.userId,
          username: app.username,
          email: app.username
        },
        storeName: app.storeName,
        address: app.address,
        status: app.status,
        idDocumentUrl: app.idDocumentUrl,
        businessLicenseUrl: app.businessLicenseUrl,
        taxCertificateUrl: app.taxCertificateUrl,
        note: ""
      }));
      setPendingUsers(apps);
      
      console.log('Fetching stats...');
      const statsPromises = await Promise.allSettled([
        axios.get(`${API_BASE}/api/admin/users`),
        axios.get(`${API_BASE}/products/all`),
        axios.get(`${API_BASE}/orders/admin/all`)
      ]);
      
      const usersData = statsPromises[0].status === 'fulfilled' ? statsPromises[0].value.data : [];
      const productsData = statsPromises[1].status === 'fulfilled' ? statsPromises[1].value.data : [];
      const ordersData = statsPromises[2].status === 'fulfilled' ? statsPromises[2].value.data : [];
      
      const totalRevenue = ordersData.reduce((sum, order) => 
        sum + (order.totalPrice || order.totalAmount || 0), 0
      );
      
      setStats({
        totalUsers: usersData.length || 0,
        totalProducts: productsData.length || 0,
        totalOrders: ordersData.length || 0,
        pendingApplications: apps.length,
        revenue: totalRevenue
      });
      
      console.log('Stats loaded:', {
        users: usersData.length,
        products: productsData.length,
        orders: ordersData.length,
        apps: apps.length
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setStats({
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        pendingApplications: pendingUsers.length,
        revenue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const updateNote = (index, value) => {
    const list = [...pendingUsers];
    list[index].note = value;
    setPendingUsers(list);
  };

  const handleAction = async (userId, action, note) => {
    try {
      const url = `${API_BASE}/api/admin/sellers/applications/${userId}/${action}`;
      const res = await axios.post(url, { note: note });
      alert(res.data.message);
      fetchDashboardData();
    } catch (err) {
      console.error("Error performing action:", err);
      alert("Action failed. See console.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview stats={stats} loading={loading} />;
      case "applications":
        return (
          <ApplicationsTab
            pendingUsers={pendingUsers}
            loading={loading}
            updateNote={updateNote}
            handleAction={handleAction}
          />
        );
      case "users":
        return <UsersTab />;
      case "products":
        return <ProductsTab />;
      default:
        return <div className="ad-card">Work in progress...</div>;
    }
  };

  return (
    <div className="ad-layout">
      <aside className="ad-sidebar">
        <div className="ad-sidebar-header">
          <Shield size={28} />
          <div>
            <div style={{ fontWeight: "700", fontSize: "1.1rem" }}>Admin</div>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Control Panel</div>
          </div>
        </div>

        <nav className="ad-nav">
          <button
            className={`ad-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button
            className={`ad-nav-item ${activeTab === "applications" ? "active" : ""}`}
            onClick={() => setActiveTab("applications")}
          >
            <FileText size={20} /> 
            Applications
            {stats.pendingApplications > 0 && (
              <span className="ad-badge-count">{stats.pendingApplications}</span>
            )}
          </button>
          <button
            className={`ad-nav-item ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <Users size={20} /> Users
          </button>
          <button
            className={`ad-nav-item ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            <ShoppingBag size={20} /> Products
          </button>
          <button
            className={`ad-nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={20} /> Settings
          </button>
        </nav>

        <div className="ad-logout">
          <button className="ad-logout-btn" onClick={handleLogout}>
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <main className="ad-main">
        {renderContent()}
      </main>
    </div>
  );
}

const DashboardOverview = ({ stats, loading }) => (
  <div className="fade-in">
    <div className="ad-header">
      <div>
        <h1 className="ad-title">Dashboard Overview</h1>
        <p className="ad-subtitle">Monitor your platform's performance and activity</p>
      </div>
      <div className="ad-header-date">
        {new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>
    </div>

    {loading ? (
      <div style={{ padding: "2rem", textAlign: "center" }}>Loading dashboard...</div>
    ) : (
      <>
        <div className="ad-stats-grid">
          <div className="ad-stat-card">
            <div className="ad-stat-icon" style={{ background: "#dbeafe", color: "#1e40af" }}>
              <Users />
            </div>
            <div className="ad-stat-content">
              <p className="ad-stat-label">Total Users</p>
              <h3 className="ad-stat-value">{stats.totalUsers.toLocaleString()}</h3>
              <div className="ad-stat-trend">
                <TrendingUp size={14} />
                <span>+12% from last month</span>
              </div>
            </div>
          </div>

          <div className="ad-stat-card">
            <div className="ad-stat-icon" style={{ background: "#fef3c7", color: "#b45309" }}>
              <FileText />
            </div>
            <div className="ad-stat-content">
              <p className="ad-stat-label">Pending Applications</p>
              <h3 className="ad-stat-value">{stats.pendingApplications}</h3>
              {stats.pendingApplications > 0 && (
                <div className="ad-stat-trend warning">
                  <AlertCircle size={14} />
                  <span>Requires attention</span>
                </div>
              )}
            </div>
          </div>

          <div className="ad-stat-card">
            <div className="ad-stat-icon" style={{ background: "#dcfce7", color: "#15803d" }}>
              <ShoppingBag />
            </div>
            <div className="ad-stat-content">
              <p className="ad-stat-label">Total Products</p>
              <h3 className="ad-stat-value">{stats.totalProducts.toLocaleString()}</h3>
              <div className="ad-stat-trend">
                <TrendingUp size={14} />
                <span>+8% from last month</span>
              </div>
            </div>
          </div>

          <div className="ad-stat-card">
            <div className="ad-stat-icon" style={{ background: "#e0e7ff", color: "#4338ca" }}>
              <Package />
            </div>
            <div className="ad-stat-content">
              <p className="ad-stat-label">Total Orders</p>
              <h3 className="ad-stat-value">{stats.totalOrders.toLocaleString()}</h3>
              <div className="ad-stat-trend">
                <TrendingUp size={14} />
                <span>+23% from last month</span>
              </div>
            </div>
          </div>

          <div className="ad-stat-card ad-stat-card-highlight">
            <div className="ad-stat-icon" style={{ background: "#fff", color: "#000" }}>
              <DollarSign />
            </div>
            <div className="ad-stat-content">
              <p className="ad-stat-label">Total Revenue</p>
              <h3 className="ad-stat-value">${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <div className="ad-stat-trend">
                <TrendingUp size={14} />
                <span>+18% from last month</span>
              </div>
            </div>
          </div>
        </div>

        {stats.pendingApplications > 0 && (
          <div className="ad-alert">
            <AlertCircle size={20} />
            <div>
              <strong>Action Required:</strong> You have {stats.pendingApplications} pending seller {stats.pendingApplications === 1 ? 'application' : 'applications'} waiting for review.
            </div>
          </div>
        )}
      </>
    )}
  </div>
);

const ApplicationsTab = ({ pendingUsers, loading, updateNote, handleAction }) => (
  <div className="fade-in">
    <div className="ad-header">
      <div>
        <h1 className="ad-title">Seller Applications</h1>
        <p className="ad-subtitle">Review and manage seller registration requests</p>
      </div>
    </div>

    <div className="ad-table-container">
      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center" }}>Loading applications...</div>
      ) : pendingUsers.length === 0 ? (
        <div className="ad-empty-state">
          <FileText size={64} color="#d1d5db" />
          <h3>No Pending Applications</h3>
          <p>All seller applications have been processed</p>
        </div>
      ) : (
        <table className="ad-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User Details</th>
              <th>Store Name</th>
              <th>Address</th>
              <th>Documents</th>
              <th>Status</th>
              <th>Admin Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((app, index) => (
              <tr key={app.id}>
                <td><span className="ad-id">#{app.id}</span></td>
                <td>
                  <div className="ad-user-cell">
                    <div className="ad-user-avatar">
                      {(app.user?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="ad-user-name">{app.user?.username || "N/A"}</div>
                      <div className="ad-user-email">{app.user?.email}</div>
                    </div>
                  </div>
                </td>
                <td><strong>{app.storeName}</strong></td>
                <td>{app.address}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {app.idDocumentUrl && (
                      <a href={`${API_BASE}${app.idDocumentUrl}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ExternalLink size={12} /> ID Document
                      </a>
                    )}
                    {app.businessLicenseUrl && (
                      <a href={`${API_BASE}${app.businessLicenseUrl}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ExternalLink size={12} /> Business License
                      </a>
                    )}
                    {app.taxCertificateUrl && (
                      <a href={`${API_BASE}${app.taxCertificateUrl}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ExternalLink size={12} /> Tax Certificate
                      </a>
                    )}
                  </div>
                </td>
                <td><span className="ad-badge badge-pending">{app.status}</span></td>
                <td>
                  <input
                    className="ad-input"
                    type="text"
                    placeholder="Add note (optional)"
                    value={app.note}
                    onChange={(e) => updateNote(index, e.target.value)}
                  />
                </td>
                <td>
                  <div className="ad-action-buttons">
                    <button
                      className="ad-btn ad-btn-approve"
                      onClick={() => handleAction(app.id, "approve", app.note)}
                      title="Approve Application"
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button
                      className="ad-btn ad-btn-reject"
                      onClick={() => handleAction(app.id, "reject", app.note)}
                      title="Reject Application"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockReason, setBlockReason] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/admin/users`);
      console.log('Admin users data:', response.data);
      
      // Fetch profile data for each user to get profile images
      const usersWithProfiles = await Promise.all(
        response.data.map(async (user) => {
          try {
            const profileRes = await fetch(`${API_BASE}/users/profile/${user.userId}`);
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              return {
                ...user,
                profileImagePath: profileData.profileImagePath,
                firstName: profileData.firstName,
                lastName: profileData.lastName
              };
            }
          } catch (err) {
            console.log(`Could not fetch profile for user ${user.userId}:`, err);
          }
          return user;
        })
      );
      
      console.log('Users with profile images:', usersWithProfiles);
      setUsers(usersWithProfiles);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (user) => {
    setSelectedImage({
      url: user.profileImagePath 
        ? `${API_BASE}/uploads/customer-profile/${user.profileImagePath}` 
        : "https://via.placeholder.com/400",
      name: user.fullName || user.username
    });
    setShowImageModal(true);
  };

  const handleBlockUnblock = async (userId, currentStatus) => {
    const action = currentStatus === 'ACTIVE' ? 'block' : 'unblock';
    
    console.log('Block/Unblock triggered:', { userId, currentStatus, action });
    
    // If blocking, show modal to get reason
    if (action === 'block') {
      const user = users.find(u => u.userId === userId);
      setSelectedUser({ userId, ...user });
      setBlockReason("");
      setShowBlockModal(true);
      return;
    }
    
    // For unblock, proceed directly with confirmation
    const confirmMsg = 'Are you sure you want to unblock this user?';
    
    if (!window.confirm(confirmMsg)) {
      console.log('User cancelled the action');
      return;
    }

    try {
      const url = `${API_BASE}/api/admin/users/${userId}/${action}`;
      console.log('Making request to:', url);
      
      const response = await axios.post(url);
      console.log('Response:', response.data);
      
      alert(response.data.message);
      fetchUsers();
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to ${action} user: ${error.response?.data?.message || error.message}`);
    }
  };

  const confirmBlockUser = async () => {
    if (!blockReason.trim()) {
      alert('Please provide a reason for blocking this user');
      return;
    }

    try {
      const url = `${API_BASE}/api/admin/users/${selectedUser.userId}/block`;
      console.log('Making request to:', url, 'with reason:', blockReason);
      
      const response = await axios.post(url, { reason: blockReason });
      console.log('Response:', response.data);
      
      alert(response.data.message);
      setShowBlockModal(false);
      setSelectedUser(null);
      setBlockReason("");
      fetchUsers();
    } catch (error) {
      console.error('Error blocking user:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to block user: ${error.response?.data?.message || error.message}`);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="ad-header">
        <div>
          <h1 className="ad-title">User Management</h1>
          <p className="ad-subtitle">View and manage all platform users</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.625rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.875rem',
              width: '300px'
            }}
          />
        </div>
      </div>

      <div className="ad-table-container">
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="ad-empty-state">
            <Users size={64} color="#d1d5db" />
            <h3>No Users Found</h3>
            <p>{searchTerm ? 'Try a different search term' : 'No users in the system'}</p>
          </div>
        ) : (
          <table className="ad-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User Details</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.userId}>
                  <td><span className="ad-id">#{user.userId}</span></td>
                  <td>
                    <div className="ad-user-cell">
                      <img
                        src={user.profileImagePath 
                          ? `${API_BASE}/uploads/customer-profile/${user.profileImagePath}` 
                          : "https://via.placeholder.com/40"}
                        alt={user.fullName || user.username}
                        className="ad-user-avatar-img"
                        onClick={() => handleImageClick(user)}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          cursor: 'pointer',
                          border: '2px solid #e5e7eb',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1)';
                          e.target.style.borderColor = '#000';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.borderColor = '#e5e7eb';
                        }}
                      />
                      <div>
                        <div className="ad-user-name">{user.fullName || user.username || "N/A"}</div>
                        <div className="ad-user-email">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>
                      <div>{user.email}</div>
                      {user.contactNumber && (
                        <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>{user.contactNumber}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`ad-badge ${
                      user.role === 'ADMIN' ? 'badge-admin' : 
                      user.role === 'SELLER' ? 'badge-seller' : 
                      'badge-customer'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`ad-badge ${
                      user.status === 'ACTIVE' ? 'badge-active' : 
                      user.status === 'BLOCKED' ? 'badge-blocked' : 
                      'badge-pending'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    {user.role !== 'ADMIN' && (
                      <button
                        className={`ad-btn ${user.status === 'ACTIVE' ? 'ad-btn-reject' : 'ad-btn-approve'}`}
                        onClick={() => handleBlockUnblock(user.userId, user.status)}
                        style={{ fontSize: '0.8rem', padding: '0.5rem 0.875rem' }}
                      >
                        {user.status === 'ACTIVE' ? (
                          <>
                            <XCircle size={14} />
                            Block
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} />
                            Unblock
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="ad-modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="ad-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="ad-modal-header">
              <h2>{selectedImage.name}'s Profile Picture</h2>
              <button className="ad-modal-close" onClick={() => setShowImageModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="ad-modal-body" style={{ padding: 0 }}>
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '500px',
                  objectFit: 'contain',
                  borderRadius: '0 0 16px 16px'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Block Reason Modal */}
      {showBlockModal && (
        <div className="ad-modal-overlay" onClick={() => setShowBlockModal(false)}>
          <div className="ad-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal-header">
              <h2>Block User</h2>
              <button className="ad-modal-close" onClick={() => setShowBlockModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="ad-modal-body">
              <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                You are about to block <strong>{selectedUser?.fullName || selectedUser?.username}</strong>. 
                Please provide a reason for blocking this user.
              </p>
              <textarea
                className="ad-textarea"
                placeholder="Enter the reason for blocking this user..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <div className="ad-modal-footer">
              <button 
                className="ad-btn ad-btn-secondary" 
                onClick={() => setShowBlockModal(false)}
              >
                Cancel
              </button>
              <button 
                className="ad-btn ad-btn-reject" 
                onClick={confirmBlockUser}
              >
                <XCircle size={16} />
                Block User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductsTab = () => (
  <div className="fade-in">
    <div className="ad-header">
      <div>
        <h1 className="ad-title">Product Management</h1>
        <p className="ad-subtitle">Monitor and manage all products on the platform</p>
      </div>
    </div>
    <div className="ad-card">
      <div className="ad-empty-state">
        <ShoppingBag size={64} color="#d1d5db" />
        <h3>Product Management</h3>
        <p>This feature is coming soon</p>
      </div>
    </div>
  </div>
);