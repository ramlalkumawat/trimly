import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Layers3,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { providerAPI } from '../api/provider';
import { useAuth } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import useDelayedLoading from '../hooks/useDelayedLoading';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import {
  CardSkeleton,
  EmptyState,
  ErrorState,
  InlineLoader,
  Skeleton,
} from '../components/ui/Loader';

// Shared INR formatter for all monetary dashboard fields.
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

// Safe date formatter that avoids invalid date crashes in UI.
const formatDate = (value, formatPattern) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return format(date, formatPattern);
};

// Fallback chart data to keep graph shape stable when API has no entries.
const EMPTY_WEEK_DATA = Array.from({ length: 7 }).map((_, idx) => {
  const date = subDays(new Date(), 6 - idx);
  return {
    label: format(date, 'EEE'),
    earnings: 0,
  };
});

// Provider home dashboard with stats, trend chart, recent bookings, and claim actions.
const Dashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { provider } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [availableBookings, setAvailableBookings] = useState([]);
  const [weeklyEarnings, setWeeklyEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const showLoading = useDelayedLoading(loading, 350);

  // Pulls dashboard summary + available requests + weekly earnings in parallel.
  const loadDashboard = useCallback(
    async ({ background = false } = {}) => {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      try {
        const endDate = new Date();
        const startDate = subDays(endDate, 6);
        const config = background ? { headers: { 'x-skip-global-loader': 'true' } } : {};

        const [dashboardResponse, availableResponse, earningsResult] = await Promise.all([
          providerAPI.getDashboard(config),
          providerAPI.getAvailableBookings(config),
          providerAPI
            .getEarnings(startDate.toISOString(), endDate.toISOString(), config)
            .then((response) => ({ ok: true, response }))
            .catch(() => ({ ok: false })),
        ]);

        setDashboardData(dashboardResponse?.data?.data || {});
        setAvailableBookings(Array.isArray(availableResponse?.data?.data) ? availableResponse.data.data : []);
        setWeeklyEarnings(
          earningsResult?.ok && Array.isArray(earningsResult.response?.data?.data?.dailyEarnings)
            ? earningsResult.response.data.data.dailyEarnings
            : []
        );
        setLastUpdatedAt(new Date());
      } catch (loadError) {
        const message =
          loadError?.response?.data?.message || 'Unable to load dashboard. Please try again.';
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDashboard();
    // Background refresh keeps dashboard near real-time without manual reload.
    const intervalId = window.setInterval(() => loadDashboard({ background: true }), 60000);
    return () => window.clearInterval(intervalId);
  }, [loadDashboard]);

  // Converts earnings records into chart points.
  const chartData = useMemo(() => {
    if (!weeklyEarnings.length) return EMPTY_WEEK_DATA;
    return weeklyEarnings.map((item) => ({
      label: formatDate(item.date, 'EEE'),
      earnings: Number(item.earnings) || 0,
      bookings: Number(item.bookings) || 0,
    }));
  }, [weeklyEarnings]);

  // Aggregates dashboard cards from API payload with sensible fallbacks.
  const stats = useMemo(() => {
    const totalBookings =
      dashboardData?.totalBookings ??
      (Number(dashboardData?.pendingBookings || 0) +
        Number(dashboardData?.completedBookings || 0) +
        Number(dashboardData?.todayBookings || 0));

    const todayFromChart = weeklyEarnings.length
      ? Number(weeklyEarnings[weeklyEarnings.length - 1]?.earnings || 0)
      : 0;

    return [
      {
        key: 'total',
        title: 'Total Bookings',
        value: Number(totalBookings || 0),
        icon: Layers3,
        onClick: () => navigate('/bookings'),
      },
      {
        key: 'pending',
        title: 'Pending',
        value: Number(dashboardData?.pendingBookings || 0),
        icon: Clock3,
        onClick: () => navigate('/bookings?status=pending'),
      },
      {
        key: 'completed',
        title: 'Completed',
        value: Number(dashboardData?.completedBookings || 0),
        icon: CalendarDays,
        onClick: () => navigate('/bookings?status=completed'),
      },
      {
        key: 'todayEarnings',
        title: "Today's Earnings",
        value: formatCurrency(dashboardData?.todayEarnings ?? todayFromChart),
        icon: CircleDollarSign,
        onClick: () => navigate('/earnings'),
      },
    ];
  }, [dashboardData, navigate, weeklyEarnings]);

  const recentBookings = useMemo(
    () => (Array.isArray(dashboardData?.recentBookings) ? dashboardData.recentBookings : []),
    [dashboardData]
  );

  // Claims an open booking request and refreshes panel data.
  const handleClaimBooking = useCallback(
    async (bookingId) => {
      try {
        await providerAPI.claimBooking(bookingId);
        toast.success('Booking Claimed', 'Booking request moved to your queue.');
        loadDashboard({ background: true });
      } catch (claimError) {
        toast.error(
          'Action Failed',
          claimError?.response?.data?.message || 'Could not claim booking right now.'
        );
      }
    },
    [loadDashboard, toast]
  );

  if (showLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <CardSkeleton key={idx} rows={2} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <CardSkeleton rows={7} />
          </div>
          <div className="xl:col-span-2">
            <CardSkeleton rows={7} />
          </div>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        message={error}
        onRetry={() => loadDashboard()}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Welcome back, {provider?.name}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Monitor bookings, earnings, and real-time updates in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {refreshing ? <InlineLoader label="Refreshing..." /> : null}
          <button
            type="button"
            onClick={() => loadDashboard({ background: true })}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-300 hover:bg-zinc-100"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {error ? (
        <ErrorState compact title="Partial sync issue" message={error} onRetry={() => loadDashboard()} />
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.key}
              type="button"
              onClick={stat.onClick}
              className="rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">{stat.title}</p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-900">{stat.value}</p>
                </div>
                <div className="rounded-xl bg-zinc-100 p-2.5 text-zinc-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </button>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card
          title="Weekly Earnings"
          description="Last 7 days performance"
          className="xl:col-span-3"
          action={
            <button
              type="button"
              onClick={() => navigate('/earnings')}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors duration-300 hover:bg-zinc-100 sm:text-sm"
            >
              View Details
              <ArrowRight className="h-4 w-4" />
            </button>
          }
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#27272a" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#27272a" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  cursor={{ stroke: '#a1a1aa', strokeWidth: 1 }}
                  formatter={(value) => [formatCurrency(value), 'Earnings']}
                  labelFormatter={(label) => `Day: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#27272a"
                  fill="url(#earningsGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Quick Actions" description="Speed up daily workflow" className="xl:col-span-2">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate('/bookings')}
              className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition-colors duration-300 hover:bg-zinc-100"
            >
              <span>
                <p className="text-sm font-semibold text-zinc-900">Open Bookings</p>
                <p className="text-xs text-zinc-500">Review active and pending jobs</p>
              </span>
              <ArrowRight className="h-4 w-4 text-zinc-500" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/services')}
              className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition-colors duration-300 hover:bg-zinc-100"
            >
              <span>
                <p className="text-sm font-semibold text-zinc-900">Manage Services</p>
                <p className="text-xs text-zinc-500">Update pricing and offerings</p>
              </span>
              <ArrowRight className="h-4 w-4 text-zinc-500" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/earnings')}
              className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition-colors duration-300 hover:bg-zinc-100"
            >
              <span>
                <p className="text-sm font-semibold text-zinc-900">View Earnings</p>
                <p className="text-xs text-zinc-500">Track payouts and trends</p>
              </span>
              <ArrowRight className="h-4 w-4 text-zinc-500" />
            </button>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card
          title="Recent Bookings"
          description="Latest customer activity"
          className="xl:col-span-3"
          action={lastUpdatedAt ? <span className="text-xs text-zinc-500">Synced {format(lastUpdatedAt, 'p')}</span> : null}
        >
          {recentBookings.length ? (
            <ul className="space-y-3">
              {recentBookings.slice(0, 6).map((booking) => (
                <li
                  key={booking._id}
                  className="flex flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {booking.customerId?.name || 'Customer'}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {booking.serviceId?.name || 'Service'} • {formatDate(booking.date, 'dd MMM, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={booking.status}>{String(booking.status || 'pending').replace('_', ' ')}</Badge>
                    <span className="text-xs font-medium text-zinc-700">
                      {formatCurrency(booking.totalAmount || booking.serviceId?.price || 0)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No recent bookings yet"
              message="As soon as bookings come in, they'll appear here."
              action={
                <button
                  type="button"
                  onClick={() => navigate('/bookings')}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-zinc-800"
                >
                  Open Bookings
                </button>
              }
            />
          )}
        </Card>

        <Card
          title="Available Requests"
          description="Claim new bookings quickly"
          className="xl:col-span-2"
          action={<Badge variant="info">{availableBookings.length} open</Badge>}
        >
          {availableBookings.length ? (
            <ul className="space-y-3">
              {availableBookings.slice(0, 5).map((booking) => (
                <li key={booking._id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <p className="text-sm font-semibold text-zinc-900">
                    {booking.customerId?.name || 'Customer'}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {booking.serviceId?.name || 'Service'} • {formatDate(booking.date, 'dd MMM')}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-900">
                      {formatCurrency(booking.totalAmount || booking.serviceId?.price || 0)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleClaimBooking(booking._id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition-colors duration-300 hover:bg-zinc-800"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Claim
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No open requests"
              message="New customer requests will show up here automatically."
            />
          )}
        </Card>
      </section>
    </div>
  );
};

export default Dashboard;
