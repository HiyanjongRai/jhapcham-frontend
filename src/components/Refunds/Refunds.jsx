import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import refundsApi from '../../api/refundsApi';
import './Refunds.css';
import { 
  RotateCcw, ShieldCheck, Box, Clock, ChevronRight, 
  ArrowRight, AlertTriangle, CheckCircle2, MessageSquare, Info, XCircle
} from 'lucide-react';
import { API_BASE } from '../config/config';

const Refunds = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await refundsApi.getMyReports();
            setReports(data || []);
        } catch (error) {
            toast.error('Failed to load your return history');
        } finally {
            setLoading(false);
        }
    };

    if (loading && reports.length === 0) {
        return (
            <div className="refund-page-wrap">
                <div className="loyal-loader">
                    <div className="lux-spinner" />
                    <p>Syncing return records...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="refund-page-v3 animate-in">
            <header className="rh-hero-v3">
                <div className="rh-content">
                    <div className="rh-icon-box"><RotateCcw size={32}/></div>
                    <div className="rh-text">
                        <h1>Returns & Reversals</h1>
                        <p>Track your reported issues and refund progress in real-time.</p>
                    </div>
                </div>
                <div className="rh-support-box">
                   <div className="support-item">
                      <ShieldCheck size={20} />
                      <span>7-Day Return Protection</span>
                   </div>
                </div>
            </header>

            <div className="rh-grid-v3">
                {reports.length === 0 ? (
                    <div className="rh-empty-v3">
                        <div className="empty-visual">
                           <Box size={64} strokeWidth={1} />
                        </div>
                        <h3>No Active Reports</h3>
                        <p>All your orders are looking great! If you encounter an issue, report it directly from your Order History.</p>
                        <button className="rh-btn-action" onClick={() => window.location.hash = '#orders'}>
                           Go to Orders <ArrowRight size={16}/>
                        </button>
                    </div>
                ) : (
                    <div className="rh-list-v3">
                        {reports.map((report) => (
                            <div key={report.id} className={`rh-card-v3 status-${report.status.toLowerCase()}`}>
                                <div className="rh-c-header">
                                    <div className="rh-c-meta">
                                        <span className="rep-id">#REP-{report.id}</span>
                                        <span className="dot">•</span>
                                        <span className="rep-date">{new Date(report.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className={`rep-status-pill ${report.status.toLowerCase()}`}>
                                        {report.status.replace(/_/g, ' ')}
                                    </div>
                                </div>

                                <div className="rh-c-body">
                                    <div className="rh-product-info">
                                        <div className="rh-product-img">
                                            <img src={report.productImage ? (report.productImage.startsWith('http') ? report.productImage : `${API_BASE}/${report.productImage}`) : 'https://via.placeholder.com/60'} alt="" />
                                        </div>
                                        <div className="rh-product-text">
                                            <h4>{report.productName}</h4>
                                            <span>Order #{report.orderId} · {report.storeName}</span>
                                        </div>
                                    </div>
                                    <div className="rh-reason-box">
                                        <div className="reason-label">{report.reason?.replace(/_/g, ' ')}</div>
                                        <p>"{report.description}"</p>
                                    </div>
                                </div>

                                <div className="rh-c-footer">
                                    {report.status === 'OPEN' && (
                                        <div className="status-timeline">
                                            <Clock size={14} />
                                            <span>Waiting for Seller Review (Expected within 48h)</span>
                                        </div>
                                    )}
                                    
                                    {(report.status === 'SELLER_APPROVED' || report.status === 'ADMIN_APPROVED') && (
                                        <div className="status-success">
                                            <CheckCircle2 size={16} />
                                            <span>Approval Granted • Financial reversal initiated</span>
                                        </div>
                                    )}

                                    {report.status === 'SELLER_REJECTED' && (
                                        <div className="status-warning">
                                            <AlertTriangle size={16} />
                                            <span>Disputed • Escalated to Jhapcham Admin for final audit</span>
                                        </div>
                                    )}

                                    {report.status === 'REJECTED' && (
                                        <div className="status-error">
                                            <XCircle size={16} />
                                            <span>Request Denied by Admin Audit</span>
                                        </div>
                                    )}
                                    
                                    <button className="rh-btn-details" onClick={() => toast.info('Detailed timeline coming soon!')}>
                                        DETAILS <ChevronRight size={14}/>
                                    </button>
                                </div>

                                {(report.sellerComment || report.adminComment) && (
                                    <div className="rh-official-note">
                                        <MessageSquare size={14} />
                                        <p><strong>Note:</strong> {report.adminComment || report.sellerComment}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .refund-page-v3 { padding: 0; min-height: 80vh; color: #0f172a; }
                .rh-hero-v3 { background: #0f172a; border-radius: 32px; padding: 48px; color: white; display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; position: relative; overflow: hidden; }
                .rh-hero-v3::after { content: ''; position: absolute; right: -50px; bottom: -50px; width: 300px; height: 300px; background: rgba(99, 102, 241, 0.1); border-radius: 50%; blur: 50px; }
                
                .rh-content { display: flex; gap: 32px; align-items: center; }
                .rh-icon-box { width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 24px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.15); }
                .rh-text h1 { font-size: 32px; font-weight: 950; margin: 0; letter-spacing: -0.04em; }
                .rh-text p { color: #94a3b8; font-size: 16px; margin-top: 8px; font-weight: 500; }
                
                .rh-support-box { background: rgba(255,255,255,0.05); padding: 20px 32px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); }
                .support-item { display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 800; color: #6366f1; }
                
                .rh-empty-v3 { text-align: center; padding: 100px 40px; background: #f8fafc; border-radius: 40px; border: 2px dashed #e2e8f0; }
                .empty-visual { color: #94a3b8; margin-bottom: 24px; }
                .rh-empty-v3 h3 { font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 12px; }
                .rh-empty-v3 p { color: #64748b; font-size: 15px; max-width: 400px; margin: 0 auto 32px; font-weight: 500; }
                .rh-btn-action { background: #0f172a; color: white; border: none; padding: 14px 32px; border-radius: 12px; font-weight: 900; display: flex; align-items: center; gap: 12px; margin: 0 auto; cursor: pointer; transition: 0.2s; }
                .rh-btn-action:hover { transform: scale(1.05); background: #000; }

                .rh-list-v3 { display: flex; flex-direction: column; gap: 24px; }
                .rh-card-v3 { background: #fff; border: 1px solid #f1f5f9; border-radius: 28px; padding: 32px; transition: 0.3s; position: relative; }
                .rh-card-v3:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
                
                .rh-c-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1px solid #f8fafc; padding-bottom: 16px; }
                .rh-c-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; color: #94a3b8; }
                .rep-id { color: #64748b; }
                .rep-status-pill { font-size: 10px; font-weight: 950; text-transform: uppercase; padding: 4px 14px; border-radius: 20px; letter-spacing: 0.05em; }
                .rep-status-pill.open { background: #fef3c7; color: #d97706; }
                .rep-status-pill.seller_approved, .rep-status-pill.admin_approved { background: #f0fdf4; color: #10b981; }
                .rep-status-pill.seller_rejected { background: #fff1f2; color: #f43f5e; }
                .rep-status-pill.rejected { background: #f1f5f9; color: #64748b; }

                .rh-c-body { display: grid; grid-template-columns: 320px 1fr; gap: 40px; margin-bottom: 24px; }
                .rh-product-info { display: flex; gap: 20px; align-items: center; }
                .rh-product-img { width: 72px; height: 72px; background: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9; overflow: hidden; flex-shrink: 0; }
                .rh-product-img img { width: 100%; height: 100%; object-fit: contain; }
                .rh-product-text h4 { font-size: 18px; font-weight: 900; margin: 0; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
                .rh-product-text span { font-size: 13px; color: #94a3b8; font-weight: 600; }
                
                .rh-reason-box { background: #f8fafc; padding: 20px; border-radius: 20px; border: 1px solid #f1f5f9; }
                .reason-label { font-size: 11px; font-weight: 950; color: #f43f5e; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
                .rh-reason-box p { font-size: 14px; color: #475569; font-weight: 600; line-height: 1.5; margin: 0; font-style: italic; }

                .rh-c-footer { display: flex; justify-content: space-between; align-items: center; }
                .status-timeline, .status-success, .status-warning, .status-error { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 800; }
                .status-timeline { color: #f59e0b; }
                .status-success { color: #10b981; }
                .status-warning { color: #f43f5e; }
                .status-error { color: #64748b; }
                
                .rh-btn-details { border: none; background: transparent; font-size: 11px; font-weight: 950; color: #6366f1; cursor: pointer; display: flex; align-items: center; gap: 6px; letter-spacing: 0.05em; }
                
                .rh-official-note { margin-top: 24px; padding: 16px 24px; background: #eff6ff; border-radius: 16px; display: flex; gap: 12px; color: #1e40af; border: 1px solid #dbeafe; }
                .rh-official-note p { font-size: 13px; font-weight: 700; margin: 0; line-height: 1.5; }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-in { animation: fadeIn 0.4s ease forwards; }
            `}</style>
        </div>
    );
};

export default Refunds;
