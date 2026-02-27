import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';

// Dynamic create/update form rendered inside modal from field metadata.
const CRUDForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, 
  fields = [], 
  title = 'Form',
  loading = false,
  error = null
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const initialFormData = {};
      fields.forEach(field => {
        initialFormData[field.name] = field.defaultValue || '';
      });
      setFormData(initialFormData);
    }
    setErrors({});
  }, [initialData, fields]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    fields.forEach(field => {
      if (field.required && (!formData[field.name] || formData[field.name].trim() === '')) {
        newErrors[field.name] = `${field.label} is required`;
      }
      
      if (field.type === 'email' && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name])) {
          newErrors[field.name] = 'Please enter a valid email address';
        }
      }
      
      if (field.type === 'number' && formData[field.name]) {
        const num = Number(formData[field.name]);
        if (isNaN(num)) {
          newErrors[field.name] = 'Please enter a valid number';
        } else if (field.min !== undefined && num < field.min) {
          newErrors[field.name] = `Minimum value is ${field.min}`;
        } else if (field.max !== undefined && num > field.max) {
          newErrors[field.name] = `Maximum value is ${field.max}`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderField = (field) => {
    const commonProps = {
      id: field.name,
      value: formData[field.name] || '',
      onChange: (e) => handleChange(field.name, e.target.value),
      className: `w-full px-4 py-2 bg-input-bg border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary placeholder-gray-500 ${
        errors[field.name] ? 'border-red-500 focus:ring-red-500' : ''
      }`,
      placeholder: field.placeholder || `Enter ${field.label.toLowerCase()}`,
      disabled: loading
    };

    switch (field.type) {
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={field.rows || 3}
          />
        );
      
      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step || 'any'}
          />
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={field.name}
              checked={formData[field.name] || false}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              className="mr-2"
              disabled={loading}
            />
            <label htmlFor={field.name} className="text-sm text-text-primary">
              {field.checkboxLabel || field.label}
            </label>
          </div>
        );
      
      default:
        return (
          <input
            {...commonProps}
            type={field.type || 'text'}
          />
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={field.size || 'md'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {fields.map(field => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-text-primary mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
            {errors[field.name] && (
              <p className="mt-1 text-sm text-red-500">{errors[field.name]}</p>
            )}
            {field.description && (
              <p className="mt-1 text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        ))}
      </form>
    </Modal>
  );
};

export default CRUDForm;
