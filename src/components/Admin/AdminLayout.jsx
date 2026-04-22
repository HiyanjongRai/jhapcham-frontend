import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  Users, Boxes, AlertTriangle, FileText, Settings, LogOut,
  Shield, ShoppingBag, LayoutDashboard, MessageSquare, 
  Store, DollarSign, Zap, Star
} from "lucide-react";
import DashboardNavbar from "./DashboardNavbar.jsx";
import ConfirmModal from "../Common/ConfirmModal.jsx";
import "./AdminDashboard.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });

  const navItems = [
    { group: "General", items: [
      { id: "overview",      label: "Overview",      icon: LayoutDashboard, path: "/admin/dashboard" },
      { id: "orders",        label: "Orders",        icon: ShoppingBag,      path: "/admin/orders" },
      { id: "products",      label: "Catalog",       icon: Boxes,            path: "/admin/catalog" },
      { id: "messages",      label: "Messages",      icon: MessageSquare,    path: "/admin/messages" },
    ]},
    { group: "Partners", items: [
      { id: "sellers",       label: "Merchants",     icon: Store,            path: "/admin/merchants" },
      { id: "applications",  label: "Applications",  icon: FileText,         path: "/admin/applications" },
    ]},
    { group: "Operations", items: [
      { id: "reports",       label: "Disputes",      icon: AlertTriangle,    path: "/admin/disputes" },
      { id: "reviews",       label: "Moderation",    icon: Star,             path: "/admin/moderation" },
      { id: "commissions",   label: "Commissions",   icon: DollarSign,       path: "/admin/commissions" },
      { id: "users",         label: "Customers",     icon: Users,            path: "/admin/users" },
    ]},
    { group: "Content", items: [
      { id: "campaigns",     label: "Campaigns",     icon: Zap,              path: "/admin/campaigns" },
    ]},
    { group: "System", items: [
      { id: "settings",      label: "Settings",      icon: Settings,         path: "/admin/settings" },
    ]}
  ];

  const handleLogout = () => setConfirmConfig({
    isOpen: true,
    title: "Sign Out",
    message: "Are you sure you want to sign out?",
    onConfirm: () => { localStorage.clear(); navigate("/login"); }
  });

  return (
    <div className="admin-dashboard-layout">
      <aside className="adm-sidebar">
        <div className="adm-sidebar-logo" onClick={() => navigate("/")}>
          <Shield size={22} />
          <span>Jhapcham Admin</span>
        </div>

        <nav className="adm-sidebar-nav">
          {navItems.map((group) => (
            <div key={group.group} className="adm-nav-group">
              <span className="adm-nav-group-label">{group.group}</span>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={`adm-nav-item ${location.pathname === item.path ? "active" : ""}`}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <button className="adm-nav-item logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="adm-main">
        <DashboardNavbar title="Administration" role="ADMIN" />
        <div className="adm-content-wrapper">
          <Outlet />
        </div>
      </main>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type="danger"
      />
    </div>
  );
}
