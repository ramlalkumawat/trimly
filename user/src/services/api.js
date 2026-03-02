import api from '../utils/api';

// Generic API request helper using the shared axios instance.
const apiRequest = async (endpoint, options = {}) => {
  const method = (options.method || 'GET').toLowerCase();
  const token = options.token;

  try {
    const response = await api.request({
      url: endpoint,
      method,
      data: options.data,
      params: options.params,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });

    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'API request failed';
    throw new Error(message);
  }
};

// Authenticated API request
const authenticatedRequest = async (endpoint, token, options = {}) => {
  return apiRequest(endpoint, { ...options, token });
};

// Booking API functions
export const createBooking = async (bookingData, token) => {
  return authenticatedRequest('/bookings', token, {
    method: 'POST',
    data: bookingData
  });
};

export const getCustomerBookings = async (token) => {
  return authenticatedRequest('/bookings', token);
};

export const getActiveBookings = async (token) => {
  return authenticatedRequest('/bookings/customer/active', token);
};

export const cancelBooking = async (bookingId, token) => {
  return authenticatedRequest(`/bookings/${bookingId}/status`, token, {
    method: 'PATCH',
    data: { status: 'cancelled' }
  });
};

export const getBookingDetails = async (bookingId, token) => {
  return authenticatedRequest(`/bookings/${bookingId}`, token);
};

// Service API functions
export const getServices = async () => {
  return apiRequest('/services');
};

export const getServiceById = async (serviceId) => {
  return apiRequest(`/services/${serviceId}`);
};

// User profile functions
export const updateProfile = async (profileData, token) => {
  return authenticatedRequest('/user/profile', token, {
    method: 'PUT',
    data: profileData
  });
};

export const addAddress = async (address, token) => {
  return authenticatedRequest('/user/addresses', token, {
    method: 'POST',
    data: address
  });
};

// Auth functions
export const login = async (credentials) => {
  return apiRequest('/auth/login', {
    method: 'POST',
    data: credentials
  });
};

export const register = async (userData) => {
  return apiRequest('/auth/register', {
    method: 'POST',
    data: userData
  });
};

export const forgotPassword = async (loginId) => {
  const value = (loginId || '').trim();
  const payload = value.includes('@')
    ? { email: value.toLowerCase() }
    : { phone: value };

  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    data: payload
  });
};

// Helper function for handling API errors
export const handleApiError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default {
  createBooking,
  getCustomerBookings,
  getActiveBookings,
  cancelBooking,
  getBookingDetails,
  getServices,
  getServiceById,
  updateProfile,
  addAddress,
  login,
  register,
  forgotPassword,
  handleApiError
};
