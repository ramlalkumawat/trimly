const Booking = require('../models/Booking');
const ErrorResponse = require('../utils/errorResponse');

// Booking status state-machine helpers with transition validation and timestamp updates.
class BookingStatusService {
  // Valid status transitions
  static VALID_TRANSITIONS = {
    'pending': ['accepted', 'rejected', 'cancelled'],
    'accepted': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'cancelled'],
    'completed': [], // Terminal state
    'cancelled': [], // Terminal state
    'rejected': []    // Terminal state
  };

  /**
   * Validate if a status transition is allowed
   * @param {String} currentStatus - Current booking status
   * @param {String} newStatus - New status to transition to
   * @returns {Boolean} True if transition is valid
   */
  static isValidTransition(currentStatus, newStatus) {
    const allowedTransitions = this.VALID_TRANSITIONS[currentStatus];
    return allowedTransitions && allowedTransitions.includes(newStatus);
  }

  /**
   * Update booking status with validation and timestamps
   * @param {String} bookingId - Booking ID
   * @param {String} newStatus - New status
   * @param {String} userId - User making the change
   * @param {String} userRole - Role of the user making the change
   * @param {Object} additionalData - Additional data (rejectionReason, etc.)
   * @returns {Object} Updated booking
   */
  static async updateStatus(bookingId, newStatus, userId, userRole, additionalData = {}) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ErrorResponse('Booking not found', 404);
    }

    // Validate status transition
    if (!this.isValidTransition(booking.status, newStatus)) {
      throw new ErrorResponse(`Invalid status transition from ${booking.status} to ${newStatus}`, 400);
    }

    // Check authorization based on role and status
    this.validateAuthorization(booking, newStatus, userId, userRole);

    // Update status and timestamps
    const previousStatus = booking.status;
    booking.status = newStatus;
    
    // Set timestamps based on status
    switch (newStatus) {
      case 'accepted':
        booking.acceptedAt = new Date();
        break;
      case 'in_progress':
        booking.inProgressAt = new Date();
        break;
      case 'completed':
        booking.completedAt = new Date();
        booking.paymentStatus = booking.paymentStatus === 'failed' ? 'failed' : 'paid';
        break;
      case 'rejected':
        if (additionalData.rejectionReason) {
          booking.rejectionReason = additionalData.rejectionReason;
        }
        break;
      case 'cancelled':
        booking.cancelledAt = new Date();
        booking.cancelledBy = userId;
        booking.cancellationReason = additionalData.cancellationReason || additionalData.rejectionReason || '';
        break;
    }

    booking.statusHistory.push({
      status: newStatus,
      changedBy: userId || null,
      role: userRole || 'system',
      note: additionalData.note || additionalData.rejectionReason || ''
    });

    await booking.save();
    return { booking, previousStatus };
  }

  /**
   * Validate if user is authorized to make the status change
   * @param {Object} booking - Booking object
   * @param {String} newStatus - New status
   * @param {String} userId - User ID
   * @param {String} userRole - User role
   */
  static validateAuthorization(booking, newStatus, userId, userRole) {
    switch (userRole) {
      case 'user':
        // Customers can only cancel their own bookings
        if (newStatus !== 'cancelled' || booking.customerId.toString() !== String(userId)) {
          throw new ErrorResponse('User can only cancel their own bookings', 403);
        }
        if (!['pending', 'accepted'].includes(booking.status)) {
          throw new ErrorResponse(`Cannot cancel booking in ${booking.status} state`, 400);
        }
        break;
        
      case 'provider':
        // Providers can only update their assigned bookings
        if (!booking.providerId || booking.providerId.toString() !== String(userId)) {
          throw new ErrorResponse('Provider can only update their assigned bookings', 403);
        }
        // Providers can accept/reject and progress accepted bookings
        const providerAllowedStatuses = ['accepted', 'rejected', 'in_progress', 'completed', 'cancelled'];
        if (!providerAllowedStatuses.includes(newStatus)) {
          throw new ErrorResponse('Provider not authorized to set this status', 403);
        }
        break;
        
      case 'admin':
        // Admins can update any booking status
        break;
        
      default:
        throw new ErrorResponse('Unauthorized role', 403);
    }
  }

  /**
   * Get all possible next statuses for a given current status
   * @param {String} currentStatus - Current status
   * @returns {Array} Array of possible next statuses
   */
  static getNextPossibleStatuses(currentStatus) {
    return this.VALID_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Check if booking is in terminal state
   * @param {String} status - Booking status
   * @returns {Boolean} True if terminal state
   */
  static isTerminalState(status) {
    const terminalStates = ['completed', 'cancelled', 'rejected'];
    return terminalStates.includes(status);
  }

  /**
   * Get booking status flow for UI display
   * @param {String} currentStatus - Current booking status
   * @returns {Object} Status flow information
   */
  static getStatusFlow(currentStatus) {
    const statusFlow = {
      pending: { label: 'Pending', color: 'yellow', order: 1 },
      accepted: { label: 'Accepted', color: 'blue', order: 2 },
      in_progress: { label: 'In Progress', color: 'orange', order: 3 },
      completed: { label: 'Completed', color: 'green', order: 4 },
      cancelled: { label: 'Cancelled', color: 'red', order: 5 },
      rejected: { label: 'Rejected', color: 'red', order: 5 }
    };

    return {
      current: statusFlow[currentStatus] || { label: 'Unknown', color: 'gray', order: 0 },
      next: this.getNextPossibleStatuses(currentStatus).map(status => statusFlow[status])
    };
  }
}

module.exports = BookingStatusService;
