const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/authMiddleware');
const { onlyProvider } = require('../middlewares/roleMiddleware');
const { 
  checkBookingOwnership, 
  checkServiceOwnership, 
  checkBookingStatus,
  checkProviderStatus 
} = require('../middlewares/ownershipMiddleware');
const {
  getDashboard,
  getBookings,
  acceptBooking,
  rejectBooking,
  startService,
  completeService,
  toggleAvailability,
  getServices,
  addService,
  updateService,
  deleteService,
  getProfile,
  updateProfile,
  getAvailableBookings,
  claimBooking
} = require('../controllers/providerController');

// Provider-only routes for dashboard, booking workflow, services, and profile actions.
// Apply authentication and role middleware to all routes
router.use(protect);
router.use(onlyProvider);
router.use(checkProviderStatus);

// Dashboard routes
router.get('/dashboard', getDashboard);

// Booking routes
router.get('/bookings', getBookings);
router.get('/available-bookings', getAvailableBookings);
router.put('/bookings/:id/accept', 
  checkBookingOwnership, 
  checkBookingStatus(['pending']), 
  acceptBooking
);
router.put('/bookings/:id/claim', claimBooking);
router.put('/bookings/:id/reject', 
  checkBookingOwnership, 
  checkBookingStatus(['pending']), 
  rejectBooking
);
router.put('/bookings/:id/start', 
  checkBookingOwnership, 
  checkBookingStatus(['accepted']), 
  startService
);
router.put('/bookings/:id/complete', 
  checkBookingOwnership, 
  checkBookingStatus(['in_progress']), 
  completeService
);

// Availability routes
router.put('/availability', toggleAvailability);

// Service routes
router.get('/services', getServices);
router.post('/services', addService);
router.put('/services/:id', checkServiceOwnership, updateService);
router.delete('/services/:id', checkServiceOwnership, deleteService);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;
