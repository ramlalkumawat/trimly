import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { providerAPI } from '../api/provider';
import useToast from '../hooks/useToast';
import { 
  CalendarIcon, 
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  PowerIcon,
  UserIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { PulseLoader } from 'react-spinners';

// Test/debug dashboard used to quickly verify provider auth and stats flows.
const TestPage = () => {
  const { provider, toggleAvailability, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await providerAPI.getDashboard();
      setStats(response.data.data.stats || {
        totalBookings: 0,
        pendingBookings: 0,
        completedBookings: 0,
        totalEarnings: 0
      });
    } catch (error) {
      toast.error('Error', 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    setToggling(true);
    const newStatus = !provider?.isAvailable;
    const result = await toggleAvailability(newStatus);
    
    if (result.success) {
      toast.success(
        'Status Updated',
        `You are now ${newStatus ? 'online' : 'offline'}`
      );
    } else {
      toast.error('Error', result.error);
    }
    setToggling(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged Out', 'You have been successfully logged out');
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
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {provider?.name || 'Provider'}! Here's your business overview.
        </p>
      </div>

      {/* Availability Status Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
          <div className="flex-1">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">Your Availability Status</h2>
            <p className="text-sm text-gray-600 mt-1">
              {provider?.isAvailable 
                ? 'You are currently online and receiving booking requests' 
                : 'You are offline and not receiving new booking requests'}
            </p>
          </div>
          <button
            onClick={handleToggleAvailability}
            disabled={toggling}
            className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
              provider?.isAvailable
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {toggling ? (
              <PulseLoader color="#ffffff" size={6} />
            ) : (
              <>
                <PowerIcon className="h-4 w-4 mr-2" />
                {provider?.isAvailable ? 'Go Offline' : 'Go Online'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-2 sm:p-3">
              <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-5 w-0 flex-1">
              <dl>
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                <dd className="text-base sm:text-lg font-medium text-gray-900">{stats.totalBookings}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-2 sm:p-3">
              <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
            <div className="ml-3 sm:ml-5 w-0 flex-1">
              <dl>
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Pending Requests</dt>
                <dd className="text-base sm:text-lg font-medium text-gray-900">{stats.pendingBookings}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-2 sm:p-3">
              <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-5 w-0 flex-1">
              <dl>
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Completed Services</dt>
                <dd className="text-base sm:text-lg font-medium text-gray-900">{stats.completedBookings}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-md p-2 sm:p-3">
              <CurrencyDollarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="ml-3 sm:ml-5 w-0 flex-1">
              <dl>
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Earnings</dt>
                <dd className="text-base sm:text-lg font-medium text-gray-900">${stats.totalEarnings}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {!provider?.isAvailable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ClockIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                You are currently offline
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  While offline, you won't receive new booking requests. 
                  Toggle your availability status to start receiving bookings again.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors"
          >
            <UserIcon className="h-5 w-5 mr-2" />
            Edit Profile
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
