import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './ErrorToast.css';

/**
 * ErrorToast Component
 * Displays backend errors in a beautiful popup notification
 * 
 * Usage:
 * <ErrorToast 
 *   error={{ status: 400, message: "Invalid Operation", details: "Insufficient stock" }}
 *   onClose={() => setError(null)}
 * />
 */
const ErrorToast = ({ error, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (error && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [error, duration, onClose]);

  if (!error) return null;

  // Determine error type and icon
  const getErrorType = (status) => {
    if (status >= 500) return { type: 'server', icon: '🔥', color: '#ef4444' };
    if (status === 404) return { type: 'notfound', icon: '🔍', color: '#f59e0b' };
    if (status === 403) return { type: 'forbidden', icon: '🚫', color: '#ef4444' };
    if (status === 401) return { type: 'unauthorized', icon: '🔒', color: '#f59e0b' };
    if (status === 400) return { type: 'validation', icon: '⚠️', color: '#f59e0b' };
    return { type: 'error', icon: '❌', color: '#ef4444' };
  };

  const errorType = getErrorType(error.status);

  return (
    <div className="error-toast-overlay">
      <div className="error-toast" style={{ borderLeftColor: errorType.color }}>
        <div className="error-toast-header">
          <div className="error-toast-icon" style={{ backgroundColor: errorType.color }}>
            {errorType.icon}
          </div>
          <div className="error-toast-title">
            <h4>{error.message || 'Error Occurred'}</h4>
            {error.status && (
              <span className="error-toast-status">Status: {error.status}</span>
            )}
          </div>
          <button 
            className="error-toast-close" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          >
            <X size={20} />
          </button>
        </div>

        {error.details && (
          <div className="error-toast-details">
            <p>{error.details}</p>
          </div>
        )}

        {error.errors && Object.keys(error.errors).length > 0 && (
          <div className="error-toast-validation">
            <p className="validation-title">Validation Errors:</p>
            <ul>
              {Object.entries(error.errors).map(([field, message]) => (
                <li key={field}>
                  <strong>{field}:</strong> {message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error.timestamp && (
          <div className="error-toast-footer">
            <span className="error-toast-time">
              {new Date(error.timestamp).toLocaleString()}
            </span>
            {error.path && (
              <span className="error-toast-path">{error.path}</span>
            )}
          </div>
        )}

        <div className="error-toast-progress" style={{ animationDuration: `${duration}ms` }} />
      </div>
    </div>
  );
};

export default ErrorToast;
