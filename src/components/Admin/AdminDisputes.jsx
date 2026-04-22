import React, { useState, useEffect } from "react";
import { AlertTriangle, Search, MessageSquare } from "lucide-react";
import { Badge } from "./AdminCommon";
import axios from "../../api/axios";
import ResolutionModal from "./ResolutionModal.jsx";
import MessageModal from "../Message/MessageModal.jsx";
import "./AdminDashboard.css";

export default function AdminDisputes() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [resolutionConfig, setResolutionConfig] = useState({ isOpen: false, reportId: null, status: '', reason: '' });
  const [messageConfig, setMessageConfig] = useState({ isOpen: false, recipientId: null, recipientName: "" });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/reports");
      setReports(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const resolveReport = async (id, status, note) => {
    try {
      await axios.post(`/api/admin/reports/${id}/resolve`, { status, note });
      setResolutionConfig({ ...resolutionConfig, isOpen: false });
      fetchReports();
    } catch { console.error("Failed to resolve report"); }
  };

  const filtered = reports.filter(r =>
    [r.reportedEntityName, r.reporterName, r.reason, r.type]
      .some(k => String(k || "").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="adm-disputes-container fade-in">
      <div className="adm-welcome-banner">
        <div>
          <h2 className="adm-welcome-title">Resolution Center</h2>
          <p className="adm-welcome-sub">Address user disputes and content violations.</p>
        </div>
        <div className="adm-search-bar" style={{ maxWidth: '300px' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search disputes..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="adm-table-card">
         {filtered.map(r => (
           <div className="adm-row" key={r.id}>
             <div className="adm-row-info">
               <span className="adm-row-title">{r.productName || r.reportedEntityName}</span>
               <span className="adm-row-sub">{r.type || 'Product Report'} · by {r.customerName || r.reporterName}</span>
               <p className="adm-row-desc">{r.reason}</p>
               <p className="adm-row-desc" style={{ fontStyle: 'italic', color: '#64748b' }}>"{r.description}"</p>
               {r.evidenceUrls && r.evidenceUrls.length > 0 && (
                   <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                       {r.evidenceUrls.map(url => {
                           const fullUrl = url.startsWith('http') ? url : `http://localhost:8080/${url}`;
                           return (
                               <a key={url} href={fullUrl} target="_blank" rel="noreferrer">
                                   <img src={fullUrl} alt="evidence" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                               </a>
                           );
                       })}
                   </div>
               )}
             </div>
             <Badge status={r.status} />
             <div className="adm-row-actions">
                <select 
                  className="adm-select small" 
                  value="" 
                  onChange={(e)=> {
                    if(!e.target.value) return;
                    setResolutionConfig({ isOpen: true, reportId: r.id, status: e.target.value, reason: r.reason });
                    e.target.value = "";
                  }}
                  disabled={r.status === "RESOLVED" || r.status === "RESOLVED_REFUNDED" || r.status === "CLOSED_REJECTED"}
                >
                   <option value="">Resolution...</option>
                   <option value="UNDER_INVESTIGATION">Investigate</option>
                   <option value="RESOLVED">Resolve (Valid)</option>
                   <option value="RESOLVED_REFUNDED">Resolve & Refund</option>
                   <option value="CLOSED_REJECTED">Dismiss (Invalid)</option>
                </select>
                <button className="adm-icon-btn" onClick={() => setMessageConfig({ isOpen: true, recipientId: r.reporterId, recipientName: r.reporterName })}><MessageSquare size={16}/></button>
             </div>
           </div>
         ))}
         {loading ? (
              <div className="adm-empty">Loading tickets...</div>
         ) : filtered.length === 0 && (
              <div className="adm-empty">No active disputes found.</div>
         )}
      </div>

      <ResolutionModal
        isOpen={resolutionConfig.isOpen}
        onClose={() => setResolutionConfig({...resolutionConfig, isOpen: false})}
        onResolve={resolveReport}
        reportId={resolutionConfig.reportId}
        statusLabel={resolutionConfig.status}
      />

      <MessageModal
        isOpen={messageConfig.isOpen}
        onClose={() => setMessageConfig({ isOpen: false })}
        recipientId={messageConfig.recipientId}
        recipientName={messageConfig.recipientName}
      />
    </div>
  );
}
