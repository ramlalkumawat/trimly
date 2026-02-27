import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import useSocket from '../hooks/useSocket';

// Provider console: manage incoming requests, active jobs, and completed history.
const statusColorMap = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-200 text-gray-700',
  rejected: 'bg-red-100 text-red-800'
};

const toReadableStatus = (status) =>
  String(status || '')
    .replace('_', ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const ProviderDashboard = () => {
  const token = localStorage.getItem('token');
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (error) {
      return {};
    }
  }, []);

  const { connected, newBooking, bookingStatus, clearEvent } = useSocket(token, user);

  const [pendingBookings, setPendingBookings] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [historyBookings, setHistoryBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState('');

  // Normalize one booking update into the correct list based on its current status.
  const applyBookingUpdate = (booking) => {
    if (!booking || !booking._id) return;

    const status = booking.status;
    setPendingBookings((prev) => prev.filter((item) => item._id !== booking._id));
    setActiveBookings((prev) => prev.filter((item) => item._id !== booking._id));
    setHistoryBookings((prev) => prev.filter((item) => item._id !== booking._id));

    if (status === 'pending') {
      setPendingBookings((prev) => [booking, ...prev]);
      return;
    }

    if (['accepted', 'in_progress'].includes(status)) {
      setActiveBookings((prev) => [booking, ...prev]);
      return;
    }

    setHistoryBookings((prev) => [booking, ...prev]);
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const [pendingRes, activeRes, historyRes] = await Promise.all([
        api.get('/bookings/provider/pending'),
        api.get('/bookings/provider/upcoming'),
        api.get('/bookings/provider/history')
      ]);

      setPendingBookings(pendingRes.data.data || []);
      setActiveBookings(activeRes.data.data || []);
      setHistoryBookings(historyRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch provider bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (newBooking?.booking) {
      applyBookingUpdate(newBooking.booking);
      clearEvent('newBooking');
    }
  }, [newBooking, clearEvent]);

  useEffect(() => {
    if (bookingStatus?.booking) {
      applyBookingUpdate(bookingStatus.booking);
      clearEvent('bookingStatus');
    }
  }, [bookingStatus, clearEvent]);

  // Wrapper for accept/reject/start/complete actions to keep loading/error handling consistent.
  const runAction = async (bookingId, path, payload = null) => {
    setActionLoadingId(bookingId);
    try {
      const response = payload
        ? await api.patch(path, payload)
        : await api.patch(path);
      if (response.data?.data) {
        applyBookingUpdate(response.data.data);
      } else {
        fetchBookings();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setActionLoadingId('');
    }
  };

  const renderBookingCard = (booking, actions = []) => (
    <div key={booking._id} className="bg-white rounded-xl shadow-soft p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-[var(--text-primary)]">
            {booking.serviceId?.name || 'Service'}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(booking.scheduledTime || booking.date).toLocaleString()}
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColorMap[booking.status] || 'bg-gray-100 text-gray-700'}`}>
          {toReadableStatus(booking.status)}
        </span>
      </div>

      <div className="text-sm text-gray-600">
        <div>
          <span className="font-medium">Customer:</span>{' '}
          {booking.customerId?.name || `${booking.customerId?.firstName || ''} ${booking.customerId?.lastName || ''}`.trim() || 'N/A'}
        </div>
        <div>
          <span className="font-medium">Phone:</span> {booking.customerId?.phone || 'N/A'}
        </div>
        <div>
          <span className="font-medium">Address:</span> {booking.address}
        </div>
        <div>
          <span className="font-medium">Amount:</span> ₹{Number(booking.totalAmount || 0).toFixed(2)}
        </div>
      </div>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              disabled={actionLoadingId === booking._id}
              className={action.className}
            >
              {actionLoadingId === booking._id ? 'Please wait...' : action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div className="text-gray-600">Loading provider dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Provider Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          Real-time booking requests and service lifecycle management.
        </p>
        <div className="mt-3 text-xs">
          Socket status:{' '}
          <span className={connected ? 'text-green-600 font-semibold' : 'text-yellow-700 font-semibold'}>
            {connected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
        {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
      </div>

      <section>
        <h2 className="font-semibold text-lg mb-3">Incoming Requests ({pendingBookings.length})</h2>
        {pendingBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-soft p-4 text-sm text-gray-600">No pending requests.</div>
        ) : (
          <div className="grid gap-3">
            {pendingBookings.map((booking) =>
              renderBookingCard(booking, [
                {
                  label: 'Accept',
                  onClick: () => runAction(booking._id, `/bookings/${booking._id}/accept`),
                  className: 'px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium'
                },
                {
                  label: 'Reject',
                  onClick: () => runAction(booking._id, `/bookings/${booking._id}/reject`, { reason: 'Provider unavailable' }),
                  className: 'px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium'
                }
              ])
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-3">Active Services ({activeBookings.length})</h2>
        {activeBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-soft p-4 text-sm text-gray-600">No active services.</div>
        ) : (
          <div className="grid gap-3">
            {activeBookings.map((booking) =>
              renderBookingCard(
                booking,
                booking.status === 'accepted'
                  ? [
                      {
                        label: 'Start Service',
                        onClick: () =>
                          runAction(booking._id, `/bookings/${booking._id}/status`, { status: 'in_progress' }),
                        className: 'px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium'
                      },
                      {
                        label: 'Cancel',
                        onClick: () =>
                          runAction(booking._id, `/bookings/${booking._id}/status`, {
                            status: 'cancelled',
                            reason: 'Provider cancelled'
                          }),
                        className: 'px-4 py-2 rounded-xl bg-gray-700 text-white text-sm font-medium'
                      }
                    ]
                  : [
                      {
                        label: 'Mark Completed',
                        onClick: () =>
                          runAction(booking._id, `/bookings/${booking._id}/status`, { status: 'completed' }),
                        className: 'px-4 py-2 rounded-xl bg-green-700 text-white text-sm font-medium'
                      },
                      {
                        label: 'Cancel',
                        onClick: () =>
                          runAction(booking._id, `/bookings/${booking._id}/status`, {
                            status: 'cancelled',
                            reason: 'Provider cancelled'
                          }),
                        className: 'px-4 py-2 rounded-xl bg-gray-700 text-white text-sm font-medium'
                      }
                    ]
              )
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-3">History ({historyBookings.length})</h2>
        {historyBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-soft p-4 text-sm text-gray-600">No completed history yet.</div>
        ) : (
          <div className="grid gap-3">
            {historyBookings.map((booking) => renderBookingCard(booking))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProviderDashboard;
