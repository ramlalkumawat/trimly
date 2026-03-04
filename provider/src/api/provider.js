import api from './axios';

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
