// All storage keys used by admin auth/session flow.
const AUTH_KEYS = ['token', 'user', 'role', 'accessToken', 'refreshToken'];

// Reusable helper to remove auth keys from a specific storage object.
const clearStorageAuthKeys = (storage) => {
  AUTH_KEYS.forEach((key) => storage.removeItem(key));
};

// Clears persisted auth from both local and session storage on logout/401.
export const clearAuthSession = () => {
  clearStorageAuthKeys(localStorage);
  clearStorageAuthKeys(sessionStorage);
};

// Single source for reading JWT used by axios/auth context.
export const getStoredToken = () => localStorage.getItem('token');
