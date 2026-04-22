import React from "react";
import "./AdminDashboard.css";

export const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="adm-stat-card">
    <div className="adm-stat-icon-wrap" style={{ background: color + "18", color }}>
      <Icon size={22} />
    </div>
    <div className="adm-stat-info">
      <span className="adm-stat-label">{label}</span>
      <span className="adm-stat-value">{value}</span>
      {sub && <span className="adm-stat-sub">{sub}</span>}
    </div>
  </div>
);

export const Badge = ({ status }) => {
  const map = {
    ACTIVE:               { cls: "badge-active",    text: "Active" },
    BLOCKED:              { cls: "badge-blocked",   text: "Blocked" },
    PENDING:              { cls: "badge-pending",   text: "Pending" },
    INACTIVE:             { cls: "badge-inactive",  text: "Inactive" },
    NEW:                  { cls: "badge-new",       text: "New" },
    UNDER_INVESTIGATION:  { cls: "badge-warning",   text: "Investigating" },
    RESOLVED:             { cls: "badge-active",    text: "Resolved" },
    RESOLVED_REFUNDED:    { cls: "badge-active",    text: "Refunded" },
    CLOSED_REJECTED:      { cls: "badge-blocked",   text: "Rejected" },
    DELIVERED:            { cls: "badge-active",    text: "Delivered" },
    PLACED:               { cls: "badge-pending",   text: "Placed" },
    PROCESSING:           { cls: "badge-warning",   text: "Processing" },
    CANCELLED:            { cls: "badge-blocked",   text: "Cancelled" },
    SHIPPED:              { cls: "badge-active",    text: "Shipped" },
    SHIPPED_TO_BRANCH:    { cls: "badge-warning",   text: "In Transit" },
    PAID:                 { cls: "badge-active",    text: "Paid" },
    UNPAID:               { cls: "badge-warning",   text: "Unpaid" },
  };
  const m = map[status] || { cls: "badge-inactive", text: status };
  return <span className={`adm-badge ${m.cls}`}>{m.text}</span>;
};
