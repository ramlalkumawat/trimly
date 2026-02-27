const express = require('express');
const router = express.Router();
const {
  getAllServices,
  createService,
  updateService,
  deleteService,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  getAllProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  verifyProvider,
  blockProvider,
  getDashboardAnalytics,
  getAllPayments,
  refundPayment,
  getCommissions,
  updateServiceCommission,
  updateProviderCommission,
  getProfile,
  updateProfile,
} = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const { onlyAdmin } = require('../middlewares/roleMiddleware');

// Admin API routes: protected management endpoints for all platform resources.
// Apply authentication and admin role to all admin routes
router.use(protect);
router.use(onlyAdmin);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Analytics routes
router.get('/analytics', getDashboardAnalytics);

// Payment routes
router.get('/payments', getAllPayments);
router.post('/payments/refund/:id', refundPayment);

// Commission routes
router.get('/commissions', getCommissions);
router.patch('/commissions/services/:id', updateServiceCommission);
router.patch('/commissions/providers/:id', updateProviderCommission);

// Service routes
router.get('/services', getAllServices);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);

// User routes
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/status', async (req, res, next) => {
  const { status } = req.body;
  req.body = { status };
  return updateUser(req, res, next);
});

// Booking routes
router.get('/bookings', getAllBookings);
router.post('/bookings', createBooking);
router.put('/bookings/:id', updateBooking);
router.delete('/bookings/:id', deleteBooking);
router.patch('/bookings/:id', async (req, res, next) => {
  const { status } = req.body;
  req.body = { status };
  return updateBooking(req, res, next);
});

// Provider routes
router.get('/providers', getAllProviders);
router.post('/providers', createProvider);
router.put('/providers/:id', updateProvider);
router.delete('/providers/:id', deleteProvider);
router.patch('/providers/:id/verify', verifyProvider);
router.patch('/providers/:id/block', blockProvider);
router.patch('/providers/:id', async (req, res, next) => {
  const { approved } = req.body;
  req.body = { approved };
  return updateProvider(req, res, next);
});

module.exports = router;
