import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import useToast from '../../hooks/useToast';
import { CardSkeleton } from '../../components/layout/LoadingSkeleton';

// Primary admin dashboard with KPI cards, quick actions, and latest activity.
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeProviders: 0,
    totalBookings: 0,
    monthlyRevenue: 0,
    pendingBookings: 0,
    recentActivity: []
  });

  const toast = useToast();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.analytics.getDashboard();
      setStats(response.data.data.overview);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-700">
              Welcome back! Here's what's happening with your business today.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <CardSkeleton count={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-700">
              Welcome back! Here's what's happening with your business today.
            </p>
          </div>
        </div>
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">👥</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalUsers.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/users"
                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                View all users →
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">✂️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Providers</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.activeProviders.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/providers"
                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                Manage providers →
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 font-semibold">📅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalBookings.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/bookings"
                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                View bookings →
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">💰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Monthly Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${stats.monthlyRevenue.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/payments"
                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                View payments →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/users"
            className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-amber-500 transition-colors"
          >
            <h3 className="text-base font-medium text-gray-900">Add New User</h3>
            <p className="mt-1 text-sm text-gray-500">Create a new user account</p>
          </Link>
          
          <Link
            to="/providers"
            className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-amber-500 transition-colors"
          >
            <h3 className="text-base font-medium text-gray-900">Verify Provider</h3>
            <p className="mt-1 text-sm text-gray-500">Review and approve provider applications</p>
          </Link>
          
          <Link
            to="/services"
            className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-amber-500 transition-colors"
          >
            <h3 className="text-base font-medium text-gray-900">Add Service</h3>
            <p className="mt-1 text-sm text-gray-500">Create a new service offering</p>
          </Link>
          
          <Link
            to="/bookings"
            className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-amber-500 transition-colors"
          >
            <h3 className="text-base font-medium text-gray-900">Manage Bookings</h3>
            <p className="mt-1 text-sm text-gray-500">View and update booking status</p>
          </Link>
          
          <Link
            to="/payments"
            className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-amber-500 transition-colors"
          >
            <h3 className="text-base font-medium text-gray-900">Process Refunds</h3>
            <p className="mt-1 text-sm text-gray-500">Handle payment refunds and disputes</p>
          </Link>
          
          <Link
            to="/analytics"
            className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-amber-500 transition-colors"
          >
            <h3 className="text-base font-medium text-gray-900">View Analytics</h3>
            <p className="mt-1 text-sm text-gray-500">Monitor business performance metrics</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-8">
              <p className="text-gray-500">No recent activity to display</p>
              <p className="text-sm text-gray-400 mt-2">Activity will appear here as users interact with the platform</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
