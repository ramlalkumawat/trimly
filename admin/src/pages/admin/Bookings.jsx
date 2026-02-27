import React, { useState, useEffect } from 'react';
import { EyeIcon, CheckIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/modals/Modal';
import FormInput, { FormActions } from '../../components/forms/FormInput';
import { ConfirmModal } from '../../components/modals/Modal';
import { adminAPI } from '../../utils/api';
import useToast from '../../hooks/useToast';
import { TableSkeleton } from '../../components/layout/LoadingSkeleton';

// Bookings operations page: list, view details, update status, and create manual entries.
const Bookings = () => {
  const [bookings, setBookings] = useState([]);
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
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    status: '',
    notes: ''
  });
  const [createFormData, setCreateFormData] = useState({
    user: '',
    provider: '',
    service: '',
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    address: '',
    notes: ''
  });
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  const toast = useToast();

  // Fetch users, providers, services for create booking
  const fetchOptions = async () => {
    try {
      const [uRes, pRes, sRes] = await Promise.all([
        adminAPI.users.getAll({ limit: 100 }),
        adminAPI.providers.getAll({ limit: 100 }),
        adminAPI.services.getAll({ limit: 100 })
      ]);
      setUsers(uRes.data.data.users);
      setProviders(pRes.data.data.providers);
      setServices(sRes.data.data.services);
    } catch (err) {
      console.error('Failed to fetch options', err);
    }
  };

  useEffect(() => {
    if (showCreateModal) {
      fetchOptions();
    }
  }, [showCreateModal]);

  // Fetch bookings
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        status: filterStatus,
        startDate: filterDateRange.start,
        endDate: filterDateRange.end
      };
      
      const response = await adminAPI.bookings.getAll(params);
      setBookings(response.data.data.bookings);
      setPagination(prev => ({
        ...prev,
        ...response.data.data.pagination
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bookings');
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, pagination.limit, searchTerm, sortConfig, filterStatus, filterDateRange]);

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateInputChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({ ...prev, [name]: value }));
  };

  // CRUD operations
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await adminAPI.bookings.create(createFormData);
      toast.success('Booking created successfully');
      setShowCreateModal(false);
      setCreateFormData({
        user: '',
        provider: '',
        service: '',
        date: new Date().toISOString().slice(0, 10),
        time: '10:00',
        address: '',
        notes: ''
      });
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    
    setFormLoading(true);
    try {
      await adminAPI.bookings.update(selectedBooking._id, formData);
      toast.success('Booking updated successfully');
      setShowEditModal(false);
      setShowStatusModal(false);
      setFormData({ status: '', notes: '' });
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update booking');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBooking = async () => {
    try {
      await adminAPI.bookings.delete(selectedBooking._id);
      toast.success('Booking deleted successfully');
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete booking');
    }
  };

  const handleUpdateStatus = async (booking, newStatus) => {
    try {
      await adminAPI.bookings.update(booking._id, { status: newStatus });
      toast.success(`Booking ${newStatus} successfully`);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Modal handlers
  const openViewModal = (booking) => {
    setSelectedBooking(booking);
    setShowViewModal(true);
  };

  const openEditModal = (booking) => {
    setSelectedBooking(booking);
    setFormData({
      status: booking.status,
      notes: booking.notes || ''
    });
    setShowEditModal(true);
  };

  const openStatusModal = (booking, status) => {
    setSelectedBooking(booking);
    setFormData({
      status: status,
      notes: booking.notes || ''
    });
    setShowStatusModal(true);
  };

  const openDeleteModal = () => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      handleDeleteBooking();
    }
  };

  // Filter options
  const filterOptions = [
    {
      key: 'status',
      value: filterStatus,
      placeholder: 'All Status',
      options: [
        { value: '', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'accepted', label: 'Accepted' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'rejected', label: 'Rejected' }
      ]
    }
  ];

  // Status options
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // Table columns
  const columns = [
    {
      key: 'bookingId',
      title: 'Booking ID',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm">#{value}</span>
      )
    },
    {
      key: 'user',
      title: 'Customer',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.user?.firstName} {row.user?.lastName}
          </div>
          <div className="text-sm text-gray-500">{row.user?.email}</div>
        </div>
      )
    },
    {
      key: 'provider',
      title: 'Provider',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.provider?.businessName}
          </div>
          <div className="text-sm text-gray-500">
            {row.provider?.firstName} {row.provider?.lastName}
          </div>
        </div>
      )
    },
    {
      key: 'service',
      title: 'Service',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{row.service?.name}</div>
          <div className="text-sm text-gray-500">${row.service?.price}</div>
        </div>
      )
    },
    {
      key: 'scheduledDate',
      title: 'Scheduled',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">
            {new Date(value).toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => {
        const statusConfig = {
          pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
          accepted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Accepted' },
          in_progress: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'In Progress' },
          completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
          cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
          rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' }
        };
        
        const config = statusConfig[value] || statusConfig.pending;
        
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
            {config.label}
          </span>
        );
      }
    },
    {
      key: 'totalAmount',
      title: 'Amount',
      sortable: true,
      render: (value) => `$${value.toFixed(2)}`
    },
    {
      key: 'commissionAmount',
      title: 'Commission',
      sortable: true,
      render: (value) => `$${(value || 0).toFixed(2)}`
    },
    {
      key: 'createdAt',
      title: 'Booked',
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
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {row.status === 'pending' && (
            <button
              onClick={() => handleUpdateStatus(row, 'accepted')}
              className="text-green-600 hover:text-green-700"
              title="Accept"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => {
              setSelectedBooking(row);
              openDeleteModal();
            }}
            className="text-red-600 hover:text-red-700"
            title="Delete"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all service bookings and their status
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Booking
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="mt-6 bg-gray-50 px-4 py-3 rounded-lg">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
            <input
              type="date"
              value={filterDateRange.start}
              onChange={(e) => setFilterDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={filterDateRange.end}
              onChange={(e) => setFilterDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <button
            onClick={() => setFilterDateRange({ start: '', end: '' })}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear dates
          </button>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <TableSkeleton columns={8} rows={pagination.limit} />
        ) : (
          <DataTable
            data={bookings}
            columns={columns}
            loading={loading}
            error={error}
            pagination={pagination}
            onPaginationChange={setPagination}
            onSort={setSortConfig}
            onSearch={setSearchTerm}
            searchPlaceholder="Search bookings..."
            showFilters={true}
            filters={filterOptions}
            onFilterChange={(key, value) => setFilterStatus(value)}
          />
        )}
      </div>

      {/* Create Booking Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Booking"
        size="lg"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer</label>
              <select
                name="user"
                value={createFormData.user}
                onChange={handleCreateInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                required
              >
                <option value="">Select Customer</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.phone})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Provider</label>
              <select
                name="provider"
                value={createFormData.provider}
                onChange={handleCreateInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                required
              >
                <option value="">Select Provider</option>
                {providers.map(p => (
                  <option key={p._id} value={p._id}>{p.businessName || `${p.firstName} ${p.lastName}`} ({p.category})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Service</label>
              <select
                name="service"
                value={createFormData.service}
                onChange={handleCreateInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                required
              >
                <option value="">Select Service</option>
                {services.map(s => (
                  <option key={s._id} value={s._id}>{s.name} (${s.price})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                name="date"
                value={createFormData.date}
                onChange={handleCreateInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Time</label>
              <input
                type="time"
                name="time"
                value={createFormData.time}
                onChange={handleCreateInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              name="address"
              value={createFormData.address}
              onChange={handleCreateInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
              placeholder="Full service address"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={createFormData.notes}
              onChange={handleCreateInputChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
              placeholder="Any additional notes..."
            />
          </div>
          <FormActions
            onCancel={() => setShowCreateModal(false)}
            loading={formLoading}
            submitLabel="Create Booking"
          />
        </form>
      </Modal>

      {/* View Booking Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Booking Details"
        size="lg"
      >
        {selectedBooking && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Customer Info</h3>
                <div className="mt-2 text-sm text-gray-900">
                  <p className="font-semibold">{selectedBooking.user?.firstName} {selectedBooking.user?.lastName}</p>
                  <p>{selectedBooking.user?.email}</p>
                  <p>{selectedBooking.user?.phone}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Provider Info</h3>
                <div className="mt-2 text-sm text-gray-900">
                  <p className="font-semibold">{selectedBooking.provider?.businessName}</p>
                  <p>{selectedBooking.provider?.firstName} {selectedBooking.provider?.lastName}</p>
                  <p>{selectedBooking.provider?.phone}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Service Info</h3>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Service</p>
                  <p className="text-sm font-medium">{selectedBooking.service?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Scheduled For</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedBooking.scheduledDate).toLocaleDateString()} at {new Date(selectedBooking.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                    selectedBooking.status === 'completed' ? 'bg-green-100 text-green-800' :
                    selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedBooking.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Financial Details</h3>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="font-medium">${selectedBooking.totalAmount?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Commission</p>
                  <p className="font-medium text-amber-600">${selectedBooking.commissionAmount?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payment Status</p>
                  <p className="font-medium">{selectedBooking.paymentStatus || 'Pending'}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Address & Notes</h3>
              <div className="mt-2 text-sm">
                <p className="text-gray-900"><span className="font-medium">Address:</span> {selectedBooking.address}</p>
                {selectedBooking.notes && (
                  <p className="mt-2 text-gray-600"><span className="font-medium">Notes:</span> {selectedBooking.notes}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Booking Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Booking"
        size="md"
      >
        <form onSubmit={handleUpdateBooking}>
          <FormInput
            label="Status"
            name="status"
            type="select"
            value={formData.status}
            onChange={handleInputChange}
            options={statusOptions}
          />
          <FormInput
            label="Notes"
            name="notes"
            type="textarea"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Add any notes about this booking..."
          />
          <FormActions
            onCancel={() => setShowEditModal(false)}
            loading={formLoading}
          />
        </form>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Status"
        size="md"
      >
        <form onSubmit={handleUpdateBooking}>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to update the booking status to <strong>{formData.status}</strong>?
            </p>
          </div>
          <FormInput
            label="Notes (Optional)"
            name="notes"
            type="textarea"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Add any notes about this status change..."
          />
          <FormActions
            onCancel={() => setShowStatusModal(false)}
            loading={formLoading}
            submitText="Update Status"
          />
        </form>
      </Modal>
    </div>
  );
};

export default Bookings;
