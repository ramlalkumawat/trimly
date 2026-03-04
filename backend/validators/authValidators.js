const { body } = require('express-validator');

// Checks if payload includes any accepted login identifier field.
const hasAnyIdentifier = (payload = {}) =>
  Boolean(
    String(payload.identifier || '').trim() ||
      String(payload.email || '').trim() ||
      String(payload.phone || '').trim()
  );

// Validation rules for registration endpoint.
const registerValidator = [
  body('password')
    .trim()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['user', 'provider', 'admin'])
    .withMessage('Invalid role'),
  body()
    .custom((value) => {
      // Allow either full name or first name for flexible onboarding forms.
      const hasName =
        String(value.name || '').trim() ||
        String(value.firstName || '').trim();
      if (!hasName) {
        throw new Error('Name is required');
      }

      // Registration requires at least one contact identifier.
      if (!hasAnyIdentifier(value)) {
        throw new Error('Email or phone is required');
      }

      return true;
    })
];

// Validation rules for login endpoint.
const loginValidator = [
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),
  body()
    .custom((value) => {
      // User can login with either email or phone (or generic identifier field).
      if (!hasAnyIdentifier(value)) {
        throw new Error('Email or phone is required');
      }
      return true;
    })
];

// Validation rules for forgot-password endpoint.
const forgotPasswordValidator = [
  body()
    .custom((value) => {
      if (!hasAnyIdentifier(value)) {
        throw new Error('Please provide your email or phone number');
      }
      return true;
    })
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator
};
