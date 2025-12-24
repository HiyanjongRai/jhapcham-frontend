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
    info: '#3b82f6',   
    warning: '#f59e0b'
  };

  const icons = {
    success: <CheckCircle size={24} color="#fff" />,
    error: <XCircle size={24} color="#fff" />,
    info: <Info size={24} color="#fff" />,
    warning: <Info size={24} color="#fff" />
  };

  return ReactDOM.createPortal(
    <div className={`toast-container toast-${type}`}>
      <div className="toast-icon-wrapper" style={{ background: bgColors[type] || bgColors.info }}>
        {icons[type] || icons.info}
      </div>
      <div className="toast-content">
        <h4 className="toast-title">
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </h4>
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close" onClick={onClose}>
        <X size={18} />
      </button>
      <div className="toast-progress-bar" style={{ background: bgColors[type] || bgColors.info }}></div>
    </div>,
    document.body
  );
};

export default Toast;
