import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { adminAPI } from '../../utils/api';
import useToast from '../../hooks/useToast';
import { CardSkeleton } from '../../components/layout/LoadingSkeleton';
import DataTable from '../../components/tables/DataTable';

// Advanced analytics page with charts/tables for business performance monitoring.
const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalUsers: 0,
      activeProviders: 0,
      totalBookings: 0,
      monthlyRevenue: 0
    },
    revenueData: [],
    bookingGrowthData: [],
    topProviders: [],
    serviceDistribution: [],
    recentActivity: []
  });

  const toast = useToast();

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.analytics.getDashboard();
      setAnalyticsData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch analytics data');
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Chart colors
  const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899'];

  // Format currency for Indian Rupees
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format date for charts
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Top providers table columns
  const providerColumns = [
    {
      key: 'provider',
      title: 'Provider',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{row.businessName}</div>
          <div className="text-sm text-gray-500">
            {row.firstName} {row.lastName}
          </div>
        </div>
      )
    },
    {
      key: 'totalBookings',
      title: 'Total Bookings',
      render: (value) => (
        <div className="text-center font-medium">{value}</div>
      )
    },
    {
      key: 'totalRevenue',
      title: 'Total Revenue',
      render: (value) => (
        <div className="text-center font-medium">{formatCurrency(value)}</div>
      )
    },
    {
      key: 'averageRating',
      title: 'Avg Rating',
      render: (value) => (
        <div className="text-center">
          <div className="font-medium">{value?.toFixed(1) || 'N/A'}</div>
          {value && (
            <div className="text-sm text-gray-500">⭐ {value.toFixed(1)}</div>
          )}
        </div>
      )
    },
    {
      key: 'completionRate',
      title: 'Completion Rate',
      render: (value) => (
        <div className="text-center">
          <div className="font-medium">{value?.toFixed(1)}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className="bg-amber-600 h-2 rounded-full" 
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
            <p className="mt-2 text-sm text-gray-700">
              Real-time insights and performance metrics
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
            <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
            <p className="mt-2 text-sm text-gray-700">
              Real-time insights and performance metrics
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
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">
            Real-time insights and performance metrics
          </p>
        </div>
      </div>

      {/* Overview Cards */}
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
                  <dd className="text-lg font-medium text-gray-900">{analyticsData.overview.totalUsers.toLocaleString()}</dd>
                </dl>
              </div>
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
                  <dd className="text-lg font-medium text-gray-900">{analyticsData.overview.activeProviders.toLocaleString()}</dd>
                </dl>
              </div>
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
                  <dd className="text-lg font-medium text-gray-900">{analyticsData.overview.totalBookings.toLocaleString()}</dd>
                </dl>
              </div>
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
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(analyticsData.overview.monthlyRevenue)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis 
                  tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Growth Chart */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.bookingGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [value, 'Bookings']}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Legend />
                <Bar 
                  dataKey="bookings" 
                  fill="#10B981"
                  name="Bookings"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Service Distribution and Top Providers */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Distribution */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Service Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.serviceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.serviceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Bookings']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Providers */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Providers</h3>
            <DataTable
              data={analyticsData.topProviders}
              columns={providerColumns}
              loading={false}
              error={null}
              pagination={null}
              showSearch={false}
              emptyMessage="No provider data available"
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {analyticsData.recentActivity.length > 0 ? (
              analyticsData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      activity.type === 'booking' ? 'bg-amber-500' :
                      activity.type === 'payment' ? 'bg-green-500' :
                      activity.type === 'user' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
