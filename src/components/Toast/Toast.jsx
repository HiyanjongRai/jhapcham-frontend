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
    success: '#10b981',
    error: '#ef4444',  
    info: '#4f46e5',   
    warning: '#f59e0b'
  };

  const icons = {
    success: <CheckCircle size={24} color="#fff" strokeWidth={2} />,
    error: <XCircle size={24} color="#fff" strokeWidth={2} />,
    info: <Info size={24} color="#fff" strokeWidth={2} />,
    warning: <Info size={24} color="#fff" strokeWidth={2} />
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
