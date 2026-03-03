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

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'user',
  status: 'active',
};

// User administration page with responsive table and full CRUD modals.
const Users = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
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

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.users.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      });

      setUsers(response?.data?.data?.users || []);
      setPagination((prev) => ({
        ...prev,
        ...(response?.data?.data?.pagination || {}),
      }));
    } catch (requestError) {
      const message = requestError?.response?.data?.message || 'Failed to fetch users.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, searchTerm, sortConfig]);

  const resetForm = () => {
    setFormData(initialFormState);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      await adminAPI.users.create(formData);
      toast.success('User created successfully.');
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to create user.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateUser = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      await adminAPI.users.update(selectedUser._id, formData);
      toast.success('User updated successfully.');
      setShowEditModal(false);
      resetForm();
      fetchUsers();
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to update user.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser?._id) return;
    try {
      await adminAPI.users.delete(selectedUser._id);
      toast.success('User removed successfully.');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const nextStatus = user.status === 'active' ? 'inactive' : 'active';
      await adminAPI.users.updateStatus(user._id, nextStatus);
      toast.success(`User marked as ${nextStatus}.`);
      fetchUsers();
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to update user status.');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'user',
      status: user.status || 'active',
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const columns = [
    {
      key: 'firstName',
      title: 'Name',
      sortable: true,
      render: (_, row) => (
        <div className="min-w-[140px]">
          <p className="font-semibold text-slate-900">{`${row.firstName || ''} ${row.lastName || ''}`.trim()}</p>
          <p className="text-xs text-slate-500">{row.phone || '--'}</p>
        </div>
      ),
    },
    {
      key: 'email',
      title: 'Email',
      sortable: true,
      render: (value) => <span className="text-sm text-slate-700">{value || '--'}</span>,
    },
    {
      key: 'role',
      title: 'Role',
      sortable: true,
      render: (value) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            value === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {(value || 'user').toUpperCase()}
        </span>
      ),
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
      key: 'createdAt',
      title: 'Joined',
      sortable: true,
      render: (value) => (
        <span className="text-xs text-slate-500">
          {value ? new Date(value).toLocaleDateString('en-IN') : '--'}
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
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            title="View details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="rounded-lg border border-blue-200 p-1.5 text-blue-700 transition hover:bg-blue-50"
            title="Edit user"
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
            title="Delete user"
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
          <h1 className="admin-section-title">Users</h1>
          <p className="admin-section-subtitle">Create, update and monitor customer/admin accounts.</p>
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
          Add User
        </button>
      </section>

      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        onPaginationChange={setPagination}
        onSort={setSortConfig}
        onSearch={setSearchTerm}
        searchPlaceholder="Search by name, email or phone..."
      />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New User" size="md">
        <form onSubmit={handleCreateUser}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Role"
              name="role"
              type="select"
              value={formData.role}
              onChange={handleInputChange}
              options={[
                { value: 'user', label: 'User' },
                { value: 'admin', label: 'Admin' },
              ]}
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
          <FormActions onCancel={() => setShowCreateModal(false)} loading={formLoading} />
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User" size="md">
        <form onSubmit={handleUpdateUser}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Role"
              name="role"
              type="select"
              value={formData.role}
              onChange={handleInputChange}
              options={[
                { value: 'user', label: 'User' },
                { value: 'admin', label: 'Admin' },
              ]}
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
          <FormActions onCancel={() => setShowEditModal(false)} loading={formLoading} />
        </form>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${(selectedUser?.firstName || '') + ' ' + (selectedUser?.lastName || '')}?`}
        confirmText="Delete User"
        type="danger"
      />

      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="User Details" size="md">
        {selectedUser ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Name</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-1 text-sm text-slate-700">{selectedUser.email || '--'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Phone</p>
              <p className="mt-1 text-sm text-slate-700">{selectedUser.phone || '--'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</p>
              <p className="mt-1 text-sm text-slate-700">{selectedUser.role || '--'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
              <p className="mt-1 text-sm text-slate-700">{selectedUser.status || '--'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Created</p>
              <p className="mt-1 text-sm text-slate-700">
                {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString('en-IN') : '--'}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default Users;
