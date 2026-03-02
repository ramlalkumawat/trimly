const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
  const providerObjectId = new mongoose.Types.ObjectId(providerId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const [stats, recentBookings] = await Promise.all([
    // Stats calculations
    Promise.all([
      Booking.countDocuments({ providerId, status: 'pending' }),
      Booking.countDocuments({ providerId, status: 'accepted' }),
      Booking.countDocuments({ providerId, status: 'in_progress' }),
      Booking.countDocuments({ providerId, status: 'completed' }),
      Booking.countDocuments({ providerId, status: 'cancelled' }),
      Booking.aggregate([
        { $match: { providerId: providerObjectId, status: 'completed' } },
        { $group: { _id: null, totalEarnings: { $sum: '$providerPayout' } } }
      ]),
      Booking.aggregate([
        {
          $match: {
            providerId: providerObjectId,
            status: 'completed',
            completedAt: { $gte: today, $lt: tomorrow }
          }
        },
        { $group: { _id: null, todayEarnings: { $sum: '$providerPayout' } } }
      ])
    ]),
    // Recent bookings
    Booking.find({ providerId })
      .populate('customerId', 'name phone email')
      .populate('serviceId', 'name price duration category')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  const todayBookingsCount = await Booking.countDocuments({
    providerId,
    scheduledTime: { $gte: today, $lt: tomorrow }
  });

  res.status(200).json({
    success: true,
    data: {
      pendingBookings: stats[0],
      acceptedBookings: stats[1],
      inProgressBookings: stats[2],
      completedBookings: stats[3],
      cancelledBookings: stats[4],
      totalBookings: stats[0] + stats[1] + stats[2] + stats[3] + stats[4],
      totalEarnings: stats[5][0]?.totalEarnings || 0,
      todayBookings: todayBookingsCount,
      todayEarnings: stats[6][0]?.todayEarnings || 0,
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

// @desc    Get provider earnings analytics
// @route   GET /api/provider/earnings
// @access  Private (Provider only)
exports.getEarnings = asyncHandler(async (req, res, next) => {
  const providerId = req.user.id;
  const providerObjectId = new mongoose.Types.ObjectId(providerId);
  const { startDate, endDate } = req.query;

  let rangeStart;
  let rangeEnd;

  if (startDate) {
    rangeStart = new Date(startDate);
    if (Number.isNaN(rangeStart.getTime())) {
      return next(new ErrorResponse('Invalid startDate', 400));
    }
  } else {
    rangeStart = new Date();
    rangeStart.setDate(rangeStart.getDate() - 30);
  }

  if (endDate) {
    rangeEnd = new Date(endDate);
    if (Number.isNaN(rangeEnd.getTime())) {
      return next(new ErrorResponse('Invalid endDate', 400));
    }
  } else {
    rangeEnd = new Date();
  }

  if (rangeStart > rangeEnd) {
    return next(new ErrorResponse('startDate must be before endDate', 400));
  }

  const baseMatch = {
    providerId: providerObjectId,
    status: 'completed',
    completedAt: { $gte: rangeStart, $lte: rangeEnd }
  };

  const amountExpression = { $ifNull: ['$providerPayout', '$totalAmount'] };
  const completionDateExpression = { $ifNull: ['$completedAt', '$date'] };

  const [summaryAgg, dailyAgg, monthlyAgg, recentTransactions] = await Promise.all([
    Booking.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: amountExpression },
          completedBookings: { $sum: 1 }
        }
      }
    ]),
    Booking.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: completionDateExpression } }
          },
          earnings: { $sum: amountExpression },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]),
    Booking.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m-01', date: completionDateExpression } }
          },
          earnings: { $sum: amountExpression },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]),
    Booking.find(baseMatch)
      .populate('customerId', 'name email')
      .populate('serviceId', 'name')
      .sort({ completedAt: -1 })
      .limit(20)
  ]);

  const totalEarnings = summaryAgg[0]?.totalEarnings || 0;
  const completedBookings = summaryAgg[0]?.completedBookings || 0;
  const averageEarnings = completedBookings > 0 ? totalEarnings / completedBookings : 0;

  res.status(200).json({
    success: true,
    data: {
      totalEarnings,
      completedBookings,
      averageEarnings,
      dailyAverage: averageEarnings,
      dailyEarnings: dailyAgg.map((item) => ({
        date: item._id.date,
        earnings: item.earnings,
        bookings: item.bookings
      })),
      monthlyEarnings: monthlyAgg.map((item) => ({
        month: item._id.month,
        earnings: item.earnings,
        bookings: item.bookings
      })),
      recentTransactions: recentTransactions.map((item) => ({
        _id: item._id,
        date: item.completedAt || item.date,
        amount: item.providerPayout || item.totalAmount || 0,
        user: item.customerId
          ? {
              _id: item.customerId._id,
              name: item.customerId.name
            }
          : null,
        service: item.serviceId
          ? {
              _id: item.serviceId._id,
              name: item.serviceId.name
            }
          : null
      }))
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
  const rawAvailability = req.body?.isAvailable;
  const isAvailable =
    typeof rawAvailability === 'boolean'
      ? rawAvailability
      : rawAvailability === 'true'
      ? true
      : rawAvailability === 'false'
      ? false
      : null;

  if (isAvailable === null) {
    return next(new ErrorResponse('isAvailable must be a boolean', 400));
  }

  const provider = await User.findByIdAndUpdate(
    providerId,
    { $set: { isAvailable } },
    { new: true }
  ).select('isAvailable');

  if (!provider) {
    return next(new ErrorResponse('Provider not found', 404));
  }

  res.status(200).json({
    success: true,
    message: `Provider availability updated to ${isAvailable ? 'online' : 'offline'}`,
    data: {
      isAvailable: provider.isAvailable !== false
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
  const provider = await User.findById(providerId);
  if (!provider) {
    return next(new ErrorResponse('Provider not found', 404));
  }

  if (typeof req.body.name === 'string') {
    const nextName = req.body.name.trim();
    if (!nextName) {
      return next(new ErrorResponse('Name is required', 400));
    }
    provider.name = nextName;
  }

  if (typeof req.body.phone === 'string') {
    const nextPhone = req.body.phone.trim();
    if (!nextPhone) {
      return next(new ErrorResponse('Phone number is required', 400));
    }

    if (nextPhone !== provider.phone) {
      const existingPhone = await User.findOne({
        phone: nextPhone,
        _id: { $ne: providerId }
      });
      if (existingPhone) {
        return next(new ErrorResponse('Phone number already registered', 400));
      }
    }
    provider.phone = nextPhone;
  }

  if (typeof req.body.description === 'string') {
    provider.description = req.body.description.trim();
  }

  if (typeof req.body.serviceArea === 'string') {
    provider.serviceArea = req.body.serviceArea.trim();
  }

  if (typeof req.body.profileImage === 'string') {
    provider.profileImage = req.body.profileImage;
  }

  if (typeof req.body.businessName === 'string') {
    provider.businessName = req.body.businessName.trim();
  }

  if (typeof req.body.category === 'string') {
    provider.category = req.body.category;
  }

  if (req.body.address !== undefined) {
    provider.address = req.body.address;
  }

  if (req.body.location !== undefined) {
    provider.location = req.body.location;
  }

  if (req.body.serviceRadiusKm !== undefined) {
    provider.serviceRadiusKm = req.body.serviceRadiusKm;
  }

  const wantsPasswordChange =
    req.body.currentPassword !== undefined || req.body.newPassword !== undefined;

  if (wantsPasswordChange) {
    if (!req.body.currentPassword || !req.body.newPassword) {
      return next(
        new ErrorResponse('Both currentPassword and newPassword are required to change password', 400)
      );
    }

    if (req.body.newPassword.length < 8) {
      return next(new ErrorResponse('New password must be at least 8 characters', 400));
    }

    const isCurrentPasswordValid = await bcrypt.compare(req.body.currentPassword, provider.password);
    if (!isCurrentPasswordValid) {
      return next(new ErrorResponse('Current password is incorrect', 400));
    }

    const salt = await bcrypt.genSalt(10);
    provider.password = await bcrypt.hash(req.body.newPassword, salt);
  }

  await provider.save();

  const updatedProvider = await User.findById(providerId).select('-password');

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedProvider
  });
});
