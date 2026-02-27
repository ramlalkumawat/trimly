const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Socket gateway setup: authenticates connections and publishes booking lifecycle events.
const configureSocket = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const rawToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization || '';
      const token = rawToken.startsWith('Bearer ') ? rawToken.split(' ')[1] : rawToken;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      // Check if user is blocked
      if (user.isBlocked) {
        return next(new Error('Account is blocked'));
      }

      // Check if user is inactive/suspended/rejected
      if (['inactive', 'suspended', 'rejected'].includes(user.status)) {
        return next(new Error('Account is not active'));
      }

      // For providers, check if approved
      if (user.role === 'provider' && (!user.approved || !user.isApproved)) {
        return next(new Error('Provider account is not approved'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user.role})`);
    
    // Join user-specific room for targeted communication
    socket.join(`user_${socket.user._id}`);
    
    // Join role-specific room for broadcasting to roles
    socket.join(`role_${socket.user.role}`);
    
    // If provider, join provider-specific room and available providers room
    if (socket.user.role === 'provider') {
      socket.join(`provider_${socket.user._id}`);
      if (socket.user.status === 'active' && socket.user.approved && socket.user.isApproved) {
        socket.join('available_providers');
        console.log(`Provider ${socket.user._id} joined available providers room`);
      }
      console.log(`Provider ${socket.user._id} joined their room`);
    }

    if (socket.user.role === 'admin') {
      socket.join('admins');
    }

    // Handle joining booking-specific room
    socket.on('join_booking', (bookingId) => {
      socket.join(`booking_${bookingId}`);
      console.log(`User ${socket.user._id} joined booking room ${bookingId}`);
    });

    // Handle leaving booking-specific room
    socket.on('leave_booking', (bookingId) => {
      socket.leave(`booking_${bookingId}`);
      console.log(`User ${socket.user._id} left booking room ${bookingId}`);
    });

    // Handle provider availability updates
    socket.on('update_availability', (isAvailable) => {
      if (socket.user.role === 'provider') {
        if (isAvailable && socket.user.status === 'active' && socket.user.approved && socket.user.isApproved) {
          socket.join('available_providers');
        } else {
          socket.leave('available_providers');
        }
        socket.broadcast.emit(`provider_availability_${socket.user._id}`, { isAvailable });
      }
    });

    // Handle provider location updates
    socket.on('update_location', (location) => {
      if (socket.user.role === 'provider') {
        socket.broadcast.emit(`provider_location_${socket.user._id}`, location);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.user.role})`);
    });
  });

  return io;
};

// Emit functions for real-time events
const emitToProvider = (io, providerId, event, data) => {
  io.to(`provider_${providerId}`).emit(event, data);
};

const emitToCustomer = (io, customerId, event, data) => {
  io.to(`user_${customerId}`).emit(event, data);
};

const emitToBooking = (io, bookingId, event, data) => {
  io.to(`booking_${bookingId}`).emit(event, data);
};

const emitToRole = (io, role, event, data) => {
  io.to(`role_${role}`).emit(event, data);
};

const emitToAdmins = (io, event, data) => {
  io.to('admins').emit(event, data);
};

const emitToAvailableProviders = (io, event, data) => {
  io.to('available_providers').emit(event, data);
};

module.exports = {
  configureSocket,
  emitToProvider,
  emitToCustomer,
  emitToBooking,
  emitToRole,
  emitToAdmins,
  emitToAvailableProviders
};
