import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/modals/Modal';
import FormInput, { FormActions } from '../../components/forms/FormInput';
import { ConfirmModal } from '../../components/modals/Modal';
import { adminAPI } from '../../utils/api';
import useToast from '../../hooks/useToast';

// Service catalog management page for creating/editing/removing offerings.
const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    duration: 30,
    commissionRate: 10,
    status: 'active',
    imageUrl: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  const toast = useToast();

  // Categories
  const categories = [
    { value: 'haircut', label: 'Haircut' },
    { value: 'styling', label: 'Styling' },
    { value: 'coloring', label: 'Coloring' },
    { value: 'treatment', label: 'Treatment' },
    { value: 'beard', label: 'Beard & Mustache' },
    { value: 'shave', label: 'Shave' },
    { value: 'facial', label: 'Facial' },
    { value: 'massage', label: 'Massage' },
    { value: 'other', label: 'Other' }
  ];

  // Fetch services
  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        category: filterCategory,
        status: filterStatus
      };
      
      const response = await adminAPI.services.getAll(params);
      setServices(response.data.data.services);
      setPagination(prev => ({
        ...prev,
        ...response.data.data.pagination
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch services');
      toast.addToast('Failed to fetch services', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [pagination.page, pagination.limit, searchTerm, sortConfig, filterCategory, filterStatus]);

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseFloat(value) || 0 : value 
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Service name is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.category) errors.category = 'Category is required';
    if (formData.price < 0) errors.price = 'Price must be positive';
    if (formData.duration <= 0) errors.duration = 'Duration must be positive';
    if (formData.commissionRate < 0 || formData.commissionRate > 100) {
      errors.commissionRate = 'Commission rate must be between 0 and 100';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: 0,
      duration: 30,
      commissionRate: 10,
      status: 'active',
      imageUrl: ''
    });
    setFormErrors({});
  };

  // CRUD operations
  const handleCreateService = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setFormLoading(true);
    try {
      await adminAPI.services.create(formData);
      toast.addToast('Service created successfully', 'success');
      setShowCreateModal(false);
      resetForm();
      fetchServices();
    } catch (err) {
      toast.addToast(err.response?.data?.message || 'Failed to create service', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setFormLoading(true);
    try {
      await adminAPI.services.update(selectedService._id, formData);
      toast.addToast('Service updated successfully', 'success');
      setShowEditModal(false);
      resetForm();
      fetchServices();
    } catch (err) {
      toast.addToast(err.response?.data?.message || 'Failed to update service', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteService = async () => {
    try {
      await adminAPI.services.delete(selectedService._id);
      toast.addToast('Service deleted successfully', 'success');
      setShowDeleteModal(false);
      setSelectedService(null);
      fetchServices();
    } catch (err) {
      toast.addToast(err.response?.data?.message || 'Failed to delete service', 'error');
    }
  };

  const handleToggleStatus = async (service) => {
    try {
      const newStatus = service.status === 'active' ? 'inactive' : 'active';
      await adminAPI.services.update(service._id, { ...service, status: newStatus });
      toast.addToast(`Service ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
      fetchServices();
    } catch (err) {
      toast.addToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  // Modal handlers
  const openEditModal = (service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category,
      price: service.price,
      duration: service.duration,
      commissionRate: service.commissionRate,
      status: service.status,
      imageUrl: service.imageUrl || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (service) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  const openViewModal = (service) => {
    setSelectedService(service);
    setShowViewModal(true);
  };

  // Filter options
  const filterOptions = [
    {
      key: 'category',
      value: filterCategory,
      placeholder: 'All Categories',
      options: [
        { value: '', label: 'All Categories' },
        ...categories
      ]
    },
    {
      key: 'status',
      value: filterStatus,
      placeholder: 'All Status',
      options: [
        { value: '', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ];

  // Table columns
  const columns = [
    {
      key: 'name',
      title: 'Service Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center">
          {row.imageUrl && (
            <img
              src={row.imageUrl}
              alt={value}
              className="h-10 w-10 rounded-full mr-3 object-cover"
            />
          )}
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{row.category}</div>
          </div>
        </div>
      )
    },
    {
      key: 'description',
      title: 'Description',
      sortable: false,
      render: (value) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'price',
      title: 'Price',
      sortable: true,
      render: (value) => `$${value.toFixed(2)}`
    },
    {
      key: 'duration',
      title: 'Duration',
      sortable: true,
      render: (value) => `${value} min`
    },
    {
      key: 'commissionRate',
      title: 'Commission',
      sortable: true,
      render: (value) => `${value}%`
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openViewModal(row)}
            className="text-gray-400 hover:text-gray-600"
            title="View Details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="text-amber-600 hover:text-amber-700"
            title="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(row)}
            className={`${
              row.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
            }`}
            title={row.status === 'active' ? 'Deactivate' : 'Activate'}
          >
            {row.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className="text-red-600 hover:text-red-700"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all services offered on the platform
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Service
          </button>
        </div>
      </div>

      <div className="mt-8">
        <DataTable
          data={services}
          columns={columns}
          loading={loading}
          error={error}
          pagination={pagination}
          onPaginationChange={setPagination}
          onSort={setSortConfig}
          onSearch={setSearchTerm}
          searchPlaceholder="Search services..."
          showFilters={true}
          filters={filterOptions}
          onFilterChange={(key, value) => {
            if (key === 'category') setFilterCategory(value);
            if (key === 'status') setFilterStatus(value);
          }}
        />
      </div>

      {/* Create Service Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Service"
        size="md"
      >
        <form onSubmit={handleCreateService}>
          <FormInput
            label="Service Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={formErrors.name}
            required
          />
          <FormInput
            label="Description"
            name="description"
            type="textarea"
            value={formData.description}
            onChange={handleInputChange}
            error={formErrors.description}
            required
          />
          <FormInput
            label="Category"
            name="category"
            type="select"
            value={formData.category}
            onChange={handleInputChange}
            error={formErrors.category}
            options={categories}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Price ($)"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
              error={formErrors.price}
              min="0"
              step="0.01"
              required
            />
            <FormInput
              label="Duration (minutes)"
              name="duration"
              type="number"
              value={formData.duration}
              onChange={handleInputChange}
              error={formErrors.duration}
              min="1"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Commission Rate (%)"
              name="commissionRate"
              type="number"
              value={formData.commissionRate}
              onChange={handleInputChange}
              error={formErrors.commissionRate}
              min="0"
              max="100"
              step="0.1"
            />
            <FormInput
              label="Status"
              name="status"
              type="select"
              value={formData.status}
              onChange={handleInputChange}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />
          </div>
          <FormInput
            label="Image URL"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleInputChange}
            placeholder="https://example.com/image.jpg"
          />
          <FormActions
            onCancel={() => setShowCreateModal(false)}
            loading={formLoading}
          />
        </form>
      </Modal>

      {/* Edit Service Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Service"
        size="md"
      >
        <form onSubmit={handleUpdateService}>
          <FormInput
            label="Service Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={formErrors.name}
            required
          />
          <FormInput
            label="Description"
            name="description"
            type="textarea"
            value={formData.description}
            onChange={handleInputChange}
            error={formErrors.description}
            required
          />
          <FormInput
            label="Category"
            name="category"
            type="select"
            value={formData.category}
            onChange={handleInputChange}
            error={formErrors.category}
            options={categories}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Price ($)"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
              error={formErrors.price}
              min="0"
              step="0.01"
              required
            />
            <FormInput
              label="Duration (minutes)"
              name="duration"
              type="number"
              value={formData.duration}
              onChange={handleInputChange}
              error={formErrors.duration}
              min="1"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Commission Rate (%)"
              name="commissionRate"
              type="number"
              value={formData.commissionRate}
              onChange={handleInputChange}
              error={formErrors.commissionRate}
              min="0"
              max="100"
              step="0.1"
            />
            <FormInput
              label="Status"
              name="status"
              type="select"
              value={formData.status}
              onChange={handleInputChange}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />
          </div>
          <FormInput
            label="Image URL"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleInputChange}
            placeholder="https://example.com/image.jpg"
          />
          <FormActions
            onCancel={() => setShowEditModal(false)}
            loading={formLoading}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteService}
        title="Delete Service"
        message={`Are you sure you want to delete ${selectedService?.name}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />

      {/* View Service Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Service Details"
        size="md"
      >
        {selectedService && (
          <div className="space-y-4">
            {selectedService.imageUrl && (
              <div className="flex justify-center">
                <img
                  src={selectedService.imageUrl}
                  alt={selectedService.name}
                  className="h-32 w-32 rounded-lg object-cover"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Service Name</label>
              <p className="mt-1 text-sm text-gray-900">{selectedService.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <p className="mt-1 text-sm text-gray-900">{selectedService.description}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <p className="mt-1 text-sm text-gray-900">{selectedService.category}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <p className="mt-1 text-sm text-gray-900">${selectedService.price.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration</label>
                <p className="mt-1 text-sm text-gray-900">{selectedService.duration} minutes</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Commission Rate</label>
                <p className="mt-1 text-sm text-gray-900">{selectedService.commissionRate}%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  selectedService.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedService.status}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Created</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(selectedService.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Updated</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(selectedService.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Services;
