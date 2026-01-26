import React, { useEffect, useState } from "react";
import { API_BASE } from "../config/config";
import axios from "../../api/axios";
import { Bell, CheckCircle2, AlertTriangle, Package, Info, Search, XCircle, Shield, Store, Flag, Megaphone, MessageSquare } from "lucide-react";
import "./NotificationPage.css";

export default function NotificationList() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        let username = localStorage.getItem("userEmail");
        
        if (!username) {
            const encodedId = localStorage.getItem("userId");
            if (encodedId) {
                try {
                    const userId = atob(encodedId);
                    const res = await axios.get(`${API_BASE}/api/users/${userId}`);
                    username = res.data.email;
                    if (username) localStorage.setItem("userEmail", username);
                } catch (err) {
                    console.error("Notification email resolution failed:", err);
                }
            }
        }

        if (!username) {
            setError("You must be logged in to view notifications.");
            setLoading(false);
            return;
        }

        try {
            const res = await axios.get(`${API_BASE}/api/notifications?username=${username}`);
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to load notifications:", err);
            setError("Failed to load notifications.");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.put(`${API_BASE}/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            window.dispatchEvent(new Event('notifications-updated'));
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
            await Promise.all(unreadIds.map(id => axios.put(`${API_BASE}/api/notifications/${id}/read`)));
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            window.dispatchEvent(new Event('notifications-updated'));
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const formatStatus = (status) => {
        if (!status) return '';
        return status.replace(/_/g, ' ').toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return "Just now";
    };

    const getIconData = (type, title) => {
        const isReport = type === 'REPORT_ALERT' || title.toUpperCase().includes('REPORT');
        const isMessage = type === 'SELLER_ALERT' || title.toUpperCase().includes('MESSAGE');
        const isCampaign = type === 'NEW_CAMPAIGN' || title.toUpperCase().includes('CAMPAIGN');
        const isOrder = type === 'ORDER_UPDATE';
        const isPromo = title.toUpperCase().includes('DISCOUNT') || title.toUpperCase().includes('SALE') || title.toUpperCase().includes('OFF');

        const status = title.split(': ')[1] || '';
        
        // Status-based icons
        if (status.includes('RESOLVED')) return { icon: <CheckCircle2 size={20} className="notif-badge-icon success" />, bgClass: 'icon-message' };
        if (status.includes('INVESTIGATION')) return { icon: <Search size={20} className="notif-badge-icon warning" />, bgClass: 'icon-promo' };
        if (status.includes('REJECTED') || status.includes('CLOSED')) return { icon: <XCircle size={20} className="notif-badge-icon danger" />, bgClass: 'icon-report' };
        
        // Type-based icons
        if (isReport) return { icon: <Flag size={20} className="notif-badge-icon danger" />, bgClass: 'icon-report' };
        if (isMessage) return { icon: <MessageSquare size={20} className="notif-badge-icon green" />, bgClass: 'icon-message' };
        if (isCampaign) return { icon: <Megaphone size={20} className="notif-badge-icon purple" />, bgClass: 'icon-campaign' };
        if (isPromo) return { icon: <Megaphone size={20} className="notif-badge-icon warning" />, bgClass: 'icon-promo' };
        if (isOrder) return { icon: <Package size={20} className="notif-badge-icon info" />, bgClass: 'icon-order' };
        
        switch (type) {
            case 'SYSTEM_ALERT': return { icon: <Shield size={20} className="notif-badge-icon blue" />, bgClass: 'icon-system' };
            default: return { icon: <Bell size={20} className="notif-badge-icon default" />, bgClass: 'icon-default' };
        }
    };

    const getBadgeClass = (title) => {
        const status = title.toUpperCase();
        if (status.includes('RESOLVED') || status.includes('APPROVED')) return 'badge-success';
        if (status.includes('INVESTIGATION') || status.includes('PENDING')) return 'badge-warning';
        if (status.includes('REJECTED') || status.includes('CLOSED') || status.includes('CANCELED')) return 'badge-danger';
        return 'badge-info';
    };

    const parseMessage = (msg) => {
        if (!msg) return { body: '', note: '' };
        const parts = msg.split('. Note: ');
        return {
            body: parts[0] + (parts[0].endsWith('.') ? '' : '.'),
            note: parts[1] || ''
        };
    };

    // Filter notifications
    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead;
        if (filter === 'read') return n.isRead;
        return true;
    });

    if (loading) return (
        <div className="notif-container">
            <div className="notif-loader">
                <div className="loader-spinner"></div>
                <p>Loading notifications...</p>
            </div>
        </div>
    );

    return (
        <div className="notif-container">
            <div className="notif-header">
                <div className="notif-header-content">
                    <div className="notif-title-row">
                        <Bell size={32} className="header-icon" />
                        <div>
                            <h1>Notifications</h1>
                            <p>Stay updated with your latest activities</p>
                        </div>
                    </div>
                </div>
                {notifications.length > 0 && (
                    <div className="notif-header-actions">
                        <div className="notif-header-stats">
                            <span className="stat-pill unread">{notifications.filter(n => !n.isRead).length} Unread</span>
                            <span className="stat-pill total">{notifications.length} Total</span>
                        </div>
                        {notifications.some(n => !n.isRead) && (
                            <button className="mark-all-read-btn" onClick={markAllAsRead}>
                                <CheckCircle2 size={16} />
                                Mark all as read
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Filter Tabs */}
            {notifications.length > 0 && (
                <div className="notif-filter-tabs">
                    <button 
                        className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                        <span className="tab-count">{notifications.length}</span>
                    </button>
                    <button 
                        className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
                        onClick={() => setFilter('unread')}
                    >
                        Unread
                        <span className="tab-count">{notifications.filter(n => !n.isRead).length}</span>
                    </button>
                    <button 
                        className={`filter-tab ${filter === 'read' ? 'active' : ''}`}
                        onClick={() => setFilter('read')}
                    >
                        Read
                        <span className="tab-count">{notifications.filter(n => n.isRead).length}</span>
                    </button>
                </div>
            )}

            {error && <div className="notif-error-card"><AlertTriangle size={20}/> {error}</div>}

            <div className="notif-list">
                {filteredNotifications.length === 0 ? (
                    <div className="notif-empty">
                        <div className="empty-icon-wrapper">
                            <Bell size={48} />
                        </div>
                        <h3>{filter === 'all' ? 'All caught up!' : filter === 'unread' ? 'No unread notifications' : 'No read notifications'}</h3>
                        <p>{filter === 'all' ? 'No notifications at the moment.' : filter === 'unread' ? 'You\'ve read all your notifications!' : 'No notifications have been read yet.'}</p>
                    </div>
                ) : (
                    filteredNotifications.map(n => {
                        const { body, note } = parseMessage(n.message);
                        const iconData = getIconData(n.type, n.title);
                        const displayTitle = n.title.includes(':') ? n.title.split(': ')[0] : n.title;
                        
                        return (
                            <div 
                                key={n.id} 
                                className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                                onClick={() => !n.isRead && markAsRead(n.id)}
                            >
                                <div className="notif-sidebar">
                                    <div className={`notif-icon-container ${iconData.bgClass}`}>
                                        {iconData.icon}
                                    </div>
                                </div>

                                <div className="notif-main">
                                    <div className="notif-title-text">
                                        {displayTitle}
                                    </div>
                                    
                                    <div className="notif-content-area">
                                        <p className="notif-body-text">{body}</p>
                                        
                                        {note && (
                                            <div className="notif-admin-note">
                                                <div className="note-label"><Info size={10}/> Admin Note</div>
                                                <p>{note}</p>
                                            </div>
                                        )}
                                        
                                        <span className="notif-date">{timeAgo(n.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
