import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Heart,
  TrendingUp,
  Package,
  MapPin,
  Settings,
  LogOut,
  Bell,
  ArrowRight,
  AlertCircle,
  Zap
} from 'lucide-react';
import api from '../../api/axios';
import './CustomerDashboardHome.css';

export default function CustomerDashboardHome() {
  const [userData, setUserData] = useState({
    name: 'Guest User',
    email: '',
    totalOrders: 0,
    totalSpent: 0,
    loyaltyPoints: 0,
    wishlistItems: 0,
    savedAddresses: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user data
      const userResponse = await api.get(`/api/users/${userId}`);
      if (userResponse.data) {
        setUserData(prev => ({
          ...prev,
          name: userResponse.data.firstName || 'User',
          email: userResponse.data.email || '',
          totalOrders: userResponse.data.totalOrders || 0,
          loyaltyPoints: userResponse.data.loyaltyPoints || 0
        }));
      }

      // Fetch recent orders
      const ordersResponse = await api.get(`/api/orders/user/${userId}?limit=3`);
      if (ordersResponse.data) {
        setRecentOrders(ordersResponse.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="cdh-loading">
        <div className="cdh-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="cdh-container">
      {/* HEADER SECTION */}
      <div className="cdh-header">
        <div className="cdh-header-content">
          <div>
            <h1 className="cdh-greeting">Welcome back, {userData.name}! 👋</h1>
            <p className="cdh-subtext">Here's your shopping summary</p>
          </div>
          <div className="cdh-header-actions">
            <button className="cdh-icon-btn" title="Notifications">
              <Bell size={20} />
              <span className="cdh-badge">2</span>
            </button>
            <button className="cdh-icon-btn" title="Settings">
              <Settings size={20} />
            </button>
            <button className="cdh-icon-btn cdh-logout" onClick={handleLogout} title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK STATS SECTION */}
      <div className="cdh-stats-grid">
        <div className="cdh-stat-card">
          <div className="cdh-stat-icon orders">
            <ShoppingBag size={24} />
          </div>
          <div className="cdh-stat-content">
            <p className="cdh-stat-label">Total Orders</p>
            <h3 className="cdh-stat-value">{userData.totalOrders}</h3>
          </div>
          <ArrowRight size={16} className="cdh-stat-arrow" />
        </div>

        <div className="cdh-stat-card">
          <div className="cdh-stat-icon spent">
            <TrendingUp size={24} />
          </div>
          <div className="cdh-stat-content">
            <p className="cdh-stat-label">Total Spent</p>
            <h3 className="cdh-stat-value">Rs {userData.totalSpent}</h3>
          </div>
          <ArrowRight size={16} className="cdh-stat-arrow" />
        </div>

        <div className="cdh-stat-card">
          <div className="cdh-stat-icon loyalty">
            <Zap size={24} />
          </div>
          <div className="cdh-stat-content">
            <p className="cdh-stat-label">Loyalty Points</p>
            <h3 className="cdh-stat-value">{userData.loyaltyPoints}</h3>
          </div>
          <ArrowRight size={16} className="cdh-stat-arrow" />
        </div>

        <div className="cdh-stat-card">
          <div className="cdh-stat-icon wishlist">
            <Heart size={24} />
          </div>
          <div className="cdh-stat-content">
            <p className="cdh-stat-label">Wishlist Items</p>
            <h3 className="cdh-stat-value">{userData.wishlistItems}</h3>
          </div>
          <ArrowRight size={16} className="cdh-stat-arrow" />
        </div>
      </div>

      {/* QUICK ACTIONS SECTION */}
      <div className="cdh-section">
        <h2 className="cdh-section-title">Quick Actions</h2>
        <div className="cdh-actions-grid">
          <div className="cdh-action-card">
            <div className="cdh-action-icon">
              <Package size={32} />
            </div>
            <h3>Track Order</h3>
            <p>See where your package is</p>
            <button className="cdh-action-btn">Go to Orders →</button>
          </div>

          <div className="cdh-action-card">
            <div className="cdh-action-icon">
              <MapPin size={32} />
            </div>
            <h3>Manage Addresses</h3>
            <p>Add or update your addresses</p>
            <button className="cdh-action-btn">Manage →</button>
          </div>

          <div className="cdh-action-card">
            <div className="cdh-action-icon">
              <ShoppingBag size={32} />
            </div>
            <h3>Reorder Items</h3>
            <p>Quick reorder from past orders</p>
            <button className="cdh-action-btn">Reorder →</button>
          </div>

          <div className="cdh-action-card">
            <div className="cdh-action-icon">
              <Heart size={32} />
            </div>
            <h3>View Wishlist</h3>
            <p>Check your saved items</p>
            <button className="cdh-action-btn">Wishlist →</button>
          </div>
        </div>
      </div>

      {/* RECENT ORDERS SECTION */}
      {recentOrders.length > 0 && (
        <div className="cdh-section">
          <div className="cdh-section-header">
            <h2 className="cdh-section-title">Recent Orders</h2>
            <button className="cdh-view-all">View All →</button>
          </div>
          <div className="cdh-orders-list">
            {recentOrders.map((order) => (
              <div key={order._id} className="cdh-order-item">
                <div className="cdh-order-info">
                  <h4 className="cdh-order-id">Order #{order.orderNumber}</h4>
                  <p className="cdh-order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="cdh-order-status">
                  <span className={`cdh-status cdh-status-${order.status?.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>
                <div className="cdh-order-amount">
                  <p className="cdh-amount">Rs {order.totalAmount}</p>
                </div>
                <button className="cdh-order-action">Details →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HELPFUL LINKS SECTION */}
      <div className="cdh-section">
        <h2 className="cdh-section-title">Settings & More</h2>
        <div className="cdh-links-grid">
          <a href="#account" className="cdh-link-card">
            <Settings size={20} />
            <span>Account Settings</span>
          </a>
          <a href="#payments" className="cdh-link-card">
            <ShoppingBag size={20} />
            <span>Payment Methods</span>
          </a>
          <a href="#notifications" className="cdh-link-card">
            <Bell size={20} />
            <span>Notifications</span>
          </a>
          <a href="#support" className="cdh-link-card">
            <AlertCircle size={20} />
            <span>Help & Support</span>
          </a>
        </div>
      </div>

      {/* FOOTER MESSAGE */}
      <div className="cdh-footer">
        <p>Need help? Check our <a href="#help">FAQs</a> or <a href="#contact">contact support</a></p>
      </div>
    </div>
  );
}
