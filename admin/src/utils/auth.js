// All storage keys used by admin auth/session flow.
// NOTE: Token is NO LONGER stored in localStorage
// Authentication is now handled via HttpOnly cookies managed by the server
const AUTH_KEYS = ['token', 'user', 'role', 'accessToken', 'refreshToken'];

// Reusable helper to remove auth keys from a specific storage object.
const clearStorageAuthKeys = (storage) => {
  AUTH_KEYS.forEach((key) => storage.removeItem(key));
};

/**
 * Clears persisted auth from both local and session storage on logout/401.
 * NOTE: HttpOnly cookies are automatically cleared by the server,
 * so we only need to clear client-side session data.
 */
export const clearAuthSession = () => {
  clearStorageAuthKeys(localStorage);
  clearStorageAuthKeys(sessionStorage);
};

/**
 * Get stored user data (if cached locally)
 * Authentication is now server-side via HttpOnly cookies,
 * so this is only used for client-side caching
 */
export const getStoredUser = () => {
  const stored = localStorage.getItem('user');
  return stored ? JSON.parse(stored) : null;
};
