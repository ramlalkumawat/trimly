const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const { configureSocket } = require('./config/socket');

// Application bootstrap: HTTP server, middleware stack, routes, and Socket.io wiring.
// load env vars
dotenv.config();

// connect database
connectDB();

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

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

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user')); // user-specific routes
app.use('/api/provider', require('./routes/provider')); // provider-specific routes
app.use('/api/admin', require('./routes/admin')); // admin-specific routes
app.use('/api/bookings', require('./routes/bookings')); // general booking routes
app.use('/api/services', require('./routes/services')); // general service routes
app.use('/api/users', require('./routes/users')); // legacy user management routes

// error handler should be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const defaultOrigins = ['http://localhost:3000', 'http://localhost:5173'];
const envOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

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
