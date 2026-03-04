const AUTH_KEYS = ['token', 'user', 'role', 'accessToken', 'refreshToken'];

const clearStorageAuthKeys = (storage) => {
  AUTH_KEYS.forEach((key) => storage.removeItem(key));
};

export const clearAuthSession = () => {
  clearStorageAuthKeys(localStorage);
  clearStorageAuthKeys(sessionStorage);
};

export const getStoredToken = () => localStorage.getItem('token');
