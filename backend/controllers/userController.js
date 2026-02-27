const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Customer/user controller for profile, address/location updates, and admin user listing.
// @desc    Get current user profile
// @route   GET /api/user/profile
// @access  private
exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Profile retrieved',
    data: user
  });
});

// @desc    Update current user profile
// @route   PUT /api/user/profile
// @access  private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, name, email, phone } = req.body;
  const updateData = {};

  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email || null;
  if (phone !== undefined) updateData.phone = phone;

  const user = await User.findByIdAndUpdate(req.user.id, updateData, {
    new: true,
    runValidators: true
  }).select('-password');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated',
    data: user
  });
});

// @desc    Add user address
// @route   POST /api/user/addresses
// @access  private
exports.addAddress = asyncHandler(async (req, res, next) => {
  const { street, city, state, zip, country } = req.body;
  if (!street && !city && !state && !zip && !country) {
    return next(new ErrorResponse('At least one address field is required', 400));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  user.addresses.push({ street, city, state, zip, country });
  await user.save();

  res.status(201).json({
    success: true,
    message: 'Address added',
    data: user.addresses[user.addresses.length - 1]
  });
});

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select('-password');
  res.status(200).json({ success: true, message: 'Users retrieved', data: users });
});

// @desc    Update a user (admin)
// @route   PATCH /api/users/:id
// @access  admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    select: '-password',
  });
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  res.status(200).json({ success: true, message: 'User updated', data: user });
});

// @desc    Update user location
// @route   POST /api/user/location
// @access  private
exports.updateLocation = asyncHandler(async (req, res, next) => {
  const { address, latitude, longitude, placeId } = req.body;

  // Validate required fields
  if (!address || latitude === undefined || longitude === undefined) {
    return next(new ErrorResponse('Address, latitude, and longitude are required', 400));
  }

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  // Validate coordinates
  if (Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude) ||
      parsedLatitude < -90 || parsedLatitude > 90 || parsedLongitude < -180 || parsedLongitude > 180) {
    return next(new ErrorResponse('Invalid coordinates', 400));
  }

  // Update user location in database
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      $set: {
        'location.address': address,
        'location.latitude': parsedLatitude,
        'location.longitude': parsedLongitude,
        'location.placeId': placeId || null,
        'location.updatedAt': new Date()
      }
    },
    { new: true, runValidators: true, select: '-password' }
  );

  if (!updatedUser) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Location updated successfully',
    data: {
      address: updatedUser.location.address,
      latitude: updatedUser.location.latitude,
      longitude: updatedUser.location.longitude,
      updatedAt: updatedUser.location.updatedAt
    }
  });
});
