// Tracks in-flight API requests so a global loader can show/hide consistently.
let activeRequests = 0;
const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(activeRequests));
};

// Call before a request starts.
export const beginRequest = () => {
  activeRequests += 1;
  notify();
};

// Call after a request finishes (success or error).
export const endRequest = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  notify();
};

// Allows UI components (like global spinners) to react to request count changes.
export const subscribeLoading = (listener) => {
  listeners.add(listener);
  listener(activeRequests);
  return () => listeners.delete(listener);
};
