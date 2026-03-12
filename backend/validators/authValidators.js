const { body, validationResult } = require('express-validator');
const { 
  validateEmail, 
  validatePhoneNumber, 
  validatePasswordStrength, 
  validateName,
  sanitizeInput 
} = require('../utils/validators');

// Checks if payload includes any accepted login identifier field.
const hasAnyIdentifier = (payload = {}) =>
  Boolean(
    String(payload.identifier || '').trim() ||
      String(payload.email || '').trim() ||
      String(payload.phone || '').trim()
  );

// Validation rules for registration endpoint.
// CRITICAL: Requires strong passwords, validated email/phone, and proper names
const registerValidator = [
  // Password: Enforce security requirements
  body('password')
    .trim()
    .custom((value) => {
      const error = validatePasswordStrength(value);
      if (error) {
        throw new Error(error);
      }
      return true;
    })
    .withMessage('Invalid password'),
  
  // Email: RFC-compliant validation if provided
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (value && !validateEmail(value)) {
        throw new Error('Invalid email format');
      }
      return true;
    })
    .toLowerCase(),
  
  // Phone: E.164 format validation if provided
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (value) {
        try {
          const formatted = validatePhoneNumber(value);
          if (!formatted) {
            throw new Error('Invalid phone number');
          }
        } catch (err) {
          throw new Error('Invalid phone number format');
        }
      }
      return true;
    }),
  
  // Name validation
  body('name')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!validateName(value)) {
        throw new Error('Name can only contain letters, spaces, hyphens, and apostrophes (2-100 characters)');
      }
      return true;
    }),
  
  body('firstName')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!validateName(value)) {
        throw new Error('First name can only contain letters, spaces, hyphens, and apostrophes (2-100 characters)');
      }
      return true;
    }),
  
  // Role validation
  body('role')
    .optional()
    .isIn(['user', 'provider', 'admin'])
    .withMessage('Invalid role'),
  
  // Custom validation for required fields
  body()
    .custom((value) => {
      // Allow either full name or first name for flexible onboarding forms
      const hasName =
        String(value.name || '').trim() ||
        String(value.firstName || '').trim();
      if (!hasName) {
        throw new Error('Name is required');
      }

      // Registration requires at least one contact identifier
      if (!hasAnyIdentifier(value)) {
        throw new Error('Email or phone is required');
      }

      return true;
    })
];

// Validation rules for login endpoint.
// Validates email/phone with strict requirements
const loginValidator = [
  // Password: Must be provided
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),
  
  // Email: Validate format if provided
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (value && !validateEmail(value)) {
        throw new Error('Invalid email format');
      }
      return true;
    })
    .toLowerCase(),
  
  // Phone: Validate format if provided
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (value) {
        try {
          const formatted = validatePhoneNumber(value);
          if (!formatted) {
            throw new Error('Invalid phone number');
          }
        } catch (err) {
          throw new Error('Invalid phone number format');
        }
      }
      return true;
    }),
  
  // Custom validation for login identifier
  body()
    .custom((value) => {
      // User can login with either email or phone (or generic identifier field)
      if (!hasAnyIdentifier(value)) {
        throw new Error('Email or phone is required');
      }
      return true;
    })
];

// Validation rules for forgot-password endpoint.
// Requires email or phone in proper format
const forgotPasswordValidator = [
  // Email: Validate format if provided
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (value && !validateEmail(value)) {
        throw new Error('Invalid email format');
      }
      return true;
    })
    .toLowerCase(),
  
  // Phone: Validate format if provided
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (value) {
        try {
          const formatted = validatePhoneNumber(value);
          if (!formatted) {
            throw new Error('Invalid phone number');
          }
        } catch (err) {
          throw new Error('Invalid phone number format');
        }
      }
      return true;
    }),
  
  // Custom validation: At least one identifier required
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
