import { useNavigate } from 'react-router-dom';

/**
 * Global API Error Handler
 * Use this in all your API calls to automatically handle errors
 */
export const useApiErrorHandler = () => {
  const navigate = useNavigate();

  const handleApiError = (error, customMessage = null) => {
    console.error('API Error:', error);

    // Check if it's a network error (no response from server)
    if (!error.response) {
      // Check if it's a connection refused or backend down
      if (error.message === 'Network Error' || error.message.includes('ERR_CONNECTION_REFUSED')) {
        navigate('/backend-down');
        return;
      }
      
      // Other network errors
      navigate('/network-error');
      return;
    }

    // Server responded with an error
    const { status, data } = error.response;

    // Handle specific status codes
    if (status === 404) {
      navigate('/error', {
        state: {
          error: {
            status: 404,
            message: data.message || 'Not Found',
            details: data.details || customMessage || 'The requested resource was not found',
            timestamp: data.timestamp || new Date().toISOString(),
            path: data.path || error.config?.url
          }
        }
      });
      return;
    }

    if (status === 403) {
      navigate('/403');
      return;
    }

    if (status === 401) {
      // Redirect to login for unauthorized
      navigate('/login', { 
        state: { 
          message: 'Please login to continue',
          from: window.location.pathname 
        } 
      });
      return;
    }

    if (status >= 500) {
      navigate('/500');
      return;
    }

    // For all other errors (400, 422, etc.), show detailed error page
    navigate('/error', {
      state: {
        error: {
          status: status,
          message: data.message || 'An error occurred',
          errors: data.errors || {},
          details: data.details || customMessage,
          timestamp: data.timestamp || new Date().toISOString(),
          path: data.path || error.config?.url,
          trace: data.trace
        }
      }
    });
  };

  return { handleApiError };
};

/**
 * Wrapper for fetch API calls with automatic error handling
 */
export const apiFetch = async (url, options = {}, navigate) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Navigate to appropriate error page
      if (response.status === 404) {
        navigate('/error', {
          state: {
            error: {
              status: 404,
              message: errorData.message || 'Not Found',
              details: errorData.details,
              timestamp: errorData.timestamp || new Date().toISOString(),
              path: errorData.path || url
            }
          }
        });
      } else if (response.status === 403) {
        navigate('/403');
      } else if (response.status === 401) {
        navigate('/login', { 
          state: { 
            message: 'Please login to continue',
            from: window.location.pathname 
          } 
        });
      } else if (response.status >= 500) {
        navigate('/500');
      } else {
        navigate('/error', {
          state: {
            error: {
              status: response.status,
              message: errorData.message || 'An error occurred',
              errors: errorData.errors,
              details: errorData.details,
              timestamp: errorData.timestamp || new Date().toISOString(),
              path: errorData.path || url,
              trace: errorData.trace
            }
          }
        });
      }
      
      throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.message.includes('HTTP')) {
      // Already handled above
      throw error;
    }
    
    // Network error
    navigate('/backend-down');
    throw error;
  }
};

/**
 * Axios interceptor setup for automatic error handling
 */
export const setupAxiosInterceptors = (axios, navigate) => {
  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
      // Add auth token if exists
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Handle errors
      if (!error.response) {
        // Network error or backend down
        navigate('/backend-down');
        return Promise.reject(error);
      }

      const { status, data } = error.response;

      // Handle specific status codes
      if (status === 404) {
        navigate('/error', {
          state: {
            error: {
              status: 404,
              message: data.message || 'Not Found',
              details: data.details,
              timestamp: data.timestamp || new Date().toISOString(),
              path: data.path || error.config?.url
            }
          }
        });
      } else if (status === 403) {
        navigate('/403');
      } else if (status === 401) {
        navigate('/login', { 
          state: { 
            message: 'Please login to continue',
            from: window.location.pathname 
          } 
        });
      } else if (status >= 500) {
        navigate('/500');
      } else {
        navigate('/error', {
          state: {
            error: {
              status: status,
              message: data.message || 'An error occurred',
              errors: data.errors,
              details: data.details,
              timestamp: data.timestamp || new Date().toISOString(),
              path: data.path || error.config?.url,
              trace: data.trace
            }
          }
        });
      }

      return Promise.reject(error);
    }
  );
};
