import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Download,
  IndianRupee,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { endOfDay, format, startOfDay, startOfMonth, subDays } from 'date-fns';
import { providerAPI } from '../api/provider';
import useToast from '../hooks/useToast';
import useDelayedLoading from '../hooks/useDelayedLoading';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { CardSkeleton, EmptyState, ErrorState, InlineLoader, Skeleton } from '../components/ui/Loader';

const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'month', label: 'This month' },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const resolveDateRange = (range) => {
  const now = new Date();
  switch (range) {
    case '7d':
      return [startOfDay(subDays(now, 6)), endOfDay(now)];
    case '90d':
      return [startOfDay(subDays(now, 89)), endOfDay(now)];
    case 'month':
      return [startOfDay(startOfMonth(now)), endOfDay(now)];
    default:
      return [startOfDay(subDays(now, 29)), endOfDay(now)];
  }
};

const Earnings = () => {
  const toast = useToast();
  const [range, setRange] = useState('30d');
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const showLoading = useDelayedLoading(loading, 300);

  const fetchEarnings = useCallback(
    async ({ background = false } = {}) => {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const [startDate, endDate] = resolveDateRange(range);
        const response = await providerAPI.getEarnings(
          startDate.toISOString(),
          endDate.toISOString(),
          background ? { headers: { 'x-skip-global-loader': 'true' } } : {}
        );
        setEarningsData(response?.data?.data || {});
      } catch (requestError) {
        setError(requestError?.response?.data?.message || 'Unable to fetch earnings.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range]
  );

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const monthlySummaries = useMemo(() => {
    const monthly = Array.isArray(earningsData?.monthlyEarnings) ? earningsData.monthlyEarnings : [];
    const sorted = [...monthly].sort((a, b) => new Date(a.month) - new Date(b.month));
    const current = sorted[sorted.length - 1] || { earnings: 0, bookings: 0 };
    const previous = sorted[sorted.length - 2] || { earnings: 0, bookings: 0 };
    const growth =
      Number(previous.earnings) > 0
        ? ((Number(current.earnings) - Number(previous.earnings)) / Number(previous.earnings)) * 100
        : 0;

    return {
      total: Number(earningsData?.totalEarnings || 0),
      currentMonth: Number(current.earnings || 0),
      previousMonth: Number(previous.earnings || 0),
      avgTicket:
        Number(earningsData?.completedBookings || 0) > 0
          ? Number(earningsData?.totalEarnings || 0) / Number(earningsData.completedBookings)
          : 0,
      growth,
    };
  }, [earningsData]);

  const chartData = useMemo(() => {
    const monthly = Array.isArray(earningsData?.monthlyEarnings) ? earningsData.monthlyEarnings : [];
    return monthly.map((entry) => ({
      label: format(new Date(entry.month), 'MMM yy'),
      earnings: Number(entry.earnings) || 0,
      bookings: Number(entry.bookings) || 0,
    }));
  }, [earningsData]);

  const transactions = useMemo(
    () => (Array.isArray(earningsData?.recentTransactions) ? earningsData.recentTransactions : []),
    [earningsData]
  );

  const handleDownloadReport = () => {
    const rows = [
      ['Date', 'Customer', 'Service', 'Amount', 'Status'],
      ...transactions.map((item) => [
        format(new Date(item.date), 'yyyy-MM-dd'),
        item.user?.name || 'Customer',
        item.service?.name || 'Service',
        String(item.amount || 0),
        'Completed',
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trimly-earnings-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Report ready', 'CSV report downloaded successfully.');
  };

  if (showLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <CardSkeleton key={idx} rows={2} />
          ))}
        </div>
        <CardSkeleton rows={8} />
        <CardSkeleton rows={8} />
      </div>
    );
  }

  if (error && !earningsData) {
    return <ErrorState title="Unable to load earnings" message={error} onRetry={() => fetchEarnings()} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Earnings Overview</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Analyze monthly trends, transactions, and payout performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {refreshing ? <InlineLoader label="Refreshing..." /> : null}
          <button
            type="button"
            onClick={() => fetchEarnings({ background: true })}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-300 hover:bg-zinc-100"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-zinc-800"
          >
            <Download className="h-4 w-4" />
            Download Report
          </button>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-2">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setRange(option.value)}
            className={[
              'rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-300',
              range === option.value
                ? 'bg-zinc-900 text-white'
                : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100',
            ].join(' ')}
          >
            {option.label}
          </button>
        ))}
      </section>

      {error ? <ErrorState compact title="Partial sync issue" message={error} onRetry={() => fetchEarnings()} /> : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card bodyClassName="space-y-2">
          <div className="inline-flex rounded-xl bg-zinc-100 p-2 text-zinc-700">
            <IndianRupee className="h-4 w-4" />
          </div>
          <p className="text-sm text-zinc-500">Total Earnings</p>
          <p className="text-2xl font-semibold text-zinc-900">{formatCurrency(monthlySummaries.total)}</p>
        </Card>
        <Card bodyClassName="space-y-2">
          <div className="inline-flex rounded-xl bg-zinc-100 p-2 text-zinc-700">
            <CalendarDays className="h-4 w-4" />
          </div>
          <p className="text-sm text-zinc-500">This Month</p>
          <p className="text-2xl font-semibold text-zinc-900">{formatCurrency(monthlySummaries.currentMonth)}</p>
        </Card>
        <Card bodyClassName="space-y-2">
          <div className="inline-flex rounded-xl bg-zinc-100 p-2 text-zinc-700">
            <BarChart3 className="h-4 w-4" />
          </div>
          <p className="text-sm text-zinc-500">Previous Month</p>
          <p className="text-2xl font-semibold text-zinc-900">{formatCurrency(monthlySummaries.previousMonth)}</p>
        </Card>
        <Card bodyClassName="space-y-2">
          <div className="inline-flex rounded-xl bg-zinc-100 p-2 text-zinc-700">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Avg Ticket</p>
            <Badge variant={monthlySummaries.growth >= 0 ? 'success' : 'error'}>
              {monthlySummaries.growth.toFixed(1)}%
            </Badge>
          </div>
          <p className="text-2xl font-semibold text-zinc-900">{formatCurrency(monthlySummaries.avgTicket)}</p>
        </Card>
      </section>

      <Card title="Monthly Trend" description="Revenue by month">
        {chartData.length ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Earnings']} />
                <Bar dataKey="earnings" radius={[8, 8, 0, 0]} fill="#27272a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            title="No monthly data"
            message="Complete bookings to populate your monthly trend chart."
          />
        )}
      </Card>

      <Card title="Recent Transactions" description="Completed booking payouts">
        {transactions.length ? (
          <div className="-mx-4 overflow-x-auto sm:-mx-6">
            <div className="min-w-[760px] px-4 sm:px-6">
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Service</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="rounded-2xl border border-zinc-100 bg-zinc-50 text-sm text-zinc-700">
                      <td className="rounded-l-xl px-3 py-3">{format(new Date(transaction.date), 'dd MMM yyyy')}</td>
                      <td className="px-3 py-3">{transaction.user?.name || 'Customer'}</td>
                      <td className="px-3 py-3">{transaction.service?.name || 'Service'}</td>
                      <td className="px-3 py-3 font-semibold text-zinc-900">{formatCurrency(transaction.amount)}</td>
                      <td className="rounded-r-xl px-3 py-3">
                        <Badge variant="completed">Completed</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No transactions yet"
            message="Completed booking transactions will appear in this table."
          />
        )}
      </Card>
    </div>
  );
};

export default Earnings;
