const mongoose = require('mongoose');

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

module.exports = mongoose.model('User', userSchema);
