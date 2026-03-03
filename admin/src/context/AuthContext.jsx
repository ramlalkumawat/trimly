import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../utils/api';
import { clearAuthSession, getStoredToken } from '../utils/auth';

// Auth context for admin login/session state and route guarding helpers.
export const AuthContext = createContext();

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Decode JWT token to check expiration and role
  const decodeToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      return null;
    }
  };

  // Check if token is expired
  const isTokenExpired = (token) => {
    const decoded = decodeToken(token);
    if (!decoded) return true;
    return Date.now() >= decoded.exp * 1000;
  };

  // Verify admin role
  const isAdmin = () => {
    if (!user) return false;
    return user.role === 'admin';
  };

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.auth.login(credentials);
      const { token: jwt, user: usr } = res.data.data;
      
      // Verify it's an admin user
      if (usr.role !== 'admin') {
        throw new Error('Access denied. Admin role required.');
      }
      
      localStorage.setItem('token', jwt);
      localStorage.setItem('user', JSON.stringify(usr));
      setToken(jwt);
      setUser(usr);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      if (getStoredToken()) {
        await adminAPI.auth.logout();
      }
    } catch (error) {
      // Ignore logout API failures and clear local session regardless.
    } finally {
      clearAuthSession();
      setToken(null);
      setUser(null);
      setLoading(false);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Auto-logout on token expiration
  useEffect(() => {
    if (token && isTokenExpired(token)) {
      logout();
    }
  }, [token, logout]);

  // Refresh token periodically
  useEffect(() => {
    if (!token) return undefined;

    const refreshTokenInterval = setInterval(async () => {
      if (token && !isTokenExpired(token)) {
        try {
          const res = await adminAPI.auth.refreshToken();
          const { token: newToken } = res.data.data;
          localStorage.setItem('token', newToken);
          setToken(newToken);
        } catch (error) {
          logout();
        }
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshTokenInterval);
  }, [token, logout]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const isAuthenticated = !!token && !isTokenExpired(token);

  const contextValue = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      login,
      logout,
      isAuthenticated,
      isAdmin,
      decodeToken,
    }),
    [user, token, loading, error, login, logout, isAuthenticated]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
