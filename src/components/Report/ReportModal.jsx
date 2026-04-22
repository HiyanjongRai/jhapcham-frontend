import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import axios from '../../api/axios';
import { AlertTriangle, X, Send } from 'lucide-react';
import Toast from '../Toast/Toast';
import './ReportModal.css';

const ReportModal = ({ isOpen, onClose, orderId, orderItemId, entityName }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [evidenceFiles, setEvidenceFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });

    if (!isOpen) return null;

    const reasons = [
        { key: 'DAMAGED', label: 'Item is damaged' },
        { key: 'WRONG_ITEM', label: 'Received the wrong item' },
        { key: 'MISSING_ITEM', label: 'Item is missing' },
        { key: 'QUALITY_ISSUE', label: 'Quality issue' }
    ];

    const showToast = (message, type) => {
        setToast({ message, type });
    };

    const handleCloseToast = () => {
        setToast({ message: '', type: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!reason) {
            showToast('Please select a reason', 'error');
            return;
        }
        
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('orderId', orderId);
            formData.append('orderItemId', orderItemId);
            formData.append('reason', reason);
            formData.append('description', description);
            
            evidenceFiles.forEach(f => formData.append('files', f));
            
            const response = await axios.post('/api/reports', formData);
            if (response.status === 200 || response.status === 201) {
                showToast('Report submitted successfully. Seller will review it.', 'success');
                setTimeout(() => {
                    onClose();
                }, 2000);
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message || 'Failed to submit report';
            showToast(errMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const modalLayout = (
        <>
            <div className="report-modal-overlay" onClick={onClose}>
                <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="report-modal-header">
                        <div className="report-modal-title">
                            <AlertTriangle size={24} color="#e53e3e" />
                            <h2>Report Order Issue</h2>
                        </div>
                        <button className="report-modal-close" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>

                    <div className="report-modal-body">
                        <div className="report-entity-info">
                            <p className="report-label">Target Product:</p>
                            <p className="report-entity-nickname">{entityName}</p>
                            <p className="report-meta">Order ID: #{orderId}</p>
                        </div>

                        <form onSubmit={handleSubmit} id="report-form">
                            <div className="report-form-group">
                                <label className="report-label">Select Reason</label>
                                <select 
                                    className="report-select"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                    disabled={loading}
                                >
                                    <option value="" disabled>-- Choose Category --</option>
                                    {reasons.map((r) => (
                                        <option key={r.key} value={r.key}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="report-form-group" style={{ marginTop: '1.5rem' }}>
                                <label className="report-label">Explain your issue</label>
                                <textarea
                                    className="report-textarea"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    placeholder="Provide details about the issue..."
                                    disabled={loading}
                                    style={{ minHeight: '120px' }}
                                />
                            </div>

                            <div className="report-form-group" style={{ marginTop: '1.5rem' }}>
                                <label className="report-label">Upload Evidence Photos (Optional)</label>
                                <input 
                                    type="file" 
                                    multiple 
                                    accept="image/*"
                                    onChange={(e) => setEvidenceFiles(Array.from(e.target.files).slice(0, 3))}
                                    disabled={loading}
                                    className="report-file-input"
                                    style={{ display: 'block', width: '100%', marginTop: '8px', padding: '8px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '6px' }}
                                />
                                {evidenceFiles.length > 0 && (
                                    <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#64748b' }}>
                                        {evidenceFiles.length} file(s) selected (Max 3)
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="report-modal-footer">
                        <button type="button" className="report-btn report-btn-cancel" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            form="report-form"
                            className="report-btn report-btn-submit" 
                            disabled={loading || !reason}
                        >
                            {loading ? 'Submitting...' : (
                                <>
                                    <Send size={18} />
                                    SUBMIT REPORT
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            {toast.message && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={handleCloseToast} 
                />
            )}
        </>
    );

    return createPortal(modalLayout, document.body);
};

export default ReportModal;
