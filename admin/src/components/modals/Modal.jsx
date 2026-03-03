import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Modern modal components (base + confirm) used by admin CRUD pages.
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true 
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div 
          className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px] transition-opacity"
          onClick={onClose}
        />

        <div className={`relative w-full ${sizeClasses[size]} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl`}>
          <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              {showCloseButton && (
                <button
                  type="button"
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={onClose}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-4 py-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}) => {
  const typeClasses = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    success: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
    primary: 'bg-blue-700 hover:bg-blue-800 focus:ring-blue-500'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <div className="mt-2">
          <p className="text-sm text-slate-500">{message}</p>
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`inline-flex justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${typeClasses[type]}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Modal;
