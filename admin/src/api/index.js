import axios from 'axios';

const rawApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';
const API_BASE_URL = rawApiBaseUrl.endsWith('/api')
  ? rawApiBaseUrl
  : `${rawApiBaseUrl.replace(/\/$/, '')}/api`;

// Shared axios client used by some legacy admin pages.
const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  createAccount: (userData) => api.post('/auth/register', { ...userData, role: 'admin' }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword })
};

export const adminAPI = {
  // Profile
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (profileData) => api.put('/admin/profile', profileData),
  
  // Analytics
  getAnalytics: () => api.get('/admin/analytics'),
  
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (userData) => api.post('/admin/users', userData),
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  
  // Providers
  getProviders: (params) => api.get('/admin/providers', { params }),
  createProvider: (providerData) => api.post('/admin/providers', providerData),
  updateProvider: (providerId, providerData) => api.put(`/admin/providers/${providerId}`, providerData),
  deleteProvider: (providerId) => api.delete(`/admin/providers/${providerId}`),
  verifyProvider: (providerId, verified) => api.patch(`/admin/providers/${providerId}/verify`, { verified }),
  blockProvider: (providerId, blocked) => api.patch(`/admin/providers/${providerId}/block`, { blocked }),
  
  // Services
  getServices: (params) => api.get('/admin/services', { params }),
  createService: (serviceData) => api.post('/admin/services', serviceData),
  updateService: (serviceId, serviceData) => api.put(`/admin/services/${serviceId}`, serviceData),
  deleteService: (serviceId) => api.delete(`/admin/services/${serviceId}`),
  
  // Bookings
  getBookings: (params) => api.get('/admin/bookings', { params }),
  createBooking: (bookingData) => api.post('/admin/bookings', bookingData),
  updateBooking: (bookingId, bookingData) => api.put(`/admin/bookings/${bookingId}`, bookingData),
  deleteBooking: (bookingId) => api.delete(`/admin/bookings/${bookingId}`),
  
  // Payments
  getPayments: (params) => api.get('/admin/payments', { params }),
  refundPayment: (paymentId) => api.post(`/admin/payments/refund/${paymentId}`),
  
  // Commissions
  getCommissions: () => api.get('/admin/commissions'),
  updateServiceCommission: (serviceId, commissionRate) => api.patch(`/admin/commissions/services/${serviceId}`, { commissionRate }),
  updateProviderCommission: (providerId, commissionRate) => api.patch(`/admin/commissions/providers/${providerId}`, { commissionRate })
};

export default api;
