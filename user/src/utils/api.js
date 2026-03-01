import axios from 'axios';

const rawApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '';
const normalizedApiBaseUrl = rawApiBaseUrl
  ? (rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl : `${rawApiBaseUrl.replace(/\/$/, '')}/api`)
  : '';

// central axios instance for this frontend
const api = axios.create({
  baseURL: normalizedApiBaseUrl
});

const isProtectedEndpoint = (url = '') => {
  const protectedPrefixes = ['/bookings', '/user', '/auth/me', '/auth/refresh', '/auth/logout'];
  return protectedPrefixes.some((prefix) => url.startsWith(prefix));
};

// attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const method = (config.method || 'get').toUpperCase();
  const endpoint = config.url || '';

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (isProtectedEndpoint(endpoint)) {
    if (token) {
      console.debug(
        `[auth-debug][frontend] ${method} ${endpoint} with Bearer token (length=${token.length})`
      );
    } else {
      console.warn(`[auth-debug][frontend] ${method} ${endpoint} missing auth token`);
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const method = (error.config?.method || 'get').toUpperCase();
      const endpoint = error.config?.url || '';
      const message = error.response?.data?.message || 'Unauthorized';
      console.warn(`[auth-debug][frontend] 401 ${method} ${endpoint}: ${message}`);
    }

    return Promise.reject(error);
  }
);

export default api;
