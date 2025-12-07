import React from "react";
import "./seller.css";
import {
  Home,
  Package,
  Users,
  ShoppingBag,
  Truck,
  Settings,
  Share2,
  MessageCircle,
  HelpCircle,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function SellerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: <Home size={18} />, label: "Overview", path: "/seller" },
    { icon: <Package size={18} />, label: "Add Products", path: "/seller/add-product" },
    { icon: <Package size={18} />, label: "Products", path: "/seller/products" },
    { icon: <Users size={18} />, label: "Customer", path: "/seller/customers" },
    { icon: <ShoppingBag size={18} />, label: "Orders", path: "/seller/orders" },
    { icon: <Truck size={18} />, label: "Shipment", path: "/seller/shipment" },
    { icon: <Settings size={18} />, label: "Store Setting", path: "/seller/settings" },
    { icon: <Share2 size={18} />, label: "Platform Partner", path: "/seller/partners" },
    { icon: <MessageCircle size={18} />, label: "Feedback", path: "/seller/feedback" },
    { icon: <HelpCircle size={18} />, label: "Help & Support", path: "/seller/help" },
  ];

  const handleMenuClick = (path) => {
    navigate(path);
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span>Seller Panel</span>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                className={"sidebar-menu-item" + (isActive ? " active" : "")}
                onClick={() => handleMenuClick(item.path)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="dashboard-content">
        <h2>Welcome to Seller Dashboard</h2>

        <div className="dashboard-actions" style={{ marginTop: "2rem" }}>
          <h3>Quick Actions</h3>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button
              className="btn-primary"
              onClick={() => navigate("/seller/settings")}
              style={{
                padding: "1rem 2rem",
                backgroundColor: "#000",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "1rem"
              }}
            >
              <Settings size={20} />
              Update Store Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
