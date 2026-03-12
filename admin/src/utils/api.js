import api from '../api/axios';

// API endpoints for admin modules
export const adminAPI = {
  // Users
  users: {
    getAll: (params = {}) => api.get('/admin/users', { params }),
    getById: (id) => api.get(`/admin/users/${id}`),
    create: (userData) => api.post('/admin/users', userData),
    update: (id, userData) => api.put(`/admin/users/${id}`, userData),
    updateStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),
    delete: (id) => api.delete(`/admin/users/${id}`),
  },

  // Providers
  providers: {
    getAll: (params = {}) => api.get('/admin/providers', { params }),
    getById: (id) => api.get(`/admin/providers/${id}`),
    create: (providerData) => api.post('/admin/providers', providerData),
    update: (id, providerData) => api.put(`/admin/providers/${id}`, providerData),
    verify: (id, status) => api.patch(`/admin/providers/${id}/verify`, { verified: status }),
    delete: (id) => api.delete(`/admin/providers/${id}`),
  },

  // Services
  services: {
    getAll: (params = {}) => api.get('/admin/services', { params }),
    getById: (id) => api.get(`/admin/services/${id}`),
    create: (serviceData) => api.post('/admin/services', serviceData),
    update: (id, serviceData) => api.put(`/admin/services/${id}`, serviceData),
    delete: (id) => api.delete(`/admin/services/${id}`),
  },

  // Bookings
  bookings: {
    getAll: (params = {}) => api.get('/admin/bookings', { params }),
    getById: (id) => api.get(`/admin/bookings/${id}`),
    create: (bookingData) => api.post('/admin/bookings', bookingData),
    update: (id, bookingData) => api.put(`/admin/bookings/${id}`, bookingData),
    delete: (id) => api.delete(`/admin/bookings/${id}`),
  },

  // Payments
  payments: {
    getAll: (params = {}) => api.get('/admin/payments', { params }),
    refund: (id) => api.post(`/admin/payments/refund/${id}`),
  },

  // Analytics
  analytics: {
    getDashboard: () => api.get('/admin/analytics'),
  },

  // Commissions
  commissions: {
    getAll: () => api.get('/admin/commissions'),
    updateService: (id, data) => api.patch(`/admin/commissions/services/${id}`, data),
    updateProvider: (id, data) => api.patch(`/admin/commissions/providers/${id}`, data),
  },

  // Auth
  auth: {
    createAccount: (userData) => api.post('/auth/register', { ...userData, role: 'admin' }),
    login: (credentials) => api.post('/auth/login', credentials),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (data) => api.post('/auth/reset-password', data),
    logout: () => api.post('/auth/logout'),
    refreshToken: () => api.post('/auth/refresh'),
  },

  // Profile
  profile: {
    get: () => api.get('/admin/profile'),
    update: (profileData) => api.put('/admin/profile', profileData),
  },
};

export default api;
