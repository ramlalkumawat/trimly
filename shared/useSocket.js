import { useState, useEffect, useCallback } from 'react';
import socketService from './socketService';

// Custom hook for Socket.io integration
export const useSocket = (token, user) => {
  const [isConnected, setIsConnected] = useState(false);
  const [newBooking, setNewBooking] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [bookingAccepted, setBookingAccepted] = useState(null);
  const [bookingRejected, setBookingRejected] = useState(null);
  const [bookingReassigned, setBookingReassigned] = useState(null);
  const [providerOnTheWay, setProviderOnTheWay] = useState(null);
  const [serviceStarted, setServiceStarted] = useState(null);
  const [serviceCompleted, setServiceCompleted] = useState(null);

  // Connect to socket
  useEffect(() => {
    if (token && user) {
      socketService.connect(token, user)
        .then(() => setIsConnected(true))
        .catch(error => {
          console.error('Failed to connect to socket:', error);
          setIsConnected(false);
        });

      return () => {
        socketService.disconnect();
        setIsConnected(false);
      };
    }
  }, [token, user]);

  // Set up event listeners based on user role
  useEffect(() => {
    if (!isConnected) return;

    // Clear existing listeners
    socketService.off('new_booking');
    socketService.off('booking_accepted');
    socketService.off('booking_rejected');
    socketService.off('booking_reassigned');
    socketService.off('provider_on_the_way');
    socketService.off('service_started');
    socketService.off('service_completed');
    socketService.off('booking_status_updated');

    // Provider listeners
    if (user?.role === 'provider') {
      socketService.onNewBooking((data) => {
        setNewBooking(data);
        // Show notification or update UI
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Booking Request', {
            body: `New booking for ${data.booking.serviceId.name}`,
            icon: '/notification-icon.png'
          });
        }
      });
    }

    // Customer listeners
    if (user?.role === 'customer') {
      socketService.onBookingAccepted((data) => {
        setBookingAccepted(data);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Booking Accepted', {
            body: data.message,
            icon: '/notification-icon.png'
          });
        }
      });

      socketService.onBookingRejected((data) => {
        setBookingRejected(data);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Booking Rejected', {
            body: data.message,
            icon: '/notification-icon.png'
          });
        }
      });

      socketService.onBookingReassigned((data) => {
        setBookingReassigned(data);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Booking Reassigned', {
            body: data.message,
            icon: '/notification-icon.png'
          });
        }
      });

      socketService.onProviderOnTheWay((data) => {
        setProviderOnTheWay(data);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Provider On The Way', {
            body: data.message,
            icon: '/notification-icon.png'
          });
        }
      });

      socketService.onServiceStarted((data) => {
        setServiceStarted(data);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Service Started', {
            body: data.message,
            icon: '/notification-icon.png'
          });
        }
      });

      socketService.onServiceCompleted((data) => {
        setServiceCompleted(data);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Service Completed', {
            body: data.message,
            icon: '/notification-icon.png'
          });
        }
      });
    }

    // General listeners for all roles
    socketService.onBookingStatusUpdated((data) => {
      setBookingStatus(data);
    });

  }, [isConnected, user]);

  // Request notification permission
  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Join booking room
  const joinBookingRoom = useCallback((bookingId) => {
    socketService.joinBookingRoom(bookingId);
  }, []);

  // Leave booking room
  const leaveBookingRoom = useCallback((bookingId) => {
    socketService.leaveBookingRoom(bookingId);
  }, []);

  // Update provider location
  const updateLocation = useCallback((location) => {
    socketService.updateLocation(location);
  }, []);

  // Clear states
  const clearStates = useCallback(() => {
    setNewBooking(null);
    setBookingStatus(null);
    setBookingAccepted(null);
    setBookingRejected(null);
    setBookingReassigned(null);
    setProviderOnTheWay(null);
    setServiceStarted(null);
    setServiceCompleted(null);
  }, []);

  return {
    isConnected,
    newBooking,
    bookingStatus,
    bookingAccepted,
    bookingRejected,
    bookingReassigned,
    providerOnTheWay,
    serviceStarted,
    serviceCompleted,
    requestNotificationPermission,
    joinBookingRoom,
    leaveBookingRoom,
    updateLocation,
    clearStates
  };
};

export default useSocket;
