import axios from 'axios';
import { beginRequest, endRequest } from '../utils/loadingBus';

const DEFAULT_API_ORIGIN = 'https://trimly-1q56.onrender.com';
const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.REACT_APP_API_URL ||
  DEFAULT_API_ORIGIN;
const API_BASE_URL = rawApiUrl.endsWith('/api')
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/$/, '')}/api`;
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 25000);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number.isFinite(API_TIMEOUT_MS) ? API_TIMEOUT_MS : 25000,
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

    const token = localStorage.getItem('providerToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
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
      localStorage.removeItem('providerToken');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
