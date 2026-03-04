// Shared request counter used to drive full-page/global loading indicators.
let activeRequests = 0;
const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(activeRequests));
};

// Increments active request count when an API call starts.
export const beginRequest = () => {
  activeRequests += 1;
  notify();
};

// Decrements active request count when an API call completes.
export const endRequest = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  notify();
};

// Subscribes UI listeners to loader count changes.
export const subscribeLoading = (listener) => {
  listeners.add(listener);
  listener(activeRequests);
  return () => {
    listeners.delete(listener);
  };
};

// Convenience accessor for quick checks.
export const hasActiveRequests = () => activeRequests > 0;
