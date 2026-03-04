const { body } = require('express-validator');

// Request validations for creating a booking from user app checkout flow.
const createBookingValidator = [
  // Service must be a valid Mongo ObjectId.
  body('serviceId')
    .trim()
    .isMongoId()
    .withMessage('Valid serviceId is required'),
  // Date is stored/handled in YYYY-MM-DD format.
  body('date')
    .trim()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Valid date is required (YYYY-MM-DD)'),
  // Time is expected in 24-hour HH:mm format.
  body('time')
    .trim()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Valid time is required (HH:mm)'),
  // Booking amount must be positive.
  body('totalAmount')
    .isFloat({ gt: 0 })
    .withMessage('Total amount must be greater than 0'),
  // Address helps providers reach customer location.
  body('address')
    .trim()
    .isLength({ min: 8, max: 300 })
    .withMessage('Address must be between 8 and 300 characters'),
  // Payment mode is optional but constrained to supported values.
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'upi', 'wallet'])
    .withMessage('Invalid payment method')
];

module.exports = {
  createBookingValidator
};
