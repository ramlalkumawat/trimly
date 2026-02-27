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

// attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
