import React, { useEffect, useState } from 'react';
import api from '../api';
import StatCard from '../components/StatCard';
import { LineChart, BarChart, PieChart } from '../components/Charts';

// Legacy dashboard page showing aggregated KPIs and chart summaries.
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get('/admin/stats')
      .then((res) => setStats(res.data.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }
  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  const {
    totalUsers,
    activeProviders,
    totalBookings,
    revenue,
    cancellationRate,
    revenueTrend,
    bookingStatus,
    topServices,
  } = stats || {};

  return (
    <main className="flex-1 overflow-y-auto pt-20 pb-8">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's your platform overview.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard icon="👥" label="Total Users" value={totalUsers} subtext="Active users on platform" />
          <StatCard icon="💼" label="Active Providers" value={activeProviders} subtext="Verified and approved" />
          <StatCard icon="📅" label="Total Bookings" value={totalBookings} subtext="Completed reservations" />
          <StatCard icon="💰" label="Revenue" value={revenue} subtext="Total commission earned" />
          <StatCard
            icon="❌"
            label="Cancellation Rate"
            value={cancellationRate}
            subtext="Bookings cancelled"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <LineChart data={revenueTrend || []} height={300} />
          </div>
          <div>
            <BarChart data={topServices || []} title="Top Services" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PieChart data={bookingStatus || []} title="Booking Status Distribution" />
        </div>
      </div>
    </main>
  );
}
