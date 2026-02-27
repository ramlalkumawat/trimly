import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import useToast from '../../hooks/useToast';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/modals/Modal';
import FormInput, { FormActions } from '../../components/forms/FormInput';
import { TableSkeleton } from '../../components/layout/LoadingSkeleton';

// Commission management page for provider payouts, rates, and settlement tracking.
const Commissions = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commissions, setCommissions] = useState({ services: [], providers: [] });
  const [selectedItem, setSelectedItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({ commissionRate: 0 });
  const [formLoading, setFormLoading] = useState(false);
  const [type, setType] = useState('service'); // 'service' or 'provider'

  const toast = useToast();

  const fetchCommissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.commissions.getAll();
      setCommissions(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch commissions');
      toast.error('Failed to fetch commissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const handleEdit = (item, itemType) => {
    setSelectedItem(item);
    setType(itemType);
    setFormData({ commissionRate: item.commissionRate });
    setShowEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (type === 'service') {
        await adminAPI.commissions.updateService(selectedItem._id, formData);
      } else {
        await adminAPI.commissions.updateProvider(selectedItem._id, formData);
      }
      toast.success('Commission updated successfully');
      setShowEditModal(false);
      fetchCommissions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update commission');
    } finally {
      setFormLoading(false);
    }
  };

  const serviceColumns = [
    { key: 'name', title: 'Service Name', sortable: true },
    { key: 'commissionRate', title: 'Commission Rate', sortable: true, render: (val) => `${val}%` },
    { key: 'status', title: 'Status', render: (val) => (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${val === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {val}
      </span>
    )},
    { key: 'actions', title: 'Actions', render: (_, row) => (
      <button onClick={() => handleEdit(row, 'service')} className="text-blue-600 hover:text-blue-800">Edit</button>
    )}
  ];

  const providerColumns = [
    { key: 'name', title: 'Provider Name', sortable: true },
    { key: 'commissionRate', title: 'Commission Rate', sortable: true, render: (val) => `${val}%` },
    { key: 'status', title: 'Status', render: (val) => (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${val === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
        {val}
      </span>
    )},
    { key: 'actions', title: 'Actions', render: (_, row) => (
      <button onClick={() => handleEdit(row, 'provider')} className="text-blue-600 hover:text-blue-800">Edit</button>
    )}
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Commission Management</h1>
        <p className="mt-2 text-sm text-gray-700">Manage global and specific commission rates.</p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Service Commissions</h2>
          {loading ? (
            <TableSkeleton columns={4} rows={5} />
          ) : (
            <DataTable 
              data={commissions.services} 
              columns={serviceColumns} 
              loading={loading} 
              error={error} 
            />
          )}
        </section>

        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Provider Commissions</h2>
          {loading ? (
            <TableSkeleton columns={4} rows={5} />
          ) : (
            <DataTable 
              data={commissions.providers} 
              columns={providerColumns} 
              loading={loading} 
              error={error} 
            />
          )}
        </section>
      </div>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Commission for ${selectedItem?.name}`}
      >
        <form onSubmit={handleSubmit}>
          <FormInput
            label="Commission Rate (%)"
            name="commissionRate"
            type="number"
            value={formData.commissionRate}
            onChange={(e) => setFormData({ commissionRate: parseFloat(e.target.value) })}
            required
            min="0"
            max="100"
          />
          <FormActions
            onCancel={() => setShowEditModal(false)}
            loading={formLoading}
            submitLabel="Update Commission"
          />
        </form>
      </Modal>
    </div>
  );
};

export default Commissions;
