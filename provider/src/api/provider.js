import axios from 'axios';
import { beginRequest, endRequest } from '../utils/loadingBus';

// Central API client + endpoint helpers for provider/auth/booking operations.
const rawApiBaseUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api';
const API_BASE_URL = rawApiBaseUrl.endsWith('/api')
  ? rawApiBaseUrl
  : `${rawApiBaseUrl.replace(/\/$/, '')}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and cache-busting
api.interceptors.request.use(
  (config) => {
    const skipGlobalLoader = config.headers?.['x-skip-global-loader'] === 'true';
    if (!skipGlobalLoader) {
      beginRequest();
      config.__loaderTracked = true;
    }

    const token = localStorage.getItem('providerToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add cache-busting for GET requests
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now() // timestamp to prevent caching
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
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

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
};

// Provider Dashboard API calls
export const providerAPI = {
  // Auth
  login: authAPI.login,
  getProfile: () => api.get('/provider/profile'),
  
  // Dashboard
  getDashboard: (config = {}) => api.get('/provider/dashboard', config),
  
  // Bookings
  getBookings: (status, config = {}) =>
    api.get('/provider/bookings', {
      ...config,
      params: {
        ...(config.params || {}),
        ...(status ? { status } : {}),
      },
    }),
  getAvailableBookings: (config = {}) => api.get('/provider/available-bookings', config),
  claimBooking: (bookingId) => api.put(`/provider/bookings/${bookingId}/claim`),
  acceptBooking: (bookingId) => api.put(`/provider/bookings/${bookingId}/accept`),
  rejectBooking: (bookingId) => api.put(`/provider/bookings/${bookingId}/reject`),
  startService: (bookingId) => api.put(`/provider/bookings/${bookingId}/start`),
  completeService: (bookingId) => api.put(`/provider/bookings/${bookingId}/complete`),
  
  // Availability
  toggleAvailability: (isAvailable) => api.put('/provider/availability', { isAvailable }),
  
  // Services
  getServices: () => api.get('/provider/services'),
  addService: (serviceData) => api.post('/provider/services', serviceData),
  updateService: (serviceId, serviceData) => api.put(`/provider/services/${serviceId}`, serviceData),
  deleteService: (serviceId) => api.delete(`/provider/services/${serviceId}`),
  
  // Profile
  updateProfile: (profileData) => api.put('/provider/profile', profileData),
  
  // Earnings
  getEarnings: (startDate, endDate, config = {}) =>
    api.get('/provider/earnings', {
      ...config,
      params: {
        ...(config.params || {}),
        startDate,
        endDate,
      },
    }),
};

// Export combined API object
export default {
  auth: authAPI,
  provider: providerAPI,
};
