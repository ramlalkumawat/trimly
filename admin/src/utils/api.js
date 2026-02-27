import axios from 'axios';

// Central API layer for admin domain endpoints (auth, users, services, etc.).
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
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

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - auto logout
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    }
    
    return Promise.reject(error);
  }
);

// API endpoints for admin modules
export const adminAPI = {
  // Users
  users: {
    getAll: (params = {}) => api.get('/api/admin/users', { params }),
    getById: (id) => api.get(`/api/admin/users/${id}`),
    create: (userData) => api.post('/api/admin/users', userData),
    update: (id, userData) => api.put(`/api/admin/users/${id}`, userData),
    updateStatus: (id, status) => api.patch(`/api/admin/users/${id}/status`, { status }),
    delete: (id) => api.delete(`/api/admin/users/${id}`),
  },

  // Providers
  providers: {
    getAll: (params = {}) => api.get('/api/admin/providers', { params }),
    getById: (id) => api.get(`/api/admin/providers/${id}`),
    create: (providerData) => api.post('/api/admin/providers', providerData),
    update: (id, providerData) => api.put(`/api/admin/providers/${id}`, providerData),
    verify: (id, status) => api.patch(`/api/admin/providers/${id}/verify`, { verified: status }),
    delete: (id) => api.delete(`/api/admin/providers/${id}`),
  },

  // Services
  services: {
    getAll: (params = {}) => api.get('/api/admin/services', { params }),
    getById: (id) => api.get(`/api/admin/services/${id}`),
    create: (serviceData) => api.post('/api/admin/services', serviceData),
    update: (id, serviceData) => api.put(`/api/admin/services/${id}`, serviceData),
    delete: (id) => api.delete(`/api/admin/services/${id}`),
  },

  // Bookings
  bookings: {
    getAll: (params = {}) => api.get('/api/admin/bookings', { params }),
    getById: (id) => api.get(`/api/admin/bookings/${id}`),
    update: (id, bookingData) => api.put(`/api/admin/bookings/${id}`, bookingData),
    delete: (id) => api.delete(`/api/admin/bookings/${id}`),
  },

  // Payments
  payments: {
    getAll: (params = {}) => api.get('/api/admin/payments', { params }),
    refund: (id) => api.post(`/api/admin/payments/refund/${id}`),
  },

  // Analytics
  analytics: {
    getDashboard: () => api.get('/api/admin/analytics'),
  },

  // Commissions
  commissions: {
    getAll: () => api.get('/api/admin/commissions'),
    updateService: (id, data) => api.patch(`/api/admin/commissions/services/${id}`, data),
    updateProvider: (id, data) => api.patch(`/api/admin/commissions/providers/${id}`, data),
  },

  // Auth
  auth: {
    createAccount: (userData) => api.post('/api/auth/register', { ...userData, role: 'admin' }),
    login: (credentials) => api.post('/api/auth/login', credentials),
    forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
    logout: () => api.post('/api/auth/logout'),
    refreshToken: () => api.post('/api/auth/refresh'),
  },

  // Profile
  profile: {
    get: () => api.get('/api/admin/profile'),
    update: (profileData) => api.put('/api/admin/profile', profileData),
  },
};

export default api;
