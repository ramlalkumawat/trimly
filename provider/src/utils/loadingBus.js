// Central request counter so provider UI can show a single global loading state.
let activeRequests = 0;
const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(activeRequests));
};

// Marks request start.
export const beginRequest = () => {
  activeRequests += 1;
  notify();
};

// Marks request completion.
export const endRequest = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  notify();
};

// Allows global loader components to subscribe/unsubscribe.
export const subscribeLoading = (listener) => {
  listeners.add(listener);
  listener(activeRequests);
  return () => listeners.delete(listener);
};
