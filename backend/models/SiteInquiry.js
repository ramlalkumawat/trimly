const mongoose = require('mongoose');

// Stores contact/inquiry submissions from informational site pages in user app.
const siteInquirySchema = new mongoose.Schema(
  {
    // Tracks which static section form generated this inquiry.
    section: {
      type: String,
      enum: ['company', 'customers', 'professionals', 'follow'],
      required: true
    },
    slug: {
      type: String,
      required: true,
      trim: true
    },
    pageTitle: {
      type: String,
      required: true,
      trim: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    company: {
      type: String,
      trim: true,
      maxlength: 140,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      maxlength: 120,
      default: ''
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 24,
      default: ''
    },
    bookingId: {
      type: String,
      trim: true,
      maxlength: 80,
      default: ''
    },
    experience: {
      type: String,
      trim: true,
      maxlength: 160,
      default: ''
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 3000
    },
    source: {
      type: String,
      trim: true,
      maxlength: 40,
      default: 'user-web'
    },
    requestMeta: {
      // Best-effort request metadata for abuse detection and support tracing.
      ip: {
        type: String,
        trim: true,
        default: ''
      },
      userAgent: {
        type: String,
        trim: true,
        default: ''
      }
    }
  },
  {
    timestamps: true
  }
);

// Recent-first and section-aware indexes for admin/support listing.
siteInquirySchema.index({ createdAt: -1 });
siteInquirySchema.index({ section: 1, slug: 1, createdAt: -1 });

module.exports = mongoose.model('SiteInquiry', siteInquirySchema);
