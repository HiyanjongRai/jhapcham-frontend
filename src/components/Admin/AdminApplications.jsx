import React, { useState, useEffect } from "react";
import { FileText, Search, CheckCircle2, XCircle, Store } from "lucide-react";
import { Badge } from "./AdminCommon";
import axios from "../../api/axios";
import ConfirmModal from "../Common/ConfirmModal.jsx";
import "./AdminDashboard.css";

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {}, type: "warning" });

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/sellers/applications/pending");
      setApplications(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  const approveApp = (id) => setConfirmConfig({
    isOpen: true, title: "Approve Merchant",
    message: "Allow this merchant to start selling on Jhapcham?",
    type: "success",
    onConfirm: async () => {
      await axios.post(`/api/admin/sellers/applications/${id}/approve`);
      fetchApplications();
    }
  });

  const rejectApp = (id) => setConfirmConfig({
    isOpen: true, title: "Reject Merchant",
    message: "Are you sure you want to reject this merchant application?",
    type: "danger",
    onConfirm: async () => {
      await axios.post(`/api/admin/sellers/applications/${id}/reject`);
      fetchApplications();
    }
  });

  const filtered = applications.filter(app =>
    [app.storeName, app.fullName, app.email]
      .some(k => String(k || "").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="adm-applications-container fade-in">
      <div className="adm-welcome-banner">
        <div>
          <h2 className="adm-welcome-title">Pending Applications</h2>
          <p className="adm-welcome-sub">Validate and onboard new merchant partners.</p>
        </div>
        <div className="adm-search-bar" style={{ maxWidth: '300px' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search applications..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="adm-table-card">
        {filtered.map(app => (
          <div className="adm-row" key={app.id}>
            <div className="adm-row-avatar"><Store size={20}/></div>
            <div className="adm-row-info">
              <span className="adm-row-title">{app.storeName}</span>
              <span className="adm-row-sub">{app.fullName} · {app.email}</span>
            </div>
            <Badge status="PENDING" />
            <div className="adm-row-actions">
              <button className="adm-icon-btn success" title="Approve" onClick={() => approveApp(app.id)}><CheckCircle2 size={18}/></button>
              <button className="adm-icon-btn danger" title="Reject" onClick={() => rejectApp(app.id)}><XCircle size={18}/></button>
            </div>
          </div>
        ))}
        {loading ? (
             <div className="adm-empty">Loading applications...</div>
        ) : filtered.length === 0 && (
             <div className="adm-empty">No pending applications found.</div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={() => { confirmConfig.onConfirm(); setConfirmConfig({ ...confirmConfig, isOpen: false }); }}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
      />
    </div>
  );
}
