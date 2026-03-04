import { io } from 'socket.io-client';

// Socket service wrapper for connection management and provider event channels.
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.REACT_APP_API_URL ||
  'https://trimly-1q56.onrender.com';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(token) {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.connected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Provider-specific events
  onNewBooking(callback) {
    if (this.socket) {
      this.socket.on('new_booking', callback);
      this.socket.on('new_booking_request', callback); // For available providers room
    }
  }

  onBookingUpdated(callback) {
    if (this.socket) {
      this.socket.on('booking_status_updated', callback);
      this.socket.on('booking_updated', callback);
    }
  }

  onBookingCancelled(callback) {
    if (this.socket) {
      this.socket.on('booking_cancelled', callback);
      this.socket.on('booking_rejected', callback);
    }
  }

  // Join provider room (handled automatically by backend)
  joinProviderRoom(providerId) {
    if (this.socket && providerId) {
      // Backend automatically joins provider to their room
      console.log(`Provider ${providerId} room joined automatically`);
    }
  }

  // Leave provider room
  leaveProviderRoom(providerId) {
    if (this.socket && providerId) {
      // Backend handles provider room membership automatically.
    }
  }

  // Update provider availability
  updateAvailability(isAvailable) {
    if (this.socket && this.connected) {
      this.socket.emit('update_availability', isAvailable);
    }
  }

  // Update provider location
  updateLocation(location) {
    if (this.socket) {
      this.socket.emit('update_location', location);
    }
  }

  // Remove event listeners
  removeEventListener(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  isConnected() {
    return this.connected;
  }
}

export const socketService = new SocketService();
export default socketService;
