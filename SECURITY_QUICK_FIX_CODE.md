# 🔐 Critical Security Fixes - Quick Reference Code

This document contains ready-to-use code snippets for implementing the top 7 critical vulnerabilities.

---

## 1️⃣ MOVE JWT TO HTTONLY COOKIES

### Backend: Install cookie-parser
```bash
npm install cookie-parser
```

### Backend: server.js - Add cookie handling
```javascript
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

// BEFORE (INSECURE)
app.use(cors());
app.use(express.json({ limit: '8mb' }));

// AFTER (SECURE)
app.use(helmet());
app.use(cookieParser());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '100kb' }));
```

### Backend: authController.js - Update login response
```javascript
// BEFORE
res.status(200).json({
  success: true,
  message: 'Logged in',
  data: { token, user: sanitizeUser(user) }
});

// AFTER
res.cookie('authToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

res.status(200).json({
  success: true,
  message: 'Logged in',
  data: { user: sanitizeUser(user) } // Don't return token
});
```

### Frontend: axios.js - Update interceptor
```javascript
// BEFORE
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);

// AFTER
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  credentials: 'include', // Send cookies automatically
  headers: { 'Content-Type': 'application/json' }
});

// Cookies are sent automatically - no need to manually add token
```

### Frontend: auth.js - Remove token storage
```javascript
// BEFORE
export const getStoredToken = () => localStorage.getItem('token');

// AFTER
export const getStoredToken = () => {
  // Tokens are stored in HttpOnly cookies - don't try to access
  return null; 
};

// Only store non-sensitive user data
export const setUserData = (user) => {
  localStorage.setItem('user', JSON.stringify({
    id: user.id,
    name: user.name,
    role: user.role
    // Never store token
  }));
};
```

---

## 2️⃣ IMPLEMENT RATE LIMITING

### Install
```bash
npm install express-rate-limit
```

### Backend: server.js
```javascript
const rateLimit = require('express-rate-limit');

// Auth rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP + email/phone combo
    return `${req.ip}-${req.body.email || req.body.phone}`;
  }
});

// Password reset limiter
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many password reset attempts'
});

// Apply to routes
app.post('/api/auth/login', authLimiter, login);
app.post('/api/auth/register', authLimiter, register);
app.post('/api/auth/forgot-password', resetLimiter, forgotPassword);
```

---

## 3️⃣ ENFORCE STRONG PASSWORDS (12 CHARACTERS)

### Backend: authValidators.js
```javascript
const { body } = require('express-validator');

const registerValidator = [
  body('password')
    .trim()
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must include uppercase, lowercase, numbers, and special characters'),
  // ... other validators
];

exports.registerValidator = registerValidator;
```

### Backend: authController.js
```javascript
// Update validation in register and login
if (password.length < 12) {
  return next(new ErrorResponse('Password must be at least 12 characters', 400));
}

if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
  return next(new ErrorResponse(
    'Password must include uppercase, lowercase, numbers, and special characters',
    400
  ));
}
```

---

## 4️⃣ ADD CSRF PROTECTION

### Install
```bash
npm install csurf express-session
```

### Backend: server.js
```javascript
const csrf = require('csurf');
const session = require('express-session');

// Session for CSRF tokens
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  }
}));

// CSRF protection
const csrfProtection = csrf({ cookie: false });

// Provide CSRF token endpoint
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Protect state-changing routes
app.post('/api/auth/register', csrfProtection, registerValidator, handleValidation, register);
app.post('/api/auth/login', csrfProtection, loginValidator, handleValidation, login);
app.post('/api/admin/*', csrfProtection, protect, onlyAdmin, ...);
app.put('/api/admin/*', csrfProtection, protect, onlyAdmin, ...);
app.patch('/api/admin/*', csrfProtection, protect, onlyAdmin, ...);
app.delete('/api/admin/*', csrfProtection, protect, onlyAdmin, ...);

// CSRF error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  } else {
    next(err);
  }
});
```

### Frontend: axios.js
```javascript
let csrfToken = '';

// Fetch CSRF token on app start
async function initCsrfToken() {
  try {
    const response = await axios.get(`${API_BASE_URL}/csrf-token`);
    csrfToken = response.data.csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
}

initCsrfToken();

// Add to request interceptor
api.interceptors.request.use((config) => {
  if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

// Refresh on 403
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403 && error.response?.data?.message?.includes('CSRF')) {
      await initCsrfToken();
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## 5️⃣ ADD SECURITY HEADERS (HELMET)

### Install
```bash
npm install helmet
```

### Backend: server.js
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://api.trimly.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Frontend: Vercel.json
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" }
      ]
    }
  ]
}
```

