import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  SparklesIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { adminAPI } from '../../utils/api';
import useToast from '../../hooks/useToast';
import { CardSkeleton } from '../../components/layout/LoadingSkeleton';

const formatCount = (value) =>
  new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const statConfig = [
  {
    key: 'totalUsers',
    label: 'Total Users',
    Icon: UsersIcon,
    accent: 'text-blue-700 bg-blue-100',
    href: '/users',
  },
  {
    key: 'totalBookings',
    label: 'Total Bookings',
    Icon: CalendarDaysIcon,
    accent: 'text-indigo-700 bg-indigo-100',
    href: '/bookings',
  },
  {
    key: 'monthlyRevenue',
    label: 'Revenue',
    Icon: BanknotesIcon,
    accent: 'text-emerald-700 bg-emerald-100',
    href: '/payments',
    currency: true,
  },
  {
    key: 'activeServices',
    label: 'Active Services',
    Icon: CheckBadgeIcon,
    accent: 'text-amber-700 bg-amber-100',
    href: '/services',
  },
];

// Admin dashboard with KPI cards, chart placeholders and activity stream.
const Dashboard = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalUsers: 0,
      activeProviders: 0,
      totalBookings: 0,
      monthlyRevenue: 0,
      pendingBookings: 0,
    },
    revenueData: [],
    bookingGrowthData: [],
    recentActivity: [],
    activeServices: 0,
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsResponse, activeServicesResponse] = await Promise.all([
        adminAPI.analytics.getDashboard(),
        adminAPI.services.getAll({ page: 1, limit: 1, status: 'active' }),
      ]);

      const analyticsData = analyticsResponse?.data?.data || {};
      const activeServicesTotal = activeServicesResponse?.data?.data?.pagination?.total || 0;

      setDashboardData({
        overview: analyticsData.overview || {},
        revenueData: analyticsData.revenueData || [],
        bookingGrowthData: analyticsData.bookingGrowthData || [],
        recentActivity: analyticsData.recentActivity || [],
        activeServices: activeServicesTotal,
      });
    } catch (requestError) {
      const message = requestError?.response?.data?.message || 'Failed to load dashboard metrics.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const chartBars = useMemo(() => {
    const revenuePoints = dashboardData.revenueData || [];
    if (!revenuePoints.length) return [];

    const maxValue = Math.max(...revenuePoints.map((point) => Number(point.revenue || 0)), 1);
    return revenuePoints.map((point, index) => ({
      id: `${point.date}_${index}`,
      label: new Date(point.date).toLocaleDateString('en-IN', { month: 'short' }),
      percent: Math.max((Number(point.revenue || 0) / maxValue) * 100, 6),
      value: point.revenue || 0,
    }));
  }, [dashboardData.revenueData]);

  const stats = useMemo(
    () => ({
      ...dashboardData.overview,
      activeServices: dashboardData.activeServices,
    }),
    [dashboardData]
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="admin-section-title">Business Command Dashboard</h1>
          <p className="admin-section-subtitle">
            Real-time overview of users, bookings, revenue, and service operations.
          </p>
        </div>
        <button type="button" onClick={fetchDashboardData} className="admin-btn-secondary w-full sm:w-auto">
          <ArrowPathIcon className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </section>

      {loading ? <CardSkeleton count={4} /> : null}

      {!loading && error ? (
        <div className="admin-card border-red-200 bg-red-50 p-5">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button type="button" onClick={fetchDashboardData} className="admin-btn-secondary mt-3">
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statConfig.map(({ key, label, Icon, accent, href, currency }) => (
              <Link key={key} to={href} className="admin-card admin-card-hover p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {currency ? formatCurrency(stats[key]) : formatCount(stats[key])}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">Open {label.toLowerCase()} details</p>
                  </div>
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </Link>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <article className="admin-card p-5 xl:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Revenue Trend Placeholder</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Static chart section ready for advanced analytics widgets.
                  </p>
                </div>
                <SparklesIcon className="h-5 w-5 text-blue-700" />
              </div>
              <div className="mt-6 flex h-52 items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 pb-4 pt-6">
                {(chartBars.length ? chartBars : new Array(6).fill(null)).map((bar, index) => {
                  const height = bar ? `${bar.percent}%` : `${18 + index * 9}%`;
                  const label = bar?.label || `M${index + 1}`;
                  const value = bar?.value || 0;

                  return (
                    <div key={bar?.id || `placeholder_${index}`} className="flex flex-1 flex-col items-center gap-2">
                      <span className="text-[11px] text-slate-500">
                        {bar ? formatCurrency(value) : '--'}
                      </span>
                      <div className="relative flex h-36 w-full items-end rounded-lg bg-slate-200/80">
                        <div
                          className="w-full rounded-lg bg-gradient-to-t from-blue-700 to-indigo-400 transition-all duration-500"
                          style={{ height }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-500">{label}</span>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="admin-card p-5">
              <h2 className="text-lg font-semibold text-slate-900">Quick Shortcuts</h2>
              <p className="mt-1 text-sm text-slate-500">Jump directly to frequent admin actions.</p>
              <div className="mt-5 space-y-2">
                {[
                  { to: '/users', text: 'Manage users' },
                  { to: '/services', text: 'Review services' },
                  { to: '/bookings', text: 'Open booking queue' },
                  { to: '/settings', text: 'Update settings' },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                  >
                    {item.text}
                    <span aria-hidden="true">↗</span>
                  </Link>
                ))}
              </div>
            </article>
          </section>

          <section className="admin-card overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
              <p className="mt-1 text-sm text-slate-500">Latest platform events and booking movements.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Description</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboardData.recentActivity.length ? (
                    dashboardData.recentActivity.slice(0, 8).map((activity, index) => (
                      <tr key={`${activity.timestamp}_${index}`} className="transition hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-700" />
                            {(activity.type || 'event').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-700">
                          <p className="font-medium text-slate-800">{activity.title || 'Activity update'}</p>
                          <p className="text-slate-500">{activity.description || '--'}</p>
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-500">
                          {activity.timestamp
                            ? new Date(activity.timestamp).toLocaleString('en-IN')
                            : '--'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-5 py-12 text-center text-sm text-slate-500">
                        Activity feed is empty right now.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
};

export default Dashboard;
