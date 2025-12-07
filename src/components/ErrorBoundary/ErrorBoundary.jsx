import React from 'react';
import { ServerErrorPage } from '../ErrorPage/ErrorPage';

/**
 * Error Boundary Component
 * Catches all React errors and displays the error page
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Store error details in state
    this.state = {
      hasError: true,
      error: error,
      errorInfo: errorInfo
    };

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render error page
      return <ServerErrorPage />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
