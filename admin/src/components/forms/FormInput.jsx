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
  const baseInputClasses = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed";
  
  const inputClasses = `${baseInputClasses} ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`;

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
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
              type="checkbox"
              name={name}
              checked={value}
              onChange={onChange}
              disabled={disabled}
              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded disabled:opacity-50"
            />
            {label && (
              <label className="ml-2 block text-sm text-gray-700">
                {label}
              </label>
            )}
          </div>
        );

      default:
        return (
          <input
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
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
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
    <div className="border-b border-gray-200 pb-6 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
};

export const FormActions = ({ 
  onCancel, 
  onSubmit, 
  submitText = 'Save', 
  cancelText = 'Cancel',
  loading = false,
  disabled = false 
}) => {
  return (
    <div className="flex justify-end gap-3 mt-6">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
      >
        {cancelText}
      </button>
      <button
        type="submit"
        disabled={disabled || loading}
        className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Saving...
          </div>
        ) : (
          submitText
        )}
      </button>
    </div>
  );
};

export default FormInput;
