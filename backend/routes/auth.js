const express = require('express');
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  logout,
  refreshToken,
  getMe
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Authentication routes for registration, login, password reset, and session endpoints.
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/forgotpassword', forgotPassword);
router.post('/logout', protect, logout);
router.post('/refresh', protect, refreshToken);
router.get('/me', protect, getMe);

module.exports = router;
