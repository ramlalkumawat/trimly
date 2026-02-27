import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/modals/Modal';
import FormInput, { FormActions } from '../../components/forms/FormInput';
import { ConfirmModal } from '../../components/modals/Modal';
import { adminAPI } from '../../utils/api';
import useToast from '../../hooks/useToast';
import { ClipLoader } from 'react-spinners';

// User management page with search, CRUD, and status management actions.
const Users = () => {
  const [users, setUsers] = useState([]);
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

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'user',
    status: 'active'
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  const toast = useToast();

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      };
      
      const response = await adminAPI.users.getAll(params);
      setUsers(response.data.data.users);
      setPagination(prev => ({
        ...prev,
        ...response.data.data.pagination
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      toast.addToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, searchTerm, sortConfig]);

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
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
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'user',
      status: 'active'
    });
    setFormErrors({});
  };

  // CRUD operations
  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setFormLoading(true);
    try {
      await adminAPI.users.create(formData);
      toast.addToast('User created successfully', 'success');
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      toast.addToast(err.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setFormLoading(true);
    try {
      await adminAPI.users.update(selectedUser._id, formData);
      toast.addToast('User updated successfully', 'success');
      setShowEditModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      toast.addToast(err.response?.data?.message || 'Failed to update user', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await adminAPI.users.delete(selectedUser._id);
      toast.addToast('User deleted successfully', 'success');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toast.addToast(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await adminAPI.users.updateStatus(user._id, newStatus);
      toast.addToast(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
      fetchUsers();
    } catch (err) {
      toast.addToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  // Modal handlers
  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status
    });
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

  // Table columns
  const columns = [
    {
      key: 'firstName',
      title: 'Name',
      sortable: true,
      render: (value, row) => `${row.firstName} ${row.lastName}`
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
      key: 'role',
      title: 'Role',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
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
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="text-amber-600 hover:text-amber-700"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(row)}
            className={`${
              row.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
            }`}
          >
            {row.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className="text-red-600 hover:text-red-700"
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
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all users in the system
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      <div className="mt-8">
        <DataTable
          data={users}
          columns={columns}
          loading={loading}
          error={error}
          pagination={pagination}
          onPaginationChange={setPagination}
          onSort={setSortConfig}
          onSearch={setSearchTerm}
          searchPlaceholder="Search users..."
        />
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
        size="md"
      >
        <form onSubmit={handleCreateUser}>
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
            label="Role"
            name="role"
            type="select"
            value={formData.role}
            onChange={handleInputChange}
            options={[
              { value: 'user', label: 'User' },
              { value: 'admin', label: 'Admin' }
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
              { value: 'inactive', label: 'Inactive' }
            ]}
          />
          <FormActions
            onCancel={() => setShowCreateModal(false)}
            loading={formLoading}
          />
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
        size="md"
      >
        <form onSubmit={handleUpdateUser}>
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
            label="Role"
            name="role"
            type="select"
            value={formData.role}
            onChange={handleInputChange}
            options={[
              { value: 'user', label: 'User' },
              { value: 'admin', label: 'Admin' }
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
              { value: 'inactive', label: 'Inactive' }
            ]}
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
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.firstName} ${selectedUser?.lastName}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />

      {/* View User Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="User Details"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-sm text-gray-900">
                {selectedUser.firstName} {selectedUser.lastName}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <p className="mt-1 text-sm text-gray-900">{selectedUser.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <p className="mt-1 text-sm text-gray-900">{selectedUser.role}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                selectedUser.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {selectedUser.status}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Created</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(selectedUser.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Updated</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(selectedUser.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Users;
