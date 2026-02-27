const mongoose = require('mongoose');

// Payment ledger schema linked one-to-one with bookings for settlement and refund tracking.
const paymentSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  amount: {
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
    required: true,
    min: 0
  },
  netAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash', 'bank_transfer', 'digital_wallet', 'upi', 'wallet'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  refundedAmount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ providerId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
