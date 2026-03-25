import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import './Toast.css';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const bgColors = {
    success: '#10b981', // Bright Emerald Green
    error: '#f87171',   // Bright Coral Red
    info: '#3b82f6',    // Bright Blue
    warning: '#fbbf24'  // Bright Amber
  };

  const icons = {
    success: <CheckCircle size={18} color="#fff" strokeWidth={2.5} />,
    error: <XCircle size={18} color="#fff" strokeWidth={2.5} />,
    info: <Info size={18} color="#fff" strokeWidth={2.5} />,
    warning: <Info size={18} color="#fff" strokeWidth={2.5} />
  };

  return ReactDOM.createPortal(
    <div className={`toast-container toast-${type}`}>
      <div className="toast-icon-sidebar" style={{ background: bgColors[type] || bgColors.info }}>
        {icons[type] || icons.info}
      </div>
      <div className="toast-main">
        <div className="toast-content">
          <h4 className="toast-title">
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </h4>
          <p className="toast-message">{message}</p>
        </div>
        <button 
          className="toast-close-btn" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close notification"
        >
          <X size={18} />
        </button>
      </div>
      <div className="toast-timer-line" style={{ background: bgColors[type] || bgColors.info }}></div>
    </div>,
    document.body
  );
};

export default Toast;
