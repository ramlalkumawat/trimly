import React, { useState, useEffect } from 'react';
import api from '../api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import CRUDForm from '../components/CRUDForm';
import Button from '../components/Button';

// Legacy services catalog page for CRUD and service visibility toggles.
export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const serviceFields = [
    {
      name: 'name',
      label: 'Service Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., Haircut'
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: [
        { value: 'hair', label: 'Hair' },
        { value: 'nails', label: 'Nails' },
        { value: 'facial', label: 'Facial' },
        { value: 'massage', label: 'Massage' },
        { value: 'makeup', label: 'Makeup' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      name: 'duration',
      label: 'Duration (minutes)',
      type: 'number',
      required: true,
      min: 15,
      max: 480,
      step: 15
    },
    {
      name: 'price',
      label: 'Price ($)',
      type: 'number',
      required: true,
      min: 0,
      step: 0.01
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 3,
      placeholder: 'Describe the service...'
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ];

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/services');
      setServices(res.data.data.services);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreate = () => {
    setSelectedService(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (service) => {
    if (window.confirm(`Are you sure you want to delete "${service.name}"?`)) {
      try {
        await api.delete(`/admin/services/${service._id}`);
        fetchServices();
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    }
  };

  const handleSubmit = async (formData) => {
    setFormLoading(true);
    setFormError(null);
    
    try {
      if (selectedService) {
        // Update existing service
        await api.put(`/admin/services/${selectedService._id}`, formData);
      } else {
        // Create new service
        await api.post('/admin/services', formData);
      }
      
      setIsFormOpen(false);
      fetchServices();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'duration', label: 'Duration' },
    { key: 'price', label: 'Price' },
    {
      key: 'status',
      label: 'Status',
      render: (status) => <StatusBadge status={status} />
    }
  ];

  const actions = [
    {
      label: 'Edit',
      onClick: handleEdit,
      variant: 'primary'
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
            <h1 className="text-4xl font-bold text-text-primary mb-2">Services Management</h1>
            <p className="text-gray-600">Manage all salon services and pricing</p>
          </div>
          <Button onClick={handleCreate}>
            Add New Service
          </Button>
        </div>

        {loading && <div>Loading services...</div>}
        {error && <div className="text-red-500 mb-4">{error}</div>}
        
        <DataTable 
          columns={columns} 
          data={services} 
          actions={actions}
          searchPlaceholder="Search services..."
        />

        <CRUDForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
          initialData={selectedService}
          fields={serviceFields}
          title={selectedService ? 'Edit Service' : 'Add New Service'}
          loading={formLoading}
          error={formError}
        />
      </div>
    </main>
  );
}
