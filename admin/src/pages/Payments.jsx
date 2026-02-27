import React, { useState, useEffect } from 'react';
import api from '../api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

// Legacy payments page for transaction list and payout status visibility.
export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/payments');
      setPayments(res.data.data.payments);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const columns = [
    { key: 'transactionId', label: 'Txn ID' },
    { key: 'user', label: 'User' },
    { key: 'amount', label: 'Amount' },
    { key: 'date', label: 'Date' },
    {
      key: 'status',
      label: 'Status',
      render: (status) => <StatusBadge status={status} />
    }
  ];

  return (
    <main className="flex-1 overflow-y-auto pt-20 pb-8">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-text-primary mb-2">Payments</h1>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}
        <DataTable columns={columns} data={payments} />
      </div>
    </main>
  );
}
