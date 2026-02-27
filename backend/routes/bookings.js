const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  getBookings, 
  updateBookingStatus, 
  getProviderPendingBookings,
  acceptBooking,
  rejectBooking,
  getBookingDetails,
  getProviderUpcomingBookings,
  getProviderHistoryBookings,
  getCustomerActiveBookings
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');
const { onlyCustomer, onlyProvider, authorizeRoles } = require('../middlewares/roleMiddleware');
const { checkBookingOwnership, checkBookingStatus } = require('../middlewares/ownershipMiddleware');

// Booking routes for customer creation, provider actions, and role-scoped listing/details.
router.use(protect);

router.post('/', onlyCustomer, createBooking);
router.get('/', getBookings);

// Provider specific routes
router.get('/provider/pending', onlyProvider, getProviderPendingBookings);
router.get('/provider/upcoming', onlyProvider, getProviderUpcomingBookings);
router.get('/provider/history', onlyProvider, getProviderHistoryBookings);

// Customer specific routes
router.get('/customer/active', onlyCustomer, getCustomerActiveBookings);

// Booking action routes with ownership and status checks
router.patch('/:id/accept', 
  onlyProvider, 
  checkBookingOwnership, 
  checkBookingStatus(['pending']), 
  acceptBooking
);
router.patch('/:id/reject', 
  onlyProvider, 
  checkBookingOwnership, 
  checkBookingStatus(['pending']), 
  rejectBooking
);

// providers, users (cancel) or admins can update status
router.patch('/:id/status', 
  authorizeRoles('provider', 'admin', 'user'), 
  checkBookingOwnership, 
  updateBookingStatus
);

// Get booking details
router.get('/:id', getBookingDetails);

module.exports = router;
