import { useCallback, useEffect, useMemo, useState } from 'react';

let toastState = [];
const listeners = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => listener(toastState));
};

const pushToast = (toast) => {
  toastState = [...toastState, toast];
  notifyListeners();
};

const removeToastById = (id) => {
  toastState = toastState.filter((toast) => toast.id !== id);
  notifyListeners();
};

const clearToasts = () => {
  toastState = [];
  notifyListeners();
};

// Shared toast state hook used across app without prop drilling.
const useToast = () => {
  const [toasts, setToasts] = useState(toastState);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  const addToast = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const newToast = {
      id,
      type: 'info',
      title: 'Notification',
      duration: 5000,
      ...toast,
    };

    pushToast(newToast);

    if (newToast.duration > 0) {
      window.setTimeout(() => removeToastById(id), newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    removeToastById(id);
  }, []);

  const success = useCallback(
    (title, message, options = {}) => addToast({ type: 'success', title, message, ...options }),
    [addToast]
  );
  const error = useCallback(
    (title, message, options = {}) =>
      addToast({ type: 'error', title, message, duration: 0, ...options }),
    [addToast]
  );
  const warning = useCallback(
    (title, message, options = {}) => addToast({ type: 'warning', title, message, ...options }),
    [addToast]
  );
  const info = useCallback(
    (title, message, options = {}) => addToast({ type: 'info', title, message, ...options }),
    [addToast]
  );

  const clearAll = useCallback(() => {
    clearToasts();
  }, []);

  return useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      success,
      error,
      warning,
      info,
      clearAll,
    }),
    [addToast, clearAll, error, info, removeToast, success, toasts, warning]
  );
};

export default useToast;
