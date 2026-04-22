import React, { useState, useEffect, useMemo } from "react";
import { API_BASE } from "../config/config";
import axios from "../../api/axios";
import {
  Users, ShoppingBag, DollarSign, TrendingUp, Boxes, Star, Store,
  RefreshCw, FileText, AlertCircle, ChevronRight
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts';
import { StatCard } from "./AdminCommon";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/admin/analytics`);
      setAnalytics(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

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

  if (loading && !analytics) return <div className="adm-empty">Loading platform intelligence...</div>;

  return (
    <div className="adm-overview fade-in">
      <div className="adm-welcome-banner">
        <div>
          <h2 className="adm-welcome-title">Platform Summary</h2>
          <p className="adm-welcome-sub">Live health status of your ecosystem.</p>
        </div>
        <button className="adm-refresh-btn" onClick={fetchAnalytics}>
          <RefreshCw size={16} /> Update
        </button>
      </div>

      <div className="adm-stat-grid">
        <StatCard icon={Users}       label="Customers"   value={analytics?.totalUsers ?? "—"}    color="#3b82f6" />
        <StatCard icon={Store}       label="Merchants"  value={analytics?.totalSellers ?? "—"}  color="#8b5cf6" />
        <StatCard icon={ShoppingBag} label="Total Orders"      value={analytics?.totalOrders ?? "—"}   color="#00b4d8" />
        <StatCard icon={DollarSign}  label="Platform GMV"      value={analytics?.totalRevenue ? `Rs. ${analytics.totalRevenue.toLocaleString()}` : "—"} color="#10b981" />
        <StatCard icon={TrendingUp}  label="Platform Net"      value={analytics?.platformIncome ? `Rs. ${analytics.platformIncome.toLocaleString()}` : "—"} color="#10b981" />
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
                    <stop offset="5%" stopColor="#00b4d8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00b4d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  formatter={(value) => [`Rs. ${(value || 0).toLocaleString()}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="rev" stroke="#00b4d8" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
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
          <div className="adm-action-alert alert-warning" onClick={() => navigate("/admin/applications")}>
            <div className="alert-icon-circle"><FileText size={18} /></div>
            <div className="alert-content">
              <h4>Seller Applications</h4>
              <span>{analytics.pendingApplications} applications pending validation.</span>
            </div>
            <ChevronRight size={16} />
          </div>
        )}
        {analytics?.openReports > 0 && (
          <div className="adm-action-alert alert-danger" onClick={() => navigate("/admin/disputes")}>
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
};

export default AdminDashboard;
