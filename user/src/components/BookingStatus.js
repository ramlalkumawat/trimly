import React, { useState, useEffect } from 'react';
import useSocket from '../../shared/useSocket';
import { cancelBooking } from '../services/api';

// Booking status card that listens to socket events and keeps UI synced in real time.
const BookingStatus = ({ booking, token, user }) => {
  const [currentStatus, setCurrentStatus] = useState(booking.status);
  const [cancelling, setCancelling] = useState(false);
  
  const {
    bookingAccepted,
    bookingRejected,
    bookingReassigned,
    providerOnTheWay,
    serviceStarted,
    serviceCompleted,
    bookingStatus: updatedBooking,
    joinBookingRoom,
    leaveBookingRoom
  } = useSocket(token, user);

  // Join booking room for real-time updates
  useEffect(() => {
    joinBookingRoom(booking._id);
    return () => leaveBookingRoom(booking._id);
  }, [booking._id, joinBookingRoom, leaveBookingRoom]);

  // Handle real-time updates
  useEffect(() => {
    if (bookingAccepted && bookingAccepted.booking._id === booking._id) {
      setCurrentStatus('accepted');
    }
  }, [bookingAccepted, booking._id]);

  useEffect(() => {
    if (bookingRejected && bookingRejected.booking._id === booking._id) {
      setCurrentStatus('rejected');
    }
  }, [bookingRejected, booking._id]);

  useEffect(() => {
    if (bookingReassigned && bookingReassigned.booking._id === booking._id) {
      setCurrentStatus('pending');
    }
  }, [bookingReassigned, booking._id]);

  useEffect(() => {
    if (providerOnTheWay && providerOnTheWay.booking._id === booking._id) {
      setCurrentStatus('on_the_way');
    }
  }, [providerOnTheWay, booking._id]);

  useEffect(() => {
    if (serviceStarted && serviceStarted.booking._id === booking._id) {
      setCurrentStatus('in_progress');
    }
  }, [serviceStarted, booking._id]);

  useEffect(() => {
    if (serviceCompleted && serviceCompleted.booking._id === booking._id) {
      setCurrentStatus('completed');
    }
  }, [serviceCompleted, booking._id]);

  useEffect(() => {
    if (updatedBooking && updatedBooking.booking._id === booking._id) {
      setCurrentStatus(updatedBooking.status);
    }
  }, [updatedBooking, booking._id]);

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setCancelling(true);
    try {
      const response = await cancelBooking(booking._id, token);
      if (response.success) {
        setCurrentStatus('cancelled');
        alert('Booking cancelled successfully');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  // Central style/text map for each booking lifecycle state.
  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        color: 'yellow',
        text: 'Pending',
        description: 'Waiting for provider to accept',
        icon: '⏳'
      },
      accepted: {
        color: 'blue',
        text: 'Accepted',
        description: 'Provider has accepted your booking',
        icon: '✅'
      },
      on_the_way: {
        color: 'purple',
        text: 'On The Way',
        description: 'Provider is on the way to your location',
        icon: '🚗'
      },
      in_progress: {
        color: 'orange',
        text: 'In Progress',
        description: 'Service is being provided',
        icon: '💇'
      },
      completed: {
        color: 'green',
        text: 'Completed',
        description: 'Service has been completed',
        icon: '🎉'
      },
      cancelled: {
        color: 'gray',
        text: 'Cancelled',
        description: 'Booking has been cancelled',
        icon: '❌'
      },
      rejected: {
        color: 'red',
        text: 'Rejected',
        description: 'Provider could not accept this booking',
        icon: '🚫'
      }
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(currentStatus);
  const canCancel = ['pending', 'accepted'].includes(currentStatus);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {booking.serviceId.name}
        </h3>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${statusConfig.color}-100 text-${statusConfig.color}-800`}>
          <span className="mr-2">{statusConfig.icon}</span>
          {statusConfig.text}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <span className="font-medium mr-2">Date:</span>
          {new Date(booking.date).toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric' 
          })}
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <span className="font-medium mr-2">Time:</span>
          {new Date(`2000-01-01T${booking.time}`).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          })}
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <span className="font-medium mr-2">Duration:</span>
          {booking.serviceId.duration} minutes
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <span className="font-medium mr-2">Amount:</span>
          ${booking.totalAmount}
        </div>

        <div className="text-sm text-gray-600">
          <span className="font-medium">Address:</span>
          <div className="mt-1">{booking.address}</div>
        </div>

        {booking.providerId && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Provider:</span>
            <div className="mt-1">
              {booking.providerId.businessName || booking.providerId.name}
              {booking.providerId.phone && (
                <div className="text-gray-500">📞 {booking.providerId.phone}</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={`p-3 rounded-lg bg-${statusConfig.color}-50 border border-${statusConfig.color}-200 mb-4`}>
        <div className="flex items-center">
          <span className="text-2xl mr-3">{statusConfig.icon}</span>
          <div>
            <div className={`font-medium text-${statusConfig.color}-800`}>
              {statusConfig.text}
            </div>
            <div className={`text-sm text-${statusConfig.color}-600`}>
              {statusConfig.description}
            </div>
          </div>
        </div>
      </div>

      {booking.rejectionReason && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 mb-4">
          <div className="text-sm text-red-800">
            <span className="font-medium">Reason:</span> {booking.rejectionReason}
          </div>
        </div>
      )}

      {canCancel && (
        <div className="flex justify-end">
          <button
            onClick={handleCancelBooking}
            disabled={cancelling}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        </div>
      )}

      {currentStatus === 'completed' && (
        <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
          <div className="text-sm text-green-800">
            <span className="font-medium">Service Completed!</span>
            <div className="mt-1">Thank you for using Trimly. Please rate your experience.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingStatus;
