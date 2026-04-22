import React, { useState, useEffect } from "react";
import { Star, Trash2, Search } from "lucide-react";
import axios from "../../api/axios";
import ConfirmModal from "../Common/ConfirmModal.jsx";
import "./AdminDashboard.css";

export default function AdminModeration() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, reviewId: null });

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/reviews");
      setReviews(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const deleteReview = async () => {
    try {
      await axios.delete(`/api/admin/reviews/${confirmConfig.reviewId}`);
      setConfirmConfig({ isOpen: false, reviewId: null });
      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = reviews.filter(r =>
    [r.userName, r.productName, r.comment]
      .some(k => String(k || "").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="adm-moderation-container fade-in">
      <div className="adm-welcome-banner">
        <div>
          <h2 className="adm-welcome-title">Review Moderation</h2>
          <p className="adm-welcome-sub">Monitor and remove inappropriate customer feedback.</p>
        </div>
        <div className="adm-search-bar" style={{ maxWidth: '300px' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search reviews..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="adm-table-card">
        {filtered.map(r => (
          <div className="adm-row review-row" key={r.id}>
            <div className="adm-row-info">
              <div className="adm-review-top">
                <span className="adm-row-title">{r.userName}</span>
                <div className="adm-stars">
                   {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < r.rating ? "#f59e0b" : "none"} color={i < r.rating ? "#f59e0b" : "#cbd5e1"}/>)}
                </div>
              </div>
              <span className="adm-row-sub">Product: {r.productName} · {new Date(r.createdAt).toLocaleDateString()}</span>
              <p className="adm-review-comment">"{r.comment}"</p>
            </div>
            <div className="adm-row-actions">
              <button className="adm-icon-btn danger" title="Delete Review" onClick={() => setConfirmConfig({ isOpen: true, reviewId: r.id })}><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
        {loading ? (
             <div className="adm-empty">Loading reviews...</div>
        ) : filtered.length === 0 && (
             <div className="adm-empty">No reviews match your search.</div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, reviewId: null })}
        onConfirm={deleteReview}
        title="Delete Review"
        message="Permanently delete this customer review? This cannot be undone."
        type="danger"
      />
    </div>
  );
}
