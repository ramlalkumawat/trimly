import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import socketService from '../utils/socket';
import useToast from './useToast';

// Hook that registers real-time provider listeners and surfaces toast notifications.
const useSocket = () => {
  const { provider, token } = useAuth();
  const { success, info, warning } = useToast();
  const hasJoinedRoom = useRef(false);

  useEffect(() => {
    const providerId = provider?._id || provider?.id;
    if (!providerId || !token) return;

    // Connect to socket with user info
    socketService.connect(token);

    // Join provider room for real-time updates
    if (!hasJoinedRoom.current) {
      socketService.joinProviderRoom(providerId);
      hasJoinedRoom.current = true;
    }

    // Listen for new booking requests
    socketService.onNewBooking((booking) => {
      // Only show notification if provider is available
      if (provider.isAvailable) {
        success(
          'New Booking Request!',
          `${booking.user?.name} requested ${booking.service?.name}`,
          { duration: 8000 }
        );
      } else {
        info(
          'Missed Booking',
          `You missed a booking request from ${booking.user?.name} while offline`,
          { duration: 8000 }
        );
      }
    });

    // Listen for booking updates
    socketService.onBookingUpdated((booking) => {
      const statusMessages = {
        accepted: 'Booking has been accepted',
        rejected: 'Booking has been rejected',
        in_progress: 'Service has been started',
        completed: 'Service has been completed',
        cancelled: 'Booking has been cancelled'
      };

      info(
        'Booking Updated',
        statusMessages[booking.status] || 'Booking status updated'
      );
    });

    // Listen for booking cancellations
    socketService.onBookingCancelled((booking) => {
      warning(
        'Booking Cancelled',
        `${booking.user?.name} cancelled their booking for ${booking.service?.name}`
      );
    });

    // Cleanup on unmount
    return () => {
      if (hasJoinedRoom.current) {
        socketService.leaveProviderRoom(providerId);
        hasJoinedRoom.current = false;
      }
      
      socketService.removeEventListener('new_booking');
      socketService.removeEventListener('new_booking_request');
      socketService.removeEventListener('booking_updated');
      socketService.removeEventListener('booking_status_updated');
      socketService.removeEventListener('booking_cancelled');
      socketService.removeEventListener('booking_rejected');
    };
  }, [info, provider, success, token, warning]);

  // Disconnect socket when user logs out
  useEffect(() => {
    return () => {
      socketService.disconnect();
    };
  }, []);

  return {
    isConnected: socketService.isConnected()
  };
};

export default useSocket;
