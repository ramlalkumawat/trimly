const mongoose = require('mongoose');

// Booking schema capturing scheduling, provider assignment, status history, and payouts.
const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  role: {
    type: String,
    enum: ['user', 'provider', 'admin', 'system'],
    default: 'system'
  },
  note: {
    type: String,
    default: ''
  },
  changedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const bookingLocationSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    min: -180,
    max: 180
  }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  statusHistory: [statusHistorySchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  commissionRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 10
  },
  commissionAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  providerPayout: {
    type: Number,
    min: 0,
    default: 0
  },
  address: {
    type: String,
    required: true
  },
  customerLocation: {
    type: bookingLocationSchema,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'wallet'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  assignedAt: {
    type: Date,
    default: null
  },
  timeoutAt: {
    type: Date,
    default: null
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  inProgressAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Update compatibility fields and derived amounts
bookingSchema.pre('save', function(next) {
  if (!this.date && this.scheduledTime) {
    const onlyDate = new Date(this.scheduledTime);
    onlyDate.setHours(0, 0, 0, 0);
    this.date = onlyDate;
  }

  if ((!this.time || this.time.trim() === '') && this.scheduledTime) {
    this.time = this.scheduledTime.toTimeString().slice(0, 5);
  }

  this.commissionAmount = Number(((this.totalAmount * this.commissionRate) / 100).toFixed(2));
  this.providerPayout = Number((this.totalAmount - this.commissionAmount).toFixed(2));
  next();
});

// Index for performance
bookingSchema.index({ providerId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ customerId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ serviceId: 1, status: 1 });
bookingSchema.index({ status: 1, scheduledTime: 1 });
bookingSchema.index({ timeoutAt: 1 });
bookingSchema.index({ paymentStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
