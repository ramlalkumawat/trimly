import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { providerAPI } from '../api/provider';
import socketService from '../../../shared/socketService';

// Auth/session state container for provider login, profile, and socket lifecycle.
const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        provider: { 
          ...action.payload.provider, 
          isAvailable: action.payload.provider?.status === 'active' // Map status to isAvailable
        },
        token: action.payload.token,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        loading: false,
        provider: null,
        token: null,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        loading: false,
        provider: null,
        token: null,
        error: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        provider: { 
          ...state.provider, 
          ...action.payload,
          isAvailable: action.payload.status === 'active' ? true : action.payload.isAvailable ?? state.provider?.isAvailable
        }
      };
    case 'SET_AVAILABILITY':
      return {
        ...state,
        provider: { ...state.provider, isAvailable: action.payload }
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  loading: true,
  provider: null,
  token: localStorage.getItem('providerToken'),
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    const initAuth = async () => {
      console.log('Initializing auth...');
      const token = localStorage.getItem('providerToken');
      console.log('Token found:', !!token);
      
      // Clear any cached provider data to ensure fresh load
      localStorage.removeItem('providerData');
      
      if (token) {
        try {
          console.log('Fetching user profile...');
          // Add cache-busting timestamp
          const timestamp = Date.now();
          const response = await providerAPI.getProfile();
          console.log('Profile response:', response.data);
          
          const providerData = response.data.data;
          console.log('Provider data:', providerData);
          console.log('Provider status field:', providerData?.status);
          console.log('Mapped isAvailable:', providerData?.status === 'active');
          
          // Store in localStorage with timestamp for debugging
          localStorage.setItem('providerData', JSON.stringify({
            ...providerData,
            cachedAt: timestamp
          }));
          
          // Set user in socket service for real-time features
          socketService.setUser(providerData);
          
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              provider: providerData,
              token
            }
          });
          console.log('Auth successful - Provider status:', providerData?.status, 'mapped to isAvailable:', providerData?.status === 'active');
        } catch (error) {
          console.error('Auth error:', error);
          localStorage.removeItem('providerToken');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        console.log('No token found, setting loading to false');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, []); // Empty dependency array - run only once

  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await providerAPI.login(credentials);
      const { token, user } = response.data.data;
      
      localStorage.setItem('providerToken', token);
      
      // Set user in socket service for real-time features
      socketService.setUser(user);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { provider: user, token }
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('providerToken');
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = (profileData) => {
    dispatch({
      type: 'UPDATE_PROFILE',
      payload: profileData
    });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const toggleAvailability = async (isAvailable) => {
    console.log('Toggle availability called with:', isAvailable);
    console.log('Current provider state:', state.provider);
    
    try {
      // Update state immediately for instant UI feedback
      dispatch({
        type: 'SET_AVAILABILITY',
        payload: isAvailable
      });

      console.log('State updated to:', isAvailable);

      // Emit socket event for real-time updates
      socketService.updateAvailability(isAvailable);

      // Update on backend
      console.log('Calling API to update availability...');
      await providerAPI.toggleAvailability(isAvailable);
      console.log('API call successful');
      
      return { success: true };
    } catch (error) {
      console.error('Availability toggle error:', error);
      console.error('Error response:', error.response);
      
      // Don't revert immediately - let the user know there's an issue
      // but keep the UI state as the user intended
      const errorMessage = error.response?.data?.message || 'Failed to update availability on server';
      
      // Show error but don't revert the state
      // The user can try again if needed
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    ...state,
    login,
    logout,
    updateProfile,
    clearError,
    toggleAvailability
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
