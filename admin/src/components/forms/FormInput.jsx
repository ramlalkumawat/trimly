import React from 'react';

// Flexible form field renderer (text/select/textarea/checkbox) with error handling.
const FormInput = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  error, 
  required = false, 
  placeholder, 
  disabled = false,
  options = [],
  className = ''
}) => {
  const baseInputClasses = "admin-input";
  
  const inputClasses = `${baseInputClasses} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`;

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={inputClasses}
          >
            <option value="">{placeholder || 'Select an option'}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            disabled={disabled}
            rows={4}
            className={inputClasses}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              id={name}
              type="checkbox"
              name={name}
              checked={value}
              onChange={onChange}
              disabled={disabled}
              className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500 disabled:opacity-50"
            />
            {label && (
              <label htmlFor={name} className="ml-2 block text-sm text-slate-700">
                {label}
              </label>
            )}
          </div>
        );

      default:
        return (
          <input
            id={name}
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClasses}
          />
        );
    }
  };

  if (type === 'checkbox') {
    return (
      <div className="mb-4">
        {renderInput()}
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export const FormSection = ({ title, children }) => {
  return (
    <div className="mb-6 border-b border-slate-200 pb-6">
      <h3 className="mb-4 text-lg font-medium text-slate-900">{title}</h3>
      {children}
    </div>
  );
};

export const FormActions = ({ 
  onCancel, 
  onSubmit, 
  submitText = 'Save', 
  submitLabel,
  cancelText = 'Cancel',
  loading = false,
  disabled = false 
}) => {
  const resolvedSubmitText = submitLabel || submitText;

  return (
    <div className="flex justify-end gap-3 mt-6">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="admin-btn-secondary"
      >
        {cancelText}
      </button>
      <button
        type="submit"
        disabled={disabled || loading}
        className="admin-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
            Saving...
          </div>
        ) : (
          resolvedSubmitText
        )}
      </button>
    </div>
  );
};

export default FormInput;
