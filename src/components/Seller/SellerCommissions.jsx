import React, { useState, useEffect, useMemo } from "react";
import { 
  Shield, CreditCard, History, ArrowRight, 
  CheckCircle, AlertCircle, TrendingDown, Search,
  Receipt, DollarSign, Info, HelpCircle, Clock,
  AlertTriangle, Send, RefreshCw, LayoutDashboard,
  Wallet, Waves, Droplets, ArrowUpRight, Zap, Check, Package
} from "lucide-react";
import { getCurrentUserId } from "../../utils/authUtils";
import api from "../../api/axios";
import "./seller.css";

const InfoIcon = Info;

export default function SellerCommissions() {
  const [commissions, setCommissions] = useState([]);
  const [activeTab, setActiveTab] = useState("UNSETTLED");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPolicy, setShowPolicy] = useState(false);
  const sellerId = getCurrentUserId();

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/seller/${sellerId}/commissions`);
      setCommissions(res.data);
    } catch (err) {
      console.error("Failed to fetch commissions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();

    // Check for eSewa return
    const params = new URLSearchParams(window.location.search);
    const esewaData = params.get("data");
    if (esewaData) {
       api.post("/api/seller/commissions/esewa/verify", { data: esewaData })
         .then(res => {
            if (res.data.success) {
               alert("Consignment settlement success!");
               fetchCommissions();
            }
            window.history.replaceState({}, document.title, window.location.pathname);
         })
         .catch(() => window.history.replaceState({}, document.title, window.location.pathname));
    }
  }, [sellerId]);

  const stats = useMemo(() => {
    const unsettled = commissions.filter(c => c.status === "UNPAID" || (c.status === "PENDING" && c.commissionEarned > 0));
    const paid = commissions.filter(c => c.status === "PAID");
    const overdue = commissions.filter(c => c.isOverdue);
    
    return {
      outstanding: unsettled.reduce((sum, c) => sum + (c.commissionEarned || 0) + (c.fineAmount || 0), 0),
      settled: paid.reduce((sum, c) => sum + (c.commissionEarned || 0) + (c.fineAmount || 0), 0),
      fineTotal: commissions.reduce((sum, c) => sum + (c.fineAmount || 0), 0),
      overdueCount: overdue.length,
      unpaidCount: unsettled.length,
      healthScore: Math.round(((commissions.length - overdue.length) / (commissions.length || 1)) * 100)
    };
  }, [commissions]);

  const filteredItems = useMemo(() => {
    const base = activeTab === "UNSETTLED" 
      ? commissions.filter(c => c.status === "UNPAID" || (c.status === "PENDING" && c.commissionEarned > 0)) 
      : commissions.filter(c => c.status === "PAID");
    return base.filter(item => 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.orderId).includes(searchTerm)
    ).sort((a,b) => b.isOverdue ? 1 : -1);
  }, [activeTab, commissions, searchTerm]);

  const handlePay = async (c) => {
    const amount = (c.commissionEarned || 0) + (c.fineAmount || 0);
    try {
      const res = await api.post(`/api/seller/${sellerId}/commissions/${c.orderId}/esewa/initiate`, {
        amount: String(amount)
      });
      
      console.log("Initiating commission payment...", amount, res.data);
      
      const form = document.createElement("form");
      form.setAttribute("method", "POST");
      form.setAttribute("action", res.data.epayUrl);

      Object.entries(res.data).forEach(([key, value]) => {
         if (key === "epayUrl") return;
         const input = document.createElement("input");
         input.setAttribute("type", "hidden");
         input.setAttribute("name", key);
         input.setAttribute("value", value);
         form.appendChild(input);
      });

      document.body.appendChild(form);
      console.log("Submitting form to eSewa...");
      form.submit();
    } catch (err) {
      console.error("Payment Error:", err);
      alert("Payment initiation failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handlePayAllComm = async () => {
    if (stats.outstanding <= 0) return;
    try {
      const res = await api.post(`/api/seller/${sellerId}/commissions/pay-all/initiate`, {
        amount: String(stats.outstanding)
      });
      
      const form = document.createElement("form");
      form.setAttribute("method", "POST");
      form.setAttribute("action", res.data.epayUrl);

      Object.entries(res.data).forEach(([key, value]) => {
         if (key === "epayUrl") return;
         const input = document.createElement("input");
         input.setAttribute("type", "hidden");
         input.setAttribute("name", key);
         input.setAttribute("value", value);
         form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      alert("Bulk payment initiation failed");
    }
  };

  if (loading) return <div className="p-loader">Sychronizing Ledger...</div>;

  return (
    <div className="pfee-fluid-hub">
      {/* Settlement Roadmap Modal */}
      {showPolicy && (
        <div className="p-modal-overlay" onClick={() => setShowPolicy(false)}>
          <div className="p-roadmap-modal glass-v2" onClick={e => e.stopPropagation()}>
             <div className="p-roadmap-head">
                <Waves className="text-indigo animate-pulse"/>
                <h2>Platform Settlement Roadmap</h2>
                <button className="close-btn" onClick={() => setShowPolicy(false)}>×</button>
             </div>
             
             <div className="roadmap-timeline">
                <div className="lane-v2">
                   <div className="step-point blue"><Droplets size={14}/></div>
                   <div className="step-content">
                      <h3>Stage 1: Fulfillment</h3>
                      <p>Consignment delivered and confirmed. Accounting initialized at base marketplace rate.</p>
                   </div>
                </div>
                
                <div className="lane-v2">
                   <div className="step-point green"><Clock size={14}/></div>
                   <div className="step-content">
                      <h3>Stage 2: Grace Window</h3>
                      <p><strong>7 Day Period</strong> for interest-free settlement. High transparency period.</p>
                   </div>
                </div>

                <div className="lane-v2">
                   <div className="step-point red"><AlertTriangle size={14}/></div>
                   <div className="step-content">
                      <h3>Stage 3: Fine Accrual</h3>
                      <p><strong>Day 8</strong> triggers an automatic <strong>10% penalty</strong> on existing commission.</p>
                   </div>
                </div>

                <div className="lane-v2">
                   <div className="step-point dark"><TrendingDown size={14}/></div>
                   <div className="step-content">
                      <h3>Stage 4: Progressive Fees</h3>
                      <p>Debt increases by <strong>5% every week</strong>. Avoid this by settling early.</p>
                   </div>
                </div>
             </div>

             <div className="roadmap-footer">
                <button className="p-btn-primary full-width" onClick={() => setShowPolicy(false)}>Understood</button>
             </div>
          </div>
        </div>
      )}

      <div className="pfee-top-nav-v2">
        <div className="p-brand">
            <div className="p-logo-glyph"><Zap size={24} fill="currentColor"/></div>
            <div className="p-title-wrap">
               <span>Business Intelligence</span>
               <h1>Platform Dividends</h1>
            </div>
        </div>
        <div className="p-actions-main">
           {stats.outstanding > 0 && (
             <button className="p-btn-settle-all" onClick={handlePayAllComm}>
               <img src="https://esewa.com.np/common/images/esewa_logo.png" alt="" style={{ height: '14px', marginRight: '8px' }}/>
               Settle All Due (Rs. {Math.round(stats.outstanding)})
             </button>
           )}
           <button className="p-btn-secondary" onClick={() => setShowPolicy(true)}><InfoIcon size={16}/> View Policy</button>
           <button className="p-btn-primary" onClick={fetchCommissions}><RefreshCw size={16}/> Sync</button>
        </div>
      </div>

      <div className="p-stats-fluid-row">
          <div className="p-stat-box-fluid glass-v2">
             <span className="l">Outstanding Debt</span>
             <div className={`v ${stats.outstanding > 0 ? 'txt-red' : ''}`}>Rs. {Math.round(stats.outstanding).toLocaleString()}</div>
             <div className="h">{stats.unpaidCount} Pending Payments</div>
          </div>
          <div className="p-stat-box-fluid glass-v2">
             <span className="l">Total Settled</span>
             <div className="v">Rs. {Math.round(stats.settled).toLocaleString()}</div>
             <div className="h">Audited Marketplace Fees</div>
          </div>
          <div className="p-stat-box-fluid glass-v2">
             <span className="l">Accrued Fines</span>
             <div className={`v ${stats.fineTotal > 0 ? 'txt-red' : ''}`}>Rs. {Math.round(stats.fineTotal).toLocaleString()}</div>
             <div className="h">Late payment penalties</div>
          </div>
          <div className="p-stat-box-fluid glass-v2 health-box">
             <span className="l">Settlement Health</span>
             <div className="v-ring">
                <div className="ring-fill" style={{width: `${stats.healthScore}%`}}></div>
                <span>{stats.healthScore}%</span>
             </div>
          </div>
      </div>

      <div className="p-ledger-container-v2">
          <div className="p-ledger-header">
             <div className="p-ledger-tabs">
                <button className={activeTab === 'UNSETTLED' ? 'active' : ''} onClick={() => setActiveTab('UNSETTLED')}>Active Liabilities</button>
                <button className={activeTab === 'PAID' ? 'active' : ''} onClick={() => setActiveTab('PAID')}>Ledger History</button>
             </div>
             <div className="p-ledger-search">
                <Search size={18}/>
                <input type="text" placeholder="Filter references..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
             </div>
          </div>

          <div className="p-table-wrap-v2">
             <table className="p-fluid-table">
                <thead>
                   <tr>
                      <th>REFERENCE</th>
                      <th>CONSIGNMENT</th>
                      <th>FINAL DUE</th>
                      <th className="txt-right">MARKETPLACE FEE</th>
                      <th className="txt-right">LATE PENALTY</th>
                      <th className="txt-right">TOTAL PAYABLE</th>
                      <th className="txt-center">STATUS</th>
                      <th className="txt-right">ACTION</th>
                   </tr>
                </thead>
                <tbody>
                   {filteredItems.map((c, i) => (
                      <tr key={i} className={c.isOverdue ? 'row-overdue' : ''}>
                         <td><span className="ref-id-v2">#ORD-{c.orderId}</span><span className="ref-cat-v2">{c.category}</span></td>
                         <td><div className="prod-meta-v2"><strong>{c.productName}</strong><span>Rs. {c.saleAmount.toLocaleString()} Sale</span></div></td>
                         <td>
                            <div className="time-meta-v2">
                               {c.status === 'PAID' ? <span className="settled">Settled {new Date().toLocaleDateString()}</span> : <span>Due {c.dueDate ? new Date(c.dueDate).toLocaleDateString() : 'N/A'}</span>}
                               {c.isOverdue && <span className="overdue-tag">LATE</span>}
                            </div>
                         </td>
                         <td className="txt-right amount-v2">Rs. {Math.round(c.commissionEarned).toLocaleString()}</td>
                         <td className={`txt-right fine-v2 ${c.fineAmount > 0 ? 'red' : 'muted'}`}>Rs. {Math.round(c.fineAmount || 0)}</td>
                         <td className="txt-right total-v2">Rs. {Math.round(c.commissionEarned + (c.fineAmount || 0)).toLocaleString()}</td>
                         <td className="txt-center">
                            <span className={`status-seal-v2 ${c.status === 'PAID' ? 'paid' : (c.isOverdue ? 'late' : 'pending')}`}>
                               {c.isOverdue ? "OVERDUE" : c.status}
                            </span>
                         </td>
                         <td className="txt-right">
                             {c.status !== 'PAID' ? (
                                <button className="p-btn-settle" onClick={() => handlePay(c)}>
                                   <img src="https://esewa.com.np/common/images/esewa_logo.png" alt="" style={{ height: '12px', marginRight: '6px' }}/>
                                   Settle
                                </button>
                             ) : (
                                <button className="p-btn-receipt" title="View Audit Receipt"><Receipt size={16}/></button>
                             )}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
             {filteredItems.length === 0 && <div className="p-empty-v2">All settlements up to date. Account standing is verified.</div>}
          </div>
      </div>

      <style>{`
        .pfee-fluid-hub { padding: 40px; background: #fff; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .p-brand { display: flex; align-items: center; gap: 16px; }
        .text-indigo { color: #6366f1; }
        .p-title-wrap h1 { font-size: 32px; font-weight: 950; color: #0f172a; margin: 0; letter-spacing: -0.04em; }
        .p-title-wrap span { font-size: 14px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
        .pfee-top-nav-v2 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 48px; }
        .p-actions-main { display: flex; gap: 16px; }
        
        .p-btn-settle-all { 
          background: #6366f1; color: #fff; border: none; padding: 12px 24px; border-radius: 12px;
          font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);
        }
        .p-btn-settle-all:hover { transform: translateY(-2px); box-shadow: 0 15px 30px -10px rgba(99, 102, 241, 0.6); }

        .p-stats-fluid-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 48px; }
        .p-stat-box-fluid { padding: 32px; border-radius: 24px; border: 1px solid rgba(0,0,0,0.05); }
        .glass-v2 { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); }
        .p-stat-box-fluid .l { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 12px; display: block; }
        .p-stat-box-fluid .v { font-size: 28px; font-weight: 900; color: #0f172a; }
        .p-stat-box-fluid .h { font-size: 13px; font-weight: 500; color: #94a3b8; margin-top: 8px; }
        .txt-red { color: #f43f5e !important; }

        .p-ledger-container-v2 { background: #f8fafc; border-radius: 32px; padding: 32px; border: 1px solid rgba(0,0,0,0.03); }
        .p-ledger-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .p-ledger-tabs { display: flex; background: #fff; padding: 6px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .p-ledger-tabs button { padding: 10px 24px; border-radius: 12px; border: none; background: none; font-weight: 700; color: #64748b; cursor: pointer; transition: 0.2s; }
        .p-ledger-tabs button.active { background: #0f172a; color: #fff; }
        
        .p-ledger-search { display: flex; align-items: center; gap: 12px; background: #fff; padding: 10px 20px; border-radius: 16px; border: 1px solid #e2e8f0; min-width: 320px; }
        .p-ledger-search input { border: none; outline: none; font-size: 14px; font-weight: 500; width: 100%; }

        .p-fluid-table { width: 100%; border-collapse: separate; border-spacing: 0 12px; }
        .p-fluid-table th { padding: 16px; font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
        .p-fluid-table td { padding: 24px 16px; background: #fff; first-child { border-radius: 16px 0 0 16px; } last-child { border-radius: 0 16px 16px 0; } }
        .ref-id-v2 { display: block; font-weight: 800; color: #0f172a; font-size: 15px; }
        .ref-cat-v2 { font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; background: #eef2ff; padding: 2px 8px; border-radius: 6px; margin-top: 4px; display: inline-block; }
        
        .amount-v2 { font-weight: 700; color: #0f172a; }
        .fine-v2.red { color: #f43f5e; font-weight: 700; }
        .total-v2 { font-weight: 900; color: #0f172a; font-size: 16px; }

        .status-seal-v2 { padding: 6px 14px; border-radius: 10px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
        .status-seal-v2.paid { background: #dcfce7; color: #166534; }
        .status-seal-v2.late { background: #fee2e2; color: #991b1b; }
        .status-seal-v2.pending { background: #f1f5f9; color: #475569; }

        .p-btn-settle { background: #0f172a; color: #fff; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; margin-left: auto; transition: 0.2s; }
        .p-btn-settle:hover { background: #6366f1; transform: translateX(4px); }
        .p-btn-receipt { background: #f1f5f9; color: #64748b; border: none; padding: 10px; border-radius: 12px; cursor: pointer; margin-left: auto; display: block; }

        .p-roadmap-modal { width: 500px; padding: 40px; border-radius: 32px; position: relative; }
        .lane-v2 { display: flex; gap: 20px; margin-bottom: 24px; position: relative; }
        .step-point { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; z-index: 10; }
        .step-point.blue { background: #e0f2fe; color: #0ea5e9; }
        .step-point.green { background: #dcfce7; color: #22c55e; }
        .step-point.red { background: #fee2e2; color: #ef4444; }
        .step-point.dark { background: #f1f5f9; color: #0f172a; }

        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

        .p-empty-v2 { text-align: center; padding: 64px; color: #94a3b8; font-weight: 600; font-size: 15px; }
      `}</style>
    </div>
  );
}
