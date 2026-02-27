const bcrypt = require('bcryptjs');
const Service = require('../models/Service');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Admin controller: metrics + CRUD operations for users/providers/services/bookings/payments.
const BOOKING_STATUS_ALIASES = {
  confirmed: 'accepted',
  no_show: 'cancelled'
};

const parseStatus = (status) => BOOKING_STATUS_ALIASES[status] || status;

const toPagination = (page = 1, limit = 10) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.max(Number(limit) || 10, 1);
  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit
  };
};

const splitName = (user) => {
  const firstName = user.firstName || user.name?.split(' ')[0] || '';
  const lastName = user.lastName || user.name?.split(' ').slice(1).join(' ') || '';
  return { firstName, lastName };
};

const mapUser = (user) => {
  const { firstName, lastName } = splitName(user);
  return {
    _id: user._id,
    id: user._id,
    firstName,
    lastName,
    name: user.name || `${firstName} ${lastName}`.trim(),
    email: user.email || '',
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

const mapService = (service) => ({
  _id: service._id,
  id: service._id,
  name: service.name,
  description: service.description || '',
  category: service.category || 'other',
  price: service.price,
  duration: service.duration,
  commissionRate: service.commissionRate || 10,
  status: service.isActive ? 'active' : 'inactive',
  imageUrl: service.imageUrl || '',
  createdAt: service.createdAt,
  updatedAt: service.updatedAt
});

const mapProvider = (provider, performance = {}) => {
  const { firstName, lastName } = splitName(provider);
  return {
    _id: provider._id,
    id: provider._id,
    firstName,
    lastName,
    name: provider.name || `${firstName} ${lastName}`.trim(),
    email: provider.email || '',
    phone: provider.phone,
    businessName: provider.businessName || provider.name || '',
    category: provider.category || 'other',
    description: provider.description || '',
    address: provider.address?.street || '',
    city: provider.address?.city || '',
    state: provider.address?.state || '',
    zipCode: provider.address?.zip || '',
    country: provider.address?.country || '',
    commissionRate: provider.commissionRate || 10,
    serviceRadiusKm: provider.serviceRadiusKm || 15,
    services: provider.serviceIds || [],
    status: provider.status,
    approved: Boolean(provider.approved),
    isApproved: Boolean(provider.isApproved),
    verified: Boolean(provider.verified),
    isBlocked: Boolean(provider.isBlocked),
    totalBookings: performance.totalBookings || 0,
    totalRevenue: performance.totalRevenue || 0,
    averageRating: performance.averageRating || 0,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt
  };
};

const ensureUniquePhoneEmail = async ({ email, phone, excludeId = null }) => {
  if (phone) {
    const phoneExists = await User.findOne({ phone, _id: { $ne: excludeId } });
    if (phoneExists) {
      throw new ErrorResponse('Phone number already exists', 400);
    }
  }

  if (email) {
    const emailExists = await User.findOne({ email, _id: { $ne: excludeId } });
    if (emailExists) {
      throw new ErrorResponse('Email already exists', 400);
    }
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Admin
exports.getProfile = asyncHandler(async (req, res, next) => {
  const admin = await User.findById(req.user.id).select('-password').lean();
  if (!admin) {
    return next(new ErrorResponse('Admin not found', 404));
  }

  const stats = {
    totalUsers: await User.countDocuments({ role: 'user' }),
    totalProviders: await User.countDocuments({ role: 'provider' }),
    activeProviders: await User.countDocuments({ role: 'provider', status: 'active', approved: true }),
    totalBookings: await Booking.countDocuments(),
    completedBookings: await Booking.countDocuments({ status: 'completed' }),
    totalRevenue:
      (
        await Payment.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
        ])
      )[0]?.total || 0
  };

  res.status(200).json({
    success: true,
    message: 'Admin profile retrieved',
    data: { admin: mapUser(admin), stats }
  });
});

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Admin
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, email, phone } = req.body;
  await ensureUniquePhoneEmail({ email, phone, excludeId: req.user.id });

  const admin = await User.findByIdAndUpdate(
    req.user.id,
    { name, email, phone },
    { new: true, runValidators: true }
  ).select('-password');

  if (!admin) {
    return next(new ErrorResponse('Admin not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: mapUser(admin)
  });
});

