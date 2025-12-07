import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ErrorPage.css';
import { Server, RefreshCw, AlertTriangle, Home, Terminal } from 'lucide-react';
import { API_BASE } from '../config/config';

const BackendDownPage = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const checkBackendStatus = async () => {
    setIsChecking(true);
    try {
      // Try to ping the backend
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        // Backend is back online!
        alert('Backend server is back online! Redirecting...');
        navigate('/');
      } else {
        setLastChecked(new Date().toLocaleTimeString());
      }
    } catch (error) {
      // Still down
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check immediately on mount
    checkBackendStatus();
  }, []);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

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
          {/* Error Icon */}
          <div className="error-icon backend-server-icon">
            <Server size={120} strokeWidth={1.5} />
            <div className="server-status-indicator offline"></div>
          </div>

          {/* Error Title */}
          <h2 className="error-title">
            Backend Server Offline
          </h2>

          {/* Error Message */}
          <p className="error-message">
            Unable to connect to the backend server. The API server might be down or not running.
          </p>

          {/* Server Details */}
          <div className="backend-details">
            <div className="backend-detail-item">
              <Terminal size={20} />
              <div>
                <div className="backend-detail-label">API Server</div>
                <code className="backend-detail-value">{API_BASE}</code>
              </div>
            </div>
            {lastChecked && (
              <div className="backend-detail-item">
                <AlertTriangle size={20} />
                <div>
                  <div className="backend-detail-label">Last Checked</div>
                  <div className="backend-detail-value">{lastChecked}</div>
                </div>
              </div>
            )}
          </div>

          {/* Troubleshooting Steps */}
          <div className="troubleshooting-box">
            <h3 className="troubleshooting-title">
              <AlertTriangle size={20} />
              Troubleshooting Steps
            </h3>
            <ol className="troubleshooting-list">
              <li>Check if the backend server is running on <code>{API_BASE}</code></li>
              <li>Verify your Spring Boot application is started</li>
              <li>Check if the port 8080 is not blocked by firewall</li>
              <li>Review backend console for any startup errors</li>
              <li>Ensure database connection is working</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="error-actions">
            <button 
              className="error-btn error-btn-primary" 
              onClick={checkBackendStatus}
              disabled={isChecking}
            >
              <RefreshCw size={20} className={isChecking ? 'spinning' : ''} />
              {isChecking ? 'Checking...' : 'Check Server Status'}
            </button>
            
            <button className="error-btn error-btn-secondary" onClick={handleRefresh}>
              <RefreshCw size={20} />
              Refresh Page
            </button>
            
            <button className="error-btn error-btn-secondary" onClick={handleGoHome}>
              <Home size={20} />
              Go Home Anyway
            </button>
          </div>

          {/* Developer Info */}
          <div className="developer-info">
            <p className="developer-info-title">For Developers:</p>
            <div className="developer-commands">
              <div className="developer-command">
                <span className="command-label">Start Backend:</span>
                <code>cd backend && mvn spring-boot:run</code>
              </div>
              <div className="developer-command">
                <span className="command-label">Check Port:</span>
                <code>netstat -ano | findstr :8080</code>
              </div>
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

export default BackendDownPage;
