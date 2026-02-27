import React from 'react'
import { Link } from 'react-router-dom'

// Card used in the services grid. Receives `service` object as prop.
// Clicking the `Link` navigates to the service detail page using the service id.
export default function ServiceCard({service}){
  return (
    <div className="bg-white rounded-xl shadow-soft p-5 flex flex-col">
      <h3 className="font-bold text-lg mb-2">{service.name}</h3>
      {/* Short description; flex-1 pushes price/button to the bottom for consistent card height */}
      <p className="text-sm text-gray-600 mb-4 flex-1">{service.description}</p>
      <div className="flex items-center justify-between mt-4">
        <div>
          <div className="text-sm text-gray-500">{service.duration}</div>
          <div className="font-semibold text-xl">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(service.price)}</div>
        </div>
        {/* `to` uses a template string to build the route for this service */}
        <Link to={`/services/${service._id}`} className="px-4 py-2 rounded-xl bg-primary text-black font-semibold">Book Now</Link>
      </div>
    </div>
  )
}
