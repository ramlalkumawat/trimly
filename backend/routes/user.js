const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  addAddress,
  updateLocation
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { onlyCustomer } = require('../middlewares/roleMiddleware');

// Customer self-service routes for profile, addresses, and location updates.
router.use(protect);
router.use(onlyCustomer);

// User profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// User addresses
router.post('/addresses', addAddress);

// Update user location
router.post('/location', updateLocation);
router.put('/location', updateLocation);

module.exports = router;
