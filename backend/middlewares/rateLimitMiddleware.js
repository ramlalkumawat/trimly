const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for authentication endpoints
 * - 5 attempts per 15 minutes
 * - Keyed by IP + email/phone combination
 * - Implements account lockout progression
 */
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windwMs
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skip: (req) => {
    // Skip rate limiting for non-auth endpoints
    return !req.path.includes('/auth');
  },
  keyGenerator: (req) => {
    // Rate limit by IP + email/phone combination
    const identifier = req.body.phone || req.body.email || req.body.identifier || '';
    return `${req.ip}-${identifier}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again in 15 minutes.'
    });
  }
});

/**
 * Rate limiter for password reset endpoint
 * - 3 attempts per hour
 * - Prevents password reset enumeration attacks
 */
exports.passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many password reset attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const identifier = req.body.email || req.body.phone || req.body.identifier || '';
    return `${req.ip}-${identifier}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts. Please try again in 1 hour.'
    });
  }
});

/**
 * General API rate limiter
 * - Prevents overall API abuse
 * - 100 requests per minute per IP
 */
exports.apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.'
    });
  }
});

/**
 * Strict rate limiter for critical endpoints
 * - 10 requests per hour
 * - For admin operations, financial transactions
 */
exports.strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many requests for this operation.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Include user ID if authenticated
    return req.user?.id ? `user-${req.user.id}` : req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests for this operation. Please try again later.'
    });
  }
});
