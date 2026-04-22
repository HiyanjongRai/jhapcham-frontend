import React from "react";
import CreateCampaign from "./CreateCampaign.jsx";
import "./AdminDashboard.css";

export default function AdminCampaigns() {
  return (
    <div className="adm-campaigns-container fade-in">
      <div className="adm-welcome-banner">
        <div>
          <h2 className="adm-welcome-title">Campaign Hub</h2>
          <p className="adm-welcome-sub">Design and launch platform-wide marketing events.</p>
        </div>
      </div>
      <CreateCampaign />
    </div>
  );
}
