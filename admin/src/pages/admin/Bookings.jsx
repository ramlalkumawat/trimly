import React, { useEffect, useState } from 'react';
import {
  CheckIcon,
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

const initialCreateForm = {
  user: '',
  provider: '',
  service: '',
  date: new Date().toISOString().slice(0, 10),
  time: '10:00',
  address: '',
  notes: '',
};

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
];

const statusClassMap = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
};

// Booking operations page for searching, editing, creating and reviewing booking records.
const Bookings = () => {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });

  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);

  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [formData, setFormData] = useState({ status: '', notes: '' });
  const [createFormData, setCreateFormData] = useState(initialCreateForm);
  const [formLoading, setFormLoading] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.bookings.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        status: filterStatus,
        startDate: filterDateRange.start,
        endDate: filterDateRange.end,
      });

      setBookings(response?.data?.data?.bookings || []);
      setPagination((prev) => ({
        ...prev,
        ...(response?.data?.data?.pagination || {}),
      }));
    } catch (requestError) {
      const message = requestError?.response?.data?.message || 'Failed to fetch bookings.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreateOptions = async () => {
    try {
      const [usersResponse, providersResponse, servicesResponse] = await Promise.all([
        adminAPI.users.getAll({ page: 1, limit: 100 }),
        adminAPI.providers.getAll({ page: 1, limit: 100 }),
        adminAPI.services.getAll({ page: 1, limit: 100, status: 'active' }),
      ]);
      setUsers(usersResponse?.data?.data?.users || []);
      setProviders(providersResponse?.data?.data?.providers || []);
      setServices(servicesResponse?.data?.data?.services || []);
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to load booking form options.');
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, pagination.limit, searchTerm, sortConfig, filterStatus, filterDateRange]);

  useEffect(() => {
    if (showCreateModal) {
      fetchCreateOptions();
    }
  }, [showCreateModal]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateInputChange = (event) => {
    const { name, value } = event.target;
    setCreateFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateBooking = async (event) => {
    event.preventDefault();
    setFormLoading(true);
    try {
      await adminAPI.bookings.create(createFormData);
      toast.success('Booking created successfully.');
      setShowCreateModal(false);
      setCreateFormData(initialCreateForm);
      fetchBookings();
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to create booking.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateBooking = async (event) => {
    event.preventDefault();
    setFormLoading(true);
    try {
      await adminAPI.bookings.update(selectedBooking._id, formData);
      toast.success('Booking updated successfully.');
      setShowEditModal(false);
      setFormData({ status: '', notes: '' });
      fetchBookings();
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to update booking.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!selectedBooking?._id) return;
    try {
      await adminAPI.bookings.delete(selectedBooking._id);
      toast.success('Booking deleted successfully.');
      setShowDeleteModal(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to delete booking.');
    }
  };

  const handleQuickAccept = async (booking) => {
    try {
      await adminAPI.bookings.update(booking._id, { status: 'accepted' });
      toast.success('Booking accepted.');
      fetchBookings();
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to update booking status.');
    }
  };

  const openViewModal = (booking) => {
    setSelectedBooking(booking);
    setShowViewModal(true);
  };

  const openEditModal = (booking) => {
    setSelectedBooking(booking);
    setFormData({
      status: booking.status || 'pending',
      notes: booking.notes || '',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (booking) => {
    setSelectedBooking(booking);
    setShowDeleteModal(true);
  };

  const filters = [
    {
      key: 'status',
      value: filterStatus,
      options: [{ value: '', label: 'All Status' }, ...statusOptions],
    },
  ];

  const columns = [
    {
      key: 'bookingId',
      title: 'Booking ID',
      sortable: true,
      render: (value) => <span className="font-mono text-xs text-slate-700">#{value || '--'}</span>,
    },
    {
      key: 'user',
      title: 'Customer',
      sortable: true,
      render: (_, row) => (
        <div className="min-w-[160px]">
          <p className="font-semibold text-slate-900">
            {`${row.user?.firstName || ''} ${row.user?.lastName || ''}`.trim() || 'Customer'}
          </p>
          <p className="text-xs text-slate-500">{row.user?.email || row.user?.phone || '--'}</p>
        </div>
      ),
    },
    {
      key: 'provider',
      title: 'Provider',
      sortable: true,
      render: (_, row) => (
        <div className="min-w-[160px]">
          <p className="font-semibold text-slate-900">{row.provider?.businessName || 'Unassigned'}</p>
          <p className="text-xs text-slate-500">
            {`${row.provider?.firstName || ''} ${row.provider?.lastName || ''}`.trim()}
          </p>
        </div>
      ),
    },
    {
      key: 'service',
      title: 'Service',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.service?.name || '--'}</p>
          <p className="text-xs text-slate-500">₹{Number(row.service?.price || 0).toFixed(0)}</p>
        </div>
      ),
    },
    {
      key: 'scheduledDate',
      title: 'Scheduled',
      sortable: true,
      render: (value) => (
        <div>
          <p className="text-sm font-medium text-slate-800">
            {value ? new Date(value).toLocaleDateString('en-IN') : '--'}
          </p>
          <p className="text-xs text-slate-500">
            {value
              ? new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              : '--'}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassMap[value] || statusClassMap.pending}`}>
          {String(value || 'pending').replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      title: 'Amount',
      sortable: true,
      render: (value) => `₹${Number(value || 0).toFixed(2)}`,
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
          {row.status === 'pending' ? (
            <button
              type="button"
              onClick={() => handleQuickAccept(row)}
              className="rounded-lg border border-emerald-200 p-1.5 text-emerald-700 transition hover:bg-emerald-50"
              title="Accept"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
          ) : null}
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
          <h1 className="admin-section-title">Bookings</h1>
          <p className="admin-section-subtitle">Track customer appointments and update booking lifecycle.</p>
        </div>
        <button type="button" onClick={() => setShowCreateModal(true)} className="admin-btn-primary w-full sm:w-auto">
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Booking
        </button>
      </section>

      <section className="admin-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Filter by scheduled date range</h2>
          <button
            type="button"
            onClick={() => setFilterDateRange({ start: '', end: '' })}
            className="text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            Clear Dates
          </button>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="date"
            value={filterDateRange.start}
            onChange={(event) => setFilterDateRange((prev) => ({ ...prev, start: event.target.value }))}
            className="admin-input"
          />
          <input
            type="date"
            value={filterDateRange.end}
            onChange={(event) => setFilterDateRange((prev) => ({ ...prev, end: event.target.value }))}
            className="admin-input"
          />
        </div>
      </section>

      <DataTable
        data={bookings}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        onPaginationChange={setPagination}
        onSort={setSortConfig}
        onSearch={setSearchTerm}
        searchPlaceholder="Search booking id, customer, provider..."
        showFilters
        filters={filters}
        onFilterChange={(_, value) => setFilterStatus(value)}
      />

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Booking"
        size="lg"
      >
        <form onSubmit={handleCreateBooking}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Customer"
              name="user"
              type="select"
              value={createFormData.user}
              onChange={handleCreateInputChange}
              options={users.map((user) => ({
                value: user._id,
                label: `${user.firstName || ''} ${user.lastName || ''} (${user.phone || user.email || '--'})`,
              }))}
              required
            />
            <FormInput
              label="Provider"
              name="provider"
              type="select"
              value={createFormData.provider}
              onChange={handleCreateInputChange}
              options={providers.map((provider) => ({
                value: provider._id,
                label: `${provider.businessName || provider.name} (${provider.phone || '--'})`,
              }))}
              required
            />
            <FormInput
              label="Service"
              name="service"
              type="select"
              value={createFormData.service}
              onChange={handleCreateInputChange}
              options={services.map((service) => ({
                value: service._id,
                label: `${service.name} (₹${Number(service.price || 0).toFixed(0)})`,
              }))}
              required
            />
            <FormInput
              label="Date"
              name="date"
              type="date"
              value={createFormData.date}
              onChange={handleCreateInputChange}
              required
            />
            <FormInput
              label="Time"
              name="time"
              type="time"
              value={createFormData.time}
              onChange={handleCreateInputChange}
              required
            />
          </div>
          <FormInput
            label="Address"
            name="address"
            value={createFormData.address}
            onChange={handleCreateInputChange}
            placeholder="Full service address"
            required
          />
          <FormInput
            label="Notes"
            name="notes"
            type="textarea"
            value={createFormData.notes}
            onChange={handleCreateInputChange}
            placeholder="Optional notes"
          />
          <FormActions onCancel={() => setShowCreateModal(false)} loading={formLoading} submitLabel="Create Booking" />
        </form>
      </Modal>

      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Booking Details" size="lg">
        {selectedBooking ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Booking ID</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">#{selectedBooking.bookingId}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
                <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassMap[selectedBooking.status] || statusClassMap.pending}`}>
                  {String(selectedBooking.status || 'pending').replace('_', ' ')}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Customer</p>
                <p className="mt-1 text-sm text-slate-700">
                  {`${selectedBooking.user?.firstName || ''} ${selectedBooking.user?.lastName || ''}`.trim()}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Provider</p>
                <p className="mt-1 text-sm text-slate-700">{selectedBooking.provider?.businessName || '--'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Service</p>
                <p className="mt-1 text-sm text-slate-700">{selectedBooking.service?.name || '--'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Amount</p>
                <p className="mt-1 text-sm text-slate-700">₹{Number(selectedBooking.totalAmount || 0).toFixed(2)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Address</p>
                <p className="mt-1 text-sm text-slate-700">{selectedBooking.address || '--'}</p>
              </div>
              {selectedBooking.notes ? (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</p>
                  <p className="mt-1 text-sm text-slate-700">{selectedBooking.notes}</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Booking" size="md">
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
            placeholder="Add notes for this update"
          />
          <FormActions onCancel={() => setShowEditModal(false)} loading={formLoading} />
        </form>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteBooking}
        title="Delete Booking"
        message={`Delete booking #${selectedBooking?.bookingId || ''}? This action cannot be undone.`}
        confirmText="Delete Booking"
        type="danger"
      />
    </div>
  );
};

export default Bookings;
