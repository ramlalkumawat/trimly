// small helper utilities used across the dashboard
export const formatCurrency = (value) => {
  if (typeof value === 'string') return value;
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

export const getStatusColor = (status) => {
  const colors = {
    active: 'text-green-600',
    inactive: 'text-gray-600',
    pending: 'text-yellow-600',
    approved: 'text-green-600',
    rejected: 'text-red-600',
    completed: 'text-blue-600',
    cancelled: 'text-red-600',
    confirmed: 'text-green-600',
    paid: 'text-green-600',
    pending_payment: 'text-yellow-600'
  };
  return colors[status] || 'text-gray-600';
};

export const getStatusBgColor = (status) => {
  const bgColors = {
    active: 'bg-green-100',
    inactive: 'bg-gray-100',
    pending: 'bg-yellow-100',
    approved: 'bg-green-100',
    rejected: 'bg-red-100',
    completed: 'bg-blue-100',
    cancelled: 'bg-red-100',
    confirmed: 'bg-green-100',
    paid: 'bg-green-100',
    pending_payment: 'bg-yellow-100'
  };
  return bgColors[status] || 'bg-gray-100';
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};
