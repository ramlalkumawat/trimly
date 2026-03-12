const express = require('express');
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  logout,
  refreshToken,
  getMe
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { handleValidation } = require('../middlewares/validationMiddleware');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator
} = require('../validators/authValidators');

// Authentication routes for registration, login, password reset, and session endpoints.
router.post('/register', registerValidator, handleValidation, register);
router.post('/login', loginValidator, handleValidation, login);
router.post('/forgot-password', forgotPasswordValidator, handleValidation, forgotPassword);
router.post('/forgotpassword', forgotPasswordValidator, handleValidation, forgotPassword);
router.post('/reset-password', resetPassword); // Public endpoint for password reset
router.post('/logout', protect, logout);
router.post('/refresh', protect, refreshToken);
router.get('/me', protect, getMe);

module.exports = router;
