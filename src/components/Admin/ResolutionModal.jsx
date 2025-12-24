import React, { useState } from 'react';
import { CheckCircle, X, Info } from 'lucide-react';
import './ResolutionModal.css';

const ResolutionModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    status,
    reportId,
    reason
}) => {
    const [note, setNote] = useState("");

    if (!isOpen) return null;

    const getStatusLabel = (s) => {
        return s?.replace(/_/g, ' ') || "";
    };

    const handleConfirm = () => {
        onConfirm(note);
        setNote(""); // Reset for next use
    };

    return (
        <div className="res-modal-overlay" onClick={onClose}>
            <div className="res-modal-content scale-in" onClick={e => e.stopPropagation()}>
                <div className="res-modal-header">
                    <div className="res-modal-title">
                        <CheckCircle size={24} className="res-icon" />
                        <h2>Update Report #{reportId}</h2>
                    </div>
                    <button className="res-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="res-modal-body">
                    {reason && (
                        <div className="res-reason-context">
                            <label>Report Reason</label>
                            <p>"{reason}"</p>
                        </div>
                    )}
                    
                    <div className="res-info-box">
                        <Info size={18} />
                        <p>Changing status to: <strong>{getStatusLabel(status)}</strong></p>
                    </div>

                    <div className="res-input-group">
                        <label>Resolution Note</label>
                        <textarea 
                            placeholder="Provide details about why this report is being updated..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={5}
                        />
                    </div>
                </div>

                <div className="res-modal-footer">
                    <button className="res-btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button 
                        className="res-btn-primary" 
                        onClick={handleConfirm}
                        disabled={!note.trim()}
                    >
                        Confirm Resolution
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResolutionModal;
