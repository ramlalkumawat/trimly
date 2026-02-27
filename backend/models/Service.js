const mongoose = require('mongoose');

// Service catalog schema with pricing, duration, category, and admin commission settings.
const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 10
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    trim: true,
    default: 'other'
  },
  commissionRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 10
  },
  imageUrl: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Service', serviceSchema);
