import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CalendarDays, Clock3, Sparkles } from 'lucide-react';
import api from '../utils/api';
import SlotButton from '../components/SlotButton';
import BackNavButton from '../components/common/BackNavButton';

// Example time slots used for the UI demo; real availability isn't provided by API
const sampleTimes = [
  { time: '09:00', label: 'Morning' },
  { time: '09:30', label: 'Morning' },
  { time: '10:00', label: 'Morning' },
  { time: '10:30', label: 'Morning' },
  { time: '11:30', label: 'Noon' },
  { time: '13:00', label: 'Afternoon' },
  { time: '14:30', label: 'Afternoon' },
  { time: '16:00', label: 'Evening' },
  { time: '17:30', label: 'Evening' }
];

const getLocalToday = () => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const toMinutes = (value = '') => {
  const [hours, mins] = value.split(':').map(Number);
  return (Number.isNaN(hours) ? 0 : hours) * 60 + (Number.isNaN(mins) ? 0 : mins);
};

// Slots page: choose a date and pick an available time slot for a service
export default function Slots() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default date: today's date in YYYY-MM-DD format which works with <input type="date">
  const today = getLocalToday();
  const [date, setDate] = useState(today);
  // `selected` stores the chosen time string (e.g. '09:00')
  const [selected, setSelected] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    setLoading(true);
    api
      .get('/services')
      .then((res) => {
        const found = res.data.data.find((s) => (s._id || s.id) === id);
        if (!found) setError('Service not found');
        else setService(found);
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!selected) return;

    const now = new Date();
    const isTodaySelected = date === today;
    const slotIsPast = toMinutes(selected) <= now.getHours() * 60 + now.getMinutes();

    if (isTodaySelected && slotIsPast) {
      setSelected('');
    }
  }, [date, selected, today]);

  if (loading) {
    return (
      <div className="space-y-4">
        <BackNavButton fallback={`/services/${id}`} label="Back to Service" />
        <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-soft">
          Loading slots...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <BackNavButton fallback={`/services/${id}`} label="Back to Service" />
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-4">
        <BackNavButton fallback="/services" label="Back to Services" />
        <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-soft">
          Service not found.
        </div>
      </div>
    );
  }

  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const availableSlots = sampleTimes.filter((slot) => {
    if (date !== today) return true;
    const now = new Date();
    return toMinutes(slot.time) > now.getHours() * 60 + now.getMinutes();
  });

  return (
    <div className="space-y-6 section-fade">
      <BackNavButton fallback={`/services/${id}`} label="Back to Service" />

      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-5 py-6 sm:px-8 sm:py-8">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
            <Sparkles className="h-3.5 w-3.5" />
            Smart Slot Booking
          </div>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Select your preferred time slot</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Choose date and time for <span className="font-semibold text-slate-800">{service.name}</span>. We only show
            actionable slots for smooth booking.
          </p>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft sm:p-6">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">Choose Date</h2>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="slot-date">
              Choose date
            </label>
            <input
              id="slot-date"
              type="date"
              value={date}
              min={today}
              onChange={(e) => {
                const nextDate = e.target.value;
                setDate(nextDate < today ? today : nextDate);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-auto"
            />
            <p className="text-sm text-slate-600">
              Selected: <span className="font-semibold text-slate-800">{formattedDate}</span>
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-slate-900">Available Time Slots</h3>
          </div>

          {availableSlots.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No upcoming slots left for today. Please pick another date.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sampleTimes.map((slot) => {
                const isDisabled = !availableSlots.some((openSlot) => openSlot.time === slot.time);
                return (
                  <SlotButton
                    key={slot.time}
                    time={slot.time}
                    subtitle={slot.label}
                    selected={selected === slot.time}
                    disabled={isDisabled}
                    onClick={() => {
                      if (!isDisabled) setSelected(slot.time);
                    }}
                  />
                );
              })}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-3xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50 p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Booking Snapshot</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span>Service</span>
              <span className="font-semibold text-slate-900 text-right">{service.name}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Date</span>
              <span className="font-semibold text-slate-900">{formattedDate}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Slot</span>
              <span className="font-semibold text-slate-900">{selected || 'Select a slot'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Price</span>
              <span className="font-semibold text-slate-900">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0
                }).format(service.price || 0)}
              </span>
            </div>
          </div>

          <button
            onClick={() =>
              nav('/checkout', {
                state: {
                  serviceId: service._id || service.id,
                  serviceName: service.name,
                  date,
                  time: selected,
                  price: service.price
                }
              })
            }
            disabled={!selected}
            className={`mt-6 w-full rounded-2xl px-6 py-3 font-semibold transition-all ${
              selected
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 hover:bg-emerald-400'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            Continue to Checkout
          </button>
        </aside>
      </div>
    </div>
  );
}
