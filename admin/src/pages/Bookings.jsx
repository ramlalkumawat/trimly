import React, { useState, useEffect } from 'react';
import api from '../api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import CRUDForm from '../components/CRUDForm';
import Button from '../components/Button';
import Modal from '../components/Modal';

// Legacy bookings management page with table, filters, and edit/status actions.
export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);

  const bookingFields = [
    {
      name: 'user',
      label: 'User',
      type: 'select',
      required: true,
      options: users.map(user => ({ value: user._id, label: user.name }))
    },
    {
      name: 'provider',
      label: 'Provider',
      type: 'select',
      required: true,
      options: providers.map(provider => ({ value: provider._id, label: provider.name }))
    },
    {
      name: 'service',
      label: 'Service',
      type: 'select',
      required: true,
      options: services.map(service => ({ value: service._id, label: service.name }))
    },
    {
      name: 'date',
      label: 'Date',
      type: 'date',
      required: true
    },
    {
      name: 'time',
      label: 'Time',
      type: 'text',
      required: true,
      placeholder: 'e.g., 10:00 AM'
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'no_show', label: 'No Show' }
      ]
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      rows: 3,
      placeholder: 'Additional notes...'
    }
  ];

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/bookings', { params: { date: dateFilter } });
      setBookings(res.data.data.bookings);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [usersRes, providersRes, servicesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/providers'),
        api.get('/admin/services')
      ]);
      setUsers(usersRes.data.data.users || []);
      setProviders(providersRes.data.data.providers || []);
      setServices(servicesRes.data.data.services || []);
    } catch (err) {
      console.error('Failed to fetch dropdown data:', err);
    }
  };

  useEffect(() => {
    fetch();
    fetchDropdownData();
  }, [dateFilter]);

  const handleCreate = () => {
    setSelectedBooking(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleEdit = (booking) => {
    setSelectedBooking(booking);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleView = (booking) => {
    setSelectedBooking(booking);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (booking) => {
    if (window.confirm(`Are you sure you want to delete this booking?`)) {
      try {
        await api.delete(`/admin/bookings/${booking._id}`);
        fetch();
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    }
  };

  const handleSubmit = async (formData) => {
    setFormLoading(true);
    setFormError(null);
    
    try {
      if (selectedBooking) {
        // Update existing booking
        await api.put(`/admin/bookings/${selectedBooking._id}`, formData);
      } else {
        // Create new booking
        await api.post('/admin/bookings', formData);
      }
      
      setIsFormOpen(false);
      fetch();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (booking, status) => {
    try {
      await api.patch(`/admin/bookings/${booking._id}`, { status });
      fetch();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { key: 'user', label: 'User' },
    { key: 'provider', label: 'Provider' },
    { key: 'service', label: 'Service' },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    {
      key: 'status',
      label: 'Status',
      render: (status) => <StatusBadge status={status} />
    }
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
      label: 'Complete',
      onClick: (row) => handleStatusChange(row, 'completed'),
      variant: 'success'
    },
    {
      label: 'Cancel',
      onClick: (row) => handleStatusChange(row, 'cancelled'),
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
            <h1 className="text-4xl font-bold text-text-primary mb-2">Bookings Management</h1>
            <p className="text-gray-600">Manage all salon appointments and schedules</p>
          </div>
          <Button onClick={handleCreate}>
            Create Booking
          </Button>
        </div>

        <div className="mb-4">
          <label className="mr-2">Filter by date:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-default"
          />
        </div>

        {loading && <div>Loading bookings...</div>}
        {error && <div className="text-red-500 mb-4">{error}</div>}
        
        <DataTable 
          columns={columns} 
          data={bookings} 
          actions={actions}
          searchPlaceholder="Search bookings..."
        />

        <CRUDForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
          initialData={selectedBooking}
          fields={bookingFields}
          title={selectedBooking ? 'Edit Booking' : 'Create New Booking'}
          loading={formLoading}
          error={formError}
        />

        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Booking Details"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </>
          }
        >
          {selectedBooking && (
            <div className="space-y-4">
              <div className="bg-input-bg rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">User</p>
                    <p className="text-sm font-medium text-text-primary">{selectedBooking.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Provider</p>
                    <p className="text-sm font-medium text-text-primary">{selectedBooking.provider?.name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Service</p>
                    <p className="text-sm font-medium text-text-primary">{selectedBooking.service?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Status</p>
                    <StatusBadge status={selectedBooking.status} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Date</p>
                    <p className="text-sm font-medium text-text-primary">{selectedBooking.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Time</p>
                    <p className="text-sm font-medium text-text-primary">{selectedBooking.time}</p>
                  </div>
                </div>
                {selectedBooking.notes && (
                  <div>
                    <p className="text-xs text-gray-600">Notes</p>
                    <p className="text-sm font-medium text-text-primary">{selectedBooking.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </main>
  );
}
