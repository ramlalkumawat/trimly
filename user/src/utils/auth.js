// Keys that may hold auth/session state for customer and cross-panel sessions.
const AUTH_STORAGE_KEYS = ['token', 'role', 'user', 'providerToken'];

// Clears persisted auth data when user logs out or token becomes invalid.
export function clearAuthSession() {
  AUTH_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
}

// Returns minimal auth info consumed by protected-route checks.
export function getAuthSnapshot() {
  return {
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
  };
}
