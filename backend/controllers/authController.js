const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { auditLogger } = require('../utils/auditLogger');
const { sendPasswordResetEmail, isResetTokenValid, clearResetToken } = require('../utils/passwordReset');
const { validatePasswordStrength } = require('../utils/validators');
const {
  normalizeEmail,
  isEmailIdentifier,
  buildPhoneLookupQuery,
  resolveLoginIdentifier,
  resolveRegistrationIdentifiers
} = require('../utils/authIdentity');

// Authentication controller for register/login/session lookup and token lifecycle.
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const signToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  console.log(
    `[auth] Issued JWT for user=${user._id.toString()} role=${user.role} expiresIn=${JWT_EXPIRES_IN}`
  );

  return token;
};

const sanitizeUser = (userDoc) => ({
  id: userDoc._id,
  _id: userDoc._id,
  name: userDoc.name,
  firstName: userDoc.firstName || '',
  lastName: userDoc.lastName || '',
  phone: userDoc.phone,
  email: userDoc.email || '',
  role: userDoc.role,
  status: userDoc.status,
  isAvailable: userDoc.isAvailable !== false,
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

const escapeRegex = (value = '') =>
  String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findUserByLoginIdentifier = async (loginId = '') => {
  const identifier = String(loginId || '').trim();
  if (!identifier) {
    return null;
  }

  if (isEmailIdentifier(identifier)) {
    const normalized = normalizeEmail(identifier);
    const userByEmail = await User.findOne({ email: normalized });
    if (userByEmail) {
      return userByEmail;
    }

    // Legacy compatibility: older records may have email in the `phone` field.
    let userByLegacyPhone = await User.findOne(buildPhoneLookupQuery(normalized));
    if (!userByLegacyPhone && normalized !== identifier) {
      userByLegacyPhone = await User.findOne(buildPhoneLookupQuery(identifier));
    }
    if (!userByLegacyPhone) {
      userByLegacyPhone = await User.findOne({
        phone: { $regex: new RegExp(`^${escapeRegex(identifier)}$`, 'i') }
      });
    }
    return userByLegacyPhone;
  }

  return User.findOne(buildPhoneLookupQuery(identifier));
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, firstName, lastName, phone, email, identifier, password, role, adminKey } = req.body;
  const { normalizedPhone, normalizedEmail } = resolveRegistrationIdentifiers({
    phone,
    email,
    identifier
  });

  if ((!name && !firstName) || !normalizedPhone || !password) {
    return next(new ErrorResponse('Name, email/phone and password are required', 400));
  }

  // SECURITY: Enforce strong password requirements
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    auditLogger.log('SECURITY', 'WEAK_PASSWORD_ATTEMPT', 'User attempted registration with weak password', { phone: normalizedPhone });
    return next(new ErrorResponse(passwordError, 400));
  }

  const safeRole = ['user', 'provider', 'admin'].includes(role) ? role : 'user';

  if (safeRole === 'admin') {
    const allowed = await canRegisterAdmin(adminKey);
    if (!allowed) {
      auditLogger.log('SECURITY', 'UNAUTHORIZED_ADMIN_REGISTRATION', 'Unauthorized attempt to register as admin', { phone: normalizedPhone });
      return next(new ErrorResponse('Admin registration is restricted', 403));
    }
  }

  let existing = await User.findOne(buildPhoneLookupQuery(normalizedPhone));
  if (existing) {
    return next(new ErrorResponse('Phone number already registered', 409));
  }

  if (normalizedEmail) {
    existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return next(new ErrorResponse('Email already registered', 409));
    }
  }

  const hashed = await User.hashPassword(password);

  const user = await User.create({
    name: name || `${firstName || ''} ${lastName || ''}`.trim(),
    firstName,
    lastName,
    phone: normalizedPhone,
    email: normalizedEmail || undefined,
    password: hashed,
    role: safeRole,
    status: safeRole === 'provider' ? 'pending' : 'active',
    approved: safeRole !== 'provider',
    isApproved: safeRole !== 'provider',
    verified: safeRole !== 'provider'
  });

  // SECURITY: Log successful registration
  auditLogger.log('AUTHENTICATION', 'USER_REGISTERED', 'New user registered successfully', { userId: user._id, role: safeRole });

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
  const { phone, email, identifier, password } = req.body;
  const loginId = resolveLoginIdentifier({ identifier, phone, email });
  if (!loginId || !password) {
    return next(new ErrorResponse('Phone/Email and password are required', 400));
  }

  const user = await findUserByLoginIdentifier(loginId);
  
  if (!user) {
    // SECURITY: Log failed login attempt
    auditLogger.log('AUTHENTICATION', 'LOGIN_FAILED', 'Login attempt with non-existent user', { identifier: loginId, ip: req.ip });
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    // SECURITY: Log failed password attempt
    auditLogger.log('AUTHENTICATION', 'LOGIN_FAILED', 'Login attempt with wrong password', { userId: user._id, ip: req.ip });
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  if (user.role === 'provider' && (!user.approved || !user.isApproved || user.status !== 'active')) {
    return next(new ErrorResponse('Provider account is pending approval', 403));
  }

  if (['inactive', 'suspended', 'rejected'].includes(user.status)) {
    // SECURITY: Log attempt to login with inactive account
    auditLogger.log('AUTHENTICATION', 'LOGIN_FAILED', `Login attempt with ${user.status} account`, { userId: user._id, status: user.status, ip: req.ip });
    return next(new ErrorResponse('Account is not active', 403));
  }

  const token = signToken(user);

  // SECURITY: Log successful login
  auditLogger.log('AUTHENTICATION', 'LOGIN_SUCCESS', 'User logged in successfully', { userId: user._id, role: user.role, ip: req.ip });

  res.status(200).json({
    success: true,
    message: 'Logged in',
    data: { token, user: sanitizeUser(user) }
  });
});

