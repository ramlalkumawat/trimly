const mongoose = require('mongoose');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Validate that a parameter is a valid MongoDB ObjectId
 */
exports.validateObjectId = (...paramNames) => (req, res, next) => {
  for (const param of paramNames) {
    const value = req.params[param];
    
    if (value && !mongoose.Types.ObjectId.isValid(value)) {
      return next(new ErrorResponse(`Invalid ${param} format`, 400));
    }
  }
  
  next();
};

/**
 * Validate that request body IDs are valid ObjectIds
 */
exports.validateBodyObjectIds = (...fieldNames) => (req, res, next) => {
  for (const field of fieldNames) {
    const value = req.body[field];
    
    if (value && !mongoose.Types.ObjectId.isValid(value)) {
      return next(new ErrorResponse(`Invalid ${field} format`, 400));
    }
  }
  
  next();
};

/**
 * Utility: Convert string to ObjectId if valid
 */
exports.toObjectId = (value, fieldName = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${fieldName}`);
  }
  return new mongoose.Types.ObjectId(value);
};

/**
 * Utility: Safely compare two ObjectIds
 */
exports.objectIdEquals = (id1, id2) => {
  try {
    const oid1 = mongoose.Types.ObjectId(id1);
    const oid2 = mongoose.Types.ObjectId(id2);
    return oid1.equals(oid2);
  } catch {
    return false;
  }
};

/**
 * Utility: Validate array of ObjectIds
 */
exports.validateObjectIdArray = (ids, fieldName = 'ids') => {
  if (!Array.isArray(ids)) {
    throw new Error(`${fieldName} must be an array`);
  }
  
  return ids
    .filter(id => mongoose.Types.ObjectId.isValid(id))
    .map(id => new mongoose.Types.ObjectId(id));
};
