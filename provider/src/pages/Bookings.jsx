import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { providerAPI } from '../api/provider';
import useToast from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  CurrencyDollarIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlayIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { PulseLoader } from 'react-spinners';

// Bookings workflow page for pending/accepted/in-progress/completed job handling.
const Bookings = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status') || 'pending';
  const { provider } = useAuth();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const toast = useToast();

  useEffect(() => {
    fetchBookings();
  }, [status]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await providerAPI.getBookings(status);
      setBookings(response.data.data.bookings || []);
    } catch (error) {
      toast.error('Error', 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      setActionLoading(prev => ({ ...prev, [bookingId]: 'accept' }));
      await providerAPI.acceptBooking(bookingId);
      toast.success('Accepted', 'Booking has been accepted successfully');
      fetchBookings();
    } catch (error) {
      toast.error('Error', 'Failed to accept booking');
    } finally {
      setActionLoading(prev => ({ ...prev, [bookingId]: null }));
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      setActionLoading(prev => ({ ...prev, [bookingId]: 'reject' }));
      await providerAPI.rejectBooking(bookingId);
      toast.success('Rejected', 'Booking has been rejected');
      fetchBookings();
    } catch (error) {
      toast.error('Error', 'Failed to reject booking');
    } finally {
      setActionLoading(prev => ({ ...prev, [bookingId]: null }));
    }
  };

  const handleStartService = async (bookingId) => {
    try {
      setActionLoading(prev => ({ ...prev, [bookingId]: 'start' }));
      await providerAPI.startService(bookingId);
      toast.success('Started', 'Service has been started');
      fetchBookings();
    } catch (error) {
      toast.error('Error', 'Failed to start service');
    } finally {
      setActionLoading(prev => ({ ...prev, [bookingId]: null }));
    }
  };

  const handleCompleteService = async (bookingId) => {
    try {
      setActionLoading(prev => ({ ...prev, [bookingId]: 'complete' }));
      await providerAPI.completeService(bookingId);
      toast.success('Completed', 'Service has been completed successfully');
      fetchBookings();
    } catch (error) {
      toast.error('Error', 'Failed to complete service');
    } finally {
      setActionLoading(prev => ({ ...prev, [bookingId]: null }));
    }
  };

  const getStatusColor = (bookingStatus) => {
    switch (bookingStatus) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (bookingStatus) => {
    switch (bookingStatus) {
      case 'pending':
        return ClockIcon;
      case 'accepted':
        return CheckCircleIcon;
      case 'in_progress':
        return PlayIcon;
      case 'completed':
        return CheckCircleIcon;
      default:
        return ClockIcon;
    }
  };

  const renderBookingActions = (booking) => {
    const isLoading = actionLoading[booking._id];

    if (booking.status === 'pending') {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => handleAcceptBooking(booking._id)}
            disabled={isLoading === 'accept'}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isLoading === 'accept' ? (
              <PulseLoader color="#ffffff" size={6} />
            ) : (
              'Accept'
            )}
          </button>
          <button
            onClick={() => handleRejectBooking(booking._id)}
            disabled={isLoading === 'reject'}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isLoading === 'reject' ? (
              <PulseLoader color="#ffffff" size={6} />
            ) : (
              'Reject'
            )}
          </button>
        </div>
      );
    }

    if (booking.status === 'accepted') {
      return (
        <button
          onClick={() => handleStartService(booking._id)}
          disabled={isLoading === 'start'}
          className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {isLoading === 'start' ? (
            <PulseLoader color="#ffffff" size={6} />
          ) : (
            <>
              <PlayIcon className="h-4 w-4 mr-2" />
              Start Service
            </>
          )}
        </button>
      );
    }

    if (booking.status === 'in_progress') {
      return (
        <button
          onClick={() => handleCompleteService(booking._id)}
          disabled={isLoading === 'complete'}
          className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {isLoading === 'complete' ? (
            <PulseLoader color="#ffffff" size={6} />
          ) : (
            <>
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Mark as Completed
            </>
          )}
        </button>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PulseLoader color="#ffcc00" size={15} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {status === 'pending' ? 'Booking Requests' : 
           status === 'accepted' ? 'Accepted Bookings' : 
           status === 'in_progress' ? 'In Progress' : 
           'Completed Bookings'}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {status === 'pending' ? 'Review and respond to new booking requests' :
           status === 'accepted' ? 'Manage your accepted bookings' :
           status === 'in_progress' ? 'Track services currently in progress' :
           'View your completed services'}
        </p>
      </div>

      {/* Offline Status Warning */}
      {!provider?.isAvailable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                You are currently offline
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  New booking requests will not be received while you're offline. 
                  Go to your profile or header to toggle your availability status.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'pending', label: 'Pending Requests' },
            { key: 'accepted', label: 'Accepted' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'completed', label: 'Completed' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => navigate(`/bookings?status=${tab.key}`)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${status === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.length > 0 ? (
          bookings.map((booking) => {
            const StatusIcon = getStatusIcon(booking.status);
            return (
              <div key={booking._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Customer Info */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-500" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {booking.customerId?.name || 'Customer'}
                        </h3>
                        <p className="text-sm text-gray-500">{booking.customerId?.email}</p>
                        <p className="text-sm text-gray-500">{booking.customerId?.phone}</p>
                      </div>
                    </div>

                    {/* Service Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Date: {new Date(booking.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Time: {booking.time || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Price: ${booking.totalAmount ?? booking.serviceId?.price ?? 0}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start text-sm text-gray-600">
                          <MapPinIcon className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                          <span className="break-words">
                            {booking.address || 'Address not provided'}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium">Service:</span>
                          <span className="ml-2">{booking.serviceId?.name || 'Service not specified'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center space-x-2 mb-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        Booked {new Date(booking.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Notes */}
                    {booking.notes && (
                      <div className="bg-gray-50 rounded-md p-3 mb-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {booking.notes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {renderBookingActions(booking)}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No {status} bookings</h3>
            <p className="mt-1 text-sm text-gray-500">
              {status === 'pending' ? 'No new booking requests at the moment' :
               status === 'accepted' ? 'No accepted bookings yet' :
               status === 'in_progress' ? 'No services currently in progress' :
               'No completed services yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
