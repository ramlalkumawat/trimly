import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { providerAPI } from '../api/provider';
import { useAuth } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import { 
  CalendarIcon, 
  CheckCircleIcon, 
  ClockIcon,
  CurrencyDollarIcon,
  PowerIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { PulseLoader } from 'react-spinners';

// Provider home dashboard showing live stats, requests, and availability state.
const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [availableBookings, setAvailableBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  
  const { provider, updateProfile, toggleAvailability } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchDashboardData();
    fetchAvailableBookings();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      const response = await providerAPI.getDashboard();
      console.log('Dashboard data received:', response.data.data);
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Error', 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBookings = async () => {
    try {
      console.log('Fetching available bookings...');
      const response = await providerAPI.getAvailableBookings();
      console.log('Available bookings received:', response.data.data);
      setAvailableBookings(response.data.data);
    } catch (error) {
      console.error('Available bookings fetch error:', error);
      // Don't show error toast for this as it's not critical
    }
  };

  const handleClaimBooking = async (bookingId) => {
    try {
      const response = await providerAPI.claimBooking(bookingId);
      toast.success('Success', 'Booking claimed successfully');
      
      // Refresh both dashboard and available bookings
      fetchDashboardData();
      fetchAvailableBookings();
      
      // Navigate to bookings page
      navigate('/bookings');
    } catch (error) {
      console.error('Claim booking error:', error);
      toast.error('Error', error.response?.data?.message || 'Failed to claim booking');
    }
  };

  const handleToggleAvailability = async () => {
    try {
      setTogglingAvailability(true);
      const newAvailability = !provider.isAvailable;
      const result = await toggleAvailability(newAvailability);
      
      if (result.success) {
        toast.success(
          newAvailability ? 'Online' : 'Offline',
          `You are now ${newAvailability ? 'available' : 'unavailable'} for bookings`
        );
      } else {
        toast.error('Error', result.error || 'Failed to update availability');
      }
    } catch (error) {
      toast.error('Error', 'Failed to update availability');
    } finally {
      setTogglingAvailability(false);
    }
  };

  const statCards = [
    {
      name: "Today's Bookings",
      value: dashboardData?.todayBookings || 0,
      icon: CalendarIcon,
      color: 'bg-blue-500',
      onClick: () => navigate('/bookings')
    },
    {
      name: 'Pending Requests',
      value: dashboardData?.pendingBookings || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      onClick: () => navigate('/bookings?status=pending')
    },
    {
      name: 'Completed Services',
      value: dashboardData?.completedBookings || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      onClick: () => navigate('/bookings?status=completed')
    },
    {
      name: 'Total Earnings',
      value: `$${dashboardData?.totalEarnings?.toFixed(2) || '0.00'}`,
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500',
      onClick: () => navigate('/earnings')
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <PulseLoader color="#ffcc00" size={15} />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Fallback if no dashboard data
  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600">Dashboard data is loading. Please refresh if this persists.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {provider?.name}! Here's what's happening with your business today.
        </p>
      </div>

      {/* Availability Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <PowerIcon className={`h-8 w-8 ${provider?.isAvailable ? 'text-green-500' : 'text-gray-400'}`} />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Availability Status</h3>
              <p className="text-sm text-gray-600">
                {provider?.isAvailable 
                  ? 'You are currently available for new bookings' 
                  : 'You are currently unavailable for new bookings'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleAvailability}
            disabled={togglingAvailability}
            className={`
              relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
              ${provider?.isAvailable ? 'bg-green-500' : 'bg-gray-300'}
              ${togglingAvailability ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200
                ${provider?.isAvailable ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.name}
              onClick={stat.onClick}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Available Bookings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Available Bookings</h3>
          <p className="text-sm text-gray-500 mt-1">New booking requests you can claim</p>
        </div>
        <div className="p-6">
          {availableBookings.length > 0 ? (
            <div className="space-y-4">
              {availableBookings.map((booking) => (
                <div key={booking._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <ClockIcon className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {booking.customerId?.name || 'Customer'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.serviceId?.name || 'Service'} • ${booking.serviceId?.price || booking.totalAmount || 0}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(booking.date).toLocaleDateString()} at {booking.time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => handleClaimBooking(booking._id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      Claim Booking
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No available bookings</h3>
              <p className="mt-1 text-sm text-gray-500">
                New booking requests will appear here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
        </div>
        <div className="p-6">
          {dashboardData?.recentBookings?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentBookings.map((booking) => (
                <div key={booking._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        booking.status === 'pending' ? 'bg-yellow-100' :
                        booking.status === 'accepted' ? 'bg-blue-100' :
                        booking.status === 'in_progress' ? 'bg-purple-100' :
                        booking.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <UserGroupIcon className={`h-6 w-6 ${
                          booking.status === 'pending' ? 'text-yellow-600' :
                          booking.status === 'accepted' ? 'text-blue-600' :
                          booking.status === 'in_progress' ? 'text-purple-600' :
                          booking.status === 'completed' ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {booking.customerId?.name || 'Customer'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.serviceId?.name || 'Service'} • ${booking.totalAmount || booking.serviceId?.price || 0}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {booking.status.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(booking.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No recent bookings</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your recent booking activity will appear here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          onClick={() => navigate('/bookings?status=pending')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
        >
          <ClockIcon className="h-8 w-8 text-yellow-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Review Requests</h3>
          <p className="mt-1 text-sm text-gray-600">
            Check and respond to new booking requests
          </p>
        </button>

        <button
          onClick={() => navigate('/services')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
        >
          <UserGroupIcon className="h-8 w-8 text-blue-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Manage Services</h3>
          <p className="mt-1 text-sm text-gray-600">
            Add or update your service offerings
          </p>
        </button>

        <button
          onClick={() => navigate('/earnings')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
        >
          <CurrencyDollarIcon className="h-8 w-8 text-green-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">View Earnings</h3>
          <p className="mt-1 text-sm text-gray-600">
            Track your income and payment history
          </p>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
