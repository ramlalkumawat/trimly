const rawApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';
const API_BASE_URL = rawApiBaseUrl.endsWith('/api')
  ? rawApiBaseUrl
  : `${rawApiBaseUrl.replace(/\/$/, '')}/api`;

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Authenticated API request
const authenticatedRequest = async (endpoint, token, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
};

// Booking API functions
export const createBooking = async (bookingData, token) => {
  return authenticatedRequest('/bookings', token, {
    method: 'POST',
    body: JSON.stringify(bookingData)
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
    body: JSON.stringify({ status: 'cancelled' })
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
    body: JSON.stringify(profileData)
  });
};

export const addAddress = async (address, token) => {
  return authenticatedRequest('/user/addresses', token, {
    method: 'POST',
    body: JSON.stringify(address)
  });
};

export const updateLocation = async (location, token) => {
  return authenticatedRequest('/user/location', token, {
    method: 'PUT',
    body: JSON.stringify(location)
  });
};

// Auth functions
export const login = async (credentials) => {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
};

export const register = async (userData) => {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
};

export const forgotPassword = async (loginId) => {
  const value = (loginId || '').trim();
  const payload = value.includes('@')
    ? { email: value.toLowerCase() }
    : { phone: value };

  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

// Helper function for handling API errors
export const handleApiError = (error) => {
  if (error.message) {
    return error.message;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return 'An unexpected error occurred';
};

// Helper function to get customer location
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(new Error('Unable to retrieve your location'));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
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
  updateLocation,
  login,
  register,
  forgotPassword,
  handleApiError,
  getCurrentLocation
};
