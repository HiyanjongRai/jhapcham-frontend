import React, { useState } from 'react';

import axios from '../../api/axios';
import { API_BASE } from '../config/config';

const ReportModal = ({ isOpen, onClose, type, reportedEntityId, entityName }) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                type: type, // "PRODUCT" or "SELLER"
                reportedEntityId: reportedEntityId,
                reason: reason
            };
            await axios.post('/api/reports', payload);
            alert('Report submitted successfully');
            onClose();
        } catch (error) {
            console.error(error);
            if (error.response && error.response.status === 401) {
                alert('Session expired. Please log in again.');
            } else {
                alert('Failed to submit report. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000
        }}>
            <div style={{
                background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px'
            }}>
                <h2 style={{marginTop: 0}}>Report {type === 'PRODUCT' ? 'Product' : 'Seller'}</h2>
                <p>Reporing: <strong>{entityName}</strong></p>
                <form onSubmit={handleSubmit}>
                    <div style={{marginBottom: '1rem'}}>
                        <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>Reason</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            style={{width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', minHeight: '100px'}}
                            placeholder="Describe the issue..."
                        />
                    </div>
                    <div style={{display: 'flex', justifyContent: 'flex-end', gap: '0.5rem'}}>
                        <button type="button" onClick={onClose} style={{
                            padding: '0.5rem 1rem', border: '1px solid #ccc', background: 'white', borderRadius: '6px', cursor: 'cursor'
                        }}>Cancel</button>
                        <button type="submit" disabled={loading} style={{
                            padding: '0.5rem 1rem', border: 'none', background: '#dc2626', color: 'white', borderRadius: '6px', cursor: 'cursor'
                        }}>
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;