---

## 6️⃣ VALIDATE INPUT PROPERLY

### Install
```bash
npm install email-validator libphonenumber-js
```

### Backend: validators.js
```javascript
const validator = require('email-validator');
const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');

// Validate email
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  if (normalized.length > 254) return false;
  return validator.validate(normalized);
};

// Validate phone
export const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return null;
  try {
    const parsed = parsePhoneNumber(phone, 'IN'); // Adjust region as needed
    return parsed && parsed.isValid() ? parsed.number : null;
  } catch {
    return null;
  }
};

// Sanitize input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[{}$]/g, '') // Remove MongoDB operators
    .trim()
    .substring(0, 500);
};
```

### Backend: authValidators.js
```javascript
const { validateEmail, validatePhoneNumber } = require('../utils/validators');

const registerValidator = [
  body('email')
    .optional()
    .custom((value) => {
      if (value && !validateEmail(value)) {
        throw new Error('Invalid email format');
      }
      return true;
    }),
  
  body('phone')
    .optional()
    .custom((value) => {
      if (value && !validatePhoneNumber(value)) {
        throw new Error('Invalid phone number');
      }
      return true;
    }),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 12 }).withMessage('Minimum 12 characters')
    .matches(/[A-Z]/).withMessage('Include uppercase')
    .matches(/[a-z]/).withMessage('Include lowercase')
    .matches(/\d/).withMessage('Include digits')
    .matches(/[@$!%*?&]/).withMessage('Include special characters')
];

exports.registerValidator = registerValidator;
```

---

## 7️⃣ SECURE PASSWORD RESET

### Backend: User.js - Add reset token fields
```javascript
const userSchema = new mongoose.Schema({
  // ... existing fields
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  }
});

// Generate reset token
userSchema.methods.generateResetToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  
  return resetToken;
};

// Validate reset token
userSchema.methods.validateResetToken = function(token) {
  const crypto = require('crypto');
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  return (
    this.resetPasswordToken === hashedToken &&
    this.resetPasswordExpires > Date.now()
  );
};
```

### Backend: authController.js
```javascript
const nodemailer = require('nodemailer');

const emailService = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email, phone, identifier } = req.body;
  const loginId = resolveLoginIdentifier({ identifier, phone, email });

  if (!loginId) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists, reset email has been sent'
    });
  }

  const user = await findUserByLoginIdentifier(loginId);
  
  if (!user) {
    // Always return same response (prevent user enumeration)
    return res.status(200).json({
      success: true,
      message: 'If an account exists, reset email has been sent'
    });
  }

  // Generate token
  const resetToken = user.generateResetToken();
  await user.save({ validateBeforeSave: false });

  // Send email
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

  try {
    await emailService.sendMail({
      to: user.email,
      subject: 'Trimly - Password Reset',
      html: `<a href="${resetUrl}">Reset Password</a><p>Link expires in 1 hour.</p>`
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(new ErrorResponse('Failed to send email', 500));
  }

  // Always return same message
  res.status(200).json({
    success: true,
    message: 'If an account exists, reset email has been sent'
  });
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { token, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return next(new ErrorResponse('Passwords do not match', 400));
  }

  if (password.length < 12) {
    return next(new ErrorResponse('Password must be at least 12 characters', 400));
  }

  const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user || !user.validateResetToken(token)) {
    return next(new ErrorResponse('Invalid or expired token', 400));
  }

  // Update password
  user.password = await User.hashPassword(password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  const newToken = signToken(user);

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
    data: { token: newToken, user: sanitizeUser(user) }
  });
});
```

### Frontend: ResetPassword.jsx (New page)
```javascript
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        email,
        password,
        confirmPassword
      });
      
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return <div>Invalid reset link</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded mb-4">
          Password reset successful! Redirecting to login...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
```

### Frontend: App.jsx - Add route
```javascript
<Route path="/reset-password" element={<ResetPassword />} />
```

---

## 🚀 Deployment Checklist

After implementing all 7 critical fixes:

```
[ ] All code changes tested locally
[ ] Security tests pass
[ ] No console errors in browser
[ ] Authentication flow works end-to-end
[ ] Rate limiting prevents brute force
[ ] CSRF tokens working
[ ] Security headers present
[ ] Password reset emails sent
[ ] ErrorResponse not leaking info
[ ] Deployment to staging
[ ] Full UAT
[ ] Security review by team
[ ] Production deployment with rollback plan
[ ] Post-deployment verification
[ ] Update security documentation
```

---

*Use these code snippets as a reference while implementing the critical fixes outlined in SECURITY_AUDIT.md*
