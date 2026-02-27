const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const BookingLifecycleService = require('../services/bookingLifecycleService');

// Booking controller exposing customer/provider/admin booking API endpoints.
const BOOKING_POPULATE = [
  { path: 'customerId', select: 'name firstName lastName phone email location' },
  { path: 'providerId', select: 'name firstName lastName phone email businessName' },
  { path: 'serviceId', select: 'name category price duration commissionRate' },
  { path: 'paymentId' }
];

const withPagination = (query, page = 1, limit = 20) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.max(Number(limit) || 20, 1);
  return {
    skip: (safePage - 1) * safeLimit,
    limit: safeLimit,
    page: safePage
  };
};

// @desc create booking with provider matching
// @route POST /api/bookings
// @access user
exports.createBooking = asyncHandler(async (req, res, next) => {
  const {
    serviceId,
    date,
    time,
    totalAmount,
    address,
    paymentMethod,
    customerLocation
  } = req.body;

  if (!serviceId || !date || !time || !totalAmount || !address) {
    return next(new ErrorResponse('Missing booking information', 400));
  }

  const booking = await BookingLifecycleService.createBooking({
    customerId: req.user.id,
    serviceId,
    date,
    time,
    address,
    paymentMethod,
    totalAmount: Number(totalAmount),
    customerLocation
  });

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: booking
  });
});

// @desc get bookings based on role
// @route GET /api/bookings
// @access protected
exports.getBookings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const { skip, limit: safeLimit, page: safePage } = withPagination(page, limit);
  const filter = {};

  if (req.user.role === 'user') {
    filter.customerId = req.user.id;
  } else if (req.user.role === 'provider') {
    filter.providerId = req.user.id;
  }

  if (status) {
    filter.status = status;
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate(BOOKING_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    Booking.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    message: 'Bookings retrieved',
    data: bookings,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit)
    }
  });
});

// @desc get provider's pending bookings
// @route GET /api/bookings/provider/pending
// @access provider
exports.getProviderPendingBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({
    providerId: req.user.id,
    status: 'pending'
  })
    .populate(BOOKING_POPULATE)
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Pending bookings retrieved',
    data: bookings
  });
});

// @desc get provider's active bookings
// @route GET /api/bookings/provider/upcoming
// @access provider
exports.getProviderUpcomingBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({
    providerId: req.user.id,
    status: { $in: ['accepted', 'in_progress'] }
  })
    .populate(BOOKING_POPULATE)
    .sort({ scheduledTime: 1 });

  res.status(200).json({
    success: true,
    message: 'Upcoming bookings retrieved',
    data: bookings
  });
});

// @desc get provider booking history
// @route GET /api/bookings/provider/history
// @access provider
exports.getProviderHistoryBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({
    providerId: req.user.id,
    status: { $in: ['completed', 'cancelled', 'rejected'] }
  })
    .populate(BOOKING_POPULATE)
    .sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Booking history retrieved',
    data: bookings
  });
});

// @desc get customer active bookings
// @route GET /api/bookings/customer/active
// @access user
exports.getCustomerActiveBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({
    customerId: req.user.id,
    status: { $in: ['pending', 'accepted', 'in_progress'] }
  })
    .populate(BOOKING_POPULATE)
    .sort({ scheduledTime: 1 });

  res.status(200).json({
    success: true,
    message: 'Active bookings retrieved',
    data: bookings
  });
});

// @desc get booking details
// @route GET /api/bookings/:id
// @access protected
exports.getBookingDetails = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id).populate(BOOKING_POPULATE);

  if (!booking) {
    return next(new ErrorResponse('Booking not found', 404));
  }

  if (req.user.role === 'user' && booking.customerId._id.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to view this booking', 403));
  }

  if (req.user.role === 'provider' && (!booking.providerId || booking.providerId._id.toString() !== req.user.id)) {
    return next(new ErrorResponse('Not authorized to view this booking', 403));
  }

  res.status(200).json({
    success: true,
    message: 'Booking details retrieved',
    data: booking
  });
});

// @desc provider accepts booking
// @route PATCH /api/bookings/:id/accept
// @access provider
exports.acceptBooking = asyncHandler(async (req, res, next) => {
  const updatedBooking = await BookingLifecycleService.updateBookingStatus({
    bookingId: req.params.id,
    actorId: req.user.id,
    actorRole: req.user.role,
    status: 'accepted'
  });

  res.status(200).json({
    success: true,
    message: 'Booking accepted',
    data: updatedBooking
  });
});

// @desc provider rejects booking
// @route PATCH /api/bookings/:id/reject
// @access provider
exports.rejectBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const updatedBooking = await BookingLifecycleService.updateBookingStatus({
    bookingId: req.params.id,
    actorId: req.user.id,
    actorRole: req.user.role,
    status: 'rejected',
    rejectionReason: reason || ''
  });

  res.status(200).json({
    success: true,
    message: 'Booking rejected',
    data: updatedBooking
  });
});

// @desc update booking status
// @route PATCH /api/bookings/:id/status
// @access provider/admin/user (cancel only)
exports.updateBookingStatus = asyncHandler(async (req, res, next) => {
  const { status, reason } = req.body;
  if (!status) {
    return next(new ErrorResponse('Status is required', 400));
  }

  const updatedBooking = await BookingLifecycleService.updateBookingStatus({
    bookingId: req.params.id,
    actorId: req.user.id,
    actorRole: req.user.role,
    status,
    cancellationReason: reason || '',
    rejectionReason: reason || ''
  });

  res.status(200).json({
    success: true,
    message: `Booking status updated to ${status}`,
    data: updatedBooking
  });
});
