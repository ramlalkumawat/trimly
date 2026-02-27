const Booking = require('../models/Booking');
const User = require('../models/User');
const Service = require('../models/Service');
const ErrorResponse = require('../utils/errorResponse');

// Ownership guards to ensure users/providers only mutate resources they control.
// Check if user owns the booking (customer or assigned provider)
exports.checkBookingOwnership = async (req, res, next) => {
  try {
    const bookingId = req.params.id || req.params.bookingId;
    const userId = req.user.id;
    const userRole = req.user.role;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(new ErrorResponse('Booking not found', 404));
    }

    // Admin can access any booking
    if (userRole === 'admin') {
      req.booking = booking;
      return next();
    }

    // Customer can only access their own bookings
    if (userRole === 'user') {
      if (booking.customerId.toString() !== userId) {
        return next(new ErrorResponse('Not authorized to access this booking', 403));
      }
      req.booking = booking;
      return next();
    }

    // Provider can only access bookings assigned to them
    if (userRole === 'provider') {
      if (!booking.providerId || booking.providerId.toString() !== userId) {
        return next(new ErrorResponse('Not authorized to access this booking', 403));
      }
      req.booking = booking;
      return next();
    }

    return next(new ErrorResponse('Invalid user role', 403));
  } catch (error) {
    return next(new ErrorResponse('Error checking booking ownership', 500));
  }
};

// Check if user owns the service (provider only)
exports.checkServiceOwnership = async (req, res, next) => {
  try {
    const serviceId = req.params.id || req.params.serviceId;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin can access any service
    if (userRole === 'admin') {
      return next();
    }

    // Only providers can own services
    if (userRole !== 'provider') {
      return next(new ErrorResponse('Only providers can access services', 403));
    }

    const provider = await User.findOne({ 
      _id: userId, 
      serviceIds: serviceId 
    });

    if (!provider) {
      return next(new ErrorResponse('Service not found or not owned by provider', 404));
    }

    next();
  } catch (error) {
    return next(new ErrorResponse('Error checking service ownership', 500));
  }
};

// Check if user can access user profile (own profile or admin)
exports.checkUserProfileAccess = async (req, res, next) => {
  try {
    const targetUserId = req.params.id || req.params.userId;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    // Admin can access any profile
    if (userRole === 'admin') {
      return next();
    }

    // Users can only access their own profile
    if (targetUserId && targetUserId !== currentUserId) {
      return next(new ErrorResponse('Not authorized to access this profile', 403));
    }

    next();
  } catch (error) {
    return next(new ErrorResponse('Error checking profile access', 500));
  }
};

// Check if booking is in correct status for the requested action
exports.checkBookingStatus = (allowedStatuses) => {
  return (req, res, next) => {
    const booking = req.booking;
    
    if (!booking) {
      return next(new ErrorResponse('Booking not found', 404));
    }

    if (!allowedStatuses.includes(booking.status)) {
      return next(new ErrorResponse(
        `Booking must be in ${allowedStatuses.join(' or ')} status to perform this action. Current status: ${booking.status}`,
        400
      ));
    }

    next();
  };
};

// Check if provider is approved and active
exports.checkProviderStatus = (req, res, next) => {
  const userRole = req.user.role;
  const userStatus = req.user.status;
  const userApproved = req.user.approved;
  const userIsApproved = req.user.isApproved;

  if (userRole === 'provider') {
    if (!userApproved || !userIsApproved) {
      return next(new ErrorResponse('Provider account is not approved', 403));
    }

    if (userStatus !== 'active') {
      return next(new ErrorResponse('Provider account is not active', 403));
    }
  }

  next();
};
