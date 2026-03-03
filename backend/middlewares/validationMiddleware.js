const { validationResult } = require('express-validator');
const ErrorResponse = require('../utils/errorResponse');

// Shared express-validator result handler.
const handleValidation = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const message = result
    .array({ onlyFirstError: true })
    .map((issue) => issue.msg)
    .join(', ');

  return next(new ErrorResponse(message || 'Validation failed', 400));
};

module.exports = {
  handleValidation
};