// @desc    Get dashboard analytics
// @route   GET /api/admin/analytics
// @access  Admin
exports.getDashboardAnalytics = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments({ role: 'user' });
  const activeProviders = await User.countDocuments({ role: 'provider', status: 'active', approved: true });
  const totalBookings = await Booking.countDocuments();
  const pendingBookings = await Booking.countDocuments({ status: 'pending' });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthlyRevenue =
    (
      await Payment.aggregate([
        { $match: { status: 'completed', completedAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
      ])
    )[0]?.total || 0;

  const revenueData = [];
  const bookingGrowthData = [];
  for (let i = 5; i >= 0; i -= 1) {
    const start = new Date();
    start.setMonth(start.getMonth() - i, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const [monthRevenue, monthBookings] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'completed', completedAt: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
      ]),
      Booking.countDocuments({ createdAt: { $gte: start, $lt: end } })
    ]);

    revenueData.push({ date: start.toISOString(), revenue: monthRevenue[0]?.total || 0 });
    bookingGrowthData.push({ date: start.toISOString(), bookings: monthBookings });
  }

  const topProviderRows = await Payment.aggregate([
    { $match: { status: 'completed', providerId: { $ne: null } } },
    {
      $group: {
        _id: '$providerId',
        totalRevenue: { $sum: '$commissionAmount' },
        totalBookings: { $sum: 1 }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 10 }
  ]);
  const topProviderIds = topProviderRows.map((row) => row._id);
  const topProvidersById = await User.find({ _id: { $in: topProviderIds } }).lean();
  const topProviders = topProviderRows.map((row) => {
    const provider = topProvidersById.find((item) => item._id.toString() === row._id.toString());
    const names = provider ? splitName(provider) : { firstName: '', lastName: '' };
    return {
      _id: row._id,
      businessName: provider?.businessName || provider?.name || 'Provider',
      firstName: names.firstName,
      lastName: names.lastName,
      totalBookings: row.totalBookings,
      totalRevenue: row.totalRevenue,
      completionRate: row.totalBookings ? 100 : 0,
      averageRating: 4.5
    };
  });

  const serviceRows = await Booking.aggregate([
    { $group: { _id: '$serviceId', bookingCount: { $sum: 1 } } },
    { $sort: { bookingCount: -1 } },
    { $limit: 6 }
  ]);
  const serviceIds = serviceRows.map((row) => row._id);
  const services = await Service.find({ _id: { $in: serviceIds } }).lean();
  const serviceDistribution = serviceRows.map((row) => ({
    name: services.find((s) => s._id.toString() === row._id.toString())?.name || 'Service',
    value: row.bookingCount
  }));

  const recentBookings = await Booking.find()
    .sort({ updatedAt: -1 })
    .limit(8)
    .populate('customerId', 'name firstName lastName')
    .populate('serviceId', 'name')
    .lean();
  const recentActivity = recentBookings.map((booking) => {
    const names = splitName(booking.customerId || {});
    return {
      type: 'booking',
      title: `Booking ${booking.status}`,
      description: `${names.firstName} ${names.lastName}`.trim() +
        ` • ${booking.serviceId?.name || 'Service'}`,
      timestamp: booking.updatedAt
    };
  });

  res.status(200).json({
    success: true,
    message: 'Dashboard analytics retrieved',
    data: {
      overview: {
        totalUsers,
        activeProviders,
        totalBookings,
        monthlyRevenue,
        pendingBookings,
        recentActivity
      },
      revenueData,
      bookingGrowthData,
      topProviders,
      serviceDistribution,
      recentActivity
    }
  });
});

