const { body } = require('express-validator');

const createBookingValidator = [
  body('serviceId')
    .trim()
    .isMongoId()
    .withMessage('Valid serviceId is required'),
  body('date')
    .trim()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Valid date is required (YYYY-MM-DD)'),
  body('time')
    .trim()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Valid time is required (HH:mm)'),
  body('totalAmount')
    .isFloat({ gt: 0 })
    .withMessage('Total amount must be greater than 0'),
  body('address')
    .trim()
    .isLength({ min: 8, max: 300 })
    .withMessage('Address must be between 8 and 300 characters'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'upi', 'wallet'])
    .withMessage('Invalid payment method')
];

module.exports = {
  createBookingValidator
};
