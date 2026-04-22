import React, { useState, useEffect } from "react";
import { Store, Search, MessageSquare, ExternalLink, Eye } from "lucide-react";
import { Badge } from "./AdminCommon";
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/config";
import MessageModal from "../Message/MessageModal.jsx";
import "./AdminDashboard.css";

export default function AdminMerchants() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageConfig, setMessageConfig] = useState({ isOpen: false, recipientId: null, recipientName: "" });
  const navigate = useNavigate();

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/sellers");
      setSellers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSellers(); }, []);

  const filtered = sellers.filter(s =>
    [s.storeName, s.fullName, s.email]
      .some(k => String(k || "").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="adm-merchants-container fade-in">
      <div className="adm-welcome-banner">
        <div>
          <h2 className="adm-welcome-title">Marketplace Merchants</h2>
          <p className="adm-welcome-sub">Monitor and verify store performance and credentials.</p>
        </div>
        <div className="adm-search-bar" style={{ maxWidth: '300px' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search stores..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="adm-table-card">
        {filtered.map(s => (
          <div className="adm-row clickable" key={s.id} onClick={() => navigate(`/admin/merchant/${s.id}`)}>
            <div className="adm-row-avatar">
              {s.logoImagePath ? <img src={`${API_BASE}/${s.logoImagePath}`} alt=""/> : s.storeName?.charAt(0)}
            </div>
            <div className="adm-row-info">
              <span className="adm-row-title">{s.storeName}</span>
              <span className="adm-row-sub">{s.fullName} · {s.email}</span>
            </div>
            <Badge status={s.status} />
            <div className="adm-row-actions" onClick={e => e.stopPropagation()}>
              <button className="adm-icon-btn" onClick={() => setMessageConfig({ isOpen: true, recipientId: s.id, recipientName: s.storeName })} title="Message Store"><MessageSquare size={16}/></button>
              <button className="adm-icon-btn" onClick={()=>navigate(`/seller/${s.id}`)} title="Go to Store Front"><ExternalLink size={16}/></button>
              <button className="adm-icon-btn success" onClick={()=>navigate(`/admin/merchant/${s.id}`)} title="View Analytics"><Eye size={16}/></button>
            </div>
          </div>
        ))}
        {loading ? (
             <div className="adm-empty">Loading merchants...</div>
        ) : filtered.length === 0 && (
             <div className="adm-empty">No merchants found.</div>
        )}
      </div>

      <MessageModal
        isOpen={messageConfig.isOpen}
        onClose={() => setMessageConfig({ isOpen: false })}
        recipientId={messageConfig.recipientId}
        recipientName={messageConfig.recipientName}
      />
    </div>
  );
}
