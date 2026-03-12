const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema covering customers, providers, and admins with profile/location fields.
const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zip: String,
  country: String
}, { _id: false });

const locationSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  placeId: {
    type: String,
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true // allow multiple docs with no email
  },
  password: {
    type: String,
    required: true
  },
  // Password reset fields for secure reset flow
  passwordResetToken: {
    type: String,
    default: null // Only set during password reset request
  },
  passwordResetExpires: {
    type: Date,
    default: null // Token expiration time
  },
  role: {
    type: String,
    enum: ['user', 'provider', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'rejected', 'suspended'],
    default: 'active'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  approved: {
    type: Boolean,
    default: false
  },
  businessName: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['hair', 'nails', 'spa', 'makeup', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    trim: true
  },
  serviceArea: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  serviceIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  commissionRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 10
  },
  serviceRadiusKm: {
    type: Number,
    min: 1,
    max: 100,
    default: 15
  },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  addresses: [addressSchema],
  location: {
    type: locationSchema,
    default: null
  }
}, {
  timestamps: true
});

const resolveSaltRounds = () => {
  const configured = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
  if (!Number.isFinite(configured) || configured < 8) {
    return 10;
  }
  return Math.min(Math.floor(configured), 14);
};

// Pre-save middleware to handle name field compatibility
userSchema.pre('save', function(next) {
  // If firstName or lastName are set but name is not, generate name
  if ((this.firstName || this.lastName) && !this.name) {
    this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
  // If name is set but firstName/lastName are not, split name
  else if (this.name && !this.firstName && !this.lastName) {
    const nameParts = this.name.split(' ');
    this.firstName = nameParts[0] || '';
    this.lastName = nameParts.slice(1).join(' ') || '';
  }
  next();
});

userSchema.index({ role: 1, status: 1 });
userSchema.index({ role: 1, approved: 1, verified: 1 });
userSchema.index({ serviceIds: 1, role: 1, approved: 1 });

// Hashing helper shared across controllers to keep password hashing consistent.
userSchema.statics.hashPassword = async function hashPassword(plainPassword = '') {
  const password = String(plainPassword || '');
  return bcrypt.hash(password, resolveSaltRounds());
};

// Password verification helper used in auth login flow.
userSchema.methods.comparePassword = function comparePassword(plainPassword = '') {
  return bcrypt.compare(String(plainPassword || ''), this.password || '');
};

// Generate secure password reset token
// Returns the plain token for sending to user, stores hashed token in DB
userSchema.methods.generatePasswordResetToken = function generatePasswordResetToken() {
  const crypto = require('crypto');
  
  // Generate a random token (32 bytes = 64 hex chars)
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash the token for storage (optional but recommended for additional security)
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // Set expiration to 1 hour from now
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  
  return resetToken; // Return unhashed token to send to user
};

// Verify password reset token
// Can be called on a user document to validate a reset token
userSchema.methods.verifyPasswordResetToken = function verifyPasswordResetToken(token) {
  const crypto = require('crypto');
  
  // Hash the provided token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  // Check if token matches and hasn't expired
  if (this.passwordResetToken !== hashedToken) {
    return false;
  }
  
  if (!this.passwordResetExpires || this.passwordResetExpires < Date.now()) {
    return false;
  }
  
  return true;
};

module.exports = mongoose.model('User', userSchema);
