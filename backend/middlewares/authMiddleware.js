const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

const extractBearerToken = (authHeader = '') => {
  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2) {
    return null;
  }

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme) || !token) {
    return null;
  }
  return token;
};

// Authentication middleware: validates JWT, loads user, and blocks restricted accounts.
exports.protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = extractBearerToken(authHeader);

  console.log(
    `[auth] ${req.method} ${req.originalUrl} authHeaderPresent=${Boolean(authHeader)} tokenPresent=${Boolean(token)}`
  );

  if (!token) {
    const message = authHeader
      ? 'Not authorized, invalid authorization format'
      : 'Not authorized, token missing';
    return next(new ErrorResponse(message, 401));
  }

  if (!process.env.JWT_SECRET) {
    console.error('[auth] JWT_SECRET is not configured');
    return next(new ErrorResponse('Server configuration error', 500));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(
      `[auth] Token verified for user=${decoded.id} route=${req.originalUrl} tokenLength=${token.length}`
    );
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new ErrorResponse('No user found for this token', 401));
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return next(new ErrorResponse('Account is blocked', 403));
    }

    // Check if user is inactive/suspended/rejected
    if (['inactive', 'suspended', 'rejected'].includes(user.status)) {
      return next(new ErrorResponse('Account is not active', 403));
    }

    // For providers, check if approved
    if (user.role === 'provider' && (!user.approved || !user.isApproved)) {
      return next(new ErrorResponse('Provider account is not approved', 403));
    }

    req.user = { 
      id: user._id.toString(), 
      role: user.role,
      status: user.status,
      approved: user.approved,
      isApproved: user.isApproved,
      isBlocked: user.isBlocked,
      name: user.name
    };
    next();
  } catch (err) {
    console.error(
      `[auth] Token verification failed on ${req.method} ${req.originalUrl}: ${err.name} ${err.message}`
    );
    return next(new ErrorResponse('Token invalid or expired', 401));
  }
};
