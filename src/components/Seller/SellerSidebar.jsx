import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  ShoppingBag,
  Truck,
  Users,
  Calendar,
  Settings,
  Flag,
  Share2,
  MessageCircle,
  HelpCircle,
  LogOut,
  Store
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUserId } from "../config/authUtils";
import { API_BASE } from "../config/config";
import ConfirmModal from "../Common/ConfirmModal";

export default function SellerSidebar({ storeInfo }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuGroups = [
    {
      title: "Main",
      items: [
        { icon: <LayoutDashboard size={18} />, label: "Overview", path: "/seller/dashboard" },
        { icon: <PlusCircle size={18} />, label: "Add Products", path: "/seller/add-product" },
        { icon: <Package size={18} />, label: "Products", path: "/seller/products" },
      ]
    },
    {
      title: "Sales & CRM",
      items: [
        { icon: <ShoppingBag size={18} />, label: "Orders", path: "/seller/orders" },
        { icon: <Truck size={18} />, label: "Shipment", path: "/seller/shipment" },
        { icon: <Users size={18} />, label: "Customers", path: "/seller/customers" },
        { icon: <Calendar size={18} />, label: "Campaigns", path: "/seller/dashboard", tab: "campaigns" },
      ]
    },
    {
      title: "Management",
      items: [
        { icon: <Settings size={18} />, label: "Store Setting", path: "/seller/dashboard", tab: "settings" },
        { icon: <Users size={18} />, label: "Account Setting", path: "/seller/dashboard", tab: "account" },
        { icon: <Flag size={18} />, label: "Reports", path: "/seller/dashboard", tab: "reports" },
      ]
    },
    {
      title: "Others",
      items: [
        { icon: <Share2 size={18} />, label: "Platform Partner", path: "/seller/partners" },
        { icon: <MessageCircle size={18} />, label: "Feedback", path: "/seller/feedback" },
        { icon: <HelpCircle size={18} />, label: "Help & Support", path: "/seller/help" },
      ]
    }
  ];

  const handleMenuClick = (item) => {
    if (item.tab) {
      // If it's a tab inside the main dashboard
       navigate(item.path, { state: { activeTab: item.tab } });
    } else {
      navigate(item.path);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand-img">
          {storeInfo?.logoImagePath || storeInfo?.profileImagePath ? (
            <img 
              src={`${API_BASE}/${storeInfo.logoImagePath || storeInfo.profileImagePath}`} 
              alt="Store Logo"
            />
          ) : (
            <Store size={32} color="#0f172a" />
          )}
        </div>
        <div style={{ textAlign: 'center' }}>
          <span className="sidebar-brand-name">{storeInfo?.storeName || "Seller Panel"}</span>
          <span className="sidebar-brand-sub">Official Store</span>
        </div>
      </div>

      <div className="sidebar-divider"></div>

      <nav className="sidebar-menu" style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
        {menuGroups.map((group) => (
          <div key={group.title} className="menu-group">
            <h4 className="menu-group-title">{group.title}</h4>
            {group.items.map((item) => {
              const isActive = item.tab 
                ? location.pathname === item.path && (location.state?.activeTab === item.tab)
                : location.pathname === item.path && (!location.state?.activeTab || location.state.activeTab === 'overview');
              
              return (
                <button
                  key={item.label}
                  className={"sidebar-menu-item" + (isActive ? " active" : "")}
                  onClick={() => handleMenuClick(item)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-divider"></div>
      
      <div className="sidebar-footer" style={{ padding: '0 8px' }}>
           <button className="sidebar-menu-item logout-btn" onClick={() => setShowLogoutModal(true)}>
              <LogOut size={18} />
              <span>Sign Out</span>
           </button>
      </div>

      {showLogoutModal && (
        <ConfirmModal 
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
          title="Sign Out"
          message="Are you sure you want to log out of your seller account?"
        />
      )}
    </aside>
  );
}
