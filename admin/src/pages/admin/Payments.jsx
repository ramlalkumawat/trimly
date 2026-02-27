import React, { useState, useEffect } from 'react';
import { EyeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/modals/Modal';
import { ConfirmModal } from '../../components/modals/Modal';
import { adminAPI } from '../../utils/api';
import useToast from '../../hooks/useToast';

// Payments oversight page for transaction status, refunds, and revenue summaries.
const Payments = () => {
  const [payments, setPayments] = useState([]);
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
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [revenueSummary, setRevenueSummary] = useState({
    totalRevenue: 0,
    totalRefunds: 0,
    netRevenue: 0,
    pendingAmount: 0
  });

  const toast = useToast();

  // Fetch payments
  const fetchPayments = async () => {
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
      
      const response = await adminAPI.payments.getAll(params);
      setPayments(response.data.data.payments);
      setRevenueSummary(response.data.data.summary || revenueSummary);
      setPagination(prev => ({
        ...prev,
        ...response.data.data.pagination
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payments');
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [pagination.page, pagination.limit, searchTerm, sortConfig, filterStatus, filterDateRange]);

  // Refund operations
  const handleRefund = async () => {
    setRefundLoading(true);
    try {
      await adminAPI.payments.refund(selectedPayment._id);
      toast.success('Refund processed successfully');
      setShowRefundModal(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process refund');
    } finally {
      setRefundLoading(false);
    }
  };

  // Modal handlers
  const openViewModal = (payment) => {
    setSelectedPayment(payment);
    setShowViewModal(true);
  };

  const openRefundModal = (payment) => {
    setSelectedPayment(payment);
    setShowRefundModal(true);
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
        { value: 'completed', label: 'Completed' },
        { value: 'failed', label: 'Failed' },
        { value: 'refunded', label: 'Refunded' },
        { value: 'partially_refunded', label: 'Partially Refunded' }
      ]
    }
  ];

  // Table columns
  const columns = [
    {
      key: 'transactionId',
      title: 'Transaction ID',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'booking',
      title: 'Booking',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">#{row.booking?.bookingId}</div>
          <div className="text-sm text-gray-500">
            {row.booking?.user?.firstName} {row.booking?.user?.lastName}
          </div>
        </div>
      )
    },
    {
      key: 'provider',
      title: 'Provider',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{row.booking?.provider?.businessName}</div>
          <div className="text-sm text-gray-500">
            {row.booking?.provider?.firstName} {row.booking?.provider?.lastName}
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      title: 'Amount (₹)',
      sortable: true,
      render: (value) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      key: 'commission',
      title: 'Commission',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">₹{row.commissionAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</div>
          <div className="text-sm text-gray-500">{row.commissionRate}%</div>
        </div>
      )
    },
    {
      key: 'netAmount',
      title: 'Net Amount (₹)',
      sortable: true,
      render: (value) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => {
        const statusConfig = {
          pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
          completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
          failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
          refunded: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Refunded' },
          partially_refunded: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Partially Refunded' }
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
      key: 'paymentMethod',
      title: 'Method',
      sortable: true,
      render: (value) => {
        const methodConfig = {
          card: { label: 'Card', icon: '💳' },
          cash: { label: 'Cash', icon: '💵' },
          bank_transfer: { label: 'Bank Transfer', icon: '🏦' },
          digital_wallet: { label: 'Digital Wallet', icon: '📱' }
        };
        
        const config = methodConfig[value] || { label: value, icon: '💳' };
        
        return (
          <div className="flex items-center">
            <span className="mr-2">{config.icon}</span>
            <span>{config.label}</span>
          </div>
        );
      }
    },
    {
      key: 'createdAt',
      title: 'Date',
      sortable: true,
      render: (value) => (
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
          {(row.status === 'completed' || row.status === 'partially_refunded') && (
            <button
              onClick={() => openRefundModal(row)}
              className="text-amber-600 hover:text-amber-700"
              title="Process Refund"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all payment transactions and refunds
          </p>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">₹</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">₹{revenueSummary.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-semibold">↩</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Refunds</dt>
                  <dd className="text-lg font-medium text-gray-900">₹{revenueSummary.totalRefunds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 font-semibold">Σ</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Net Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">₹{revenueSummary.netRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-semibold">⏳</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Amount</dt>
                  <dd className="text-lg font-medium text-gray-900">₹{revenueSummary.pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                </dl>
              </div>
            </div>
          </div>
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
        <DataTable
          data={payments}
          columns={columns}
          loading={loading}
          error={error}
          pagination={pagination}
          onPaginationChange={setPagination}
          onSort={setSortConfig}
          onSearch={setSearchTerm}
          searchPlaceholder="Search payments..."
          showFilters={true}
          filters={filterOptions}
          onFilterChange={(key, value) => setFilterStatus(value)}
        />
      </div>

      {/* View Payment Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Payment Details"
        size="lg"
      >
        {selectedPayment && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedPayment.transactionId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <p className="mt-1 text-sm text-gray-900">₹{selectedPayment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Commission Amount</label>
                  <p className="mt-1 text-sm text-gray-900">₹{selectedPayment.commissionAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Net Amount</label>
                  <p className="mt-1 text-sm text-gray-900">₹{selectedPayment.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.paymentMethod}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    selectedPayment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    selectedPayment.status === 'failed' ? 'bg-red-100 text-red-800' :
                    selectedPayment.status === 'refunded' ? 'bg-gray-100 text-gray-800' :
                    selectedPayment.status === 'partially_refunded' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedPayment.status}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Booking ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">#{selectedPayment.booking?.bookingId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPayment.booking?.user?.firstName} {selectedPayment.booking?.user?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{selectedPayment.booking?.user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Provider</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.booking?.provider?.businessName}</p>
                  <p className="text-sm text-gray-500">
                    {selectedPayment.booking?.provider?.firstName} {selectedPayment.booking?.provider?.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Service</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.booking?.service?.name}</p>
                  <p className="text-sm text-gray-500">₹{selectedPayment.booking?.service?.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timestamps</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedPayment.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Updated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedPayment.updatedAt).toLocaleString()}
                  </p>
                </div>
                {selectedPayment.completedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Completed</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedPayment.completedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Commission Rate</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.commissionRate}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Refunded Amount</label>
                  <p className="mt-1 text-sm text-gray-900">₹{selectedPayment.refundedAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.notes || 'No notes'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Refund Confirmation Modal */}
      <ConfirmModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        onConfirm={handleRefund}
        title="Process Refund"
        message={`Are you sure you want to process a refund for ₹${selectedPayment?.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}? This action cannot be undone.`}
        confirmText="Process Refund"
        type="warning"
      />
    </div>
  );
};

export default Payments;
