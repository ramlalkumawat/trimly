import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!service) return <div>Service not found</div>;

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(service.price);

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      {/* Service title */}
      <h2 className="font-bold text-2xl mb-2">{service.name}</h2>

      {/* Full description text */}
      <div className="text-gray-600 mb-4">{service.description}</div>

      {/* What's included list (may be empty) */}
      {service.includes && (
        <div className="mb-4">
          <div className="font-semibold">What's included</div>
          <ul className="list-disc list-inside text-gray-600">
            {service.includes.map((it, idx) => (
              <li key={idx}>{it}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom row: duration, price and CTA */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">{service.duration}</div>
          <div className="font-semibold text-xl">{formattedPrice}</div>
        </div>

        <button
          onClick={() => nav(`/slots/${service._id || service.id}`)}
          className="px-5 py-3 rounded-2xl btn-primary font-semibold"
        >
          Select Slot
        </button>
      </div>
    </div>
  );
}
