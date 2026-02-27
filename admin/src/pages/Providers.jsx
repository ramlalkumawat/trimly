import React, { useState, useEffect } from 'react';
import api from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import CRUDForm from '../components/CRUDForm';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';

// Legacy provider directory page for approvals, edits, and profile review.
export default function Providers() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const providerFields = [
    {
      name: 'name',
      label: 'Business Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., Beauty Salon Spa'
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'e.g., contact@salon.com'
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'text',
      required: true,
      placeholder: 'e.g., +1234567890'
    },
    {
      name: 'address',
      label: 'Address',
      type: 'text',
      required: true,
      placeholder: 'Full business address'
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: [
        { value: 'hair', label: 'Hair Salon' },
        { value: 'nails', label: 'Nail Salon' },
        { value: 'spa', label: 'Spa & Wellness' },
        { value: 'beauty', label: 'Beauty Studio' },
        { value: 'barber', label: 'Barber Shop' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'suspended', label: 'Suspended' }
      ]
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 3,
      placeholder: 'Describe the business...'
    },
    {
      name: 'approved',
      label: 'Approved',
      type: 'checkbox',
      checkboxLabel: 'Mark as approved'
    }
  ];

  const fetchProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/providers');
      setProviders(res.data.data.providers);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleCreate = () => {
    setSelectedProvider(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleEdit = (provider) => {
    setSelectedProvider(provider);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (provider) => {
    if (window.confirm(`Are you sure you want to delete provider "${provider.name}"?`)) {
      try {
        await api.delete(`/admin/providers/${provider._id}`);
        fetchProviders();
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    }
  };

  const handleSubmit = async (formData) => {
    setFormLoading(true);
    setFormError(null);
    
    try {
      if (selectedProvider) {
        // Update existing provider
        await api.put(`/admin/providers/${selectedProvider._id}`, formData);
      } else {
        // Create new provider
        await api.post('/admin/providers', formData);
      }
      
      setIsFormOpen(false);
      fetchProviders();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleApprove = async (provId, approved) => {
    try {
      await api.patch(`/admin/providers/${provId}`, { approved });
      fetchProviders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleView = (provider) => {
    setSelected(provider);
    setModalOpen(true);
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'status',
      label: 'Status',
      render: (status) => <StatusBadge status={status} />
    },
    { key: 'createdAt', label: 'Joined' }
  ];

  const actions = [
    {
      label: 'View',
      onClick: handleView
    },
    {
      label: 'Edit',
      onClick: handleEdit,
      variant: 'primary'
    },
    {
      label: 'Approve',
      onClick: (row) => handleApprove(row._id, true),
      variant: 'success'
    },
    {
      label: 'Reject',
      onClick: (row) => handleApprove(row._id, false),
      variant: 'danger'
    },
    {
      label: 'Delete',
      onClick: handleDelete,
      variant: 'danger'
    }
  ];

  return (
    <main className="flex-1 overflow-y-auto pt-20 pb-8">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Providers Management</h1>
            <p className="text-gray-600">Manage salon providers and business partners</p>
          </div>
          <Button onClick={handleCreate}>
            Add Provider
          </Button>
        </div>

        {loading && <div>Loading providers...</div>}
        {error && <div className="text-red-500 mb-4">{error}</div>}
        
        <DataTable 
          columns={columns} 
          data={providers} 
          actions={actions}
          searchPlaceholder="Search providers..."
        />

        <CRUDForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
          initialData={selectedProvider}
          fields={providerFields}
          title={selectedProvider ? 'Edit Provider' : 'Add New Provider'}
          loading={formLoading}
          error={formError}
        />

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Provider Details"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Close
              </Button>
            </>
          }
        >
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selected._id}`}
                  alt={selected.name}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h3 className="text-lg font-bold text-text-primary">{selected.name}</h3>
                  <StatusBadge status={selected.status} />
                </div>
              </div>

              <div className="bg-input-bg rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Email</p>
                    <p className="text-sm font-medium text-text-primary">{selected.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Phone</p>
                    <p className="text-sm font-medium text-text-primary">{selected.phone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Address</p>
                  <p className="text-sm font-medium text-text-primary">{selected.address}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Category</p>
                    <p className="text-sm font-medium text-text-primary capitalize">{selected.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Joined</p>
                    <p className="text-sm font-medium text-text-primary">{selected.createdAt}</p>
                  </div>
                </div>
                {selected.description && (
                  <div>
                    <p className="text-xs text-gray-600">Description</p>
                    <p className="text-sm font-medium text-text-primary">{selected.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Approved</p>
                    <StatusBadge status={selected.approved ? 'approved' : 'pending'} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Bookings</p>
                    <p className="text-lg font-bold text-text-primary">{selected.bookings || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </main>
  );
}
