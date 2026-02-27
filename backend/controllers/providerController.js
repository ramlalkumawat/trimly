const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Service = require('../models/Service');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { emitToCustomer, emitToBooking } = require('../config/socket');

// Provider controller for dashboard stats, booking actions, profile, and service management.
// @desc    Get provider's dashboard stats
// @route   GET /api/provider/dashboard
// @access  Private (Provider only)
exports.getDashboard = asyncHandler(async (req, res, next) => {
  const providerId = req.user.id;
  
  const [stats, recentBookings] = await Promise.all([
    // Stats calculations
    Promise.all([
      Booking.countDocuments({ providerId, status: 'pending' }),
      Booking.countDocuments({ providerId, status: 'accepted' }),
      Booking.countDocuments({ providerId, status: 'in_progress' }),
      Booking.countDocuments({ providerId, status: 'completed' }),
      Booking.countDocuments({ providerId, status: 'cancelled' }),
      Booking.aggregate([
        { $match: { providerId: new mongoose.Types.ObjectId(providerId), status: 'completed' } },
        { $group: { _id: null, totalEarnings: { $sum: '$providerPayout' } } }
      ])
    ]),
    // Recent bookings
    Booking.find({ providerId })
      .populate('customerId', 'name phone email')
      .populate('serviceId', 'name price duration category')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayBookingsCount = await Booking.countDocuments({
    providerId,
    scheduledTime: { $gte: today, $lt: tomorrow }
  });

  res.status(200).json({
    success: true,
    data: {
      pendingBookings: stats[0][0],
      acceptedBookings: stats[0][1],
      inProgressBookings: stats[0][2],
      completedBookings: stats[0][3],
      cancelledBookings: stats[0][4],
      totalEarnings: stats[0][5][0]?.totalEarnings || 0,
      todayBookings: todayBookingsCount,
      recentBookings: recentBookings
    }
  });
});

// @desc    Get provider's bookings
// @route   GET /api/provider/bookings
// @access  Private (Provider only)
exports.getBookings = asyncHandler(async (req, res, next) => {
  const providerId = req.user.id;
  const { status, page = 1, limit = 10 } = req.query;
  
  const query = { providerId };
  if (status) {
    query.status = status;
  }

  const bookings = await Booking.find(query)
    .populate('customerId', 'name phone email')
    .populate('serviceId', 'name price duration category')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Booking.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Accept a booking
// @route   PUT /api/provider/bookings/:id/accept
// @access  Private (Provider only)
exports.acceptBooking = asyncHandler(async (req, res, next) => {
  const providerId = req.user.id;
  const bookingId = req.params.id;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return next(new ErrorResponse('Booking not found', 404));
  }

  // Verify ownership
  if (booking.providerId.toString() !== providerId) {
    return next(new ErrorResponse('Not authorized to accept this booking', 403));
  }

  if (booking.status !== 'pending') {
    return next(new ErrorResponse('Booking cannot be accepted in current status', 400));
  }

  booking.status = 'accepted';
  booking.acceptedAt = new Date();
  booking.statusHistory.push({
    status: 'accepted',
    changedBy: providerId,
    role: 'provider',
    note: 'Booking accepted by provider'
  });

  await booking.save();

  // Emit real-time events
  if (global.io) {
    emitToCustomer(global.io, booking.customerId, 'booking_accepted', {
      bookingId: booking._id,
      providerName: req.user.name,
      acceptedAt: booking.acceptedAt
    });

    emitToBooking(global.io, booking._id, 'booking_status_updated', {
      status: 'accepted',
      updatedBy: 'provider'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Booking accepted successfully',
    data: booking
  });
});

// @desc    Reject a booking
// @route   PUT /api/provider/bookings/:id/reject
// @access  Private (Provider only)
exports.rejectBooking = asyncHandler(async (req, res, next) => {
  const providerId = req.user.id;
  const bookingId = req.params.id;
  const { rejectionReason } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return next(new ErrorResponse('Booking not found', 404));
  }

  // Verify ownership
  if (booking.providerId.toString() !== providerId) {
    return next(new ErrorResponse('Not authorized to reject this booking', 403));
  }

  if (booking.status !== 'pending') {
    return next(new ErrorResponse('Booking cannot be rejected in current status', 400));
  }

  booking.status = 'rejected';
  booking.rejectionReason = rejectionReason || 'Rejected by provider';
  booking.statusHistory.push({
    status: 'rejected',
    changedBy: providerId,
    role: 'provider',
    note: rejectionReason || 'Rejected by provider'
  });

  await booking.save();

  // Emit real-time events
  if (global.io) {
    emitToCustomer(global.io, booking.customerId, 'booking_rejected', {
      bookingId: booking._id,
      rejectionReason: booking.rejectionReason,
      rejectedAt: new Date()
    });

    emitToBooking(global.io, booking._id, 'booking_status_updated', {
      status: 'rejected',
      updatedBy: 'provider',
      reason: rejectionReason
    });
  }

  res.status(200).json({
    success: true,
    message: 'Booking rejected successfully',
    data: booking
  });
});

// @desc    Start service (mark as in progress)
// @route   PUT /api/provider/bookings/:id/start
// @access  Private (Provider only)
exports.startService = asyncHandler(async (req, res, next) => {
  const providerId = req.user.id;
  const bookingId = req.params.id;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return next(new ErrorResponse('Booking not found', 404));
  }

  // Verify ownership
  if (booking.providerId.toString() !== providerId) {
    return next(new ErrorResponse('Not authorized to start this booking', 403));
  }

  if (booking.status !== 'accepted') {
    return next(new ErrorResponse('Booking must be accepted before starting', 400));
  }

  booking.status = 'in_progress';
  booking.inProgressAt = new Date();
  booking.statusHistory.push({
    status: 'in_progress',
    changedBy: providerId,
    role: 'provider',
    note: 'Service started'
  });

  await booking.save();

  // Emit real-time events
  if (global.io) {
    emitToCustomer(global.io, booking.customerId, 'booking_in_progress', {
      bookingId: booking._id,
      startedAt: booking.inProgressAt
    });

    emitToBooking(global.io, booking._id, 'booking_status_updated', {
      status: 'in_progress',
      updatedBy: 'provider'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Service started successfully',
    data: booking
  });
});

// @desc    Complete service
// @route   PUT /api/provider/bookings/:id/complete
// @access  Private (Provider only)
exports.completeService = asyncHandler(async (req, res, next) => {
  const providerId = req.user.id;
  const bookingId = req.params.id;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return next(new ErrorResponse('Booking not found', 404));
  }

  // Verify ownership
  if (booking.providerId.toString() !== providerId) {
    return next(new ErrorResponse('Not authorized to complete this booking', 403));
  }

  if (booking.status !== 'in_progress') {
    return next(new ErrorResponse('Booking must be in progress to complete', 400));
  }

  booking.status = 'completed';
  booking.completedAt = new Date();
  booking.statusHistory.push({
    status: 'completed',
    changedBy: providerId,
    role: 'provider',
    note: 'Service completed'
  });

  await booking.save();

  // Emit real-time events
  if (global.io) {
    emitToCustomer(global.io, booking.customerId, 'booking_completed', {
      bookingId: booking._id,
      completedAt: booking.completedAt,
      totalAmount: booking.totalAmount
    });

    emitToBooking(global.io, booking._id, 'booking_status_updated', {
      status: 'completed',
      updatedBy: 'provider'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Service completed successfully',
    data: booking
  });
});

// @desc    Toggle provider availability (online/offline)
// @route   PUT /api/provider/availability
// @access  Private (Provider only)
exports.toggleAvailability = asyncHandler(async (req, res, next) => {
  const providerId = req.user.id;
  const { isAvailable } = req.body;

  console.log('Toggle availability request for provider:', providerId);
  console.log('Requested availability:', isAvailable);

  const provider = await User.findById(providerId);
  if (!provider) {
    return next(new ErrorResponse('Provider not found', 404));
  }

  console.log('Current provider status:', provider.status);
  
  provider.status = isAvailable ? 'active' : 'inactive';
  await provider.save();

  console.log('Updated provider status to:', provider.status);

  res.status(200).json({
    success: true,
    message: `Provider availability updated to ${isAvailable ? 'online' : 'offline'}`,
    data: {
      isAvailable: provider.status === 'active'
    }
  });
});

// @desc    Get provider's services
// @route   GET /api/provider/services
// @access  Private (Provider only)
exports.getServices = asyncHandler(async (req, res, next) => {
  const providerId = req.user.id;

  const provider = await User.findById(providerId).populate('serviceIds');
  if (!provider) {
    return next(new ErrorResponse('Provider not found', 404));
  }

  res.status(200).json({
    success: true,
    data: provider.serviceIds
  });
});

// @desc    Add service to provider
// @route   POST /api/provider/services
// @access  Private (Provider only)
exports.addService = asyncHandler(async (req, res, next) => {
  const providerId = req.user.id;
  const { name, price, duration, category, description } = req.body;

  const service = await Service.create({
    name,
    price,
    duration,
    category,
    description
  });

  // Add service to provider's service list
  await User.findByIdAndUpdate(
    providerId,
    { $push: { serviceIds: service._id } }
  );

  res.status(201).json({
    success: true,
    message: 'Service added successfully',
    data: service
  });
});

// @desc    Update provider's service
// @route   PUT /api/provider/services/:id
// @access  Private (Provider only)
exports.updateService = asyncHandler(async (req, res, next) => {
  const providerId = req.user.id;
  const serviceId = req.params.id;

  // Check if service belongs to provider
  const provider = await User.findOne({ 
    _id: providerId, 
    serviceIds: serviceId 
  });

  if (!provider) {
    return next(new ErrorResponse('Service not found or not owned by provider', 404));
  }

  const service = await Service.findByIdAndUpdate(
    serviceId,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Service updated successfully',
    data: service
  });
});

// @desc    Delete provider's service
// @route   DELETE /api/provider/services/:id
// @access  Private (Provider only)
exports.deleteService = asyncHandler(async (req, res, next) => {
  const providerId = req.user.id;
  const serviceId = req.params.id;

  // Check if service belongs to provider
  const provider = await User.findOne({ 
    _id: providerId, 
    serviceIds: serviceId 
  });

  if (!provider) {
    return next(new ErrorResponse('Service not found or not owned by provider', 404));
  }

  // Remove service from provider's list and delete service
  await User.findByIdAndUpdate(
    providerId,
    { $pull: { serviceIds: serviceId } }
  );

  await Service.findByIdAndDelete(serviceId);

  res.status(200).json({
    success: true,
    message: 'Service deleted successfully'
  });
});

// @desc    Get available unassigned bookings for providers
// @route   GET /api/provider/available-bookings
// @access  Private (Provider only)
exports.getAvailableBookings = asyncHandler(async (req, res, next) => {
  const providerId = req.user.id;
  
  // Get provider's service categories and service IDs
  const provider = await User.findById(providerId).select('category serviceIds location serviceRadiusKm');
  if (!provider) {
    return next(new ErrorResponse('Provider not found', 404));
  }

  // Find unassigned bookings that match provider's services
  const unassignedBookings = await Booking.find({ 
    providerId: null,
    status: 'pending'
  })
    .populate('serviceId', 'name category duration price')
    .populate('customerId', 'name phone email')
    .populate('customerLocation')
    .sort({ createdAt: -1 })
    .limit(20);

  // Filter bookings based on provider's service match and location
  const availableBookings = unassignedBookings.filter(booking => {
    // Check if provider offers this service category or specific service
    const serviceMatch = 
      provider.category === booking.serviceId.category ||
      (provider.serviceIds && provider.serviceIds.some(id => id.toString() === booking.serviceId._id.toString()));
    
    if (!serviceMatch) return false;

    // If booking has customer location and provider has location, check distance
    if (booking.customerLocation && provider.location) {
      const ProviderMatchingService = require('../services/providerMatchingService');
      const distance = ProviderMatchingService.calculateDistance(
        booking.customerLocation.latitude,
        booking.customerLocation.longitude,
        provider.location.latitude,
        provider.location.longitude
      );
      
      const maxDistance = provider.serviceRadiusKm || 10;
      return distance <= maxDistance;
    }

    return true;
  });

  res.status(200).json({
    success: true,
    data: availableBookings
  });
});

// @desc    Claim an unassigned booking
// @route   PUT /api/provider/bookings/:id/claim
// @access  Private (Provider only)
exports.claimBooking = asyncHandler(async (req, res, next) => {
  const providerId = req.user.id;
  const bookingId = req.params.id;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return next(new ErrorResponse('Booking not found', 404));
  }

  // Check if booking is unassigned
  if (booking.providerId) {
    return next(new ErrorResponse('Booking already assigned', 400));
  }

  // Check if booking is still pending
  if (booking.status !== 'pending') {
    return next(new ErrorResponse('Booking cannot be claimed in current status', 400));
  }

  // Assign provider to booking
  booking.providerId = providerId;
  booking.assignedAt = new Date();
  booking.statusHistory.push({
    status: 'pending',
    changedBy: providerId,
    role: 'provider',
    note: 'Booking claimed by provider'
  });

  await booking.save();

  // Populate booking details for response
  const populatedBooking = await Booking.findById(booking._id)
    .populate('customerId', 'name phone email')
    .populate('serviceId', 'name price duration category')
    .populate('providerId', 'name businessName');

  // Emit real-time events
  if (global.io) {
    const { emitToCustomer, emitToBooking } = require('../config/socket');
    emitToCustomer(global.io, booking.customerId, 'booking_assigned', {
      booking: populatedBooking,
      providerName: req.user.name || req.user.businessName
    });

    emitToBooking(global.io, booking._id, 'booking_status_updated', {
      status: 'pending',
      updatedBy: 'provider',
      message: 'Booking claimed by provider'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Booking claimed successfully',
    data: populatedBooking
  });
});

// @desc    Get provider profile
// @route   GET /api/provider/profile
// @access  Private (Provider only)
exports.getProfile = asyncHandler(async (req, res, next) => {
  const provider = await User.findById(req.user.id)
    .select('-password')
    .populate('serviceIds');

  if (!provider) {
    return next(new ErrorResponse('Provider not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: provider
  });
});

// @desc    Update provider profile
// @route   PUT /api/provider/profile
// @access  Private (Provider only)
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const providerId = req.user.id;
  const allowedFields = ['firstName', 'lastName', 'name', 'email', 'businessName', 'category', 'description', 'address', 'location', 'serviceRadiusKm'];
  
  const updateData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const provider = await User.findByIdAndUpdate(
    providerId,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: provider
  });
});
