import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

// Global location state: persists in localStorage and syncs with backend when logged in.
const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load location from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        setLocation(JSON.parse(savedLocation));
      } catch (err) {
        console.error('Failed to parse saved location:', err);
        localStorage.removeItem('userLocation');
      }
    }
  }, []);

  // Save location to localStorage whenever it changes
  useEffect(() => {
    if (location) {
      localStorage.setItem('userLocation', JSON.stringify(location));
    } else {
      localStorage.removeItem('userLocation');
    }
  }, [location]);

  // Send location to backend
  const saveLocationToBackend = async (locationData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      // If no token, just save to local state
      setLocation(locationData);
      return locationData;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/user/location', locationData);
      setLocation(locationData);
      return locationData;
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        setError('Session expired. Please login again.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to save location');
      }
      // Still save to local state even if backend fails
      setLocation(locationData);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async (locationData) => {
    try {
      return await saveLocationToBackend(locationData);
    } catch (err) {
      // Error is already set in saveLocationToBackend
      throw err;
    }
  };

  const clearLocation = () => {
    setLocation(null);
    localStorage.removeItem('userLocation');
  };

  const value = {
    location,
    loading,
    error,
    updateLocation,
    clearLocation,
    setLocation // Direct setter for cases where we don't want backend sync
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