// @desc    Get all services
// @route   GET /api/admin/services
// @access  Admin
exports.getAllServices = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    category,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const { skip, limit: safeLimit, page: safePage } = toPagination(page, limit);
  const query = {};
  if (category) query.category = category;
  if (status) query.isActive = status === 'active';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const [services, total] = await Promise.all([
    Service.find(query).sort(sort).skip(skip).limit(safeLimit),
    Service.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    message: 'Services retrieved',
    data: {
      services: services.map(mapService),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    }
  });
});

// @desc    Create a new service
// @route   POST /api/admin/services
// @access  Admin
exports.createService = asyncHandler(async (req, res, next) => {
  const {
    name,
    price,
    duration,
    category,
    description,
    commissionRate = 10,
    status = 'active',
    imageUrl = ''
  } = req.body;

  if (!name || !price || !duration) {
    return next(new ErrorResponse('Name, price and duration are required', 400));
  }

  const service = await Service.create({
    name,
    price,
    duration,
    category: category || 'other',
    description: description || '',
    commissionRate,
    isActive: status === 'active',
    imageUrl
  });

  res.status(201).json({
    success: true,
    message: 'Service created',
    data: mapService(service)
  });
});

// @desc    Update service
// @route   PUT /api/admin/services/:id
// @access  Admin
exports.updateService = asyncHandler(async (req, res, next) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    return next(new ErrorResponse('Service not found', 404));
  }

  const updates = { ...req.body };
  if (updates.status) {
    updates.isActive = updates.status === 'active';
    delete updates.status;
  }

  Object.assign(service, updates);
  await service.save();

  res.status(200).json({
    success: true,
    message: 'Service updated',
    data: mapService(service)
  });
});

// @desc    Delete service
// @route   DELETE /api/admin/services/:id
// @access  Admin
exports.deleteService = asyncHandler(async (req, res, next) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    return next(new ErrorResponse('Service not found', 404));
  }
  await Service.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Service deleted successfully', data: {} });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
exports.getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    pageSize = 10,
    limit = pageSize,
    search = '',
    status,
    role,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const { skip, limit: safeLimit, page: safePage } = toPagination(page, limit);
  const query = { role: role || { $in: ['user', 'admin'] } };
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const [users, total] = await Promise.all([
    User.find(query).select('-password').sort(sort).skip(skip).limit(safeLimit),
    User.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    message: 'Users retrieved',
    data: {
      users: users.map(mapUser),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    }
  });
});

// @desc    Create user
// @route   POST /api/admin/users
// @access  Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    name,
    email,
    phone,
    role = 'user',
    status = 'active',
    password = 'ChangeMe@123'
  } = req.body;

  if ((!firstName && !name) || !phone) {
    return next(new ErrorResponse('Name and phone are required', 400));
  }

  await ensureUniquePhoneEmail({ email, phone });
  const hashed = await bcrypt.hash(password, 10);

  const createdUser = await User.create({
    firstName,
    lastName,
    name: name || `${firstName || ''} ${lastName || ''}`.trim(),
    email,
    phone,
    role,
    status,
    approved: role !== 'provider',
    verified: role !== 'provider',
    password: hashed
  });

  res.status(201).json({
    success: true,
    message: 'User created',
    data: mapUser(createdUser)
  });
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  await ensureUniquePhoneEmail({
    email: req.body.email,
    phone: req.body.phone,
    excludeId: user._id
  });

  const updates = { ...req.body };
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 10);
  }

  Object.assign(user, updates);
  if (updates.firstName || updates.lastName) {
    user.name = `${updates.firstName || user.firstName || ''} ${updates.lastName || user.lastName || ''}`.trim();
  }

  await user.save();
  const saved = await User.findById(user._id).select('-password');

  res.status(200).json({
    success: true,
    message: 'User updated',
    data: mapUser(saved)
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'User deleted successfully', data: {} });
});

