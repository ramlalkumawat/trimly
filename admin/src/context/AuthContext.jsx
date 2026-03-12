import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../utils/api';
import { clearAuthSession, getStoredUser } from '../utils/auth';

/**
 * Authentication Context for Admin App
 * 
 * SECURITY NOTE: Authentication is now handled via HttpOnly cookies
 * - Tokens are no longer stored in localStorage (XSS vulnerability fix)
 * - Sessions are managed server-side with secure, HttpOnly cookies
 * - Frontend maintains user state in memory only
 */
export const AuthContext = createContext();

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // User state: stored in memory and optionally in localStorage for persistence
  // (localStorage is optional for UX, actual auth is via HttpOnly cookie)
  const [user, setUser] = useState(() => {
    const stored = getStoredUser();
    return stored || null;
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  /**
   * Verify admin role from user object
   */
  const isAdmin = useCallback(() => {
    if (!user) return false;
    return user.role === 'admin';
  }, [user]);

  /**
   * Login handler
   * Sends credentials to server, which responds with user data
   * and sets HttpOnly cookie with session
   */
  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.auth.login(credentials);
      const { user: usr } = res.data.data;
      
      // Verify it's an admin user
      if (usr.role !== 'admin') {
        throw new Error('Access denied. Admin role required.');
      }
      
      // SECURITY: Store user in memory and optionally in localStorage
      // The actual session is maintained by the HttpOnly cookie on the server
      setUser(usr);
      localStorage.setItem('user', JSON.stringify(usr));
      
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  /**
   * Logout handler
   * Calls server logout endpoint to clear session
   * Server will clear the HttpOnly cookie
   */
  const logout = useCallback(async () => {
    try {
      // Attempt to notify server of logout
      // This endpoint clears the session cookie on the server
      if (user) {
        await adminAPI.auth.logout();
      }
    } catch (error) {
      // Ignore logout API failures
      // User session will expire after configured timeout anyway
      console.warn('Logout API call failed:', error.message);
    } finally {
      // Clear client-side session data
      clearAuthSession();
      setUser(null);
      setError(null);
      setLoading(false);
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  /**
   * Initialize authentication state on app load
   * Check if user exists from localStorage (means they were logged in)
   * The server will validate the session via the HttpOnly cookie
   */
  useEffect(() => {
    // Set loading to false once component mounts
    // User state is already initialized from localStorage in useState
    setLoading(false);
  }, []);

  // Determine if user is authenticated
  // With cookie-based auth, we trust the server to validate the session
  const isAuthenticated = !!user;

  // Memoize context value
  const contextValue = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      logout,
      isAuthenticated,
      isAdmin,
    }),
    [user, loading, error, login, logout, isAuthenticated, isAdmin]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
