import React, { useState } from "react";
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
  MessageCircle,
  HelpCircle,
  LogOut,
  Store,
  Tag,
  ChevronRight,
  ExternalLink,
  Eye,
  FileText
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE } from "../config/config";
import ConfirmModal from "../Common/ConfirmModal";
import "./seller.css";
import { getCurrentUserId } from "../../utils/authUtils";

export default function SellerSidebar({ storeInfo }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const sellerId = getCurrentUserId();

  const menuGroups = [
    {
      title: "Navigation",
      items: [
        { icon: <LayoutDashboard size={16} />, label: "Dashboard", path: "/seller/dashboard" },
        { icon: <PlusCircle size={16} />, label: "Add Product", path: "/seller/add-product" },
        { icon: <Package size={16} />, label: "My Inventory", path: "/seller/products" },
        { icon: <Eye size={16} />, label: "View Shop", path: `/seller/${sellerId}` },
      ]
    },
    {
      title: "Sales & Logistics",
      items: [
        { icon: <FileText size={16} />, label: "Order Manager", path: "/seller/orders" },
        { icon: <Truck size={16} />, label: "Shipments", path: "/seller/shipment" },
        { icon: <Calendar size={16} />, label: "Campaigns", path: "/seller/dashboard", tab: "campaigns" },
      ]
    },
    {
      title: "Store Management",
      items: [
        { icon: <Store size={16} />, label: "Store Profile", path: "/seller/dashboard", tab: "settings" },
        { icon: <Tag size={16} />, label: "Coupons/Promo", path: "/seller/promos" },
        { icon: <Flag size={16} />, label: "Reports", path: "/seller/dashboard", tab: "reports" },
        { icon: <Users size={16} />, label: "Account Info", path: "/seller/dashboard", tab: "account" },
      ]
    },
    {
      title: "Support",
      items: [
        { icon: <MessageCircle size={16} />, label: "Messages", path: "/messages" },
        { icon: <HelpCircle size={16} />, label: "Support Center", path: "/seller/help" },
      ]
    }
  ];

  const handleMenuClick = (item) => {
    if (item.tab) {
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
    <aside className="cd-sidebar">
      <div className="cd-sidebar-header">
         <div className="cd-sidebar-logo" onClick={() => navigate('/')}>Jhapcham</div>
         {storeInfo?.storeName && (
           <div className="gt-note" style={{ color: 'var(--porto-text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
             {storeInfo.storeName}
           </div>
         )}
      </div>

      <nav className="cd-nav">
        {menuGroups.map((group) => (
          <div key={group.title} className="cd-nav-group">
            <div className="cd-nav-label">{group.title}</div>
            {group.items.map((item) => {
              const isActive = item.tab 
                ? location.state?.activeTab === item.tab
                : location.pathname === item.path && (!location.state?.activeTab || location.state.activeTab === 'overview');
              
              return (
                <button
                  key={item.label}
                  className={`cd-nav-item ${isActive ? 'active' : ''}`}
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

      <div className="cd-sidebar-footer">
        <button className="cd-nav-item cd-logout-item" onClick={() => setShowLogoutModal(true)}>
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
