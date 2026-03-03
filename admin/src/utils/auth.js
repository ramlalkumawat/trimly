const AUTH_KEYS = ['token', 'user', 'role'];

export const clearAuthSession = () => {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const getStoredToken = () => localStorage.getItem('token');
