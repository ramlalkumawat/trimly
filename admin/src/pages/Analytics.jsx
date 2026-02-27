import React, { useState, useEffect } from 'react';
import api from '../api';
import { LineChart, BarChart } from '../components/Charts';

// Legacy analytics page for trend comparison and performance insights.
export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get('/admin/analytics')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  if (!data) return null;

  return (
    <main className="flex-1 overflow-y-auto pt-20 pb-8">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-text-primary mb-2">Analytics</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineChart data={data.revenue || []} height={300} />
          <BarChart data={data.monthlyBookings || []} title="Monthly Bookings" />
        </div>
      </div>
    </main>
  );
}