const mapBooking = (booking) => {
  const customer = booking.customerId || {};
  const provider = booking.providerId || {};
  const service = booking.serviceId || {};
  const customerName = splitName(customer);
  const providerName = splitName(provider);

  return {
    _id: booking._id,
    id: booking._id,
    bookingId: booking._id.toString().slice(-8).toUpperCase(),
    user: {
      _id: customer._id,
      firstName: customerName.firstName,
      lastName: customerName.lastName,
      email: customer.email || '',
      phone: customer.phone || ''
    },
    provider: {
      _id: provider._id,
      firstName: providerName.firstName,
      lastName: providerName.lastName,
      businessName: provider.businessName || provider.name || '',
      email: provider.email || '',
      phone: provider.phone || ''
    },
    service: {
      _id: service._id,
      name: service.name || '',
      description: service.description || '',
      price: service.price || 0,
      duration: service.duration || 0
    },
    scheduledDate: booking.scheduledTime || booking.date,
    date: booking.date,
    time: booking.time,
    status: booking.status,
    notes:
      booking.cancellationReason ||
      booking.rejectionReason ||
      booking.statusHistory?.[booking.statusHistory.length - 1]?.note ||
      '',
    address: booking.address,
    totalAmount: booking.totalAmount,
    commissionAmount: booking.commissionAmount,
    paymentStatus: booking.paymentStatus,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt
  };
};

const mapPayment = (payment) => {
  const booking = payment.bookingId || {};
  const customer = booking.customerId || {};
  const provider = booking.providerId || {};
  const service = booking.serviceId || {};
  const customerName = splitName(customer);
  const providerName = splitName(provider);

  return {
    _id: payment._id,
    id: payment._id,
    transactionId: payment.transactionId || `cash_${payment._id.toString().slice(-8)}`,
    amount: payment.amount,
    commissionRate: payment.commissionRate,
    commissionAmount: payment.commissionAmount,
    netAmount: payment.netAmount,
    paymentMethod: payment.paymentMethod,
    status: payment.status,
    refundedAmount: payment.refundedAmount || 0,
    notes: payment.notes || '',
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    completedAt: payment.completedAt || null,
    booking: {
      _id: booking._id,
      bookingId: booking._id ? booking._id.toString().slice(-8).toUpperCase() : '',
      user: {
        _id: customer._id,
        firstName: customerName.firstName,
        lastName: customerName.lastName,
        email: customer.email || '',
        phone: customer.phone || ''
      },
      provider: {
        _id: provider._id,
        firstName: providerName.firstName,
        lastName: providerName.lastName,
        businessName: provider.businessName || provider.name || '',
        phone: provider.phone || ''
      },
      service: {
        _id: service._id,
        name: service.name || '',
        price: service.price || 0
      }
    }
  };
};

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Admin
exports.getAllBookings = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  const { skip, limit: safeLimit, page: safePage } = toPagination(page, limit);

  const query = {};
  if (status) query.status = parseStatus(status);
  if (startDate || endDate) {
    query.scheduledTime = {};
    if (startDate) query.scheduledTime.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.scheduledTime.$lte = end;
    }
  }

  const sort = { [sortBy === 'scheduledDate' ? 'scheduledTime' : sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const rows = await Booking.find(query)
    .populate('customerId', 'name firstName lastName email phone')
    .populate('providerId', 'name firstName lastName businessName email phone')
    .populate('serviceId', 'name description price duration')
    .sort(sort);

  const filteredRows = search
    ? rows.filter((row) => {
        const searchText = `${row._id} ${row.customerId?.name || ''} ${row.providerId?.name || ''} ${row.serviceId?.name || ''}`
          .toLowerCase();
        return searchText.includes(search.toLowerCase());
      })
    : rows;

  const total = filteredRows.length;
  const paged = filteredRows.slice(skip, skip + safeLimit);

  res.status(200).json({
    success: true,
    message: 'Bookings retrieved',
    data: {
      bookings: paged.map(mapBooking),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    }
  });
});

