import { useCallback, useEffect, useState } from 'react';

let toastStore = [];
const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(toastStore));
};

const subscribe = (listener) => {
  listeners.add(listener);
  listener(toastStore);
  return () => listeners.delete(listener);
};

const pushToast = (message, type = 'success', duration = 3500) => {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  toastStore = [...toastStore, { id, message, type, duration }];
  notify();

  if (duration > 0) {
    window.setTimeout(() => {
      toastStore = toastStore.filter((toast) => toast.id !== id);
      notify();
    }, duration);
  }

  return id;
};

const removeToastById = (id) => {
  toastStore = toastStore.filter((toast) => toast.id !== id);
  notify();
};

const clearToasts = () => {
  toastStore = [];
  notify();
};

// Global toast store hook so any page can dispatch toasts and a single container can render them.
const useToast = () => {
  const [toasts, setToasts] = useState(toastStore);

  useEffect(() => subscribe(setToasts), []);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    return pushToast(message, type, duration);
  }, []);

  const removeToast = useCallback((id) => {
    removeToastById(id);
  }, []);

  const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
  const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
  const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

  const clearAll = useCallback(() => {
    clearToasts();
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll,
  };
};

export default useToast;
