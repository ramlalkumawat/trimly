import React, { useEffect } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Toast UI primitives plus container for stackable feedback messages.
const Toast = ({ toast, onRemove }) => {
  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.id, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <ExclamationCircleIcon className="h-6 w-6 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-emerald-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-amber-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-slate-800';
    }
  };

  return (
    <div
      className={`pointer-events-auto w-full max-w-sm transform rounded-2xl border ${getBackgroundColor()} shadow-lg transition-all duration-300 ease-out`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="w-0 flex-1">
            <p className={`text-sm font-medium ${getTextColor()}`}>
              {toast.message}
            </p>
          </div>
          <div className="ml-2 flex flex-shrink-0">
            <button
              className={`inline-flex rounded-md ${getTextColor()} transition hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1`}
              onClick={() => onRemove(toast.id)}
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[110] space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

export { ToastContainer };
export default Toast;
