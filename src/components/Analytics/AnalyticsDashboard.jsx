// Analytics Dashboard Component
import React, { useState, useEffect } from 'react';
import { 
  getSpendingAnalytics, 
  getOrderStats, 
  getMonthlySpending,
  getCategoryBreakdown,
  getTopProducts 
} from '../../utils/analyticsUtils';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';
import './AnalyticsDashboard.css';

export default function AnalyticsDashboard({ userId }) {
  const [stats, setStats] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [timeRange, setTimeRange] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, userId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [statsData, monthlyData, catData, prodData] = await Promise.all([
        getOrderStats(userId),
        getMonthlySpending(userId),
        getCategoryBreakdown(userId),
        getTopProducts(userId, 5)
      ]);

      setStats(statsData);
      setMonthly(monthlyData);
      setCategories(catData);
      setTopProducts(prodData);
    } catch (error) {
      console.error('Analytics load error:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner" />
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2 className="gt-h2">Your Shopping Analytics</h2>
        <div className="time-range-selector">
          <button 
            className={timeRange === '30' ? 'active' : ''} 
            onClick={() => setTimeRange('30')}
          >
            Last 30 Days
          </button>
          <button 
            className={timeRange === '90' ? 'active' : ''} 
            onClick={() => setTimeRange('90')}
          >
            Last 90 Days
          </button>
          <button 
            className={timeRange === 'all' ? 'active' : ''} 
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="analytics-cards">
        <div className="analytics-card">
          <div className="card-icon">
            <ShoppingBag size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Total Orders</p>
            <p className="card-value">{stats?.totalOrders || 0}</p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">
            <DollarSign size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Total Spent</p>
            <p className="card-value">Rs. {stats?.totalSpent?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Avg Order Value</p>
            <p className="card-value">Rs. {stats?.averageOrderValue?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">
            <Calendar size={24} />
          </div>
          <div className="card-content">
            <p className="card-label">Delivered Orders</p>
            <p className="card-value">{stats?.deliveredOrders || 0}</p>
          </div>
        </div>
      </div>

      {/* Monthly Spending Chart */}
      {monthly.length > 0 && (
        <div className="analytics-section">
          <h3 className="gt-h3">Monthly Spending</h3>
          <div className="monthly-chart">
            {monthly.map((item, idx) => (
              <div key={idx} className="month-bar">
                <div 
                  className="bar" 
                  style={{
                    height: `${(item.amount / Math.max(...monthly.map(m => m.amount))) * 150}px`
                  }}
                />
                <p className="month-label">{item.month}</p>
                <p className="month-value">Rs. {item.amount}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="analytics-section">
          <h3 className="gt-h3">Top Purchased Products</h3>
          <div className="top-products">
            {topProducts.map((product, idx) => (
              <div key={idx} className="product-item">
                <span className="product-rank">#{idx + 1}</span>
                <img src={product.imagePath} alt={product.name} className="product-img" />
                <div className="product-info">
                  <p className="product-name">{product.name}</p>
                  <p className="product-stat">{product.count} purchases</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {categories.length > 0 && (
        <div className="analytics-section">
          <h3 className="gt-h3">Spending by Category</h3>
          <div className="category-breakdown">
            {categories.map((cat, idx) => {
              const total = categories.reduce((sum, c) => sum + c.amount, 0);
              const percentage = (cat.amount / total) * 100;
              return (
                <div key={idx} className="category-item">
                  <div className="category-header">
                    <span className="category-name">{cat.name}</span>
                    <span className="category-amount">Rs. {cat.amount}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress" style={{ width: `${percentage}%` }} />
                  </div>
                  <p className="percentage">{percentage.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