// @desc    Forgot password - Generate and send secure reset token
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email, phone, identifier } = req.body;
  const loginId = resolveLoginIdentifier({ identifier, phone, email });

  if (!loginId) {
    return next(new ErrorResponse('Please provide your email or phone number', 400));
  }

  const user = await findUserByLoginIdentifier(loginId);
  if (!user) {
    // SECURITY: Don't reveal if user exists or not
    // Return success to prevent user enumeration
    auditLogger.log('SECURITY', 'PASSWORD_RESET_ATTEMPT', 'Password reset attempt for non-existent user', { identifier: loginId });
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email/phone, you will receive a password reset link'
    });
  }

  // Check if user has email (required for password reset)
  if (!user.email) {
    auditLogger.log('SECURITY', 'PASSWORD_RESET_FAILED', 'Password reset attempt for user without email', { userId: user._id });
    return res.status(400).json({
      success: false,
      message: 'This account does not have an email address. Please contact support.'
    });
  }

  // CRITICAL: Generate secure reset token
  const resetToken = user.generatePasswordResetToken();
  
  // Save the token hash and expiration to database
  await user.save();

  // SECURITY: Send password reset email with token
  try {
    await sendPasswordResetEmail(user, resetToken);
    
    auditLogger.log('AUTHENTICATION', 'PASSWORD_RESET_REQUESTED', 'Password reset email sent', { userId: user._id, email: user.email });
    
    return res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  } catch (emailError) {
    // Clear the reset token if email send fails
    clearResetToken(user);
    await user.save();
    
    console.error('Password reset email failed:', emailError.message);
    auditLogger.log('SECURITY', 'PASSWORD_RESET_EMAIL_FAILED', `Failed to send reset email: ${emailError.message}`, { userId: user._id });
    
    return next(new ErrorResponse('Failed to send reset email. Please try again later.', 500));
  }
});

// @desc    Reset password using secure token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { token, newPassword, confirmPassword } = req.body;

  // Validate inputs
  if (!token || !newPassword || !confirmPassword) {
    return next(new ErrorResponse('Token and new password are required', 400));
  }

  // Validate password confirmation
  if (newPassword !== confirmPassword) {
    return next(new ErrorResponse('Passwords do not match', 400));
  }

  // Validate password strength
  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    return next(new ErrorResponse(passwordError, 400));
  }

  // Find user with valid reset token
  // Note: We search by the hashed token which is stored in DB
  const crypto = require('crypto');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    auditLogger.log('SECURITY', 'INVALID_RESET_TOKEN', 'Invalid or expired password reset token used', { token: token.substring(0, 10) });
    return next(new ErrorResponse('Invalid or expired reset token', 400));
  }

  // CRITICAL: Hash and set new password
  const hashedPassword = await User.hashPassword(newPassword);
  user.password = hashedPassword;
  
  // Clear reset token after successful reset
  clearResetToken(user);
  
  // Save updated user
  await user.save();

  // SECURITY: Log successful password reset
  auditLogger.log('AUTHENTICATION', 'PASSWORD_RESET_SUCCESS', 'Password reset completed successfully', { userId: user._id, email: user.email });

  // Return success message (don't auto-login for security)
  res.status(200).json({
    success: true,
    message: 'Password reset successfully. Please login with your new password.'
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
