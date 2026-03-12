const validator = require('email-validator');
const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');

/**
 * Validate email format using industry standard
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const normalized = email.trim().toLowerCase();
  
  // Check length
  if (normalized.length > 254) return false;
  
  // Use industry-standard validation
  return validator.validate(normalized);
};

/**
 * Validate and normalize phone numbers
 */
const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return null;
  
  try {
    // Try parsing with default region (India - adjust as needed)
    const parsed = parsePhoneNumber(phone, 'IN');
    
    if (!parsed || !parsed.isValid()) {
      return null;
    }
    
    return parsed.format('E.164'); // Returns +91XXXXXXXXXX format
  } catch (error) {
    return null;
  }
};

/**
 * Sanitize strings to prevent NoSQL injection
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove dangerous MongoDB operators
  return input
    .replace(/[{}$]/g, '')
    .replace(/mongodb/gi, '')
    .trim()
    .substring(0, 500); // Limit length
};

/**
 * Validate password strength
 */
const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Password is required'
    };
  }

  if (password.length < 12) {
    return {
      isValid: false,
      message: 'Password must be at least 12 characters'
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain uppercase letters'
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain lowercase letters'
    };
  }

  if (!/\d/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain numbers'
    };
  }

  if (!/[@$!%*?&#]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain special characters (@$!%*?&#)'
    };
  }

  return {
    isValid: true,
    message: 'Password meets requirements'
  };
};

/**
 * Validate name format
 */
const validateName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  const trimmed = name.trim();
  
  // 2-100 characters, letters, spaces, hyphens, apostrophes
  if (trimmed.length < 2 || trimmed.length > 100) return false;
  
  return /^[a-zA-Z\s'-]+$/.test(trimmed);
};

/**
 * Sanitize and normalize email
 */
const normalizeEmail = (email) => {
  if (!email) return '';
  return email.trim().toLowerCase();
};

module.exports = {
  validateEmail,
  validatePhoneNumber,
  sanitizeInput,
  validatePasswordStrength,
  validateName,
  normalizeEmail
};
