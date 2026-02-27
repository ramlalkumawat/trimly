import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Booking success page displays information returned from API.
export default function Success() {
  const location = useLocation();
  const nav = useNavigate();
  const booking = location.state?.booking;

  console.log('Success page - location state:', location.state);
  console.log('Success page - booking:', booking);

  // Auto-redirect to profile after 5 seconds if booking exists
  useEffect(() => {
    if (booking) {
      const timer = setTimeout(() => {
        console.log('Auto-redirecting to profile...');
        nav('/profile');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [booking, nav]);

  if (!booking) {
    console.log('No booking data found, showing fallback');
    return (
      <div className="bg-white rounded-2xl shadow-soft p-6 text-center max-w-md mx-auto">
        <h2 className="font-bold text-2xl mb-4">No booking data</h2>
        <div className="text-gray-600 mb-4">
          Booking data was not passed correctly. Please check your booking history.
        </div>
        <button
          onClick={() => nav('/services')}
          className="btn-primary px-6 py-3 rounded-2xl font-semibold"
        >
          Browse Services
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 text-center max-w-md mx-auto">
      <h2 className="font-bold text-2xl mb-2">Booking Confirmed!</h2>
      <div className="text-green-600 mb-4">✓ Your booking has been successfully created</div>
      <div className="text-gray-600 mb-4">{booking.message || 'Your booking is confirmed!'}</div>
      <div className="text-gray-600 mb-2">Booking ID</div>
      <div className="font-mono font-semibold text-xl mb-4">{booking._id || booking.id}</div>
      <div className="text-sm text-gray-500 mb-4">You will be redirected to your profile in 5 seconds...</div>
      <button
        onClick={() => nav('/profile')}
        className="w-full sm:w-auto px-6 py-3 rounded-2xl btn-primary font-semibold"
      >
        Go to Profile Now
      </button>
    </div>
  );
}
