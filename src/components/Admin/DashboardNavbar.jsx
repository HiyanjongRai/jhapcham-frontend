import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Bell, MessageSquare, User, 
  ChevronDown, X, Trash2, ExternalLink 
} from 'lucide-react';
import './DashboardNavbar.css';
import { API_BASE } from '../config/config';
import api from "../../api/axios";
import logo from "../Images/Logo/logo1.png";
import { getUnreadCount, getInbox } from "../Message/messageService";

const DashboardNavbar = ({ title, searchTerm, setSearchTerm, showSearch = true, role = 'ADMIN', customUserName }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showMsgDropdown, setShowMsgDropdown] = useState(false);
  
  const userEmail = localStorage.getItem("userEmail");
  const storedName = localStorage.getItem("userName");
  const userName = customUserName || storedName || (role === 'ADMIN' ? "Super Admin" : "Valued Member");

  const isCustomer = role === 'CUSTOMER';
  const isSeller = role === 'SELLER';
  const brandSubtext = isCustomer ? 'PORTAL' : (isSeller ? 'MERCHANT' : 'CONSOLE');
  const searchPlaceholder = isCustomer ? 'Search My Account...' : (isSeller ? 'Search Merchant Intelligence...' : 'Intelligence Search...');

  useEffect(() => {
    if (!userEmail) return;

    const fetchIntelligence = async () => {
      try {
        const notifRes = await api.get(`/api/notifications?username=${userEmail}`);
        const countRes = await api.get(`/api/notifications/unread-count?username=${userEmail}`);
        setNotifications(notifRes.data || []);
        setUnreadNotifCount(countRes.data || 0);

        const msgCounter = await getUnreadCount();
        setUnreadMsgCount(msgCounter || 0);

        const convs = await getInbox();
        setMessages(convs || []);
      } catch (e) {
        console.warn("Intelligence fetch error", e);
      }
    };

    fetchIntelligence();
    const interval = setInterval(fetchIntelligence, 30000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const handleReadNotification = async (id, notif) => {
    try {
      if (!notif.isRead) {
        await api.put(`/api/notifications/${id}/read`);
        setUnreadNotifCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
      setShowNotifDropdown(false);
      if (notif.type === "ORDER_UPDATE") {
         navigate(isCustomer ? `/customer/order/${notif.referenceId || ''}` : '/admin/dashboard');
      }
    } catch (e) { console.warn(e); }
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete(`/api/notifications/clear-all?username=${userEmail}`);
      setNotifications([]);
      setUnreadNotifCount(0);
      setShowNotifDropdown(false);
    } catch (e) { console.warn(e); }
  };

  return (
    <div className={`dash-nav-container theme-${role.toLowerCase()}`}>
      <div className="dash-nav-glass" />
      
      <div className="dash-nav-left">
        {role === 'ADMIN' ? (
          <>
            <div className="dash-nav-brand" onClick={() => navigate('/admin/dashboard')}>
               <div className="dash-nav-logo-wrap">
                  <img src={logo} alt="Jhapcham" className="dash-nav-logo" />
                  <div className="dash-logo-ring" />
               </div>
                <div className="dash-nav-brand-text">
                   <span className="dash-brand-name gt-caption">JHAPCHAM</span>
                   <span className="dash-brand-console gt-note">{brandSubtext}</span>
                </div>
            </div>
            <div className="dash-nav-divider horizontal" />
            
            <div className="dash-nav-context">
              <h2 className="dash-nav-title gt-h3">{title}</h2>
              <div className="dash-nav-breadcrumb">
                 <span>Platform</span>
                 <ChevronDown size={10} className="dash-crumb-sep" />
                 <span className="dash-current">{title}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="dash-nav-context">
            <div className="dash-nav-welcome">
               <span className="dash-welcome-hi gt-note">
                  {userName === 'Valued Member' ? 'It\'s good to see you,' : 'Welcome back,'}
               </span>
               <h2 className="dash-nav-title gt-h3">
                  {userName === 'Valued Member' ? (isSeller ? 'Partner' : 'Guest Explorer') : userName.split(' ')[0]}!
               </h2>
            </div>
          </div>
        )}
      </div>

      <div className="dash-nav-center">
        {showSearch && (
          <div className="dash-nav-search-wrap">
            <Search size={18} className="dash-search-icon" />
            <input 
              type="text" 
              placeholder={searchPlaceholder} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="dash-search-glow" />
          </div>
        )}
      </div>

      <div className="dash-nav-right">
        <div className="dash-nav-actions">
           
           <div className="dash-action-item" onClick={() => setShowNotifDropdown(!showNotifDropdown)}>
              <Bell size={20} />
              {unreadNotifCount > 0 && <div className="dash-notif-badge">{unreadNotifCount}</div>}
              
              {showNotifDropdown && (
                <div className="dash-intel-dropdown" onClick={e => e.stopPropagation()}>
                   <div className="dash-intel-head">
                      <span>{isCustomer ? 'Notifications' : 'Intelligence Center'}</span>
                      <button onClick={clearAllNotifications} className="dash-clear-btn">
                        <Trash2 size={12} /> Clear
                      </button>
                   </div>
                   <div className="dash-intel-list">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 5).map(n => (
                          <div 
                            key={n.id} 
                            className={`dash-intel-item ${!n.isRead ? 'unread' : ''}`}
                            onClick={() => handleReadNotification(n.id, n)}
                          >
                             <div className="dash-intel-dot" />
                             <div className="dash-intel-content">
                                <strong>{n.title}</strong>
                                <p>{n.message}</p>
                                <span>{new Date(n.createdAt).toLocaleTimeString()}</span>
                             </div>
                             <ChevronDown size={14} className="dash-intel-arrow" />
                          </div>
                        ))
                      ) : (
                        <div className="dash-intel-empty">Your workspace is up to date.</div>
                      )}
                   </div>
                   <div className="dash-intel-foot" onClick={() => { navigate('/notifications'); setShowNotifDropdown(false); }}>
                      View Pulse History <ExternalLink size={12} />
                   </div>
                </div>
              )}
           </div>

           <div className="dash-action-item" onClick={() => { setShowMsgDropdown(!showMsgDropdown); setShowNotifDropdown(false); }}>
              <MessageSquare size={20} />
              {unreadMsgCount > 0 && <div className="dash-notif-badge message">{unreadMsgCount}</div>}
              
              {showMsgDropdown && (
                <div className="dash-intel-dropdown msg" onClick={e => e.stopPropagation()}>
                   <div className="dash-intel-head">
                      <span>Recent Messages</span>
                      <button onClick={() => navigate('/messages')} className="dash-clear-btn">
                        View Hub
                      </button>
                   </div>
                   <div className="dash-intel-list">
                      {messages.length > 0 ? (
                        messages.slice(0, 5).map(m => (
                          <div 
                            key={m.userId} 
                            className={`dash-intel-item ${m.unread ? 'unread' : ''}`}
                            onClick={() => { navigate('/messages'); setShowMsgDropdown(false); }}
                          >
                             <div className="dash-intel-avatar">
                                {m.userImage ? <img src={`${API_BASE}/${m.userImage}`} alt="" /> : <User size={14} />}
                             </div>
                             <div className="dash-intel-content">
                                <strong>{m.userName}</strong>
                                <p>{m.lastMessage}</p>
                                <span>{new Date(m.lastMessageTime).toLocaleTimeString()}</span>
                             </div>
                          </div>
                        ))
                      ) : (
                        <div className="dash-intel-empty">No recent messages.</div>
                      )}
                   </div>
                </div>
              )}
           </div>
        </div>
        
        <div className="dash-nav-divider" />
        
        <div className="dash-nav-user" onClick={() => navigate(isCustomer ? '/customer/dashboard?tab=settings' : (isSeller ? '/seller/dashboard?tab=settings' : '/admin/dashboard?tab=settings'))}>
           <div className="dash-user-avatar">
              <User size={20} />
              <div className="dash-user-status-glow" />
           </div>
            <div className="dash-user-info">
               <span className="dash-user-name gt-caption">{userName}</span>
               <span className="dash-user-role gt-note">{isCustomer ? 'Verified Buyer' : (isSeller ? 'Verified Seller' : 'Platform Operator')}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardNavbar;