const parseDateTime = (date, time) => {
  const direct = new Date(`${date}T${time}`);
  if (!Number.isNaN(direct.getTime())) return direct;
  const fallback = new Date(`${date} ${time}`);
  if (!Number.isNaN(fallback.getTime())) return fallback;
  throw new Error('Invalid booking date/time');
};

// @desc    Create booking
// @route   POST /api/admin/bookings
// @access  Admin
exports.createBooking = asyncHandler(async (req, res, next) => {
  const { user, provider, service, date, time, status = 'pending', notes = '', address = '' } = req.body;
  if (!user || !provider || !service || !date || !time) {
    return next(new ErrorResponse('User, provider, service, date and time are required', 400));
  }

  const serviceDoc = await Service.findById(service);
  if (!serviceDoc) {
    return next(new ErrorResponse('Service not found', 404));
  }

  const scheduledTime = parseDateTime(date, time);
  const normalizedDate = new Date(scheduledTime);
  normalizedDate.setHours(0, 0, 0, 0);
  const parsedStatus = parseStatus(status);
  const amount = Number(serviceDoc.price || 0);
  const commissionAmount = Number(((amount * (serviceDoc.commissionRate || 10)) / 100).toFixed(2));

  const booking = await Booking.create({
    customerId: user,
    providerId: provider,
    serviceId: service,
    date: normalizedDate,
    time,
    scheduledTime,
    status: parsedStatus,
    totalAmount: amount,
    commissionRate: serviceDoc.commissionRate || 10,
    commissionAmount,
    providerPayout: Number((amount - commissionAmount).toFixed(2)),
    address: address || 'Address not provided',
    statusHistory: [
      {
        status: parsedStatus,
        changedBy: req.user.id,
        role: 'admin',
        note: notes
      }
    ]
  });

  await Payment.create({
    bookingId: booking._id,
    customerId: user,
    providerId: provider,
    serviceId: service,
    amount,
    commissionRate: booking.commissionRate,
    commissionAmount: booking.commissionAmount,
    netAmount: booking.providerPayout,
    paymentMethod: 'cash',
    status: parsedStatus === 'completed' ? 'completed' : 'pending'
  });

  const populated = await Booking.findById(booking._id)
    .populate('customerId', 'name firstName lastName email phone')
    .populate('providerId', 'name firstName lastName businessName email phone')
    .populate('serviceId', 'name description price duration');

  res.status(201).json({
    success: true,
    message: 'Booking created',
    data: mapBooking(populated)
  });
});

// @desc    Update booking
// @route   PUT /api/admin/bookings/:id
// @access  Admin
exports.updateBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return next(new ErrorResponse('Booking not found', 404));
  }

  const updates = { ...req.body };
  if (updates.status) {
    updates.status = parseStatus(updates.status);
  }

  if (updates.date || updates.time) {
    const nextDate = updates.date || booking.date.toISOString().slice(0, 10);
    const nextTime = updates.time || booking.time;
    updates.scheduledTime = parseDateTime(nextDate, nextTime);
    const normalizedDate = new Date(updates.scheduledTime);
    normalizedDate.setHours(0, 0, 0, 0);
    updates.date = normalizedDate;
  }

  const previousStatus = booking.status;
  Object.assign(booking, updates);

  if (updates.status && updates.status !== previousStatus) {
    booking.statusHistory.push({
      status: updates.status,
      changedBy: req.user.id,
      role: 'admin',
      note: updates.notes || ''
    });
  }

  await booking.save();
  const populated = await Booking.findById(booking._id)
    .populate('customerId', 'name firstName lastName email phone')
    .populate('providerId', 'name firstName lastName businessName email phone')
    .populate('serviceId', 'name description price duration');

  res.status(200).json({
    success: true,
    message: 'Booking updated',
    data: mapBooking(populated)
  });
});

