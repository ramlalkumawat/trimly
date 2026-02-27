class SocketService {
  constructor() {
    this.socket = null;
    this.token = null;
    this.user = null;
  }

  // Initialize socket connection
  connect(token, user = null) {
    if (this.socket && this.socket.connected) {
      return Promise.resolve();
    }

    this.token = token;
    if (user) {
      this.user = user;
    }

    return new Promise((resolve, reject) => {
      // Import socket.io-client dynamically for browser environments
      const io = require('socket.io-client');
      
      this.socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token: this.token
        },
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
      });

      // Handle authentication errors
      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
        if (error.message === 'Authentication error') {
          this.disconnect();
          // Redirect to login or refresh token
          window.location.href = '/login';
        }
      });
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.user = null;
  }

  // Set user for socket service
  setUser(user) {
    this.user = user;
  }

  // Join booking room for real-time updates
  joinBookingRoom(bookingId) {
    if (this.socket) {
      this.socket.emit('join_booking', bookingId);
    }
  }

  // Leave booking room
  leaveBookingRoom(bookingId) {
    if (this.socket) {
      this.socket.emit('leave_booking', bookingId);
    }
  }

  // Join provider room for real-time updates
  joinProviderRoom(providerId) {
    if (this.socket) {
      this.socket.emit('join_provider_room', providerId);
    }
  }

  // Leave provider room
  leaveProviderRoom(providerId) {
    if (this.socket) {
      this.socket.emit('leave_provider_room', providerId);
    }
  }

  // Update provider location
  updateLocation(location) {
    if (this.socket && this.user?.role === 'provider') {
      this.socket.emit('update_location', location);
    }
  }

  // Update provider availability status
  updateAvailability(isAvailable) {
    if (this.socket && this.socket.connected && this.user?.role === 'provider') {
      this.socket.emit('update_availability', { isAvailable });
      console.log('Socket: Availability updated to', isAvailable);
    } else {
      console.log('Socket: Not connected or user not set, skipping availability update');
    }
  }

  // Listen for new bookings (provider only)
  onNewBooking(callback) {
    if (this.socket) {
      this.socket.on('new_booking', callback);
    }
  }

  // Listen for booking accepted (customer only)
  onBookingAccepted(callback) {
    if (this.socket) {
      this.socket.on('booking_accepted', callback);
    }
  }

  // Listen for booking rejected (customer only)
  onBookingRejected(callback) {
    if (this.socket) {
      this.socket.on('booking_rejected', callback);
    }
  }

  // Listen for booking reassigned (customer only)
  onBookingReassigned(callback) {
    if (this.socket) {
      this.socket.on('booking_reassigned', callback);
    }
  }

  // Listen for provider on the way (customer only)
  onProviderOnTheWay(callback) {
    if (this.socket) {
      this.socket.on('provider_on_the_way', callback);
    }
  }

  // Listen for service started (customer only)
  onServiceStarted(callback) {
    if (this.socket) {
      this.socket.on('service_started', callback);
    }
  }

  // Listen for service completed (customer only)
  onServiceCompleted(callback) {
    if (this.socket) {
      this.socket.on('service_completed', callback);
    }
  }

  // Listen for booking status updates (general)
  onBookingStatusUpdated(callback) {
    if (this.socket) {
      this.socket.on('booking_status_updated', callback);
    }
  }

  // Listen for booking created (general)
  onBookingCreated(callback) {
    if (this.socket) {
      this.socket.on('booking_created', callback);
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Get connection status
  isConnected() {
    return this.socket && this.socket.connected;
  }

  // Get socket ID
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
