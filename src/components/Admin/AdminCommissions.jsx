import React, { useState, useEffect, useMemo } from "react";
import { 
  DollarSign, Search, RefreshCw, Send,
  Store, ChevronDown, Clock, CheckCircle, 
  AlertTriangle, Info, TrendingDown, Mail, 
  Phone, BarChart3, PieChart as PieIcon,
  LayoutGrid, List, Download, TrendingUp
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import api from "../../api/axios";
import "./AdminDashboard.css";

const AdminCommissions = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("GROUPS");
  const [expandedSellers, setExpandedSellers] = useState(new Set());
  const [sendingReminder, setSendingReminder] = useState(null);

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/admin/commissions");
      setCommissions(response.data || []);
    } catch (err) {
      console.error("Failed to fetch commissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (orderId) => {
    setSendingReminder(orderId);
    try {
      await api.post(`/api/admin/commissions/${orderId}/remind`);
      alert("Urgent reminder sent to vendor.");
      fetchCommissions(); // refresh to update 'reminderSent' flag
    } catch (err) {
      alert("Failed to send reminder.");
    } finally {
      setSendingReminder(null);
    }
  };

  const stats = useMemo(() => {
    const paid = commissions.filter(c => c.status === "PAID");
    const unpaid = commissions.filter(c => c.status === "UNPAID");
    const overdue = commissions.filter(c => c.isOverdue);
    
    return {
      paid: paid.reduce((sum, c) => sum + (c.commissionEarned || 0), 0),
      unpaid: unpaid.reduce((sum, c) => sum + (c.commissionEarned || 0) + (c.fineAmount || 0), 0),
      overdueValue: overdue.reduce((sum, c) => sum + (c.commissionEarned || 0) + (c.fineAmount || 0), 0),
      gross: commissions.reduce((sum, c) => sum + (c.commissionEarned || 0) + (c.fineAmount || 0), 0),
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      overdueCount: overdue.length
    };
  }, [commissions]);

  const groupedData = useMemo(() => {
    const sellers = {};
    commissions.forEach(c => {
      const sId = c.sellerStoreName || "Unknown Seller";
      if (!sellers[sId]) {
        sellers[sId] = {
          name: sId, email: c.sellerEmail, phone: c.sellerPhone,
          total: 0, paid: 0, unpaid: 0, fine: 0, orders: []
        };
      }
      const base = c.commissionEarned || 0;
      const penalty = c.fineAmount || 0;
      sellers[sId].total += (base + penalty);
      if (c.status === "PAID") sellers[sId].paid += (base + penalty);
      else sellers[sId].unpaid += (base + penalty);
      sellers[sId].fine += penalty;
      sellers[sId].orders.push(c);
    });
    return Object.values(sellers)
      .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.unpaid - a.unpaid);
  }, [commissions, searchTerm]);

  const toggleSeller = (name) => {
    const next = new Set(expandedSellers);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setExpandedSellers(next);
  };

  if (loading) return <div className="adm-loader-overlay"><div className="adm-loader-spinner"></div><span>Syncing Commission Ledger...</span></div>;

  return (
    <div className="adm-vault-main fade-in">
      <header className="adm-vault-header">
        <div className="header-text">
          <h1>Platform Settlements</h1>
          <p>Managed financial distribution & penalty auditing</p>
        </div>
        <div className="header-actions">
           <button className="btn-secondary" onClick={fetchCommissions}><RefreshCw size={16} /> Sync</button>
           <button className="btn-primary" onClick={() => window.print()}><Download size={16} /> Report</button>
        </div>
      </header>

      <div className="adm-kpi-grid">
         <div className="kpi-card gold">
            <div className="kpi-icon"><DollarSign /></div>
            <div className="kpi-data">
               <span className="label">Total Managed Fee</span>
               <div className="value">Rs. {stats.gross.toLocaleString()}</div>
               <span className="trend positive"><TrendingUp size={12}/> Lifetime collection</span>
            </div>
         </div>
         <div className="kpi-card amber">
            <div className="kpi-icon"><Clock /></div>
            <div className="kpi-data">
               <span className="label">Awaiting Payout</span>
               <div className="value">Rs. {stats.unpaid.toLocaleString()}</div>
               <span className="trend info"><Info size={12}/> {stats.unpaidCount} Pending orders</span>
            </div>
         </div>
         <div className="kpi-card emerald">
            <div className="kpi-icon"><CheckCircle /></div>
            <div className="kpi-data">
               <span className="label">Successfully Settled</span>
               <div className="value">Rs. {stats.paid.toLocaleString()}</div>
               <span className="trend positive"><CheckCircle size={12}/> {stats.paidCount} Completed</span>
            </div>
         </div>
         <div className="kpi-card rose pulse">
            <div className="kpi-icon"><AlertTriangle /></div>
            <div className="kpi-data">
               <span className="label">Overdue & Fined</span>
               <div className="value">Rs. {stats.overdueValue.toLocaleString()}</div>
               <span className="trend negative"><TrendingDown size={12}/> {stats.overdueCount} Critical debts</span>
            </div>
         </div>
      </div>

      <div className="adm-vault-layout">
         <div className="adm-vault-feed">
            <div className="feed-controls">
               <div className="adm-search-v2">
                  <Search size={18} />
                  <input type="text" placeholder="Search Merchant or Order ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
               </div>
               <div className="adm-view-tabs">
                  <button className={viewMode === "GROUPS" ? "active" : ""} onClick={() => setViewMode("GROUPS")}><LayoutGrid size={16}/> Merchant View</button>
                  <button className={viewMode === "LIST" ? "active" : ""} onClick={() => setViewMode("LIST")}><List size={16}/> Daily Ledger</button>
               </div>
            </div>

            {viewMode === "GROUPS" ? (
               <div className="adm-groups-list">
                  {groupedData.map(seller => (
                    <div key={seller.name} className={`adm-seller-accordion ${seller.orders.some(o => o.isOverdue) ? 'overdue-alert' : ''}`}>
                       <div className="adm-accordion-header" onClick={() => toggleSeller(seller.name)}>
                          <div className="adm-seller-primary">
                             <div className="adm-seller-icon"><Store size={20}/></div>
                             <div className="adm-seller-meta">
                                <h3>{seller.name} {seller.orders.some(o => o.isOverdue) && <span className="urgent-badge">Action Required</span>}</h3>
                                <div className="adm-seller-contact">
                                   <Mail size={12}/> <span>{seller.email}</span>
                                   <Phone size={12}/> <span>{seller.phone}</span>
                                </div>
                             </div>
                          </div>
                          <div className="adm-seller-balances">
                             <div className="bal-tag"><span>EARNED</span> <strong>Rs. {seller.paid.toLocaleString()}</strong></div>
                             <div className="bal-tag rem"><span>UNSETTLED</span> <strong>Rs. {seller.unpaid.toLocaleString()}</strong></div>
                             {seller.fine > 0 && <div className="bal-tag fine"><span>TOTAL FINE</span> <strong>Rs. {seller.fine.toLocaleString()}</strong></div>}
                          </div>
                          <div className={`adm-expand-icon ${expandedSellers.has(seller.name) ? 'rotated' : ''}`}><ChevronDown size={20} /></div>
                       </div>
                       {expandedSellers.has(seller.name) && (
                         <div className="adm-accordion-body fade-in">
                            <table className="adm-inner-table">
                               <thead><tr><th>Order #</th><th>Base Fee</th><th>Fines</th><th>Final Total</th><th>Due Date</th><th>Status</th><th>Remind</th></tr></thead>
                               <tbody>
                                 {seller.orders.map(o => (
                                   <tr key={o.orderId} className={o.isOverdue ? 'row-overdue' : ''}>
                                     <td><span className="order-chip">#{o.orderId}</span></td>
                                     <td>Rs. {o.commissionEarned?.toLocaleString()}</td>
                                     <td className="txt-red">Rs. {o.fineAmount?.toLocaleString() || 0}</td>
                                     <td className="txt-bold">Rs. {(o.commissionEarned + (o.fineAmount || 0)).toLocaleString()}</td>
                                     <td>{o.dueDate ? new Date(o.dueDate).toLocaleDateString() : 'N/A'}</td>
                                     <td>
                                        <span className={`status-pill ${o.status.toLowerCase()} ${o.isOverdue ? 'overdue' : ''}`}>
                                           {o.isOverdue ? "OVERDUE" : o.status}
                                        </span>
                                     </td>
                                     <td>
                                        {o.status === 'UNPAID' && (
                                           <button className={`btn-icon-reminder ${o.reminderSent ? 'sent' : ''}`} onClick={(e) => {e.stopPropagation(); handleSendReminder(o.orderId)}} disabled={sendingReminder === o.orderId}>
                                              {sendingReminder === o.orderId ? '...' : (o.reminderSent ? <CheckCircle size={14}/> : <Send size={14}/>)}
                                           </button>
                                        )}
                                     </td>
                                   </tr>
                                 ))}
                               </tbody>
                            </table>
                         </div>
                       )}
                    </div>
                  ))}
               </div>
            ) : (
               <div className="adm-table-card">
                  <table className="adm-master-table">
                    <thead><tr><th>Order ID</th><th>Merchant</th><th>Earned Fee</th><th>Penalty</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {commissions.filter(c => c.sellerStoreName?.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                        <tr key={c.orderId} className={c.isOverdue ? 'row-overdue' : ''}>
                          <td><strong>#{c.orderId}</strong></td>
                          <td><div className="merc-cell"><Store size={14}/> {c.sellerStoreName}</div></td>
                          <td>Rs. {c.commissionEarned?.toLocaleString()}</td>
                          <td className="txt-red">Rs. {c.fineAmount?.toLocaleString() || 0}</td>
                          <td><span className={`status-pill ${c.status.toLowerCase()} ${c.isOverdue ? 'overdue' : ''}`}>{c.isOverdue ? "OVERDUE" : c.status}</span></td>
                          <td>
                             {c.status === 'UNPAID' && <button className="btn-small-remind" onClick={() => handleSendReminder(c.orderId)}><Send size={12}/> Remind</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            )}
         </div>

         <aside className="adm-vault-side">
            <div className="adm-side-card">
               <div className="card-header"><BarChart3 size={18}/><span>Collection Health</span></div>
               <div className="stats-box-mini">
                  <div className="s-mini-row"><span>Overdue Rate</span> <span className="txt-red">{Math.round((stats.overdueCount / (stats.unpaidCount || 1)) * 100)}%</span></div>
                  <div className="s-mini-row"><span>Avg. Penalty</span> <span>Rs. {Math.round(stats.overdueValue / (stats.overdueCount || 1)).toLocaleString()}</span></div>
               </div>
            </div>
            <div className="adm-announcement"><Info size={16}/><p>Penalty increases by 5% every 7 days after the initial 1-week grace period.</p></div>
         </aside>
      </div>

      <style>{`
        .adm-vault-main { padding: 40px; background: #fff; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .adm-vault-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
        .adm-vault-header h1 { margin: 0; font-size: 32px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; }
        .adm-vault-header p { margin: 5px 0 0; color: #64748b; font-size: 16px; font-weight: 500; }
        .header-actions { display: flex; gap: 12px; }
        .btn-primary { background: #0f172a; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .btn-secondary { background: #f8fafc; color: #0f172a; border: 1px solid #e2e8f0; padding: 12px 24px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .adm-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 40px; }
        .kpi-card { background: #f8fafc; padding: 24px; border-radius: 20px; border: 1px solid #f1f5f9; display: flex; gap: 20px; align-items: center; }
        .kpi-icon { width: 56px; height: 56px; border-radius: 16px; background: white; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0,0,0,0.02); }
        .kpi-card.gold .kpi-icon { color: #2563eb; }
        .kpi-card.amber .kpi-icon { color: #d97706; }
        .kpi-card.emerald .kpi-icon { color: #059669; }
        .kpi-card.rose .kpi-icon { color: #e11d48; }
        .kpi-card.rose.pulse { border-color: #fee2e2; background: #fff1f2; }
        .kpi-data .label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .kpi-data .value { font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0; }
        .trend { font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 4px; }
        .trend.positive { color: #10b981; }
        .trend.negative { color: #f43f5e; }
        .adm-vault-layout { display: grid; grid-template-columns: 1fr 340px; gap: 40px; align-items: start; }
        .feed-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 20px; }
        .adm-search-v2 { position: relative; flex: 1; min-width: 0; }
        .adm-search-v2 svg { position: absolute; left: 16px; top: 12px; color: #94a3b8; }
        .adm-search-v2 input { width: 100%; padding: 10px 16px 10px 48px; border-radius: 14px; border: 1px solid #e2e8f0; font-size: 15px; outline: none; transition: 0.2s; }
        .adm-search-v2 input:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,0.05); }
        .adm-view-tabs { background: #f1f5f9; padding: 4px; border-radius: 12px; display: flex; gap: 4px; }
        .adm-view-tabs button { background: none; border: none; padding: 8px 16px; border-radius: 8px; font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 8px; cursor: pointer; color: #64748b; text-transform: uppercase; }
        .adm-view-tabs button.active { background: white; color: #0f172a; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .adm-seller-accordion { background: white; border-radius: 20px; margin-bottom: 20px; border: 1px solid #f1f5f9; overflow: hidden; transition: 0.2s; }
        .adm-seller-accordion.overdue-alert { border-color: #fee2e2; }
        .adm-accordion-header { padding: 24px 30px; display: flex; align-items: center; cursor: pointer; }
        .adm-seller-primary { display: flex; align-items: center; gap: 18px; flex: 1; min-width: 0; }
        .adm-seller-icon { width: 44px; height: 44px; background: #f1f5f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #6366f1; flex-shrink: 0; }
        .adm-seller-meta { min-width: 0; }
        .adm-seller-meta h3 { margin: 0; font-size: 17px; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 10px; }
        .urgent-badge { background: #f43f5e; color: white; font-size: 9px; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.05em; }
        .adm-seller-contact { display: flex; align-items: center; gap: 12px; margin-top: 4px; color: #94a3b8; font-size: 12px; font-weight: 600; }
        .adm-seller-balances { display: flex; gap: 8px; margin: 0 20px; }
        .bal-tag { padding: 8px 14px; border-radius: 10px; border: 1px solid #f8fafc; display: flex; flex-direction: column; min-width: 100px; }
        .bal-tag span { font-weight: 800; color: #94a3b8; text-transform: uppercase; font-size: 9px; }
        .bal-tag strong { font-size: 13px; font-weight: 900; color: #0f172a; margin-top: 2px; }
        .bal-tag.rem strong { color: #f43f5e; }
        .bal-tag.fine { background: #fffbeb; border-color: #fef3c7; }
        .bal-tag.fine strong { color: #b45309; }
        .adm-inner-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .adm-inner-table th { text-align: left; padding: 12px 16px; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; border-bottom: 2px solid #f8fafc; }
        .adm-inner-table td { padding: 16px; font-size: 13px; font-weight: 600; color: #475569; border-bottom: 1px solid #f8fafc; }
        .row-overdue { background: #fff1f2; }
        .status-pill { padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 800; }
        .status-pill.unpaid { background: #fee2e2; color: #ef4444; }
        .status-pill.unpaid.overdue { background: #0f172a; color: white; }
        .status-pill.paid { background: #dcfce7; color: #16a34a; }
        .btn-icon-reminder { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748b; cursor: pointer; transition: 0.2s; }
        .btn-icon-reminder:hover { background: #0f172a; color: white; }
        .btn-icon-reminder.sent { color: #10b981; background: #ecfdf5; }
        .adm-master-table { width: 100%; border-collapse: collapse; }
        .adm-master-table th { text-align: left; padding: 16px; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
        .adm-master-table td { padding: 16px; border-bottom: 1px solid #f8fafc; font-size: 13px; font-weight: 600; color: #1e293b; }
        .txt-red { color: #f43f5e; }
        .txt-bold { font-weight: 900; color: #0f172a; }
        .btn-small-remind { background: #0f172a; color: white; border: none; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 6px; cursor: pointer; }
        .adm-announcement { background: #f8fafc; padding: 20px; border-radius: 16px; border-left: 4px solid #f43f5e; color: #64748b; font-size: 13px; font-weight: 600; display: flex; gap: 14px; align-items: flex-start; margin-top: 24px; }
        .pulse { animation: pulseAnim 2s infinite; }
        @keyframes pulseAnim { 0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); } }
      `}</style>
    </div>
  );
};

export default AdminCommissions;
