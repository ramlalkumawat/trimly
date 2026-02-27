const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Authentication controller for register/login/session lookup and token lifecycle.
const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

const sanitizeUser = (userDoc) => ({
  id: userDoc._id,
  name: userDoc.name,
  firstName: userDoc.firstName || '',
  lastName: userDoc.lastName || '',
  phone: userDoc.phone,
  email: userDoc.email || '',
  role: userDoc.role,
  status: userDoc.status,
  approved: userDoc.approved,
  isApproved: userDoc.isApproved
});

const canRegisterAdmin = async (adminKey = '') => {
  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount === 0) {
    return true;
  }

  const expectedKey = process.env.ADMIN_REGISTRATION_KEY;
  if (expectedKey && adminKey && adminKey === expectedKey) {
    return true;
  }

  return false;
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, firstName, lastName, phone, email, password, role, adminKey } = req.body;

  if ((!name && !firstName) || !phone || !password) {
    return next(new ErrorResponse('Name, phone and password are required', 400));
  }

  if (password.length < 6) {
    return next(new ErrorResponse('Password must be at least 6 characters', 400));
  }

  const safeRole = ['user', 'provider', 'admin'].includes(role) ? role : 'user';

  if (safeRole === 'admin') {
    const allowed = await canRegisterAdmin(adminKey);
    if (!allowed) {
      return next(new ErrorResponse('Admin registration is restricted', 403));
    }
  }

  let existing = await User.findOne({ phone });
  if (existing) {
    return next(new ErrorResponse('Phone number already registered', 400));
  }

  if (email) {
    existing = await User.findOne({ email });
    if (existing) {
      return next(new ErrorResponse('Email already registered', 400));
    }
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  const user = await User.create({
    name: name || `${firstName || ''} ${lastName || ''}`.trim(),
    firstName,
    lastName,
    phone,
    email,
    password: hashed,
    role: safeRole,
    status: safeRole === 'provider' ? 'pending' : 'active',
    approved: safeRole !== 'provider',
    isApproved: safeRole !== 'provider',
    verified: safeRole !== 'provider'
  });

  const shouldIssueToken = !(safeRole === 'provider' && (!user.approved || !user.isApproved || user.status !== 'active'));
  const token = shouldIssueToken ? signToken(user) : null;
  const message =
    safeRole === 'provider' && !token
      ? 'Provider registered and awaiting approval'
      : 'User registered';

  res.status(201).json({
    success: true,
    message,
    data: { token, user: sanitizeUser(user) }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { phone, email, password } = req.body;
  const loginId = phone || email;
  if (!loginId || !password) {
    return next(new ErrorResponse('Phone/Email and password are required', 400));
  }

  let user = await User.findOne({ phone: loginId });
  if (!user) {
    user = await User.findOne({ email: loginId });
  }
  
  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  if (user.role === 'provider' && (!user.approved || !user.isApproved || user.status !== 'active')) {
    return next(new ErrorResponse('Provider account is pending approval', 403));
  }

  if (['inactive', 'suspended', 'rejected'].includes(user.status)) {
    return next(new ErrorResponse('Account is not active', 403));
  }

  const token = signToken(user);

  res.status(200).json({
    success: true,
    message: 'Logged in',
    data: { token, user: sanitizeUser(user) }
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email, phone } = req.body;
  const loginId = (email || phone || '').trim();

  if (!loginId) {
    return next(new ErrorResponse('Please provide your email or phone number', 400));
  }

  const query = loginId.includes('@')
    ? { email: loginId.toLowerCase() }
    : { phone: loginId };

  const user = await User.findOne(query);
  if (!user) {
    return next(new ErrorResponse('No user found with this email/phone', 404));
  }

  // For now, just return success (in production, you'd send an email)
  res.status(200).json({
    success: true,
    message: 'Password reset request accepted'
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Refresh auth token
// @route   POST /api/auth/refresh
// @access  Private
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const token = signToken(user);
  res.status(200).json({
    success: true,
    message: 'Token refreshed',
    data: { token }
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  res.status(200).json({
    success: true,
    message: 'Profile retrieved',
    data: sanitizeUser(user)
  });
});
