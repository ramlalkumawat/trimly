import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import SlotButton from '../components/SlotButton';

// Example time slots used for the UI demo; real availability isn't provided by API
const sampleTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '13:00', '14:30', '15:00'];

// Slots page: choose a date and pick an available time slot for a service
export default function Slots() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default date: today's date in YYYY-MM-DD format which works with <input type="date">
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  // `selected` stores the chosen time string (e.g. '09:00')
  const [selected, setSelected] = useState(null);
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!service) return <div>Service not found</div>;

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 space-y-6">
      <h2 className="font-bold text-2xl">Select a slot for {service.name}</h2>

      {/* Date selector - binds to `date` state */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <label className="sr-only" htmlFor="slot-date">
          Choose date
        </label>
        <input
          id="slot-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input-default px-4 py-2 rounded-xl"
        />
        <div className="text-gray-600">
          Selected date:{' '}
          <span className="font-semibold">{date}</span>
        </div>
      </div>

      {/* Time slots grid. Buttons are full-width on mobile and inline on larger screens. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {sampleTimes.map((t) => (
          <SlotButton
            key={t}
            time={t}
            selected={selected === t}
            onClick={() => setSelected(t)}
          />
        ))}
      </div>

      {/* Small summary and continue CTA. Continue disabled until a slot is chosen. */}
      <div className="flex flex-col sm:flex-row items_center justify-between gap-4">
        <div className="text-sm text-gray-600">
          Selected slot:{' '}
          <span className="font-semibold text-[var(--text-primary)]">{selected || 'None'}</span>
        </div>
        <div className="flex justify-end w-full sm:w-auto">
          <button
            onClick={() =>
              nav('/checkout', {
                state: { serviceId: service._id || service.id, date, time: selected, price: service.price },
              })
            }
            disabled={!selected}
            className={`px-6 py-3 rounded-2xl font-semibold ${
              selected ? 'btn-primary' : 'bg-gray-200 text-gray-500'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
