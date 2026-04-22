import React from "react";
import UpdateAccount from "../Profile/UpdateAccount.jsx";
import "./AdminDashboard.css";

export default function AdminSettings() {
  return (
    <div className="adm-settings-container fade-in">
      <div className="adm-welcome-banner">
        <div>
          <h2 className="adm-welcome-title">Admin Account</h2>
          <p className="adm-welcome-sub">Manage your security credentials and personal information.</p>
        </div>
      </div>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <UpdateAccount />
      </div>
    </div>
  );
}
