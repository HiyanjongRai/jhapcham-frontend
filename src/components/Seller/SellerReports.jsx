import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import refundsApi from '../../api/refundsApi';
import { 
  AlertTriangle, Check, X, Clock, MessageSquare, 
  ChevronRight, ArrowRight, ShieldCheck, Box, User
} from 'lucide-react';
import { API_BASE } from '../config/config';

const SellerReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [actionComment, setActionComment] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            setLoading(true);
            const data = await refundsApi.getSellerReports();
            setReports(data || []);
        } catch (error) {
            toast.error('Failed to load item reports');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (reportId, approved) => {
        if (!actionComment && !approved) {
            toast.error('Please provide a reason for rejection (Comment is mandatory for disputes)');
            return;
        }

        try {
            setProcessing(true);
            await refundsApi.sellerAction(reportId, {
                approved,
                comment: actionComment
            });
            toast.success(approved ? 'Report approved. Refund initiated.' : 'Report rejected. Escalated to admin.');
            setActionComment('');
            setSelectedReport(null);
            loadReports();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setProcessing(false);
        }
    };

    if (loading && reports.length === 0) {
        return (
            <div className="dash-loader-wrap">
                <div className="dash-spinner"></div>
                <span>Syncing resolution queue...</span>
            </div>
        );
    }

    return (
        <div className="seller-reports-container fade-in">
            <header className="reports-header-v2">
                <div className="rh-info">
                   <div className="rh-icon-box"><AlertTriangle size={24}/></div>
                   <div className="rh-text">
                      <h1>Customer Complaints</h1>
                      <p>Review and resolve item-level disputes from your customers.</p>
                   </div>
                </div>
                <div className="rh-badge">
                   <strong>{reports.filter(r => r.status === 'OPEN').length}</strong>
                   <span>PENDING ACTION</span>
                </div>
            </header>

            <div className="reports-grid-v2">
                {reports.length === 0 ? (
                    <div className="empty-reports-v2">
                        <ShieldCheck size={48} strokeWidth={1} />
                        <h3>Perfect Record</h3>
                        <p>No active complaints or return requests for your products.</p>
                    </div>
                ) : (
                    <div className="reports-list">
                        {reports.map((report) => (
                            <div 
                                key={report.id} 
                                className={`report-item-v2 ${selectedReport?.id === report.id ? 'selected' : ''} ${report.status.toLowerCase()}`}
                                onClick={() => setSelectedReport(report)}
                            >
                                <div className="ri-meta">
                                   <div className="ri-id">#REP-{report.id}</div>
                                   <div className="ri-date">{new Date(report.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="ri-main">
                                   <div className="ri-product">
                                      <div className="ri-img-box">
                                         <img src={report.productImage ? (report.productImage.startsWith('http') ? report.productImage : `${API_BASE}/${report.productImage}`) : 'https://via.placeholder.com/40'} alt="" />
                                      </div>
                                      <div className="ri-p-text">
                                         <h4>{report.productName}</h4>
                                         <span>Order #{report.orderId}</span>
                                      </div>
                                   </div>
                                   <div className="ri-reason-pill">{report.reason?.replace(/_/g, ' ')}</div>
                                </div>
                                <div className="ri-footer">
                                   <span className={`ri-status status-${report.status.toLowerCase()}`}>
                                      {report.status.replace(/_/g, ' ')}
                                   </span>
                                   <ChevronRight size={16} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="report-detail-v2">
                    {selectedReport ? (
                        <div className="rd-content animate-in">
                            <div className="rd-header">
                               <h3>Complaint Detailed View</h3>
                               <span className="rd-id">ID: #{selectedReport.id}</span>
                            </div>

                            <div className="rd-summary-card">
                               <div className="rd-section">
                                  <label><User size={14}/> CUSTOMER</label>
                                  <p>{selectedReport.customerName}</p>
                               </div>
                               <div className="rd-section">
                                  <label><AlertTriangle size={14}/> ISSUE CATEGORY</label>
                                  <p className="highlight">{selectedReport.reason?.replace(/_/g, ' ')}</p>
                               </div>
                            </div>

                            <div className="rd-description">
                               <label><MessageSquare size={14}/> CUSTOMER STATEMENT</label>
                               <div className="statement-box">
                                  "{selectedReport.description}"
                               </div>
                            </div>

                            {selectedReport.status === 'OPEN' ? (
                                <div className="rd-action-zone">
                                   <label>OFFICIAL RESPONSE</label>
                                   <textarea 
                                     placeholder="Provide a comment (mandatory for rejection)..."
                                     value={actionComment}
                                     onChange={(e) => setActionComment(e.target.value)}
                                   />
                                   <div className="rd-action-btns">
                                      <button 
                                        className="btn-approve" 
                                        onClick={() => handleAction(selectedReport.id, true)}
                                        disabled={processing}
                                      >
                                         <Check size={18}/> APPROVE & REFUND
                                      </button>
                                      <button 
                                        className="btn-reject" 
                                        onClick={() => handleAction(selectedReport.id, false)}
                                        disabled={processing}
                                      >
                                         <X size={18}/> REJECT / DISPUTE
                                      </button>
                                   </div>
                                   <p className="rd-note">
                                      * Rejection will automatically escalate this case to <strong>Jhapcham Admin Audit</strong>.
                                   </p>
                                </div>
                            ) : (
                                <div className="rd-history">
                                   <div className="history-pill">
                                      <Clock size={14}/>
                                      <span>Action taken on {new Date(selectedReport.updatedAt).toLocaleDateString()}</span>
                                   </div>
                                   {selectedReport.sellerComment && (
                                       <div className="seller-note">
                                          <label>YOUR COMMENT:</label>
                                          <p>{selectedReport.sellerComment}</p>
                                       </div>
                                   )}
                                   {selectedReport.adminComment && (
                                       <div className="admin-note">
                                          <label>ADMIN RESOLUTION:</label>
                                          <p>{selectedReport.adminComment}</p>
                                       </div>
                                   )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rd-placeholder">
                           <Box size={40} strokeWidth={1} />
                           <p>Select a report from the list to view evidence and take action.</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .seller-reports-container { padding: 0; min-height: 80vh; color: #0f172a; }
                .reports-header-v2 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; border-bottom: 1px solid #f1f5f9; padding-bottom: 24px; }
                .rh-info { display: flex; gap: 20px; align-items: center; }
                .rh-icon-box { width: 56px; height: 56px; background: #fff1f2; color: #f43f5e; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
                .rh-text h1 { font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.02em; }
                .rh-text p { color: #64748b; font-size: 14px; margin-top: 4px; font-weight: 500; }
                .rh-badge { background: #0f172a; color: white; padding: 12px 24px; border-radius: 14px; text-align: center; }
                .rh-badge strong { display: block; font-size: 18px; font-weight: 900; }
                .rh-badge span { font-size: 10px; font-weight: 800; letter-spacing: 0.05em; opacity: 0.7; }

                .reports-grid-v2 { display: grid; grid-template-columns: 380px 1fr; gap: 40px; }
                .reports-list { display: flex; flex-direction: column; gap: 12px; height: 600px; overflow-y: auto; padding-right: 10px; }
                .report-item-v2 { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 20px; padding: 20px; cursor: pointer; transition: 0.2s; position: relative; }
                .report-item-v2:hover { border-color: #6366f1; transform: translateX(5px); }
                .report-item-v2.selected { background: #fff; border-color: #6366f1; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.1); }
                
                .ri-meta { display: flex; justify-content: space-between; margin-bottom: 12px; }
                .ri-id { font-size: 12px; font-weight: 900; color: #64748b; }
                .ri-date { font-size: 11px; color: #94a3b8; font-weight: 600; }
                
                .ri-main { margin-bottom: 16px; }
                .ri-product { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
                .ri-img-box { width: 44px; height: 44px; border-radius: 10px; overflow: hidden; background: white; border: 1px solid #f1f5f9; flex-shrink: 0; }
                .ri-img-box img { width: 100%; height: 100%; object-fit: contain; }
                .ri-p-text h4 { font-size: 14px; font-weight: 800; margin: 0; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
                .ri-p-text span { font-size: 11px; color: #94a3b8; font-weight: 600; }
                .ri-reason-pill { display: inline-block; padding: 4px 10px; background: #fff; border: 1px solid #f1f5f9; border-radius: 8px; font-size: 11px; font-weight: 800; color: #64748b; }

                .ri-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #f1f5f9; }
                .ri-status { font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: 0.05em; }
                .status-open { color: #f59e0b; }
                .status-seller_approved, .status-admin_approved { color: #10b981; }
                .status-seller_rejected { color: #ef4444; }

                .report-detail-v2 { background: #f8fafc; border-radius: 32px; border: 1px solid #f1f5f9; min-height: 600px; display: flex; flex-direction: column; }
                .rd-placeholder { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; gap: 16px; }
                .rd-placeholder p { font-size: 14px; font-weight: 600; max-width: 240px; text-align: center; }

                .rd-content { padding: 40px; flex: 1; display: flex; flex-direction: column; }
                .rd-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
                .rd-header h3 { font-size: 20px; font-weight: 900; margin: 0; }
                .rd-id { font-size: 14px; font-weight: 800; color: #94a3b8; }

                .rd-summary-card { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; background: white; padding: 24px; border-radius: 20px; border: 1px solid #f1f5f9; margin-bottom: 32px; }
                .rd-section label { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
                .rd-section p { font-size: 15px; font-weight: 800; margin: 0; }
                .rd-section p.highlight { color: #f43f5e; }

                .rd-description { margin-bottom: 32px; flex: 1; }
                .rd-description label { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
                .statement-box { background: white; border: 1px solid #f1f5f9; border-radius: 16px; padding: 24px; font-size: 15px; line-height: 1.6; color: #475569; font-style: italic; }

                .rd-action-zone { background: #fff; border-radius: 24px; padding: 32px; border: 1px solid #e2e8f0; }
                .rd-action-zone label { display: block; font-size: 11px; font-weight: 900; color: #0f172a; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; }
                .rd-action-zone textarea { width: 100%; min-height: 100px; border: 1px solid #f1f5f9; background: #f8fafc; border-radius: 16px; padding: 16px; font-family: inherit; font-size: 14px; margin-bottom: 20px; outline: none; transition: 0.2s; }
                .rd-action-zone textarea:focus { border-color: #6366f1; background: #fff; }
                .rd-action-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .btn-approve { background: #10b981; color: white; border: none; padding: 16px; border-radius: 14px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: 0.2s; }
                .btn-reject { background: #f43f5e; color: white; border: none; padding: 16px; border-radius: 14px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: 0.2s; }
                .btn-approve:hover, .btn-reject:hover { filter: brightness(1.1); transform: scale(1.02); }
                .btn-approve:disabled, .btn-reject:disabled { opacity: 0.5; cursor: not-allowed; }
                .rd-note { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 20px; font-weight: 600; }
                
                .rd-history { background: white; padding: 32px; border-radius: 24px; border: 1px solid #f1f5f9; }
                .history-pill { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; color: #10b981; margin-bottom: 24px; background: #f0fdf4; width: fit-content; padding: 6px 16px; border-radius: 20px; }
                .seller-note, .admin-note { margin-top: 20px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
                .seller-note label, .admin-note label { font-size: 10px; font-weight: 900; color: #94a3b8; display: block; margin-bottom: 8px; }
                .seller-note p { font-size: 14px; font-weight: 600; color: #0f172a; margin: 0; }
                .admin-note p { font-size: 14px; font-weight: 700; color: #6366f1; margin: 0; }
            `}</style>
        </div>
    );
};

export default SellerReports;
