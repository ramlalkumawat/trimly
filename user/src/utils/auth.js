const AUTH_STORAGE_KEYS = ['token', 'role', 'user', 'providerToken'];

export function clearAuthSession() {
  AUTH_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
}

export function getAuthSnapshot() {
  return {
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
  };
}
