import React, { useState, useEffect } from 'react';
import { providerAPI } from '../api/provider';
import useToast from '../hooks/useToast';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { PulseLoader } from 'react-spinners';

// Service management page where provider can create, edit, and delete offerings.
const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    duration: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await providerAPI.getServices();
      setServices(response.data.data || []);
    } catch (error) {
      toast.error('Error', 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = () => {
    setEditingService(null);
    setFormData({
      name: '',
      category: '',
      price: '',
      duration: '',
      description: ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category,
      price: service.price,
      duration: service.duration,
      description: service.description
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      await providerAPI.deleteService(serviceId);
      toast.success('Deleted', 'Service has been deleted successfully');
      fetchServices();
    } catch (error) {
      toast.error('Error', 'Failed to delete service');
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Service name is required';
    }
    
    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }
    
    if (!formData.price || formData.price <= 0) {
      errors.price = 'Price must be greater than 0';
    }
    
    if (!formData.duration.trim()) {
      errors.duration = 'Duration is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      const serviceData = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (editingService) {
        await providerAPI.updateService(editingService._id, serviceData);
        toast.success('Updated', 'Service has been updated successfully');
      } else {
        await providerAPI.addService(serviceData);
        toast.success('Added', 'Service has been added successfully');
      }
      
      setShowModal(false);
      fetchServices();
    } catch (error) {
      toast.error('Error', `Failed to ${editingService ? 'update' : 'add'} service`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PulseLoader color="#ffcc00" size={15} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Service Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your service offerings and pricing
          </p>
        </div>
        <button
          onClick={handleAddService}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Service
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div key={service._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                  <p className="text-sm text-gray-500">{service.category}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEditService(service)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(service._id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-medium">${service.price}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{service.duration}</span>
                </div>
                <div className="flex items-start text-sm text-gray-600">
                  <TagIcon className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                  <span className="line-clamp-2">{service.description}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No services</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first service
          </p>
          <div className="mt-6">
            <button
              onClick={handleAddService}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Service
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Service Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingService ? 'Edit Service' : 'Add New Service'}
                    </h3>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-500"
                      onClick={() => setShowModal(false)}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Service Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                          formErrors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Haircut, Plumbing Repair"
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category *
                      </label>
                      <input
                        type="text"
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                          formErrors.category ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Beauty, Home Repair"
                      />
                      {formErrors.category && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                          Price ($) *
                        </label>
                        <input
                          type="number"
                          id="price"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                            formErrors.price ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="50.00"
                        />
                        {formErrors.price && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                          Duration *
                        </label>
                        <input
                          type="text"
                          id="duration"
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                            formErrors.duration ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="e.g., 30 minutes, 1 hour"
                        />
                        {formErrors.duration && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.duration}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                          formErrors.description ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Describe your service in detail..."
                      />
                      {formErrors.description && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {submitting ? (
                      <PulseLoader color="#ffffff" size={6} />
                    ) : (
                      editingService ? 'Update Service' : 'Add Service'
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
