import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, CheckIcon, XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/modals/Modal';
import FormInput, { FormActions } from '../../components/forms/FormInput';
import { ConfirmModal } from '../../components/modals/Modal';
import { adminAPI } from '../../utils/api';
import useToast from '../../hooks/useToast';

// Provider administration page with onboarding, verification, and status controls.
const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [filterStatus, setFilterStatus] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    businessName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    commissionRate: 10,
    services: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  const toast = useToast();

  // Fetch providers
  const fetchProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        verified: filterStatus
      };
      
      const response = await adminAPI.providers.getAll(params);
      setProviders(response.data.data.providers);
      setPagination(prev => ({
        ...prev,
        ...response.data.data.pagination
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch providers');
      toast.error('Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [pagination.page, pagination.limit, searchTerm, sortConfig, filterStatus]);

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
    
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.businessName.trim()) errors.businessName = 'Business name is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.zipCode.trim()) errors.zipCode = 'Zip code is required';
    if (formData.commissionRate < 0 || formData.commissionRate > 100) {
      errors.commissionRate = 'Commission rate must be between 0 and 100';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      businessName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      commissionRate: 10,
      services: []
    });
    setFormErrors({});
  };

  // CRUD operations
  const handleCreateProvider = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setFormLoading(true);
    try {
      await adminAPI.providers.create(formData);
      toast.success('Provider created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchProviders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create provider');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateProvider = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setFormLoading(true);
    try {
      await adminAPI.providers.update(selectedProvider._id, formData);
      toast.success('Provider updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchProviders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update provider');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProvider = async () => {
    try {
      await adminAPI.providers.delete(selectedProvider._id);
      toast.success('Provider deleted successfully');
      setShowDeleteModal(false);
      setSelectedProvider(null);
      fetchProviders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete provider');
    }
  };

  const handleVerifyProvider = async (provider, verified) => {
    try {
      await adminAPI.providers.verify(provider._id, verified);
      toast.success(`Provider ${verified ? 'approved' : 'rejected'} successfully`);
      fetchProviders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update verification status');
    }
  };

  // Modal handlers
  const openEditModal = (provider) => {
    setSelectedProvider(provider);
    setFormData({
      firstName: provider.firstName,
      lastName: provider.lastName,
      email: provider.email,
      phone: provider.phone,
      businessName: provider.businessName,
      address: provider.address,
      city: provider.city,
      state: provider.state,
      zipCode: provider.zipCode,
      commissionRate: provider.commissionRate,
      services: provider.services || []
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (provider) => {
    setSelectedProvider(provider);
    setShowDeleteModal(true);
  };

  const openViewModal = (provider) => {
    setSelectedProvider(provider);
    setShowViewModal(true);
  };

  const openDocumentsModal = (provider) => {
    setSelectedProvider(provider);
    setShowDocumentsModal(true);
  };

  // Filter options
  const filterOptions = [
    { key: 'verified', value: '', placeholder: 'All Providers', options: [
      { value: '', label: 'All Providers' },
      { value: 'true', label: 'Verified' },
      { value: 'false', label: 'Pending Verification' }
    ]}
  ];

  // Table columns
  const columns = [
    {
      key: 'businessName',
      title: 'Business',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.firstName} {row.lastName}</div>
        </div>
      )
    },
    {
      key: 'email',
      title: 'Email',
      sortable: true
    },
    {
      key: 'phone',
      title: 'Phone',
      sortable: true
    },
    {
      key: 'verified',
      title: 'Verification',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === true ? 'bg-green-100 text-green-800' : 
          value === false ? 'bg-red-100 text-red-800' : 
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value === true ? 'Verified' : value === false ? 'Rejected' : 'Pending'}
        </span>
      )
    },
    {
      key: 'commissionRate',
      title: 'Commission',
      sortable: true,
      render: (value) => `${value}%`
    },
    {
      key: 'performance',
      title: 'Performance',
      render: (value, row) => (
        <div className="text-sm">
          <div className="text-gray-900">{row.totalBookings || 0} bookings</div>
          <div className="text-gray-500">${row.totalRevenue || 0} revenue</div>
        </div>
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
            onClick={() => openDocumentsModal(row)}
            className="text-blue-600 hover:text-blue-700"
            title="View Documents"
          >
            <DocumentIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="text-amber-600 hover:text-amber-700"
            title="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          {row.verified !== true && (
            <button
              onClick={() => handleVerifyProvider(row, true)}
              className="text-green-600 hover:text-green-700"
              title="Approve"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
          )}
          {row.verified !== false && (
            <button
              onClick={() => handleVerifyProvider(row, false)}
              className="text-red-600 hover:text-red-700"
              title="Reject"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
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
          <h1 className="text-2xl font-semibold text-gray-900">Providers</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage service providers and verification status
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Provider
          </button>
        </div>
      </div>

      <div className="mt-8">
        <DataTable
          data={providers}
          columns={columns}
          loading={loading}
          error={error}
          pagination={pagination}
          onPaginationChange={setPagination}
          onSort={setSortConfig}
          onSearch={setSearchTerm}
          searchPlaceholder="Search providers..."
          showFilters={true}
          filters={filterOptions}
          onFilterChange={(key, value) => setFilterStatus(value)}
        />
      </div>

      {/* Create Provider Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Provider"
        size="lg"
      >
        <form onSubmit={handleCreateProvider}>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              error={formErrors.firstName}
              required
            />
            <FormInput
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              error={formErrors.lastName}
              required
            />
          </div>
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            error={formErrors.email}
            required
          />
          <FormInput
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            error={formErrors.phone}
            required
          />
          <FormInput
            label="Business Name"
            name="businessName"
            value={formData.businessName}
            onChange={handleInputChange}
            error={formErrors.businessName}
            required
          />
          <FormInput
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            error={formErrors.address}
            required
          />
          <div className="grid grid-cols-3 gap-4">
            <FormInput
              label="City"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              error={formErrors.city}
              required
            />
            <FormInput
              label="State"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              error={formErrors.state}
              required
            />
            <FormInput
              label="Zip Code"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              error={formErrors.zipCode}
              required
            />
          </div>
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
          <FormActions
            onCancel={() => setShowCreateModal(false)}
            loading={formLoading}
          />
        </form>
      </Modal>

      {/* Edit Provider Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Provider"
        size="lg"
      >
        <form onSubmit={handleUpdateProvider}>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              error={formErrors.firstName}
              required
            />
            <FormInput
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              error={formErrors.lastName}
              required
            />
          </div>
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            error={formErrors.email}
            required
          />
          <FormInput
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            error={formErrors.phone}
            required
          />
          <FormInput
            label="Business Name"
            name="businessName"
            value={formData.businessName}
            onChange={handleInputChange}
            error={formErrors.businessName}
            required
          />
          <FormInput
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            error={formErrors.address}
            required
          />
          <div className="grid grid-cols-3 gap-4">
            <FormInput
              label="City"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              error={formErrors.city}
              required
            />
            <FormInput
              label="State"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              error={formErrors.state}
              required
            />
            <FormInput
              label="Zip Code"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              error={formErrors.zipCode}
              required
            />
          </div>
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
        onConfirm={handleDeleteProvider}
        title="Delete Provider"
        message={`Are you sure you want to delete ${selectedProvider?.businessName}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />

      {/* View Provider Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Provider Details"
        size="lg"
      >
        {selectedProvider && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedProvider.firstName} {selectedProvider.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProvider.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProvider.phone}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProvider.businessName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedProvider.address}, {selectedProvider.city}, {selectedProvider.state} {selectedProvider.zipCode}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Commission Rate</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProvider.commissionRate}%</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Verification Status</label>
                  <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    selectedProvider.verified === true ? 'bg-green-100 text-green-800' : 
                    selectedProvider.verified === false ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedProvider.verified === true ? 'Verified' : selectedProvider.verified === false ? 'Rejected' : 'Pending'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedProvider.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedProvider.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Bookings</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProvider.totalBookings || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Revenue</label>
                  <p className="mt-1 text-sm text-gray-900">${selectedProvider.totalRevenue || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Average Rating</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProvider.averageRating || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Documents Modal */}
      <Modal
        isOpen={showDocumentsModal}
        onClose={() => setShowDocumentsModal(false)}
        title="Provider Documents"
        size="lg"
      >
        {selectedProvider && (
          <div className="space-y-4">
            {selectedProvider.documents && selectedProvider.documents.length > 0 ? (
              selectedProvider.documents.map((doc, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{doc.type}</h4>
                      <p className="text-sm text-gray-500">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 text-sm">
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-700 text-sm">
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                <p className="mt-1 text-sm text-gray-500">No documents have been uploaded yet.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Providers;
