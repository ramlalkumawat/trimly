const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const csrf = require('csurf');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const { configureSocket } = require('./config/socket');
const { authLimiter, apiLimiter } = require('./middlewares/rateLimitMiddleware');
const cspConfig = require('./config/csp');
const { auditLogger } = require('./utils/auditLogger');

// Application bootstrap: HTTP server, middleware stack, routes, and Socket.io wiring.
// load env vars
dotenv.config();

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingRequiredEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingRequiredEnvVars.length) {
  console.error(
    `[config] Missing required environment variables: ${missingRequiredEnvVars.join(', ')}`
  );

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `Missing required environment variables: ${missingRequiredEnvVars.join(', ')}`
    );
  }
}

// connect database
connectDB();

const app = express();

// ==================== SECURITY MIDDLEWARE ====================

// 1. Helmet: HTTP security headers
app.use(helmet({
  contentSecurityPolicy: false, // Using custom CSP below
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow CORS resources
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

// 2. Custom Content Security Policy (XSS prevention)
app.use(helmet.contentSecurityPolicy({
  directives: cspConfig.directives
}));

// 3. CORS: Only allow specified origins
const defaultOrigins = ['http://localhost:3000', 'http://localhost:5173'];
const envOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: origin not allowed'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// 4. Body parser with size limit (prevent large payload attacks)
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ limit: '8mb', extended: true }));

// 5. Cookie parser: Parse cookies
app.use(cookieParser(process.env.COOKIE_SECRET || 'your-secret-key'));

// 6. Session configuration: For CSRF token generation
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  name: 'sessionId' // Don't use default 'connect.sid'
}));

// 7. CSRF protection: Post-processing middleware
const csrfProtection = csrf({ 
  cookie: false, // Use session instead of cookies for CSRF tokens
  value: (req) => {
    // Look for CSRF token in multiple places
    return req.body._csrf || req.headers['x-csrf-token'] || req.query._csrf;
  }
});

// 8. MongoDB sanitization: Prevent NoSQL injection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    auditLogger.log(
      'SECURITY',
      'NoSQL_INJECTION_ATTEMPT',
      `Potential NoSQL injection detected in ${key}`,
      { user: req.user?.id, ip: req.ip, key }
    );
  }
}));

// 9. Request logging middleware: For audit trails
app.use((req, res, next) => {
  // Log sensitive operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    auditLogger.log(
      'DATA_MODIFICATION',
      `${req.method} ${req.path}`,
      null,
      {
        user: req.user?.id || 'anonymous',
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    );
  }
  next();
});

// 10. Rate limiting: Protect against brute force attacks
app.use('/api/auth/', authLimiter); // Specific auth rate limiter
app.use('/api/', apiLimiter); // General API rate limiter

// ==================== END SECURITY MIDDLEWARE ====================


// Lightweight endpoints for uptime checks and smoke testing.
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Trimly backend is running'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok'
  });
});

// CSRF token endpoint: Frontend calls this to get a CSRF token
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.status(200).json({
    success: true,
    csrfToken: req.csrfToken()
  });
});


// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user')); // user-specific routes
app.use('/api/provider', require('./routes/provider')); // provider-specific routes
app.use('/api/admin', require('./routes/admin')); // admin-specific routes
app.use('/api/bookings', require('./routes/bookings')); // general booking routes
app.use('/api/services', require('./routes/services')); // general service routes
app.use('/api/users', require('./routes/users')); // legacy user management routes
app.use('/api/site', require('./routes/site')); // marketing and support inquiry routes

// error handler should be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Configure Socket.io
const io = configureSocket(require('socket.io')(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Socket origin not allowed'));
    },
    methods: ["GET", "POST"],
    credentials: true
  }
}));

// Make io available globally for controllers
global.io = io;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io server running`);
});

// handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
