const Service = require('../models/Service');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Public/admin service catalog handlers (list/detail + admin CRUD).
// @desc    Get all services (only active ones)
// @route   GET /api/services
// @access  Public
exports.getServices = asyncHandler(async (req, res, next) => {
  const services = await Service.find({ isActive: true }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, message: 'Services retrieved', data: services });
});

// @desc    Get one service
// @route   GET /api/services/:id
// @access  Public
exports.getServiceById = asyncHandler(async (req, res, next) => {
  const service = await Service.findOne({ _id: req.params.id, isActive: true });
  if (!service) {
    return next(new ErrorResponse('Service not found', 404));
  }
  res.status(200).json({ success: true, message: 'Service retrieved', data: service });
});

// @desc    Create a new service
// @route   POST /api/services
// @access  Admin
exports.createService = asyncHandler(async (req, res, next) => {
  const { name, price, duration, category, description, commissionRate, isActive } = req.body;
  if (!name || !price || !duration) {
    return next(new ErrorResponse('Name, price and duration are required', 400));
  }

  const service = await Service.create({
    name,
    price,
    duration,
    category,
    description,
    commissionRate,
    isActive
  });
  res.status(201).json({ success: true, message: 'Service created', data: service });
});

// @desc    Update an existing service
// @route   PATCH /api/services/:id
// @access  Admin
exports.updateService = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  const service = await Service.findById(id);
  if (!service) {
    return next(new ErrorResponse('Service not found', 404));
  }

  Object.assign(service, updates);
  await service.save();

  res.status(200).json({ success: true, message: 'Service updated', data: service });
});

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Admin
exports.deleteService = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const service = await Service.findById(id);
  if (!service) {
    return next(new ErrorResponse('Service not found', 404));
  }
  await Service.findByIdAndDelete(id);
  res.status(200).json({ success: true, message: 'Service deleted', data: {} });
});
