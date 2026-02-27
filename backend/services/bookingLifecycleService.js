const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Payment = require('../models/Payment');
const ProviderMatchingService = require('./providerMatchingService');
const BookingStatusService = require('./bookingStatusService');
const ErrorResponse = require('../utils/errorResponse');
const { emitToProvider, emitToCustomer, emitToBooking, emitToAvailableProviders } = require('../config/socket');

// Orchestrates booking creation/assignment/status changes and related payment/socket effects.
const BOOKING_POPULATE = [
  { path: 'customerId', select: 'name firstName lastName phone email location' },
  { path: 'providerId', select: 'name firstName lastName phone email businessName category serviceIds' },
  { path: 'serviceId', select: 'name category duration price commissionRate isActive' },
  { path: 'paymentId' }
];

const parseScheduledTime = (date, time) => {
  const direct = new Date(`${date}T${time}`);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const fallback = new Date(`${date} ${time}`);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback;
  }

  throw new ErrorResponse('Invalid booking date/time', 400);
};

const buildStatusMessage = (status, providerName = 'Provider') => {
  const statusMessages = {
    pending: 'Booking request received',
    accepted: `${providerName} accepted your booking`,
    rejected: `${providerName} rejected your booking`,
    in_progress: `${providerName} started your service`,
    completed: `${providerName} marked your service as completed`,
    cancelled: 'Booking was cancelled'
  };
  return statusMessages[status] || 'Booking updated';
};

class BookingLifecycleService {
  static async createBooking({
    customerId,
    serviceId,
    date,
    time,
    address,
    paymentMethod = 'cash',
    totalAmount,
    customerLocation = null
  }) {
    const service = await Service.findOne({ _id: serviceId, isActive: true });
    if (!service) {
      throw new ErrorResponse('Service not found or inactive', 404);
    }

    const scheduledTime = parseScheduledTime(date, time);
    const normalizedDate = new Date(scheduledTime);
    normalizedDate.setHours(0, 0, 0, 0);

    const hasLocation =
      customerLocation &&
      typeof customerLocation.latitude === 'number' &&
      typeof customerLocation.longitude === 'number';

    const matchedProvider = await ProviderMatchingService.assignProvider(
      serviceId,
      hasLocation ? customerLocation : null
    );

    const booking = await Booking.create({
      customerId,
      providerId: matchedProvider ? matchedProvider._id : null,
      serviceId,
      date: normalizedDate,
      time,
      scheduledTime,
      totalAmount,
      commissionRate: service.commissionRate || 10,
      address,
      customerLocation: hasLocation
        ? {
            address,
            latitude: customerLocation.latitude,
            longitude: customerLocation.longitude
          }
        : null,
      paymentMethod,
      status: 'pending',
      assignedAt: matchedProvider ? new Date() : null,
      statusHistory: [
        {
          status: 'pending',
          changedBy: customerId,
          role: 'user',
          note: 'Booking created'
        }
      ]
    });

    const payment = await Payment.create({
      transactionId:
        paymentMethod && paymentMethod !== 'cash'
          ? `txn_${booking._id.toString()}_${Date.now()}`
          : undefined,
      bookingId: booking._id,
      customerId,
      providerId: matchedProvider ? matchedProvider._id : null,
      serviceId,
      amount: totalAmount,
      commissionRate: booking.commissionRate,
      commissionAmount: booking.commissionAmount,
      netAmount: booking.providerPayout,
      paymentMethod,
      status: 'pending'
    });

    booking.paymentId = payment._id;
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id).populate(BOOKING_POPULATE);

    if (global.io) {
      if (matchedProvider) {
        emitToProvider(global.io, matchedProvider._id, 'new_booking', {
          booking: populatedBooking
        });
      } else {
        // Emit to all available providers for the service category
        emitToAvailableProviders(global.io, 'new_booking_request', {
          booking: populatedBooking
        });
      }

      emitToCustomer(global.io, customerId, 'booking_created', {
        booking: populatedBooking,
        message: matchedProvider
          ? 'Booking created and sent to provider'
          : 'Booking created; waiting for provider assignment'
      });
    }

    return populatedBooking;
  }

  static async updateBookingStatus({
    bookingId,
    actorId,
    actorRole,
    status,
    rejectionReason = '',
    cancellationReason = ''
  }) {
    const { booking } = await BookingStatusService.updateStatus(
      bookingId,
      status,
      actorId,
      actorRole,
      {
        rejectionReason,
        cancellationReason
      }
    );

    const payment = await Payment.findOne({ bookingId: booking._id });
    if (payment) {
      if (status === 'completed') {
        payment.status = 'completed';
        payment.completedAt = new Date();
        await payment.save();
      }

      if (status === 'cancelled' && payment.status === 'completed') {
        payment.status = 'partially_refunded';
        await payment.save();
      }
    }

    const populatedBooking = await Booking.findById(booking._id).populate(BOOKING_POPULATE);

    if (global.io) {
      const providerName = populatedBooking.providerId
        ? populatedBooking.providerId.businessName || populatedBooking.providerId.name
        : 'Provider';

      const payload = {
        booking: populatedBooking,
        status,
        message: buildStatusMessage(status, providerName)
      };

      emitToBooking(global.io, bookingId, 'booking_status_updated', payload);

      if (populatedBooking.customerId?._id) {
        emitToCustomer(global.io, populatedBooking.customerId._id, 'booking_status_updated', payload);
      }

      if (populatedBooking.providerId?._id) {
        emitToProvider(global.io, populatedBooking.providerId._id, 'booking_status_updated', payload);
      }

      if (status === 'accepted' && populatedBooking.customerId?._id) {
        emitToCustomer(global.io, populatedBooking.customerId._id, 'booking_accepted', payload);
      }

      if (status === 'rejected' && populatedBooking.customerId?._id) {
        emitToCustomer(global.io, populatedBooking.customerId._id, 'booking_rejected', payload);
      }

      if (status === 'in_progress' && populatedBooking.customerId?._id) {
        emitToCustomer(global.io, populatedBooking.customerId._id, 'service_started', payload);
      }

      if (status === 'completed' && populatedBooking.customerId?._id) {
        emitToCustomer(global.io, populatedBooking.customerId._id, 'service_completed', payload);
      }
    }

    return populatedBooking;
  }
}

module.exports = BookingLifecycleService;
