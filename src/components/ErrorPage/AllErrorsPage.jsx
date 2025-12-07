import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ErrorPage.css';
import { 
  Server, 
  RefreshCw, 
  AlertTriangle, 
  Home, 
  Terminal,
  Database,
  Lock,
  FileX,
  AlertCircle,
  XCircle,
  Info
} from 'lucide-react';
import { API_BASE } from '../config/config';

const AllErrorsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    // Get error details from navigation state
    const error = location.state?.error;
    if (error) {
      setErrorDetails(error);
    }
  }, [location]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Determine error type and icon
  const getErrorIcon = (status) => {
    if (status >= 500) return <Server size={100} strokeWidth={1.5} />;
    if (status === 404) return <FileX size={100} strokeWidth={1.5} />;
    if (status === 403 || status === 401) return <Lock size={100} strokeWidth={1.5} />;
    if (status === 400) return <AlertCircle size={100} strokeWidth={1.5} />;
    return <AlertTriangle size={100} strokeWidth={1.5} />;
  };

  const getErrorTitle = (status) => {
    const titles = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      409: 'Conflict',
      422: 'Validation Error',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout'
    };
    return titles[status] || 'Error Occurred';
  };

  const getErrorDescription = (status) => {
    const descriptions = {
      400: 'The request was invalid or cannot be served.',
      401: 'You need to be authenticated to access this resource.',
      403: 'You do not have permission to access this resource.',
      404: 'The requested resource could not be found.',
      405: 'The request method is not supported for this resource.',
      409: 'The request conflicts with the current state of the server.',
      422: 'The request was well-formed but contains invalid data.',
      429: 'Too many requests. Please slow down and try again later.',
      500: 'An unexpected error occurred on the server.',
      502: 'The server received an invalid response from the upstream server.',
      503: 'The service is temporarily unavailable. Please try again later.',
      504: 'The server did not receive a timely response from the upstream server.'
    };
    return descriptions[status] || 'An error occurred while processing your request.';
  };

  return (
    <div className="error-page">
      <div className="error-container">
        {/* Animated Background */}
        <div className="error-bg-decoration">
          <div className="error-circle error-circle-1"></div>
          <div className="error-circle error-circle-2"></div>
          <div className="error-circle error-circle-3"></div>
        </div>

        {/* Error Content */}
        <div className="error-content">
          {/* Error Code */}
          {errorDetails?.status && (
            <div className="error-code-wrapper">
              <h1 className="error-code">{errorDetails.status}</h1>
              <div className="error-code-underline"></div>
            </div>
          )}

          {/* Error Icon */}
          <div className="error-icon">
            {errorDetails?.status ? getErrorIcon(errorDetails.status) : <AlertTriangle size={100} strokeWidth={1.5} />}
          </div>

          {/* Error Title */}
          <h2 className="error-title">
            {errorDetails?.status ? getErrorTitle(errorDetails.status) : 'Something Went Wrong'}
          </h2>

          {/* Error Description */}
          <p className="error-message">
            {errorDetails?.status ? getErrorDescription(errorDetails.status) : 'An unexpected error occurred.'}
          </p>

          {/* Backend Error Details */}
          {errorDetails && (
            <div className="backend-error-details">
              {/* Error Message from Backend */}
              {errorDetails.message && (
                <div className="error-detail-box error-box-message">
                  <div className="error-detail-header">
                    <AlertCircle size={20} />
                    <span>Error Message</span>
                  </div>
                  <div className="error-detail-content">
                    {errorDetails.message}
                  </div>
                </div>
              )}

              {/* Validation Errors */}
              {errorDetails.errors && Object.keys(errorDetails.errors).length > 0 && (
                <div className="error-detail-box error-box-validation">
                  <div className="error-detail-header">
                    <XCircle size={20} />
                    <span>Validation Errors</span>
                  </div>
                  <div className="error-detail-content">
                    <ul className="validation-errors-list">
                      {Object.entries(errorDetails.errors).map(([field, message]) => (
                        <li key={field}>
                          <strong>{field}:</strong> {message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Error Details */}
              {errorDetails.details && (
                <div className="error-detail-box error-box-details">
                  <div className="error-detail-header">
                    <Info size={20} />
                    <span>Additional Details</span>
                  </div>
                  <div className="error-detail-content">
                    {errorDetails.details}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              {errorDetails.timestamp && (
                <div className="error-detail-box error-box-timestamp">
                  <div className="error-detail-header">
                    <Terminal size={20} />
                    <span>Timestamp</span>
                  </div>
                  <div className="error-detail-content">
                    <code>{new Date(errorDetails.timestamp).toLocaleString()}</code>
                  </div>
                </div>
              )}

              {/* Request Path */}
              {errorDetails.path && (
                <div className="error-detail-box error-box-path">
                  <div className="error-detail-header">
                    <Server size={20} />
                    <span>Request Path</span>
                  </div>
                  <div className="error-detail-content">
                    <code>{errorDetails.path}</code>
                  </div>
                </div>
              )}

              {/* Stack Trace (only in development) */}
              {errorDetails.trace && process.env.NODE_ENV === 'development' && (
                <div className="error-detail-box error-box-trace">
                  <div className="error-detail-header">
                    <Database size={20} />
                    <span>Stack Trace (Development Only)</span>
                  </div>
                  <div className="error-detail-content">
                    <pre className="stack-trace">{errorDetails.trace}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="error-actions">
            <button className="error-btn error-btn-secondary" onClick={handleGoBack}>
              <RefreshCw size={20} />
              Go Back
            </button>
            
            <button className="error-btn error-btn-primary" onClick={handleGoHome}>
              <Home size={20} />
              Go Home
            </button>
            
            <button className="error-btn error-btn-secondary" onClick={handleRefresh}>
              <RefreshCw size={20} />
              Retry
            </button>
          </div>

          {/* Help Section */}
          <div className="error-help">
            <p className="error-help-title">Need Help?</p>
            <div className="error-help-links">
              <button className="error-help-link" onClick={() => navigate('/contact')}>
                <AlertTriangle size={18} />
                Contact Support
              </button>
              <button className="error-help-link" onClick={() => navigate('/')}>
                <Home size={18} />
                Return to Homepage
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Dots */}
        <div className="error-decorative-dots">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="error-dot" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllErrorsPage;
