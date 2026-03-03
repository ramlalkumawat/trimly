import axios from 'axios';
import { beginRequest, endRequest } from './loadingBus';
import { clearAuthSession } from './auth';

const rawBackendUrl =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '');

const normalizedBackendUrl = rawBackendUrl ? rawBackendUrl.replace(/\/+$/, '') : '';
const normalizedApiBaseUrl = normalizedBackendUrl
  ? (normalizedBackendUrl.endsWith('/api')
      ? normalizedBackendUrl
      : `${normalizedBackendUrl}/api`)
  : '';

if (!normalizedApiBaseUrl && import.meta.env.PROD) {
  throw new Error(
    'Missing VITE_BACKEND_URL. Configure it in Vercel Environment Variables and redeploy.'
  );
}

export const API_BASE_URL = normalizedApiBaseUrl;
export const BACKEND_ORIGIN = normalizedApiBaseUrl.replace(/\/api$/, '');

// central axios instance for this frontend
const api = axios.create({
  baseURL: normalizedApiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const normalizeEndpoint = (url = '') => {
  if (!url) return '';

  if (/^https?:\/\//i.test(url)) {
    try {
      return new URL(url).pathname.replace(/^\/api/, '');
    } catch (error) {
      return url;
    }
  }

  return url.replace(/^\/api/, '');
};

const isProtectedEndpoint = (url = '') => {
  const endpoint = normalizeEndpoint(url);
  const protectedPrefixes = ['/bookings', '/user', '/auth/me', '/auth/refresh', '/auth/logout'];
  return protectedPrefixes.some((prefix) => endpoint.startsWith(prefix));
};

// attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const method = (config.method || 'get').toUpperCase();
  const endpoint = config.url || '';
  const skipGlobalLoader = config.headers?.['x-skip-global-loader'] === 'true';

  if (!skipGlobalLoader) {
    beginRequest();
    config.__loaderTracked = true;
  }

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

    if (error.response?.status === 401) {
      const method = (error.config?.method || 'get').toUpperCase();
      const endpoint = error.config?.url || '';
      const message = error.response?.data?.message || 'Unauthorized';
      console.warn(`[auth-debug][frontend] 401 ${method} ${endpoint}: ${message}`);

      if (isProtectedEndpoint(endpoint)) {
        clearAuthSession();
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