// @desc    Delete booking
// @route   DELETE /api/admin/bookings/:id
// @access  Admin
exports.deleteBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return next(new ErrorResponse('Booking not found', 404));
  }
  await Booking.findByIdAndDelete(req.params.id);
  await Payment.deleteMany({ bookingId: req.params.id });
  res.status(200).json({ success: true, message: 'Booking deleted', data: {} });
});

// @desc    Get all providers
// @route   GET /api/admin/providers
// @access  Admin
exports.getAllProviders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    verified,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  const { skip, limit: safeLimit, page: safePage } = toPagination(page, limit);

  const query = { role: 'provider' };
  if (verified === 'true') query.verified = true;
  if (verified === 'false') query.verified = false;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { businessName: { $regex: search, $options: 'i' } }
    ];
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const [providers, total] = await Promise.all([
    User.find(query).sort(sort).skip(skip).limit(safeLimit).lean(),
    User.countDocuments(query)
  ]);

  const providerIds = providers.map((provider) => provider._id);
  const [bookingStats, paymentStats] = await Promise.all([
    Booking.aggregate([
      { $match: { providerId: { $in: providerIds } } },
      { $group: { _id: '$providerId', totalBookings: { $sum: 1 } } }
    ]),
    Payment.aggregate([
      { $match: { providerId: { $in: providerIds }, status: 'completed' } },
      { $group: { _id: '$providerId', totalRevenue: { $sum: '$commissionAmount' } } }
    ])
  ]);

  const bookingStatsMap = new Map(bookingStats.map((item) => [item._id.toString(), item.totalBookings]));
  const paymentStatsMap = new Map(paymentStats.map((item) => [item._id.toString(), item.totalRevenue]));

  const mapped = providers.map((provider) =>
    mapProvider(provider, {
      totalBookings: bookingStatsMap.get(provider._id.toString()) || 0,
      totalRevenue: paymentStatsMap.get(provider._id.toString()) || 0,
      averageRating: 4.5
    })
  );

  res.status(200).json({
    success: true,
    message: 'Providers retrieved',
    data: {
      providers: mapped,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    }
  });
});

// @desc    Create provider
// @route   POST /api/admin/providers
// @access  Admin
exports.createProvider = asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    name,
    email,
    phone,
    businessName,
    address,
    city,
    state,
    zipCode,
    country = 'India',
    category = 'other',
    description = '',
    commissionRate = 10,
    serviceRadiusKm = 15,
    services = [],
    approved = false,
    password = 'ChangeMe@123'
  } = req.body;

  if ((!firstName && !name) || !phone) {
    return next(new ErrorResponse('Name and phone are required', 400));
  }

  await ensureUniquePhoneEmail({ email, phone });
  const hashed = await bcrypt.hash(password, 10);

  const provider = await User.create({
    firstName,
    lastName,
    name: name || `${firstName || ''} ${lastName || ''}`.trim(),
    email,
    phone,
    password: hashed,
    role: 'provider',
    businessName: businessName || name || `${firstName || ''} ${lastName || ''}`.trim(),
    category,
    description,
    commissionRate,
    serviceRadiusKm,
    serviceIds: services,
    approved: Boolean(approved),
    verified: Boolean(approved),
    status: approved ? 'active' : 'pending',
    address: {
      street: address || '',
      city: city || '',
      state: state || '',
      zip: zipCode || '',
      country
    }
  });

  res.status(201).json({
    success: true,
    message: 'Provider created',
    data: mapProvider(provider)
  });
});

