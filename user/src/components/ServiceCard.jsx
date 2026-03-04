import React from 'react';
import { Clock3, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

// Handles service image rendering with graceful fallback when image is unavailable.
function ServiceImage({ service }) {
  const imageSrc = service.image || service.imageUrl || service.thumbnail || null;

  if (!imageSrc) {
    return (
      <div className="h-36 rounded-xl bg-gradient-to-br from-amber-100 to-orange-50 border border-amber-200/70 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-amber-500" />
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={service.name}
      className="h-36 w-full rounded-xl object-cover border border-amber-200/60"
      loading="lazy"
      // Hide broken images instead of showing browser broken-image icon.
      onError={(event) => {
        event.currentTarget.style.display = 'none';
      }}
    />
  );
}

// Card used on services listing page for each bookable service.
export default function ServiceCard({ service }) {
  const serviceId = service._id || service.id;

  return (
    <article className="rounded-2xl border border-amber-100/80 bg-gradient-to-br from-[#fffdf8] via-[#fff9ee] to-[#fff2df] shadow-soft p-4 sm:p-5 flex flex-col card-hover">
      <ServiceImage service={service} />
      <h3 className="mt-4 font-bold text-lg text-gray-900">{service.name}</h3>
      <p className="text-sm text-gray-700 mt-2 flex-1">{service.description}</p>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-amber-100/80 bg-white/75 px-3 py-2">
        <div>
          <div className="inline-flex items-center gap-1 text-xs text-amber-800">
            <Clock3 className="w-3.5 h-3.5" />
            {service.duration || 'Flexible'}
          </div>
          <div className="font-bold text-xl text-gray-900 mt-0.5">
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0
            }).format(service.price || 0)}
          </div>
        </div>

        <Link
          to={`/services/${serviceId}`}
          className="px-4 py-2 rounded-xl bg-amber-400 text-black font-semibold whitespace-nowrap hover:bg-amber-300 transition-colors"
        >
          Book Now
        </Link>
      </div>
    </article>
  );
}
