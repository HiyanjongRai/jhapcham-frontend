import React, { useState, useEffect, useMemo } from "react";
import { 
  Shield, ShoppingBag, TrendingUp, Users, Eye, 
  ArrowUpRight, Clock, ChevronRight, AlertTriangle,
  Wallet, PieChart as PieIcon, BarChart3, ArrowRight
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import api from "../../api/axios";
import { API_BASE } from "../config/config";
import { getCurrentUserId } from "../../utils/authUtils";
import "./seller.css";

export default function SellerDashboard() {
  const [stats, setStats] = useState({});
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const sellerId = getCurrentUserId();

  useEffect(() => {
    const fetchData = async () => {
        try {
          setLoading(true);
          const [statsRes, commRes] = await Promise.all([
            api.get(`/api/seller/${sellerId}/stats`),
            api.get(`/api/seller/${sellerId}/commissions`)
          ]);
          if (statsRes.data) setStats(statsRes.data);
          if (commRes.data) setCommissions(commRes.data);
        } catch (_) {
        } finally {
          setLoading(false);
        }
    };
    if (sellerId) fetchData();
  }, [sellerId]);

  const overdueCommissions = useMemo(() => 
    commissions.filter(c => c.isOverdue && c.status === 'UNPAID'), 
    [commissions]
  );

  const totalOutstanding = useMemo(() => 
    commissions.filter(c => c.status === 'UNPAID')
      .reduce((sum, c) => sum + (c.commissionEarned || 0) + (c.fineAmount || 0), 0),
    [commissions]
  );

  if (loading) return (
    <div className="dash-loader-wrap">
      <div className="dash-spinner"></div>
      <span>Initializing Business Intelligence...</span>
    </div>
  );

  const statCards = [
    {
      icon: <Wallet size={20} />,
      label: "Net Earnings",
      value: `Rs. ${(stats.totalIncome - stats.totalCommission - stats.totalShippingCost || 0).toLocaleString()}`,
      sub: "Revenue after deductions",
      color: "#6366f1",
      glow: "indigo"
    },
    {
      icon: <ShoppingBag size={20} />,
      label: "Total Sales",
      value: stats.totalOrders || 0,
      sub: "Confirmed orders",
      color: "#10b981",
      glow: "emerald"
    },
    {
      icon: <Shield size={20} />,
      label: "Platform Fees",
      value: `Rs. ${(stats.totalCommission || 0).toLocaleString()}`,
      sub: "Total marketplace costs",
      color: "#f43f5e",
      glow: "rose"
    },
    {
      icon: <Users size={20} />,
      label: "Brand Following",
      value: stats.followerCount || "0",
      sub: "Active store fans",
      color: "#f59e0b",
      glow: "amber"
    }
  ];

  return (
    <div className="dashboard-content-premium fade-in">
        <header className="dash-hero-header">
            <div className="greeting">
                <div className="date-pill">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                <h1>Welcome back, {stats.storeName || 'Merchant'}!</h1>
                <p>Track your store performance and financial obligations in real-time.</p>
            </div>
            {overdueCommissions.length > 0 && (
                <div className="dash-alert-card pulse-border">
                    <div className="alert-icon"><AlertTriangle /></div>
                    <div className="alert-text">
                        <strong>Urgent Settlement Required</strong>
                        <span>Rs. {totalOutstanding.toLocaleString()} is overdue. Pay now to avoid fines.</span>
                    </div>
                    <button className="alert-btn" onClick={() => window.location.href='/seller/commissions'}>Settle Now</button>
                </div>
            )}
        </header>

        <div className="premium-stats-grid">
            {statCards.map((card, i) => (
                <div key={i} className={`p-stat-card glass ${card.glow}`}>
                    <div className="p-card-header">
                        <div className="p-icon-box" style={{ color: card.color }}>{card.icon}</div>
                        <span className="p-card-label">{card.label}</span>
                    </div>
                    <div className="p-card-body">
                        <div className="p-card-value">{card.value}</div>
                        <div className="p-card-sub">{card.sub}</div>
                    </div>
                    <div className="p-card-bg-icon">{card.icon}</div>
                </div>
            ))}
        </div>

        <div className="dash-grid-secondary">
            <div className="dash-main-panel glass">
                <div className="panel-header">
                    <div className="p-title">
                        <h3>Revenue Velocity</h3>
                        <span>Earnings distribution over the last 7 days</span>
                    </div>
                    <div className="p-action"><BarChart3 size={16}/> Weekly Report</div>
                </div>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={stats.weeklySales?.map((val, i) => ({ day: `Day ${i+1}`, val }))}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', background: '#fff' }}
                                itemStyle={{ fontWeight: 800, color: '#0f172a' }}
                            />
                            <Area type="monotone" dataKey="val" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <aside className="dash-side-panel">
                <div className="side-panel-card glass">
                    <div className="p-header">
                        <h3>Inventory Overview</h3>
                        <ChevronRight size={18} />
                    </div>
                    <div className="inv-stats">
                        <div className="inv-item">
                            <span className="dot active"></span>
                            <span className="label">Active</span>
                            <strong>{stats.activeProducts}</strong>
                        </div>
                        <div className="inv-item">
                            <span className="dot inactive"></span>
                            <span className="label">Inactive</span>
                            <strong>{stats.inactiveProducts}</strong>
                        </div>
                    </div>
                </div>

                <div className="side-panel-card activity-card glass">
                    <h3>Recent Signal</h3>
                    <div className="signal-list">
                        {[
                            { icon: <ShoppingBag size={14}/>, title: "New Order", time: "2m", color: "#6366f1" },
                            { icon: <Users size={14}/>, title: "Follower", time: "1h", color: "#10b981" },
                            { icon: <Shield size={14}/>, title: "Audit Pass", time: "5h", color: "#f43f5e" }
                        ].map((sig, i) => (
                            <div key={i} className="signal-item">
                                <div className="sig-icon" style={{ background: `${sig.color}15`, color: sig.color }}>{sig.icon}</div>
                                <div className="sig-text">
                                    <span className="title">{sig.title}</span>
                                    <span className="time">{sig.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
        </div>

        <div className="dash-products-panel glass">
            <div className="p-header">
                <h3>High Performance Catalog</h3>
                <button className="p-all-btn">Manage Inventory <ArrowRight size={14}/></button>
            </div>
            <div className="p-grid-mini">
                {stats.topSellingProducts?.map((p, i) => (
                    <div key={i} className="p-card-mini">
                        <div className="img-wrap">
                            <img src={p.imagePath ? `${API_BASE}/${p.imagePath}` : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'} alt="" />
                        </div>
                        <div className="info-wrap">
                            <div className="name">{p.name}</div>
                            <div className="price">Rs. {p.price.toLocaleString()}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <style>{`
            .dashboard-content-premium { padding: 40px; background: #fff; min-height: 100vh; font-family: 'Inter', sans-serif; }
            .dash-hero-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; gap: 40px; }
            .date-pill { display: inline-block; padding: 4px 12px; background: #f1f5f9; color: #64748b; font-size: 11px; font-weight: 800; border-radius: 20px; letter-spacing: 0.05em; margin-bottom: 12px; text-transform: uppercase; }
            .greeting h1 { font-size: 36px; font-weight: 950; color: #0f172a; margin: 0; letter-spacing: -0.04em; }
            .greeting p { color: #64748b; font-size: 16px; margin-top: 8px; font-weight: 500; }
            
            .dash-alert-card { background: #fff1f2; border: 1px solid #fee2e2; border-radius: 20px; padding: 20px 24px; display: flex; align-items: center; gap: 20px; box-shadow: 0 10px 30px rgba(244, 63, 94, 0.05); }
            .alert-icon { width: 44px; height: 44px; background: #f43f5e; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
            .alert-text { flex: 1; }
            .alert-text strong { display: block; color: #9f1239; font-size: 15px; font-weight: 800; }
            .alert-text span { color: #be123c; font-size: 13px; font-weight: 600; }
            .alert-btn { background: #0f172a; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; white-space: nowrap; }
            .alert-btn:hover { background: #000; transform: scale(1.05); }
            
            .pulse-border { animation: p-border 2s infinite; }
            @keyframes p-border { 0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); } }

            .premium-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 48px; }
            .p-stat-card { background: #f8fafc; border: 1px solid #f1f5f9; padding: 24px; border-radius: 24px; position: relative; overflow: hidden; transition: 0.3s; }
            .p-stat-card.indigo { border-color: #e0e7ff; background: #f5f7ff; }
            .p-stat-card.emerald { border-color: #dcfce7; background: #f0fdf4; }
            .p-stat-card.rose { border-color: #fee2e2; background: #fff1f2; }
            .p-stat-card.amber { border-color: #fef3c7; background: #fffbeb; }
            .p-stat-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.04); }
            
            .p-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
            .p-icon-box { width: 36px; height: 36px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
            .p-card-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
            .p-card-value { font-size: 26px; font-weight: 950; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.02em; }
            .p-card-sub { font-size: 13px; color: #64748b; font-weight: 600; }
            .p-card-bg-icon { position: absolute; right: -10px; bottom: -10px; font-size: 80px; opacity: 0.03; transform: rotate(-15deg); }

            .dash-grid-secondary { display: grid; grid-template-columns: 1fr 320px; gap: 40px; margin-bottom: 40px; }
            .glass { background: white; border: 1px solid #f1f5f9; border-radius: 28px; padding: 32px; }
            .panel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
            .p-title h3 { margin: 0; font-size: 20px; font-weight: 900; color: #0f172a; }
            .p-title span { font-size: 14px; color: #94a3b8; font-weight: 600; }
            .p-action { font-size: 12px; font-weight: 800; color: #6366f1; cursor: pointer; display: flex; align-items: center; gap: 8px; }
            
            .inv-stats { display: flex; gap: 40px; margin-top: 24px; }
            .inv-item { display: flex; flex-direction: column; gap: 4px; }
            .inv-item .dot { width: 8px; height: 8px; border-radius: 50%; display: block; margin-bottom: 4px; }
            .dot.active { background: #10b981; box-shadow: 0 0 10px #10b98160; }
            .dot.inactive { background: #94a3b8; }
            .inv-item .label { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
            .inv-item strong { font-size: 20px; font-weight: 900; color: #0f172a; }

            .activity-card h3 { font-size: 18px; font-weight: 900; color: #0f172a; margin-bottom: 24px; }
            .signal-list { display: grid; gap: 16px; }
            .signal-item { display: flex; align-items: center; gap: 16px; padding: 12px; border-radius: 16px; background: #f8fafc; transition: 0.2s; }
            .signal-item:hover { background: #f1f5f9; transform: scale(1.02); }
            .sig-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
            .sig-text { display: flex; flex-direction: column; }
            .sig-text .title { font-size: 13px; font-weight: 800; color: #0f172a; }
            .sig-text .time { font-size: 11px; color: #94a3b8; font-weight: 600; }

            .dash-products-panel { padding: 32px; }
            .p-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
            .p-header h3 { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; }
            .p-all-btn { background: #f1f5f9; color: #64748b; border: none; padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
            .p-all-btn:hover { background: #0f172a; color: white; }
            .p-grid-mini { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
            .p-card-mini { background: #f8fafc; border-radius: 20px; overflow: hidden; padding: 16px; transition: 0.2s; border: 1px solid transparent; }
            .p-card-mini:hover { background: #fff; border-color: #f1f5f9; box-shadow: 0 10px 30px rgba(0,0,0,0.03); transform: translateY(-3px); }
            .img-wrap { height: 160px; border-radius: 14px; overflow: hidden; margin-bottom: 16px; background: white; }
            .img-wrap img { width: 100%; height: 100%; object-fit: contain; }
            .info-wrap .name { font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 40px; }
            .info-wrap .price { font-size: 15px; font-weight: 900; color: #6366f1; margin-top: 8px; }

            .dash-loader-wrap { height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; color: #64748b; font-weight: 800; }
            .dash-spinner { width: 48px; height: 48px; border: 4px solid #f1f5f9; border-top-color: #6366f1; border-radius: 50%; animation: d-spin 1s linear infinite; }
            @keyframes d-spin { to { transform: rotate(360deg); } }
        `}</style>
    </div>
  );
}