// @desc    Update provider
// @route   PUT /api/admin/providers/:id
// @access  Admin
exports.updateProvider = asyncHandler(async (req, res, next) => {
  const provider = await User.findById(req.params.id);
  if (!provider || provider.role !== 'provider') {
    return next(new ErrorResponse('Provider not found', 404));
  }

  await ensureUniquePhoneEmail({
    email: req.body.email,
    phone: req.body.phone,
    excludeId: provider._id
  });

  const updates = { ...req.body };
  if (updates.status && updates.status === 'active') {
    updates.approved = true;
    updates.verified = true;
  }

  if (updates.services) {
    updates.serviceIds = updates.services;
    delete updates.services;
  }

  if (
    updates.address !== undefined ||
    updates.city !== undefined ||
    updates.state !== undefined ||
    updates.zipCode !== undefined ||
    updates.country !== undefined
  ) {
    provider.address = {
      street: updates.address !== undefined ? updates.address : provider.address?.street || '',
      city: updates.city !== undefined ? updates.city : provider.address?.city || '',
      state: updates.state !== undefined ? updates.state : provider.address?.state || '',
      zip: updates.zipCode !== undefined ? updates.zipCode : provider.address?.zip || '',
      country: updates.country !== undefined ? updates.country : provider.address?.country || ''
    };
    delete updates.address;
    delete updates.city;
    delete updates.state;
    delete updates.zipCode;
    delete updates.country;
  }

  Object.assign(provider, updates);
  if (updates.firstName || updates.lastName) {
    provider.name = `${updates.firstName || provider.firstName || ''} ${updates.lastName || provider.lastName || ''}`.trim();
  }
  await provider.save();

  res.status(200).json({
    success: true,
    message: 'Provider updated',
    data: mapProvider(provider)
  });
});

// @desc    Delete provider
// @route   DELETE /api/admin/providers/:id
// @access  Admin
exports.deleteProvider = asyncHandler(async (req, res, next) => {
  const provider = await User.findById(req.params.id);
  if (!provider || provider.role !== 'provider') {
    return next(new ErrorResponse('Provider not found', 404));
  }
  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Provider deleted successfully', data: {} });
});

// @desc    Approve/reject provider
// @route   PATCH /api/admin/providers/:id/verify
// @access  Admin
exports.verifyProvider = asyncHandler(async (req, res, next) => {
  const provider = await User.findById(req.params.id);
  if (!provider || provider.role !== 'provider') {
    return next(new ErrorResponse('Provider not found', 404));
  }

  const approved = Boolean(req.body.verified);
  provider.verified = approved;
  provider.approved = approved;
  provider.isApproved = approved;
  provider.status = approved ? 'active' : 'rejected';
  await provider.save();

  res.status(200).json({
    success: true,
    message: `Provider ${approved ? 'approved' : 'rejected'} successfully`,
    data: mapProvider(provider)
  });
});

// @desc    Block/unblock provider
// @route   PATCH /api/admin/providers/:id/block
// @access  Admin
exports.blockProvider = asyncHandler(async (req, res, next) => {
  const provider = await User.findById(req.params.id);
  if (!provider || provider.role !== 'provider') {
    return next(new ErrorResponse('Provider not found', 404));
  }

  const blocked = Boolean(req.body.blocked);
  provider.isBlocked = blocked;
  provider.status = blocked ? 'suspended' : 'active';
  await provider.save();

  res.status(200).json({
    success: true,
    message: `Provider ${blocked ? 'blocked' : 'unblocked'} successfully`,
    data: mapProvider(provider)
  });
});

