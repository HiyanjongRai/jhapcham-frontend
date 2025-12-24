import React, { useState } from 'react';
import axios from '../../api/axios';
import { AlertTriangle, X, Send } from 'lucide-react';
import Toast from '../Toast/Toast';
import './ReportModal.css';

const ReportModal = ({ isOpen, onClose, type, reportedEntityId, entityName }) => {
    const [category, setCategory] = useState('');
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });

    const productCategories = [
        "Fake/Counterfeit Product",
        "Misleading Product Description",
        "Inappropriate/Harmful Content",
        "Pricing Manipulation",
        "Other"
    ];

    const sellerCategories = [
        "Seller Scamming/Fraud",
        "Off-Platform Transaction",
        "Abusive Communication",
        "Poor Fulfillment/Shipping",
        "Other"
    ];

    const categories = type === 'PRODUCT' ? productCategories : sellerCategories;

    if (!isOpen) return null;

    const showToast = (message, type) => {
        setToast({ message, type });
    };

    const handleCloseToast = () => {
        setToast({ message: '', type: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Please log in to submit a report', 'error');
            return;
        }

        if (!category) {
            showToast('Please select a reason category', 'error');
            return;
        }
        
        setLoading(true);
        try {
            const finalReason = category === 'Other' ? (details || 'No additional details') : `${category}: ${details}`;
            const payload = {
                type: type, // "PRODUCT" or "SELLER"
                reportedEntityId: reportedEntityId,
                reason: finalReason
            };
            
            const response = await axios.post('/api/reports', payload);
            if (response.status === 200 || response.status === 201) {
                showToast('Report submitted successfully. We will review it shortly.', 'success');
                
                // Clear inputs and close after a delay
                setCategory('');
                setDetails('');
                setTimeout(() => {
                    onClose();
                }, 2000);
            }
        } catch (error) {
            console.error('Report submission error:', error);
            const errMsg = error.response?.data?.message || error.message || 'Failed to submit report';
            showToast(errMsg, 'error');
            
            if (error.response?.status === 401) {
                // Clear expired token? 
                // localStorage.removeItem('token');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="report-modal-overlay" onClick={onClose}>
                <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="report-modal-header">
                        <div className="report-modal-title">
                            <AlertTriangle size={24} color="#e53e3e" />
                            <h2>Report {type === 'PRODUCT' ? 'Product' : 'Seller'}</h2>
                        </div>
                        <button className="report-modal-close" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>

                    <div className="report-modal-body">
                        <div className="report-entity-info">
                            <p className="report-label">Target {type === 'PRODUCT' ? 'Product' : 'Store'}:</p>
                            <p className="report-entity-nickname">{entityName}</p>
                        </div>

                        <form onSubmit={handleSubmit} id="report-form">
                            <div className="report-form-group">
                                <label className="report-label">Reason Category</label>
                                <select 
                                    className="report-select"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    required
                                    disabled={loading}
                                >
                                    <option value="" disabled>Select a category...</option>
                                    {categories.map((cat, idx) => (
                                        <option key={idx} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="report-form-group" style={{ marginTop: '1.5rem' }}>
                                <label className="report-label">Additional Details</label>
                                <textarea
                                    className="report-textarea"
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    required={category === 'Other'}
                                    placeholder="Please provide more context to help our team investigate..."
                                    disabled={loading}
                                    style={{ minHeight: '120px' }}
                                />
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
                            disabled={loading || !category}
                        >
                            {loading ? (
                                'Submitting...'
                            ) : (
                                <>
                                    <Send size={18} />
                                    Submit Report
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
};

export default ReportModal;
