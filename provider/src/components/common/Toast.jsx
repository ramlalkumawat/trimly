import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

// Toast primitives and container used for in-app feedback messages.
const Toast = ({ toast, onRemove }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-sky-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-100';
      case 'error':
        return 'bg-rose-50 border-rose-100';
      case 'warning':
        return 'bg-amber-50 border-amber-100';
      default:
        return 'bg-sky-50 border-sky-100';
    }
  };

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-emerald-900';
      case 'error':
        return 'text-rose-900';
      case 'warning':
        return 'text-amber-900';
      default:
        return 'text-sky-900';
    }
  };

  return (
    <div className={`
      w-full max-w-sm overflow-hidden rounded-2xl border p-4 shadow-lg pointer-events-auto
      ${getBackgroundColor()}
    `}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className={`text-sm font-medium ${getTextColor()}`}>
            {toast.title}
          </p>
          {toast.message && (
            <p className={`mt-1 text-sm ${getTextColor()} opacity-90`}>
              {toast.message}
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className={`inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${getTextColor()} hover:opacity-75`}
            onClick={() => onRemove(toast.id)}
          >
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[60] space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

export { Toast, ToastContainer };
