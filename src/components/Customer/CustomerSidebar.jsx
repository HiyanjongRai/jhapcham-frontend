import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  MapPin,
  MessageCircle,
  Star,
  Settings,
  Eye,
  LogOut
} from "lucide-react";

const CustomerSidebar = ({ activeTab, setActiveTab, onLogout }) => {
  const navigate = useNavigate();

  const handleNav = (tabId) => {
    if (tabId === 'messages') {
      navigate('/messages');
    } else if (tabId === 'shop') {
      navigate('/');
    } else {
      if (setActiveTab) {
        setActiveTab(tabId);
        if (window.location.pathname !== '/customer/dashboard') {
          navigate(`/customer/dashboard?tab=${tabId}`);
        }
      } else {
        navigate(`/customer/dashboard?tab=${tabId}`);
      }
    }
  };

  return (
    <aside className="cd-sidebar">
      <div className="cd-sidebar-header">
         <div className="cd-sidebar-logo" onClick={() => navigate('/')}>Jhapcham</div>
      </div>

      <nav className="cd-nav">
        <div className="cd-nav-group">
          <div className="cd-nav-label">Main Menu</div>
          {[
            { id: "overview",  label: "Overview",       icon: LayoutDashboard },
            { id: "orders",    label: "Order History",  icon: ShoppingBag },
            { id: "wishlist",  label: "Saved Items",    icon: Heart },
            { id: "addresses", label: "Address Book",   icon: MapPin },
            { id: "messages",  label: "Messages",       icon: MessageCircle },
          ].map(tab => (
            <button
              key={tab.id}
              className={`cd-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleNav(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="cd-nav-group">
          <div className="cd-nav-label">Preferences</div>
          {[
            { id: "reviews",   label: "My Reviews",     icon: Star },
            { id: "settings",  label: "Account Settings", icon: Settings },
            { id: "shop",      label: "Go to Store",    icon: Eye },
          ].map(tab => (
            <button
              key={tab.id}
              className={`cd-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleNav(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="cd-sidebar-footer">
        <button className="cd-nav-item cd-logout-item" onClick={onLogout}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default CustomerSidebar;
