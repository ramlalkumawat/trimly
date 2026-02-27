import axios from 'axios';

// Central API client + endpoint helpers for provider/auth/booking operations.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  (response) => response,
  (error) => {
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
  getProfile: authAPI.getMe,
  
  // Dashboard
  getDashboard: () => api.get('/provider/dashboard'),
  
  // Bookings
  getBookings: (status) => api.get(`/provider/bookings${status ? `?status=${status}` : ''}`),
  getAvailableBookings: () => api.get('/provider/available-bookings'),
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
  getEarnings: (startDate, endDate) => api.get(`/provider/earnings?startDate=${startDate}&endDate=${endDate}`),
};

// Export combined API object
export default {
  auth: authAPI,
  provider: providerAPI,
};
