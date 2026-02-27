import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useSocket from '../hooks/useSocket';

// Customer profile page: booking history + live status updates via socket events.
const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-200 text-gray-700',
  rejected: 'bg-red-100 text-red-700'
};

const readableStatus = (status) =>
  String(status || '')
    .replace('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function Profile() {
  const nav = useNavigate();
  const token = localStorage.getItem('token');
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (error) {
      return {};
    }
  }, []);

  const { connected, bookingStatus, bookingAccepted, bookingRejected, clearEvent, joinBookingRoom, leaveBookingRoom } = useSocket(token, user);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cancellingId, setCancellingId] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/bookings');
      setBookings(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    // Subscribe each booking room so only relevant updates are pushed to this user.
    bookings.forEach((booking) => joinBookingRoom(booking._id));
    return () => {
      bookings.forEach((booking) => leaveBookingRoom(booking._id));
    };
  }, [bookings, joinBookingRoom, leaveBookingRoom]);

  // Merge incoming socket payload into local booking list and show small status notice.
  const updateBookingFromSocket = (payload, defaultNotice = 'Booking updated') => {
    if (!payload?.booking?._id) return;
    setBookings((prev) =>
      prev.map((item) => (item._id === payload.booking._id ? { ...item, ...payload.booking } : item))
    );
    setNotice(payload.message || defaultNotice);
  };

  useEffect(() => {
    if (bookingStatus) {
      updateBookingFromSocket(bookingStatus);
      clearEvent('bookingStatus');
    }
  }, [bookingStatus, clearEvent]);

  useEffect(() => {
    if (bookingAccepted) {
      updateBookingFromSocket(bookingAccepted, 'Your booking was accepted');
      clearEvent('bookingAccepted');
    }
  }, [bookingAccepted, clearEvent]);

  useEffect(() => {
    if (bookingRejected) {
      updateBookingFromSocket(bookingRejected, 'Your booking was rejected');
      clearEvent('bookingRejected');
    }
  }, [bookingRejected, clearEvent]);

  const handleCancelBooking = async (bookingId) => {
    setCancellingId(bookingId);
    setError('');
    try {
      const res = await api.patch(`/bookings/${bookingId}/status`, {
        status: 'cancelled',
        reason: 'Cancelled by customer'
      });
      const updated = res.data.data;
      setBookings((prev) => prev.map((item) => (item._id === bookingId ? updated : item)));
      setNotice('Booking cancelled');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to cancel booking');
    } finally {
      setCancellingId('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    nav('/login');
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-xl">{user.name || 'User'}</div>
          <div className="text-sm text-gray-600">{user.email || user.phone || ''}</div>
          <div className="text-xs text-gray-500 mt-1">
            Live status: {connected ? 'Connected' : 'Connecting...'}
          </div>
        </div>
        <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-gray-200">
          Logout
        </button>
      </div>

      {notice && <div className="text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2">{notice}</div>}
      {error && <div className="text-sm text-red-700 bg-red-50 rounded-xl px-3 py-2">{error}</div>}

      <div>
        <div className="font-semibold mb-3">Booking History</div>
        {loading ? (
          <div className="text-sm text-gray-600">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="text-sm text-gray-600">No bookings yet</div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const canCancel = ['pending', 'accepted'].includes(booking.status);
              return (
                <div key={booking._id} className="p-4 rounded-xl bg-gray-50 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{booking.serviceId?.name || 'Service'}</div>
                      <div className="text-xs text-gray-600">
                        {new Date(booking.scheduledTime || booking.date).toLocaleString()}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                      {readableStatus(booking.status)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600">
                    <div>Address: {booking.address}</div>
                    <div>Amount: ₹{Number(booking.totalAmount || 0).toFixed(2)}</div>
                    {booking.providerId && (
                      <div>
                        Provider:{' '}
                        {booking.providerId.businessName || booking.providerId.name || 'Assigned provider'}
                      </div>
                    )}
                  </div>

                  {canCancel && (
                    <div className="pt-1">
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        disabled={cancellingId === booking._id}
                        className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium"
                      >
                        {cancellingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
