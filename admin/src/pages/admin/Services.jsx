import React, { useEffect, useState } from 'react';
import {
  EyeIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import DataTable from '../../components/tables/DataTable';
import Modal, { ConfirmModal } from '../../components/modals/Modal';
import FormInput, { FormActions } from '../../components/forms/FormInput';
import { adminAPI } from '../../utils/api';
import useToast from '../../hooks/useToast';

const categories = [
  { value: 'haircut', label: 'Haircut' },
  { value: 'styling', label: 'Styling' },
  { value: 'coloring', label: 'Coloring' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'beard', label: 'Beard & Mustache' },
  { value: 'shave', label: 'Shave' },
  { value: 'facial', label: 'Facial' },
  { value: 'massage', label: 'Massage' },
  { value: 'other', label: 'Other' },
];

const initialFormState = {
  name: '',
  description: '',
  category: '',
  price: 0,
  duration: 30,
  commissionRate: 10,
  status: 'active',
  imageUrl: '',
};

// Services administration with searchable catalog table and CRUD modals.
const Services = () => {
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.services.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        category: filterCategory,
        status: filterStatus,
      });

      setServices(response?.data?.data?.services || []);
      setPagination((prev) => ({
        ...prev,
        ...(response?.data?.data?.pagination || {}),
      }));
    } catch (requestError) {
      const message = requestError?.response?.data?.message || 'Failed to fetch services.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [pagination.page, pagination.limit, searchTerm, sortConfig, filterCategory, filterStatus]);

  const resetForm = () => {
    setFormData(initialFormState);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Service name is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.category) errors.category = 'Category is required';
    if (Number(formData.price) < 0) errors.price = 'Price should be positive';
    if (Number(formData.duration) <= 0) errors.duration = 'Duration must be greater than 0';
    if (Number(formData.commissionRate) < 0 || Number(formData.commissionRate) > 100) {
      errors.commissionRate = 'Commission rate should be between 0 and 100';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (event) => {
    const { name, value, type } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCreateService = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      await adminAPI.services.create(formData);
      toast.success('Service created successfully.');
      setShowCreateModal(false);
      resetForm();
      fetchServices();
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to create service.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateService = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      await adminAPI.services.update(selectedService._id, formData);
      toast.success('Service updated successfully.');
      setShowEditModal(false);
      resetForm();
      fetchServices();
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to update service.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService?._id) return;
    try {
      await adminAPI.services.delete(selectedService._id);
      toast.success('Service deleted successfully.');
      setShowDeleteModal(false);
      setSelectedService(null);
      fetchServices();
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to delete service.');
    }
  };

  const handleToggleStatus = async (service) => {
    try {
      const nextStatus = service.status === 'active' ? 'inactive' : 'active';
      await adminAPI.services.update(service._id, { ...service, status: nextStatus });
      toast.success(`Service marked as ${nextStatus}.`);
      fetchServices();
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to update status.');
    }
  };

  const openEditModal = (service) => {
    setSelectedService(service);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      category: service.category || '',
      price: Number(service.price || 0),
      duration: Number(service.duration || 30),
      commissionRate: Number(service.commissionRate || 10),
      status: service.status || 'active',
      imageUrl: service.imageUrl || '',
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openViewModal = (service) => {
    setSelectedService(service);
    setShowViewModal(true);
  };

  const openDeleteModal = (service) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  const filters = [
    {
      key: 'category',
      value: filterCategory,
      options: [{ value: '', label: 'All Categories' }, ...categories],
    },
    {
      key: 'status',
      value: filterStatus,
      options: [
        { value: '', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  ];

  const columns = [
    {
      key: 'name',
      title: 'Service',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {row.imageUrl ? (
              <img src={row.imageUrl} alt={row.name} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-[170px]">
            <p className="font-semibold text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.category || 'other'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      render: (value) => (
        <p className="max-w-[260px] truncate text-sm text-slate-600" title={value}>
          {value}
        </p>
      ),
    },
    {
      key: 'price',
      title: 'Price',
      sortable: true,
      render: (value) => `₹${Number(value || 0).toFixed(2)}`,
    },
    {
      key: 'duration',
      title: 'Duration',
      sortable: true,
      render: (value) => `${value || 0} min`,
    },
    {
      key: 'commissionRate',
      title: 'Commission',
      sortable: true,
      render: (value) => `${value || 0}%`,
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            value === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {value === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => openViewModal(row)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50"
            title="View"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="rounded-lg border border-blue-200 p-1.5 text-blue-700 transition hover:bg-blue-50"
            title="Edit"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleToggleStatus(row)}
            className={`rounded-lg border px-2 py-1 text-xs font-semibold transition ${
              row.status === 'active'
                ? 'border-red-200 text-red-700 hover:bg-red-50'
                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {row.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            type="button"
            onClick={() => openDeleteModal(row)}
            className="rounded-lg border border-red-200 p-1.5 text-red-700 transition hover:bg-red-50"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="admin-section-title">Services</h1>
          <p className="admin-section-subtitle">Maintain service catalog, pricing and commission rates.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="admin-btn-primary w-full sm:w-auto"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Service
        </button>
      </section>

      <DataTable
        data={services}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        onPaginationChange={setPagination}
        onSort={setSortConfig}
        onSearch={setSearchTerm}
        showFilters
        filters={filters}
        onFilterChange={(key, value) => {
          if (key === 'category') setFilterCategory(value);
          if (key === 'status') setFilterStatus(value);
        }}
        searchPlaceholder="Search service name or description..."
      />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Service" size="lg">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Price (₹)"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                { value: 'inactive', label: 'Inactive' },
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
          <FormActions onCancel={() => setShowCreateModal(false)} loading={formLoading} />
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Service" size="lg">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Price (₹)"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                { value: 'inactive', label: 'Inactive' },
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
          <FormActions onCancel={() => setShowEditModal(false)} loading={formLoading} />
        </form>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteService}
        title="Delete Service"
        message={`Are you sure you want to delete "${selectedService?.name || ''}"?`}
        confirmText="Delete Service"
        type="danger"
      />

      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Service Details" size="md">
        {selectedService ? (
          <div className="space-y-4">
            {selectedService.imageUrl ? (
              <div className="h-40 overflow-hidden rounded-2xl border border-slate-200">
                <img src={selectedService.imageUrl} alt={selectedService.name} className="h-full w-full object-cover" />
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Service</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedService.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Category</p>
                <p className="mt-1 text-sm text-slate-700">{selectedService.category}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Price</p>
                <p className="mt-1 text-sm text-slate-700">₹{Number(selectedService.price || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Duration</p>
                <p className="mt-1 text-sm text-slate-700">{selectedService.duration} minutes</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Description</p>
              <p className="mt-1 text-sm text-slate-700">{selectedService.description}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default Services;
