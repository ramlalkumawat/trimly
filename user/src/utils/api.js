import axios from 'axios';

// central axios instance for this frontend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || ''
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
