import axios from 'axios';
import { beginRequest, endRequest } from '../utils/loadingBus';
import { clearAuthSession, getStoredToken } from '../utils/auth';

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
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const skipGlobalLoader = config.headers?.['x-skip-global-loader'] === 'true';
    if (!skipGlobalLoader) {
      beginRequest();
      config.__loaderTracked = true;
    }

    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

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

    if (error.response?.status === 401) {
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

export default api;
