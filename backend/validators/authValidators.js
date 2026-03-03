const { body } = require('express-validator');

const hasAnyIdentifier = (payload = {}) =>
  Boolean(
    String(payload.identifier || '').trim() ||
      String(payload.email || '').trim() ||
      String(payload.phone || '').trim()
  );

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
      const hasName =
        String(value.name || '').trim() ||
        String(value.firstName || '').trim();
      if (!hasName) {
        throw new Error('Name is required');
      }

      if (!hasAnyIdentifier(value)) {
        throw new Error('Email or phone is required');
      }

      return true;
    })
];

const loginValidator = [
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),
  body()
    .custom((value) => {
      if (!hasAnyIdentifier(value)) {
        throw new Error('Email or phone is required');
      }
      return true;
    })
];

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
