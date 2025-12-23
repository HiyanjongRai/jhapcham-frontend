import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import './ConfirmModal.css';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirm Action", 
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "warning" // warning, danger, success
}) => {
    if (!isOpen) return null;

    return (
        <div className="cm-overlay" onClick={onClose}>
            <div className="cm-content fade-in" onClick={e => e.stopPropagation()}>
                <div className="cm-header">
                    <div className={`cm-icon-box ${type}`}>
                        <AlertCircle size={24} />
                    </div>
                    <button className="cm-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="cm-body">
                    <h3 className="cm-title">{title}</h3>
                    <p className="cm-message">{message}</p>
                </div>
                <div className="cm-footer">
                    <button className="cm-btn-cancel" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button className={`cm-btn-confirm ${type}`} onClick={() => {
                        onConfirm();
                        onClose();
                    }}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
