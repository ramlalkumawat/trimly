const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const SiteInquiry = require('../models/SiteInquiry');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\s()-]{8,20}$/;
const allowedSections = new Set(['company', 'customers', 'professionals', 'follow']);

const clean = (value = '') => String(value || '').trim();

const getRequestIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '';
};

// @desc    Store marketing/site inquiry
// @route   POST /api/site/inquiries
// @access  Public
exports.createInquiry = asyncHandler(async (req, res, next) => {
  const {
    section,
    slug,
    pageTitle,
    fullName,
    company,
    city,
    email,
    phone,
    bookingId,
    experience,
    rating,
    message,
    source
  } = req.body || {};

  const safeSection = clean(section).toLowerCase();
  const safeSlug = clean(slug).toLowerCase();
  const safePageTitle = clean(pageTitle);
  const safeName = clean(fullName);
  const safeCompany = clean(company);
  const safeCity = clean(city);
  const safeEmail = clean(email).toLowerCase();
  const safePhone = clean(phone);
  const safeBookingId = clean(bookingId);
  const safeExperience = clean(experience);
  const safeMessage = clean(message);
  const safeSource = clean(source) || 'user-web';

  if (!allowedSections.has(safeSection)) {
    return next(new ErrorResponse('Invalid section value', 400));
  }

  if (!safeSlug) {
    return next(new ErrorResponse('Slug is required', 400));
  }

  if (!safePageTitle) {
    return next(new ErrorResponse('Page title is required', 400));
  }

  if (!safeName) {
    return next(new ErrorResponse('Full name is required', 400));
  }

  if (!safeEmail || !emailRegex.test(safeEmail)) {
    return next(new ErrorResponse('Valid email is required', 400));
  }

  if (!safeMessage || safeMessage.length < 20) {
    return next(new ErrorResponse('Message must be at least 20 characters', 400));
  }

  if (safePhone && !phoneRegex.test(safePhone)) {
    return next(new ErrorResponse('Enter a valid phone number', 400));
  }

  let safeRating = null;
  if (rating !== undefined && rating !== null && String(rating).trim() !== '') {
    safeRating = Number(rating);
    if (Number.isNaN(safeRating) || safeRating < 1 || safeRating > 5) {
      return next(new ErrorResponse('Rating must be between 1 and 5', 400));
    }
  }

  const inquiry = await SiteInquiry.create({
    section: safeSection,
    slug: safeSlug,
    pageTitle: safePageTitle,
    fullName: safeName,
    company: safeCompany,
    city: safeCity,
    email: safeEmail,
    phone: safePhone,
    bookingId: safeBookingId,
    experience: safeExperience,
    rating: safeRating,
    message: safeMessage,
    source: safeSource,
    requestMeta: {
      ip: getRequestIp(req),
      userAgent: clean(req.headers['user-agent'])
    }
  });

  res.status(201).json({
    success: true,
    message: 'Inquiry submitted successfully',
    data: {
      id: inquiry._id,
      createdAt: inquiry.createdAt
    }
  });
});
