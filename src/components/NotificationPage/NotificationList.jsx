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
                                    <div className={`notif-dot ${!n.isRead ? 'active' : ''}`}></div>
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
                                        <span className="notif-date">{new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
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
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

                .notif-container {
                    padding: 5rem 1rem;
                    max-width: 900px;
                    margin: 0 auto;
                    min-height: 100vh;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    background: #f8fafc;
                }

                .notif-header {
                    margin-bottom: 3rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    padding: 0 1rem;
                }

                .notif-header h1 {
                    font-size: 2.75rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                    color: #0f172a;
                    letter-spacing: -0.025em;
                }

                .notif-header p {
                    color: #64748b;
                    font-size: 1.1rem;
                }

                .stat-pill {
                    padding: 0.5rem 1rem;
                    border-radius: 99px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    margin-left: 0.5rem;
                }
                .stat-pill.unread { background: #dbeafe; color: #2563eb; }
                .stat-pill.total { background: #f1f5f9; color: #475569; }

                .notif-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .notif-item {
                    display: flex;
                    background: #ffffff;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    position: relative;
                }

                .notif-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 24px -10px rgba(0,0,0,0.08);
                    border-color: #cbd5e1;
                }

                .notif-item.unread {
                    border-left: 4px solid #3b82f6;
                    background: #fdfdff;
                }

                .notif-sidebar {
                    width: 60px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 1.5rem 0;
                    background: #fcfcfd;
                    border-right: 1px solid #f1f5f9;
                }

                .notif-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: transparent;
                    margin-bottom: 1rem;
                    transition: all 0.3s;
                }

                .notif-dot.active {
                    background: #3b82f6;
                    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                }

                .notif-icon-container {
                    color: #64748b;
                }

                .notif-main {
                    flex: 1;
                    padding: 1.5rem 2rem 1.5rem 1.5rem;
                }

                .notif-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.75rem;
                }

                .notif-title-row {
                    display: flex;
                    flex-direction: column;
                }

                .notif-category {
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    margin-bottom: 0.25rem;
                }

                .notif-title-text {
                    font-weight: 700;
                    font-size: 1.15rem;
                    color: #1e293b;
                }

                .notif-date {
                    font-size: 0.85rem;
                    color: #94a3b8;
                    font-weight: 500;
                }

                .notif-status-badge {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    margin-bottom: 0.75rem;
                    text-transform: capitalize;
                }

                .badge-success { background: #dcfce7; color: #15803d; }
                .badge-warning { background: #fef3c7; color: #b45309; }
                .badge-danger { background: #fee2e2; color: #b91c1c; }
                .badge-info { background: #e0f2fe; color: #0369a1; }

                .notif-body-text {
                    color: #475569;
                    line-height: 1.6;
                    font-size: 1rem;
                    margin-bottom: 1rem;
                }

                .notif-admin-note {
                    background: #f8fafc;
                    border-left: 3px solid #64748b;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-top: 1rem;
                }

                .note-label {
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: #64748b;
                    margin-bottom: 0.5rem;
                }

                .notif-admin-note p {
                    color: #334155;
                    font-style: italic;
                    margin: 0;
                    font-size: 0.95rem;
                }

                .notif-actions {
                    margin-top: 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #f1f5f9;
                }

                .action-hint {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    font-weight: 600;
                }

                .notif-empty {
                    text-align: center;
                    padding: 6rem 2rem;
                    background: #fff;
                    border-radius: 30px;
                    border: 1px dashed #cbd5e1;
                }

                .empty-icon-wrapper {
                    width: 100px;
                    height: 100px;
                    background: #f1f5f9;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 2rem;
                    color: #94a3b8;
                }

                .notif-empty h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                }

                .notif-empty p {
                    color: #64748b;
                }

                .notif-loader {
                    text-align: center;
                    padding: 10rem 2rem;
                }

                .loader-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #e2e8f0;
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1.5rem;
                }

                @keyframes spin { to { transform: rotate(360deg); } }

                .notif-error-card {
                    background: #fef2f2;
                    border: 1px solid #fee2e2;
                    padding: 1rem;
                    border-radius: 12px;
                    color: #dc2626;
                    margin-bottom: 2rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-weight: 600;
                }

                @media (max-width: 640px) {
                    .notif-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .notif-item { flex-direction: column; }
                    .notif-sidebar { width: 100%; flex-direction: row; padding: 1rem 1.5rem; justify-content: space-between; border-right: none; border-bottom: 1px solid #f1f5f9; }
                    .notif-dot { margin-bottom: 0; }
                }
            `}</style>
        </div>
    );
}
