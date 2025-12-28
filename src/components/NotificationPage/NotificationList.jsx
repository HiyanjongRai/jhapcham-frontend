import React, { useEffect, useState } from "react";
import { API_BASE } from "../config/config";
import axios from "../../api/axios";
import { Bell, CheckCircle2, AlertTriangle, Package, Info, Search, XCircle, Shield, Store } from "lucide-react";

export default function NotificationList() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const getIcon = (type, title) => {
        const status = title.split(': ')[1] || '';
        if (status.includes('RESOLVED')) return <CheckCircle2 size={18} className="notif-badge-icon success" />;
        if (status.includes('INVESTIGATION')) return <Search size={18} className="notif-badge-icon warning" />;
        if (status.includes('REJECTED') || status.includes('CLOSED')) return <XCircle size={18} className="notif-badge-icon danger" />;
        
        switch (type) {
            case 'REPORT_ALERT': return <AlertTriangle size={18} className="notif-badge-icon danger" />;
            case 'ORDER_UPDATE': return <Package size={18} className="notif-badge-icon info" />;
            case 'SYSTEM_ALERT': return <Shield size={18} className="notif-badge-icon blue" />;
            case 'SELLER_ALERT': return <Store size={18} className="notif-badge-icon green" />;
            default: return <Bell size={18} className="notif-badge-icon default" />;
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

    if (loading) return (
        <div className="notif-container">
            <div className="notif-loader">
                <div className="loader-spinner"></div>
                <p>Syncing your alerts...</p>
            </div>
        </div>
    );

    return (
        <div className="notif-container">
            <div className="notif-header">
                <div className="notif-header-content">
                    <h1>Notifications</h1>
                    <p>Track your reports, orders, and account updates in real-time.</p>
                </div>
                {notifications.length > 0 && (
                    <div className="notif-header-stats">
                        <span className="stat-pill unread">{notifications.filter(n => !n.isRead).length} Unread</span>
                        <span className="stat-pill total">{notifications.length} Total</span>
                    </div>
                )}
            </div>

            {error && <div className="notif-error-card"><AlertTriangle size={20}/> {error}</div>}

            <div className="notif-list">
                {notifications.length === 0 ? (
                    <div className="notif-empty">
                        <div className="empty-icon-wrapper">
                            <Bell size={48} />
                        </div>
                        <h3>All caught up!</h3>
                        <p>No new notifications at the moment. We'll let you know when something happens.</p>
                    </div>
                ) : (
                    notifications.map(n => {
                        const { body, note } = parseMessage(n.message);
                        const isUpdate = n.title.includes(':');
                        const statusLabel = isUpdate ? n.title.split(': ')[1] : '';
                        
                        return (
                            <div 
                                key={n.id} 
                                className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                                onClick={() => !n.isRead && markAsRead(n.id)}
                            >
                                    <div className="notif-sidebar">
                                        <div className="notif-icon-container">
                                            {getIcon(n.type, n.title)}
                                        </div>
                                    </div>

                                <div className="notif-main">
                                    <div className="notif-top">
                                        <div className="notif-title-row">
                                            <span className="notif-category">{n.type.replace(/_/g, ' ')}</span>
                                            <span className="notif-title-text">{isUpdate ? n.title.split(': ')[0] : n.title}</span>
                                        </div>
                                        <span className="notif-date">{timeAgo(n.createdAt)}</span>
                                    </div>

                                    <div className="notif-content-area">
                                        {statusLabel && (
                                            <div className={`notif-status-badge ${getBadgeClass(n.title)}`}>
                                                {formatStatus(statusLabel)}
                                            </div>
                                        )}
                                        <p className="notif-body-text">{body}</p>
                                        
                                        {note && (
                                            <div className="notif-admin-note">
                                                <div className="note-label">ADMIN FEEDBACK</div>
                                                <p>{note}</p>
                                            </div>
                                        )}

                                        {n.relatedEntityId && (
                                            <div className="notif-actions">
                                                <span className="action-hint">Reference ID: #{n.relatedEntityId}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Same+Serif&family=Inter:wght@400;500;600;700&display=swap');

                .notif-container {
                    padding: 3rem 0;
                    max-width: 800px;
                    margin: 0 auto;
                    min-height: 100vh;
                    font-family: 'Inter', sans-serif;
                    background: #fff;
                }

                .notif-header {
                    margin-bottom: 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 2rem;
                    border-bottom: 1px solid #f1f5f9;
                    padding-bottom: 1.5rem;
                }

                .notif-header h1 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin: 0;
                    color: #0f172a;
                }

                .notif-header p {
                    display: none;
                }

                .notif-header-stats {
                    display: flex;
                    align-items: center;
                }

                .stat-pill {
                    font-size: 0.8rem;
                    font-weight: 600;
                    padding: 4px 12px;
                    border-radius: 99px;
                    margin-left: 8px;
                }
                .stat-pill.unread { background: #fee2e2; color: #ef4444; }
                .stat-pill.total { background: #f1f5f9; color: #64748b; }

                .notif-list {
                    display: flex;
                    flex-direction: column;
                }

                /* Real E-commerce List Style */
                .notif-item {
                    display: flex;
                    background: #fff;
                    border-bottom: 1px solid #f1f5f9;
                    transition: background 0.2s;
                    cursor: pointer;
                    padding: 1.5rem 2rem;
                    position: relative;
                }

                .notif-item:last-child {
                    border-bottom: none;
                }

                .notif-item:hover {
                    background: #f8fafc;
                    transform: none;
                    box-shadow: none;
                }

                .notif-item.unread {
                    background: #fdfdff; /* Very subtle blue tint */
                    border-left: none; /* Removed the heavy border */
                }
                
                /* Unread Indicator Dot */
                .notif-item.unread:after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    right: 2rem;
                    transform: translateY(-50%);
                    width: 10px;
                    height: 10px;
                    background: #2563eb;
                    border-radius: 50%;
                }

                .notif-sidebar {
                    margin-right: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding-top: 4px; /* Align icon with text title */
                    width: auto;
                    background: transparent;
                    border: none;
                }

                .notif-icon-container {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%; /* Circle icons for standard feed look */
                    background: #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #64748b;
                    flex-shrink: 0;
                }

                .notif-item.unread .notif-icon-container {
                     background: #e0f2fe;
                     color: #0284c7;
                }

                .notif-main {
                    flex: 1;
                    padding: 0;
                }

                .notif-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.25rem;
                }

                .notif-title-row {
                    display: flex;
                    flex-direction: column;
                }

                .notif-category {
                    display: none; /* Hide category for cleaner look, like Amazon */
                }

                .notif-title-text {
                    font-weight: 600;
                    font-size: 1rem;
                    color: #0f172a;
                    line-height: 1.4;
                }

                .notif-date {
                    font-size: 0.8rem;
                    color: #94a3b8;
                    white-space: nowrap;
                    margin-left: 1rem;
                    background: transparent;
                    padding: 0;
                }

                .notif-body-text {
                    color: #64748b;
                    font-size: 0.95rem;
                    line-height: 1.5;
                    margin: 0.25rem 0 0.75rem 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    max-width: 90%;
                }

                .notif-status-badge {
                    display: inline-block;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    padding: 2px 8px;
                    border-radius: 4px;
                    margin-bottom: 0.5rem;
                }
                .badge-success { color: #15803d; background: #dcfce7; border: none; }
                .badge-warning { color: #b45309; background: #fef3c7; border: none; }
                .badge-danger { color: #b91c1c; background: #fee2e2; border: none; }
                .badge-info { display: none; } /* Hide info badges to reduce clutter */

                .notif-admin-note {
                    background: #f8fafc;
                    border: none;
                    border-left: 3px solid #cbd5e1;
                    padding: 0.75rem 1rem;
                    border-radius: 4px;
                    margin-top: 0.5rem;
                }

                .notif-actions {
                    margin-top: 0.5rem;
                    padding-top: 0;
                    border: none;
                }

                .action-hint {
                    font-size: 0.75rem;
                    color: #64748b;
                    background: #f1f5f9;
                    padding: 2px 8px;
                    border-radius: 4px;
                }

                @media (max-width: 640px) {
                    .notif-container { padding: 0; }
                    .notif-item { padding: 1rem; }
                    .notif-title-text { font-size: 0.95rem; }
                }
            `}</style>
        </div>
    );
}
