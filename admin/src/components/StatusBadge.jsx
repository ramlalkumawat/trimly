import React from 'react';

// Maps backend statuses to colored pill badges for quick visual scanning.
const StatusBadge = ({ status, variant = 'default' }) => {
  const statusStyles = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    confirmed: 'bg-green-100 text-green-800',
    paid: 'bg-green-100 text-green-800',
    pending_payment: 'bg-yellow-100 text-yellow-800',
    refunded: 'bg-blue-100 text-blue-800'
  };

  const style = statusStyles[status] || statusStyles.active;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
    </span>
  );
};

export default StatusBadge;
