import React, { useState, useEffect } from "react";
import { Users, Search, MessageSquare, Lock, Unlock } from "lucide-react";
import { Badge } from "./AdminCommon";
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";
import MessageModal from "../Message/MessageModal.jsx";
import ConfirmModal from "../Common/ConfirmModal.jsx";
import "./AdminDashboard.css";

export default function AdminCustomers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageConfig, setMessageConfig] = useState({ isOpen: false, recipientId: null, recipientName: "" });
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {}, type: "warning" });
  
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/users");
      setUsers(res.data.filter(u => u.role === "CUSTOMER"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const blockUser = (userId) => setConfirmConfig({
    isOpen: true, title: "Block User",
    message: "Block this user? They will not be able to log in.",
    type: "danger",
    onConfirm: async () => {
      await axios.put(`/api/admin/users/${userId}/block`);
      fetchUsers();
    }
  });

  const unblockUser = (userId) => setConfirmConfig({
    isOpen: true, title: "Reactivate User",
    message: "Allow this user to access their account again?",
    type: "success",
    onConfirm: async () => {
      await axios.put(`/api/admin/users/${userId}/unblock`);
      fetchUsers();
    }
  });

  const filtered = users.filter(u =>
    [u.fullName, u.email]
      .some(k => String(k || "").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="adm-customers-container fade-in">
      <div className="adm-welcome-banner">
        <div>
          <h2 className="adm-welcome-title">Platform Customers</h2>
          <p className="adm-welcome-sub">Manage user accounts and security profiles.</p>
        </div>
        <div className="adm-search-bar" style={{ maxWidth: '300px' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search customers..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="adm-table-card">
        {filtered.map(u => (
          <div className="adm-row clickable" key={u.id} onClick={() => navigate(`/admin/customer/${u.id}`)}>
            <div className="adm-row-avatar">{u.fullName?.charAt(0).toUpperCase() || "U"}</div>
            <div className="adm-row-info">
              <span className="adm-row-title">{u.fullName}</span>
              <span className="adm-row-sub">{u.email} · #{u.id}</span>
            </div>
            <Badge status={u.status} />
            <div className="adm-row-actions" onClick={e => e.stopPropagation()}>
              <button className="adm-icon-btn" title="Send Message" onClick={() => setMessageConfig({ isOpen: true, recipientId: u.id, recipientName: u.fullName })}><MessageSquare size={16}/></button>
              {u.status === "ACTIVE"
                ? <button className="adm-icon-btn danger" title="Block" onClick={() => blockUser(u.id)}><Lock size={16}/></button>
                : <button className="adm-icon-btn success" title="Unblock" onClick={() => unblockUser(u.id)}><Unlock size={16}/></button>
              }
            </div>
          </div>
        ))}
        {loading ? (
             <div className="adm-empty">Loading users...</div>
        ) : filtered.length === 0 && (
             <div className="adm-empty">No customers match your search.</div>
        )}
      </div>

      <MessageModal
        isOpen={messageConfig.isOpen}
        onClose={() => setMessageConfig({ isOpen: false })}
        recipientId={messageConfig.recipientId}
        recipientName={messageConfig.recipientName}
      />

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
