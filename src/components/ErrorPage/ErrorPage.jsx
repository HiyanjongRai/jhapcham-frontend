import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ErrorPage.css';
import { Home, ArrowLeft, RefreshCw, Search, ShoppingBag, AlertTriangle } from 'lucide-react';
import BackendDownPage from './BackendDownPage';
import AllErrorsPage from './AllErrorsPage';

const ErrorPage = ({ 
  errorCode = '404', 
  errorTitle = 'Page Not Found',
  errorMessage = "Oops! The page you're looking for doesn't exist.",
  showBackButton = true,
  showHomeButton = true,
  showRefreshButton = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleSearch = () => {
    navigate('/products');
  };

  // Different error configurations
  const errorConfigs = {
    '404': {
      title: 'Page Not Found',
      message: "Oops! The page you're looking for doesn't exist. It might have been moved or deleted.",
      icon: <Search size={120} strokeWidth={1.5} />
    },
    '403': {
      title: 'Access Denied',
      message: "Sorry, you don't have permission to access this page. Please contact support if you believe this is an error.",
      icon: <AlertTriangle size={120} strokeWidth={1.5} />
    },
    '500': {
      title: 'Server Error',
      message: "Something went wrong on our end. We're working to fix it. Please try again later.",
      icon: <AlertTriangle size={120} strokeWidth={1.5} />
    },
    'network': {
      title: 'Network Error',
      message: "Unable to connect to the server. Please check your internet connection and try again.",
      icon: <RefreshCw size={120} strokeWidth={1.5} />
    }
  };

  const currentError = errorConfigs[errorCode] || errorConfigs['404'];

  return (
    <div className="error-page">
      <div className="error-container">
        {/* Animated Background Elements */}
        <div className="error-bg-decoration">
          <div className="error-circle error-circle-1"></div>
          <div className="error-circle error-circle-2"></div>
          <div className="error-circle error-circle-3"></div>
        </div>

        {/* Error Content */}
        <div className="error-content">
          {/* Error Code */}
          <div className="error-code-wrapper">
            <h1 className="error-code">{errorCode}</h1>
            <div className="error-code-underline"></div>
          </div>

          {/* Error Icon */}
          <div className="error-icon">
            {currentError.icon}
          </div>

          {/* Error Title */}
          <h2 className="error-title">
            {errorTitle || currentError.title}
          </h2>

          {/* Error Message */}
          <p className="error-message">
            {errorMessage || currentError.message}
          </p>

          {/* Current Path Info */}
          {location.pathname !== '/' && (
            <div className="error-path">
              <code>{location.pathname}</code>
            </div>
          )}

          {/* Action Buttons */}
          <div className="error-actions">
            {showBackButton && (
              <button className="error-btn error-btn-secondary" onClick={handleGoBack}>
                <ArrowLeft size={20} />
                Go Back
              </button>
            )}
            
            {showHomeButton && (
              <button className="error-btn error-btn-primary" onClick={handleGoHome}>
                <Home size={20} />
                Go Home
              </button>
            )}
            
            {showRefreshButton && (
              <button className="error-btn error-btn-secondary" onClick={handleRefresh}>
                <RefreshCw size={20} />
                Refresh
              </button>
            )}
          </div>

          {/* Additional Help */}
          <div className="error-help">
            <p className="error-help-title">Looking for something?</p>
            <div className="error-help-links">
              <button className="error-help-link" onClick={handleSearch}>
                <ShoppingBag size={18} />
                Browse Products
              </button>
              <button className="error-help-link" onClick={() => navigate('/contact')}>
                <AlertTriangle size={18} />
                Contact Support
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
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

// Specific Error Page Components
export const NotFoundPage = () => (
  <ErrorPage 
    errorCode="404"
    showBackButton={true}
    showHomeButton={true}
  />
);

export const ForbiddenPage = () => (
  <ErrorPage 
    errorCode="403"
    showBackButton={true}
    showHomeButton={true}
  />
);

export const ServerErrorPage = () => (
  <ErrorPage 
    errorCode="500"
    showBackButton={false}
    showHomeButton={true}
    showRefreshButton={true}
  />
);

export const NetworkErrorPage = () => (
  <ErrorPage 
    errorCode="network"
    showBackButton={false}
    showHomeButton={true}
    showRefreshButton={true}
  />
);

// Export BackendDownPage and AllErrorsPage
export { BackendDownPage, AllErrorsPage };

export default ErrorPage;

