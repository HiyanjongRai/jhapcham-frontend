import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import refundsApi from '../../api/refundsApi';
import '../Refunds/Refunds.css';
import { 
  Banknote, Box, Clock, ShieldAlert, CheckCircle2, 
  XCircle, Filter, FileText, ArrowUpRight, DollarSign
} from 'lucide-react';
import { API_BASE } from '../config/config';

const AdminRefundsPanel = () => {
    const [activeTab, setActiveTab] = useState('disputes'); // 'disputes' or 'payouts'
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        try {
            setLoading(true);
            let data;
            if (activeTab === 'disputes') {
                data = await refundsApi.getDisputes();
            } else {
                data = await refundsApi.getPendingPayouts();
            }
            setItems(data || []);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleAdminResolve = async (reportId, approved) => {
        const comment = prompt('Enter resolution comment:');
        if (comment === null) return;
        
        let payerType = 'SELLER';
        if (approved) {
            const payer = prompt('Who pays for this refund? (SELLER / PLATFORM)', 'SELLER');
            if (payer === null) return;
            payerType = payer.toUpperCase() === 'PLATFORM' ? 'PLATFORM' : 'SELLER';
        }

        try {
            await refundsApi.adminAction(reportId, { approved, comment, payerType });
            toast.success('Dispute resolved');
            loadData();
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handlePayout = async (refundId) => {
        const notes = prompt('Enter payout notes (optional):', 'Processed via Marketplace System');
        if (notes === null) return;
        try {
            await refundsApi.completeRefund(refundId, notes);
            toast.success('Payout marked as COMPLETED');
            loadData();
        } catch (error) {
            toast.error('Failed to process payout');
        }
    };

    return (
        <div className="admin-moderation-panel animate-in">
            <header className="mod-header">
                <div className="mod-title">
                    <ShieldAlert size={28} className="text-blue" />
                    <div>
                        <h1>Governance Command Center</h1>
                        <p>Arbitrating disputed reports and managing financial reversals.</p>
                    </div>
                </div>
                <div className="mod-tabs">
                    <button 
                        className={`mod-tab ${activeTab === 'disputes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('disputes')}
                    >
                        <ShieldAlert size={16} />
                        Disputed Reports
                        {activeTab === 'disputes' && <span className="tab-count">{items.length}</span>}
                    </button>
                    <button 
                        className={`mod-tab ${activeTab === 'payouts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('payouts')}
                    >
                        <DollarSign size={16} />
                        Pending Payouts
                        {activeTab === 'payouts' && <span className="tab-count">{items.length}</span>}
                    </button>
                </div>
            </header>

            <div className="mod-content">
                {loading ? (
                    <div className="loyal-loader">
                        <div className="lux-spinner" />
                        <p>Retrieving pending cases...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="lux-empty-state">
                        <CheckCircle2 size={48} strokeWidth={1} color="#10b981" />
                        <h3>Clear Queue</h3>
                        <p>No {activeTab} requiring your attention at this time.</p>
                    </div>
                ) : (
                    <div className="mod-grid">
                        {activeTab === 'disputes' ? (
                            items.map(report => (
                                <div key={report.id} className="mod-card report-card">
                                    <div className="mc-header">
                                        <span className="mc-id">#REP-{report.id}</span>
                                        <span className="mc-status badge-disputed">DISPUTED</span>
                                    </div>
                                    <div className="mc-body">
                                        <div className="mc-info-row">
                                            <div className="mc-col">
                                                <label>Customer</label>
                                                <strong>{report.customerName}</strong>
                                            </div>
                                            <div className="mc-col">
                                                <label>Seller</label>
                                                <strong>{report.storeName}</strong>
                                            </div>
                                        </div>
                                        <div className="mc-item">
                                            <div className="mc-item-img">
                                                <img src={report.productImage ? `${API_BASE}/${report.productImage}` : 'https://via.placeholder.com/50'} alt="" />
                                            </div>
                                            <div className="mc-item-text">
                                                <h4>{report.productName}</h4>
                                                <span>Reason: {report.reason?.replace(/_/g, ' ')}</span>
                                            </div>
                                        </div>
                                        <div className="mc-narratives">
                                            <div className="narrative customer">
                                                <label>Customer's Claim:</label>
                                                <p>"{report.description}"</p>
                                            </div>
                                            <div className="narrative seller">
                                                <label>Seller's Rejection Reason:</label>
                                                <p>"{report.sellerComment}"</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mc-footer">
                                        <button className="btn-solid-blue" onClick={() => handleAdminResolve(report.id, true)}>APPROVE REFUND</button>
                                        <button className="btn-outline-red" onClick={() => handleAdminResolve(report.id, false)}>REJECT CLAIM</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            items.map(refund => (
                                <div key={refund.id} className="mod-card payout-card">
                                    <div className="mc-header">
                                        <span className="mc-id">#REF-{refund.id}</span>
                                        <span className={`mc-status badge-${refund.payerType?.toLowerCase()}`}>
                                            PAYER: {refund.payerType}
                                        </span>
                                    </div>
                                    <div className="mc-body">
                                        <div className="mc-payout-amount">
                                            <DollarSign size={20} />
                                            <span>Rs. {Number(refund.amount || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="mc-info-row">
                                            <div className="mc-col">
                                                <label>Payee (Customer)</label>
                                                <strong>{refund.customer?.fullName}</strong>
                                            </div>
                                            <div className="mc-col">
                                                <label>Source (Order)</label>
                                                <strong>ORD-{String(refund.order?.id).padStart(5, '0')}</strong>
                                            </div>
                                        </div>
                                        <div className="mc-item-simple">
                                            <Box size={14} /> {refund.orderItem?.productNameSnapshot}
                                        </div>
                                    </div>
                                    <div className="mc-footer">
                                        <button className="btn-success-payout" onClick={() => handlePayout(refund.id)}>
                                            CONFIRM & SETTLE PAYMENT
                                            <ArrowUpRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .admin-moderation-panel { padding: 40px; background: #fff; min-height: 100vh; }
                .mod-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; border-bottom: 1px solid #f1f5f9; padding-bottom: 32px; }
                .mod-title { display: flex; gap: 20px; align-items: center; }
                .mod-title h1 { font-size: 28px; font-weight: 950; margin: 0; color: #0f172a; letter-spacing: -0.03em; }
                .mod-title p { color: #64748b; margin: 4px 0 0; font-weight: 500; font-size: 15px; }
                
                .mod-tabs { display: flex; background: #f8fafc; padding: 6px; border-radius: 16px; border: 1px solid #f1f5f9; gap: 4px; }
                .mod-tab { border: none; padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 800; color: #64748b; background: transparent; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.2s; }
                .mod-tab.active { background: #fff; color: #0f172a; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                .tab-count { background: #6366f1; color: white; padding: 2px 8px; border-radius: 20px; font-size: 10px; }

                .mod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(450px, 1fr)); gap: 32px; }
                .mod-card { background: #fff; border: 1px solid #f1f5f9; border-radius: 28px; padding: 32px; transition: 0.3s; position: relative; }
                .mod-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); border-color: #e2e8f0; }

                .mc-header { display: flex; justify-content: space-between; margin-bottom: 24px; }
                .mc-id { font-size: 12px; font-weight: 900; color: #94a3b8; letter-spacing: 0.05em; }
                .mc-status { font-size: 10px; font-weight: 950; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; }
                .badge-disputed { background: #fff1f2; color: #f43f5e; }
                .badge-seller { background: #f0fdf4; color: #10b981; }
                .badge-platform { background: #eff6ff; color: #3b82f6; }

                .mc-info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
                .mc-col label { display: block; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
                .mc-col strong { font-size: 15px; color: #0f172a; font-weight: 800; }

                .mc-item { display: flex; gap: 16px; background: #f8fafc; padding: 16px; border-radius: 16px; margin-bottom: 24px; }
                .mc-item-img { width: 48px; height: 48px; border-radius: 10px; overflow: hidden; background: #fff; }
                .mc-item-img img { width: 100%; height: 100%; object-fit: contain; }
                .mc-item-text h4 { font-size: 14px; font-weight: 850; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px; }
                .mc-item-text span { font-size: 12px; color: #64748b; font-weight: 600; }

                .mc-narratives { display: grid; gap: 16px; }
                .narrative { padding: 16px; border-radius: 16px; }
                .narrative.customer { background: #fef2f2; border-left: 4px solid #f87171; }
                .narrative.seller { background: #f8fafc; border-left: 4px solid #94a3b8; }
                .narrative label { display: block; font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
                .narrative p { font-size: 13px; font-weight: 600; color: #334155; line-height: 1.5; margin: 0; font-style: italic; }

                .mc-payout-amount { font-size: 32px; font-weight: 950; color: #0f172a; display: flex; align-items: center; gap: 10px; margin-bottom: 24px; letter-spacing: -0.02em; }
                .mc-item-simple { font-size: 13px; font-weight: 700; color: #64748b; display: flex; align-items: center; gap: 8px; margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 12px; }

                .mc-footer { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .payout-card .mc-footer { grid-template-columns: 1fr; }
                
                .btn-solid-blue { background: #6366f1; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 850; cursor: pointer; transition: 0.2s; }
                .btn-outline-red { background: white; color: #f43f5e; border: 2px solid #f43f5e; padding: 14px; border-radius: 12px; font-weight: 850; cursor: pointer; transition: 0.2s; }
                .btn-success-payout { background: #10b981; color: white; border: none; padding: 18px; border-radius: 16px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: 0.2s; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.1); }
                .btn-solid-blue:hover, .btn-outline-red:hover, .btn-success-payout:hover { transform: scale(1.02); filter: brightness(1.1); }
            `}</style>
        </div>
    );
};

export default AdminRefundsPanel;