// @desc    Get all payments
// @route   GET /api/admin/payments
// @access  Admin
exports.getAllPayments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const { skip, limit: safeLimit, page: safePage } = toPagination(page, limit);
  const query = {};
  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }
  if (search) {
    query.transactionId = { $regex: search, $options: 'i' };
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'customerId', select: 'name firstName lastName email phone' },
          { path: 'providerId', select: 'name firstName lastName businessName phone' },
          { path: 'serviceId', select: 'name price' }
        ]
      })
      .sort(sort)
      .skip(skip)
      .limit(safeLimit),
    Payment.countDocuments(query)
  ]);

  const summary = await Payment.aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, '$commissionAmount', 0]
          }
        },
        totalRefunds: {
          $sum: {
            $cond: [
              { $in: ['$status', ['refunded', 'partially_refunded']] },
              '$refundedAmount',
              0
            ]
          }
        },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0]
          }
        }
      }
    }
  ]);

  const totals = summary[0] || { totalRevenue: 0, totalRefunds: 0, pendingAmount: 0 };
  const responseSummary = {
    totalRevenue: totals.totalRevenue,
    totalRefunds: totals.totalRefunds,
    netRevenue: totals.totalRevenue - totals.totalRefunds,
    pendingAmount: totals.pendingAmount
  };

  res.status(200).json({
    success: true,
    message: 'Payments retrieved',
    data: {
      payments: payments.map(mapPayment),
      summary: responseSummary,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    }
  });
});

// @desc    Process refund
// @route   POST /api/admin/payments/refund/:id
// @access  Admin
exports.refundPayment = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    return next(new ErrorResponse('Payment not found', 404));
  }
  if (!['completed', 'partially_refunded'].includes(payment.status)) {
    return next(new ErrorResponse('Only completed payments can be refunded', 400));
  }

  payment.status = 'refunded';
  payment.refundedAmount = payment.amount;
  payment.updatedAt = new Date();
  await payment.save();

  await Booking.findByIdAndUpdate(payment.bookingId, {
    paymentStatus: 'refunded'
  });

  res.status(200).json({
    success: true,
    message: 'Payment refunded successfully',
    data: mapPayment(payment)
  });
});

// @desc    Get commission configuration
// @route   GET /api/admin/commissions
// @access  Admin
exports.getCommissions = asyncHandler(async (req, res) => {
  const [services, providers] = await Promise.all([
    Service.find().select('name commissionRate isActive').lean(),
    User.find({ role: 'provider' }).select('name firstName lastName businessName commissionRate status').lean()
  ]);

  res.status(200).json({
    success: true,
    message: 'Commissions retrieved',
    data: {
      services: services.map((service) => ({
        _id: service._id,
        name: service.name,
        commissionRate: service.commissionRate || 10,
        status: service.isActive ? 'active' : 'inactive'
      })),
      providers: providers.map((provider) => {
        const names = splitName(provider);
        return {
          _id: provider._id,
          name: provider.businessName || provider.name || `${names.firstName} ${names.lastName}`.trim(),
          commissionRate: provider.commissionRate || 10,
          status: provider.status
        };
      })
    }
  });
});

// @desc    Update service commission
// @route   PATCH /api/admin/commissions/services/:id
// @access  Admin
exports.updateServiceCommission = asyncHandler(async (req, res, next) => {
  const { commissionRate } = req.body;
  if (commissionRate === undefined) {
    return next(new ErrorResponse('commissionRate is required', 400));
  }

  const service = await Service.findById(req.params.id);
  if (!service) {
    return next(new ErrorResponse('Service not found', 404));
  }

  service.commissionRate = commissionRate;
  await service.save();

  res.status(200).json({
    success: true,
    message: 'Service commission updated',
    data: mapService(service)
  });
});

// @desc    Update provider commission
// @route   PATCH /api/admin/commissions/providers/:id
// @access  Admin
exports.updateProviderCommission = asyncHandler(async (req, res, next) => {
  const { commissionRate } = req.body;
  if (commissionRate === undefined) {
    return next(new ErrorResponse('commissionRate is required', 400));
  }

  const provider = await User.findById(req.params.id);
  if (!provider || provider.role !== 'provider') {
    return next(new ErrorResponse('Provider not found', 404));
  }

  provider.commissionRate = commissionRate;
  await provider.save();

  res.status(200).json({
    success: true,
    message: 'Provider commission updated',
    data: mapProvider(provider)
  });
});
