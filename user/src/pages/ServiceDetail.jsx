import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Clock3, IndianRupee, ShieldCheck, Sparkles } from 'lucide-react';
import api from '../utils/api';
import BackNavButton from '../components/common/BackNavButton';

// Service detail page fetches full list then selects by id so we don't need an
// extra endpoint. It displays loading/error states.
export default function ServiceDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get('/services')
      .then((res) => {
        const items = res.data.data;
        const found = items.find((s) => (s._id || s.id) === id);
        if (!found) {
          setError('Service not found');
        } else {
          setService(found);
        }
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <BackNavButton fallback="/services" label="Back to Services" />
        <div className="rounded-2xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-soft">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <BackNavButton fallback="/services" label="Back to Services" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-4">
        <BackNavButton fallback="/services" label="Back to Services" />
        <div className="rounded-2xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-soft">Service not found</div>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(service.price);

  const serviceIncludes = Array.isArray(service.includes) ? service.includes : [];

  return (
    <div className="space-y-4">
      <BackNavButton fallback="/services" label="Back to Services" />

      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-5 sm:p-8">
        <div className="absolute -top-12 -right-10 h-44 w-44 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-white">
              <Sparkles className="h-3.5 w-3.5" />
              Premium Service
            </span>
            <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">{service.name}</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{service.description}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700">
                <Clock3 className="h-3.5 w-3.5 text-indigo-600" />
                {service.duration || 'Flexible duration'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Verified professional
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700">
                <CalendarClock className="h-3.5 w-3.5 text-indigo-600" />
                Same-day booking
              </span>
            </div>
          </div>

          <aside className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-soft backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Service Price</h2>
            <div className="mt-2 inline-flex items-center gap-1 text-3xl font-bold text-slate-900">
              <IndianRupee className="h-6 w-6" />
              <span>{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(service.price || 0)}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Final amount with taxes will be shown on checkout.</p>

            <button
              onClick={() => nav(`/slots/${service._id || service.id}`)}
              className="mt-5 w-full rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400"
            >
              Select Slot
            </button>
          </aside>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">What’s Included</h2>
        {serviceIncludes.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {serviceIncludes.map((item, idx) => (
              <article key={`${item}-${idx}`} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Service inclusions will be shared by your professional before starting the session.
          </p>
        )}

        <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-900">
          <p className="font-semibold">Booking Tip</p>
          <p className="mt-1 text-indigo-800">
            Choose a slot when you can be available for the full duration for the best service experience.
          </p>
        </div>
      </section>
    </div>
  );
}
