import React, { useState, useEffect } from 'react';
import api from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import CRUDForm from '../components/CRUDForm';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';

// Legacy user management page for customer records and account status actions.
export default function Users() {
  const [userList, setUserList] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const userFields = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., John Doe'
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'e.g., john@example.com'
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'text',
      required: true,
      placeholder: 'e.g., +1234567890'
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: [
        { value: 'user', label: 'User' },
        { value: 'provider', label: 'Provider' },
        { value: 'admin', label: 'Admin' }
      ]
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'suspended', label: 'Suspended' }
      ]
    }
  ];

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/users', {
        params: { page, pageSize, search: searchTerm, status: statusFilter }
      });
      setUserList(res.data.data.users);
      setTotal(res.data.data.total);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize, searchTerm, statusFilter]);

  const handleCreate = () => {
    setSelectedUser(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Are you sure you want to delete user "${user.name}"?`)) {
      try {
        await api.delete(`/admin/users/${user._id}`);
        fetchUsers();
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    }
  };

  const handleSubmit = async (formData) => {
    setFormLoading(true);
    setFormError(null);
    
    try {
      if (selectedUser) {
        // Update existing user
        await api.put(`/admin/users/${selectedUser._id}`, formData);
      } else {
        // Create new user
        await api.post('/admin/users', formData);
      }
      
      setIsFormOpen(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setIsProfileModalOpen(true);
  };

  const handleToggleStatus = async (user) => {
    try {
      await api.patch(`/admin/users/${user._id}/status`, {
        status: user.status === 'active' ? 'inactive' : 'active'
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    if (key === 'status') {
      setStatusFilter(value);
      setPage(1);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'status',
      label: 'Status',
      render: (status) => <StatusBadge status={status} />
    },
    { key: 'joinDate', label: 'Join Date' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'spent', label: 'Total Spent' }
  ];

  const actions = [
    {
      label: 'View',
      onClick: handleViewProfile
    },
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
            <h1 className="text-4xl font-bold text-text-primary mb-2">Users Management</h1>
            <p className="text-gray-600">Manage all platform users and their activities</p>
          </div>
          <Button onClick={handleCreate}>
            Add New User
          </Button>
        </div>

        {loading && <div>Loading users...</div>}
        {error && <div className="text-red-500 mb-4">{error}</div>}

        <DataTable
          columns={columns}
          data={userList}
          actions={actions}
          searchPlaceholder="Search by name, email or id..."
          onSearch={handleSearch}
          filters={{ status: ['active', 'inactive', 'suspended'] }}
          onFilterChange={handleFilterChange}
        />

        {/* pagination controls */}
        <div className="flex justify-end mt-4 gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-primary"
          >
            Prev
          </button>
          <span className="self-center">
            Page {page} / {Math.ceil(total / pageSize)}
          </span>
          <button
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => setPage((p) => p + 1)}
            className="btn-primary"
          >
            Next
          </button>
        </div>

        <CRUDForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
          initialData={selectedUser}
          fields={userFields}
          title={selectedUser ? 'Edit User' : 'Add New User'}
          loading={formLoading}
          error={formError}
        />

        <Modal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          title="User Profile"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsProfileModalOpen(false)}>
                Close
              </Button>
            </>
          }
        >
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser._id}`}
                  alt={selectedUser.name}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h3 className="text-lg font-bold text-text-primary">{selectedUser.name}</h3>
                  <StatusBadge status={selectedUser.status} />
                </div>
              </div>

              <div className="bg-input-bg rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-600">Email</p>
                  <p className="text-sm font-medium text-text-primary">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Phone</p>
                  <p className="text-sm font-medium text-text-primary">{selectedUser.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Role</p>
                  <p className="text-sm font-medium text-text-primary capitalize">{selectedUser.role}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Join Date</p>
                  <p className="text-sm font-medium text-text-primary">{selectedUser.joinDate}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Total Bookings</p>
                    <p className="text-lg font-bold text-text-primary">{selectedUser.bookings}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Spent</p>
                    <p className="text-lg font-bold text-primary">{selectedUser.spent}</p>
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
