const ErrorResponse = require('../utils/errorResponse');

// Centralized API error formatter for Mongoose and custom application errors.
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`; 
    error = new ErrorResponse(message, 404);
  }

  // mongoose duplicate key
  if (err.code === 11000) {
    const duplicateKeys = Object.keys(err.keyPattern || {});
    const duplicateMessage = err.keyValue
      ? `${Object.entries(err.keyValue)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')} already exists`
      : 'Duplicate field value entered';

    if (duplicateKeys.includes('customerId') && duplicateKeys.includes('date') && duplicateKeys.includes('time')) {
      error = new ErrorResponse('You have already booked this slot', 409);
    } else if (duplicateKeys.includes('email')) {
      error = new ErrorResponse('Email already registered', 409);
    } else if (duplicateKeys.includes('phone')) {
      error = new ErrorResponse('Phone number already registered', 409);
    } else {
      error = new ErrorResponse(duplicateMessage, 409);
    }
  }

  // mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error'
  });
};

module.exports = errorHandler;
