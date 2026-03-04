import React, { useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import api from '../utils/api';
import { EmptyStateSticker } from '../components/illustrations/SalonIllustrations';

// Placeholder card shown while services API response is loading.
function ServiceCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-3/5" />
      <div className="mt-3 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-4/5" />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-gray-100 rounded" />
          <div className="h-5 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-9 w-24 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

// Customer services listing page that drives the booking journey entry point.
export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pulls active services from backend and handles loading/error states.
  const fetchServices = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/services');
      setServices(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <div className="space-y-8 section-fade">
      <section className="rounded-3xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 px-5 sm:px-7 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Choose Your Service</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Pick a service, select your time slot, and confirm your booking in minutes.
        </p>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchServices}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <ServiceCardSkeleton key={idx} />
          ))}
        </div>
      )}

      {!loading && !error && services.length > 0 && (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service._id || service.id} service={service} />
          ))}
        </div>
      )}

      {!loading && !error && services.length === 0 && (
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center max-w-xl mx-auto">
          <div className="w-44 mx-auto">
            <EmptyStateSticker />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">No Services Available</h2>
          <p className="mt-2 text-sm text-gray-600">
            We are updating our catalog. Please check again in a few moments.
          </p>
          <button
            onClick={fetchServices}
            className="mt-5 px-5 py-2.5 rounded-xl btn-primary font-semibold text-black"
          >
            Refresh Services
          </button>
        </div>
      )}
    </div>
  );
}
