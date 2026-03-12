import axios from 'axios';
import { beginRequest, endRequest } from '../utils/loadingBus';
import { clearAuthSession } from '../utils/auth';

const DEFAULT_API_ORIGIN = 'https://trimly-1q56.onrender.com';
const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.REACT_APP_API_URL ||
  DEFAULT_API_ORIGIN;
const API_BASE_URL = rawApiUrl.endsWith('/api')
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  // SECURITY: Enable cookie-based authentication
  // Cookies (including sessionId) will be sent with every request
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store CSRF token for use in state-changing requests
let csrfToken = null;

/**
 * Fetch CSRF token from server
 * Called once on app initialization and before POST/PUT/PATCH/DELETE requests
 */
const getCsrfToken = async () => {
  if (csrfToken) {
    return csrfToken;
  }
  
  try {
    const response = await axios.get(`${API_BASE_URL}/csrf-token`, {
      withCredentials: true
    });
    csrfToken = response.data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error.message);
    return null;
  }
};

// Initialize CSRF token on app load
getCsrfToken();

api.interceptors.request.use(
  async (config) => {
    const skipGlobalLoader = config.headers?.['x-skip-global-loader'] === 'true';
    if (!skipGlobalLoader) {
      beginRequest();
      config.__loaderTracked = true;
    }

    // SECURITY: Add CSRF token to state-changing requests
    // GET requests don't need CSRF tokens, only state-modifying operations
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
      // If we don't have a CSRF token yet, fetch it
      if (!csrfToken) {
        await getCsrfToken();
      }
      
      // Add CSRF token to request header
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // NOTE: Authorization header is NO LONGER needed
    // Authentication is now handled via HttpOnly cookies set by the server
    // The server identifies the user from the sessionId in the cookie

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (response.config?.__loaderTracked) {
      endRequest();
    }
    return response;
  },
  (error) => {
    if (error.config?.__loaderTracked) {
      endRequest();
    }

    // SECURITY: Handle 401 Unauthorized responses
    // This means the session has expired or the user is not authenticated
    if (error.response?.status === 401) {
      // Clear any cached CSRF token
      csrfToken = null;
      
      // Clear auth session and redirect to login
      clearAuthSession();
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

// Export for use in components
export { getCsrfToken };

export default api;
