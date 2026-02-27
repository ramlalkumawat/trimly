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
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
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
