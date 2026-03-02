import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { providerAPI } from '../api/provider';
import socketService from '../utils/socket';

// Auth/session state container for provider login, profile, and availability state.
const AuthContext = createContext();

const normalizeProvider = (provider = {}) => {
  const providerId = provider._id || provider.id || null;
  return {
    ...provider,
    _id: providerId,
    id: providerId,
    isAvailable:
      typeof provider.isAvailable === 'boolean' ? provider.isAvailable : provider.status === 'active',
  };
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        provider: normalizeProvider(action.payload.provider),
        token: action.payload.token,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        loading: false,
        provider: null,
        token: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        loading: false,
        provider: null,
        token: null,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        provider: normalizeProvider({
          ...(state.provider || {}),
          ...action.payload,
        }),
      };
    case 'SET_AVAILABILITY':
      return {
        ...state,
        provider: {
          ...(state.provider || {}),
          isAvailable: action.payload,
        },
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
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
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initAuth = async () => {
      const token = localStorage.getItem('providerToken');

      if (token) {
        try {
          const response = await providerAPI.getProfile();
          const providerData = normalizeProvider(response?.data?.data || {});

          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              provider: providerData,
              token,
            },
          });
        } catch (error) {
          localStorage.removeItem('providerToken');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await providerAPI.login(credentials);
      const { token, user } = response.data.data;

      localStorage.setItem('providerToken', token);
      let providerData = normalizeProvider(user);

      try {
        const profileResponse = await providerAPI.getProfile();
        if (profileResponse?.data?.data) {
          providerData = normalizeProvider(profileResponse.data.data);
        }
      } catch (profileError) {
        // Fallback to login payload when profile fetch fails.
      }

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { provider: providerData, token },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('providerToken');
    socketService.disconnect();
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = (profileData) => {
    dispatch({
      type: 'UPDATE_PROFILE',
      payload: profileData,
    });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const toggleAvailability = async (isAvailable) => {
    const previousAvailability = state.provider?.isAvailable;

    try {
      dispatch({
        type: 'SET_AVAILABILITY',
        payload: isAvailable,
      });

      socketService.updateAvailability(isAvailable);
      const response = await providerAPI.toggleAvailability(isAvailable);
      const resolvedAvailability =
        typeof response?.data?.data?.isAvailable === 'boolean'
          ? response.data.data.isAvailable
          : isAvailable;

      dispatch({
        type: 'SET_AVAILABILITY',
        payload: resolvedAvailability,
      });

      socketService.updateAvailability(resolvedAvailability);
      return { success: true };
    } catch (error) {
      if (typeof previousAvailability === 'boolean') {
        dispatch({
          type: 'SET_AVAILABILITY',
          payload: previousAvailability,
        });
      }

      const errorMessage =
        error.response?.data?.message || 'Failed to update availability on server';
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    ...state,
    login,
    logout,
    updateProfile,
    clearError,
    toggleAvailability,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
