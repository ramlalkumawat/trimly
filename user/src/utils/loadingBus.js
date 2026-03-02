let activeRequests = 0;
const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(activeRequests));
};

export const beginRequest = () => {
  activeRequests += 1;
  notify();
};

export const endRequest = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  notify();
};

export const subscribeLoading = (listener) => {
  listeners.add(listener);
  listener(activeRequests);
  return () => {
    listeners.delete(listener);
  };
};

export const hasActiveRequests = () => activeRequests > 0;
