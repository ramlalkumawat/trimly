const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// Authentication middleware: validates JWT, loads user, and blocks restricted accounts.
exports.protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized, token missing', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
    return next(new ErrorResponse('Token invalid or expired', 401));
  }
};
