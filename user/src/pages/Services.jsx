import React, { useEffect, useState } from 'react';
import ServiceCard from '../components/ServiceCard';
import api from '../utils/api';

// Services listing page: fetches services from backend
export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get('/services')
      .then((res) => setServices(res.data.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading services...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="font-bold text-2xl mb-4">Services</h2>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s._id || s.id} service={s} />
        ))}
      </div>
    </div>
  );
}
