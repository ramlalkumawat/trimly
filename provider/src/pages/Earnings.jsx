import React, { useState, useEffect } from 'react';
import { providerAPI } from '../api/provider';
import useToast from '../hooks/useToast';
import { 
  CurrencyDollarIcon, 
  CalendarIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { PulseLoader } from 'react-spinners';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

// Earnings analytics page with date filters and trend chart summaries.
const Earnings = () => {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days'); // 7days, 30days, 3months, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    fetchEarnings();
  }, [dateRange, customStartDate, customEndDate]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      let startDate, endDate;

      switch (dateRange) {
        case '7days':
          startDate = subDays(new Date(), 7);
          endDate = new Date();
          break;
        case '30days':
          startDate = subDays(new Date(), 30);
          endDate = new Date();
          break;
        case '3months':
          startDate = subDays(new Date(), 90);
          endDate = new Date();
          break;
        case 'thisMonth':
          startDate = startOfMonth(new Date());
          endDate = endOfMonth(new Date());
          break;
        case 'custom':
          if (!customStartDate || !customEndDate) {
            setLoading(false);
            return;
          }
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          break;
        default:
          startDate = subDays(new Date(), 30);
          endDate = new Date();
      }

      const response = await providerAPI.getEarnings(
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      setEarnings(response.data.data);
    } catch (error) {
      toast.error('Error', 'Failed to fetch earnings data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const prepareChartData = () => {
    if (!earnings?.dailyEarnings) return [];
    
    return earnings.dailyEarnings.map(day => ({
      date: format(new Date(day.date), 'MMM dd'),
      earnings: day.earnings,
      bookings: day.bookings
    }));
  };

  const prepareMonthlyData = () => {
    if (!earnings?.monthlyEarnings) return [];
    
    return earnings.monthlyEarnings.map(month => ({
      month: format(new Date(month.month), 'MMM yyyy'),
      earnings: month.earnings,
      bookings: month.bookings
    }));
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
        <h1 className="text-2xl font-semibold text-gray-900">Earnings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track your income and payment history
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[
              { value: '7days', label: 'Last 7 days' },
              { value: '30days', label: 'Last 30 days' },
              { value: '3months', label: 'Last 3 months' },
              { value: 'thisMonth', label: 'This month' },
              { value: 'custom', label: 'Custom range' }
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => {
                  if (range.value === 'custom') {
                    setShowCustomRange(!showCustomRange);
                  } else {
                    setDateRange(range.value);
                    setShowCustomRange(false);
                  }
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  dateRange === range.value && !showCustomRange
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        {showCustomRange && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  if (customStartDate && customEndDate) {
                    setDateRange('custom');
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Apply Range
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md p-3 bg-green-500">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Earnings
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {formatCurrency(earnings?.totalEarnings || 0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md p-3 bg-blue-500">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Completed Bookings
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {earnings?.completedBookings || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md p-3 bg-purple-500">
              <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Average Earnings
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {formatCurrency(earnings?.averageEarnings || 0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md p-3 bg-yellow-500">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Daily Average
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {formatCurrency(earnings?.dailyAverage || 0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Earnings Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Earnings</h3>
          {earnings?.dailyEarnings?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={prepareChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Earnings']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="earnings" 
                  stroke="#ffcc00" 
                  strokeWidth={2}
                  dot={{ fill: '#ffcc00' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No daily earnings data available
            </div>
          )}
        </div>

        {/* Monthly Earnings Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Overview</h3>
          {earnings?.monthlyEarnings?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareMonthlyData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Earnings']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar dataKey="earnings" fill="#ffcc00" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No monthly earnings data available
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-hidden">
          {earnings?.recentTransactions?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {earnings.recentTransactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.user?.name || 'Customer'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.service?.name || 'Service'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your completed booking transactions will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Earnings;
