import { useCallback, useEffect, useRef, useState } from 'react';

// Shared socket hook for user/provider pages: connects once and exposes booking events.
const getSocketBaseUrl = () => {
  const envBase = import.meta.env.VITE_SOCKET_URL;
  if (envBase) {
    return envBase;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase) {
    return apiBase.replace(/\/api\/?$/, '');
  }

  return 'http://localhost:5000';
};

const loadSocketClient = (baseUrl) =>
  new Promise((resolve, reject) => {
    if (window.io) {
      resolve(window.io);
      return;
    }

    const existingScript = document.getElementById('trimly-socketio-client');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.io));
      existingScript.addEventListener('error', () => reject(new Error('Failed to load socket client')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'trimly-socketio-client';
    script.src = `${baseUrl}/socket.io/socket.io.js`;
    script.async = true;
    script.onload = () => resolve(window.io);
    script.onerror = () => reject(new Error('Failed to load socket client'));
    document.head.appendChild(script);
  });

const useSocket = (token, user) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [newBooking, setNewBooking] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [bookingAccepted, setBookingAccepted] = useState(null);
  const [bookingRejected, setBookingRejected] = useState(null);

  useEffect(() => {
    if (!token || !user?.id) {
      return undefined;
    }

    const baseUrl = getSocketBaseUrl();
    let socketInstance;
    let mounted = true;

    loadSocketClient(baseUrl)
      .then((ioClient) => {
        if (!mounted || !ioClient) {
          return;
        }

        socketInstance = ioClient(baseUrl, {
          auth: { token },
          transports: ['websocket', 'polling']
        });

        socketRef.current = socketInstance;

        socketInstance.on('connect', () => {
          setConnected(true);
        });

        socketInstance.on('disconnect', () => {
          setConnected(false);
        });

        socketInstance.on('new_booking', (payload) => setNewBooking(payload));
        socketInstance.on('booking_status_updated', (payload) => setBookingStatus(payload));
        socketInstance.on('booking_accepted', (payload) => setBookingAccepted(payload));
        socketInstance.on('booking_rejected', (payload) => setBookingRejected(payload));
        socketInstance.on('booking_created', (payload) => setNewBooking(payload));
        socketInstance.on('service_started', (payload) => setBookingStatus(payload));
        socketInstance.on('service_completed', (payload) => setBookingStatus(payload));
      })
      .catch(() => {
        setConnected(false);
      });

    return () => {
      mounted = false;
      socketInstance?.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token, user?.id]);

  const joinBookingRoom = useCallback((bookingId) => {
    socketRef.current?.emit('join_booking', bookingId);
  }, []);

  const leaveBookingRoom = useCallback((bookingId) => {
    socketRef.current?.emit('leave_booking', bookingId);
  }, []);

  const clearEvent = useCallback((eventName) => {
    if (eventName === 'newBooking') setNewBooking(null);
    if (eventName === 'bookingStatus') setBookingStatus(null);
    if (eventName === 'bookingAccepted') setBookingAccepted(null);
    if (eventName === 'bookingRejected') setBookingRejected(null);
  }, []);

  return {
    connected,
    newBooking,
    bookingStatus,
    bookingAccepted,
    bookingRejected,
    joinBookingRoom,
    leaveBookingRoom,
    clearEvent
  };
};

export default useSocket;
