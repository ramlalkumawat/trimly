import React, { createContext, useContext, useState, useEffect } from 'react';

// Global location state: persists in localStorage and syncs with backend when logged in.
const LocationContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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
      const url = API_BASE_URL.endsWith('/api')
        ? `${API_BASE_URL}/user/location`
        : `${API_BASE_URL}/api/user/location`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(locationData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear auth
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('user');
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to save location');
      }

      const result = await response.json();
      setLocation(locationData);
      return locationData;
    } catch (err) {
      setError(err.message);
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
