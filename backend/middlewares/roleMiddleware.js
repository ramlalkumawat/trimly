const ErrorResponse = require('../utils/errorResponse');

// Role-based authorization helpers with provider/account-state safety checks.
// Enhanced role checker with additional validations
exports.authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  if (!roles.includes(req.user.role)) {
    return next(new ErrorResponse(`Access denied. Required roles: ${roles.join(', ')}`, 403));
  }

  // Additional role-specific validations
  if (req.user.role === 'provider' && (!req.user.approved || !req.user.isApproved)) {
    return next(new ErrorResponse('Provider account is not approved', 403));
  }

  if (req.user.isBlocked) {
    return next(new ErrorResponse('Account is blocked', 403));
  }

  if (['inactive', 'suspended', 'rejected'].includes(req.user.status)) {
    return next(new ErrorResponse('Account is not active', 403));
  }

  next();
};

// Convenience methods for specific roles
exports.onlyAdmin = exports.authorizeRoles('admin');
exports.onlyProvider = exports.authorizeRoles('provider');
exports.onlyCustomer = exports.authorizeRoles('user');

// Allow multiple roles (e.g., admin and provider)
exports.allowAdminAndProvider = exports.authorizeRoles('admin', 'provider');
exports.allowProviderAndCustomer = exports.authorizeRoles('provider', 'user');
exports.allowAllRoles = exports.authorizeRoles('admin', 'provider', 'user');
exports.onlyUser = exports.onlyCustomer;
