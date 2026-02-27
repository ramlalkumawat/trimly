import React, { useState, useEffect } from 'react';
import Input from '../components/Input';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useLocation as useUserLocation } from '../context/LocationContext';

// Checkout page: editable address, choose payment method, and view booking summary.
export default function Checkout() {
  const location = useLocation();
  const nav = useNavigate();
  const { serviceId, date, time, price } = location.state || {};
  const userLocation = useUserLocation();

  const [address, setAddress] = useState('');
  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pre-fill address from location context
  useEffect(() => {
    if (userLocation.location?.address) {
      setAddress(userLocation.location.address);
    }
  }, [userLocation.location]);

  // calculate summary amounts
  const tax = price ? price * 0.1 : 0;
  const total = price ? price + tax : 0;

  const handleBook = async () => {
    setError(null);
    setLoading(true);
    
    if (!address.trim()) {
      setError('Please enter a service address');
      setLoading(false);
      return;
    }
    
    try {
      const res = await api.post('/bookings', {
        serviceId,
        date,
        time,
        totalAmount: total,
        address: address.trim(),
        paymentMethod: method,
        customerLocation: userLocation.location?.latitude && userLocation.location?.longitude
          ? {
              latitude: Number(userLocation.location.latitude),
              longitude: Number(userLocation.location.longitude)
            }
          : null
      });
      
      console.log('Booking created:', res.data.data);
      console.log('Navigating to success with booking data...');
      
      // pass booking data to success page for display
      nav('/success', { state: { booking: res.data.data } });
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!serviceId || !date || !time) {
    return (
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="text-red-500 mb-4">Missing booking information</div>
        <div className="text-sm text-gray-600">
          <p>Service ID: {serviceId || 'missing'}</p>
          <p>Date: {date || 'missing'}</p>
          <p>Time: {time || 'missing'}</p>
        </div>
        <button 
          onClick={() => nav('/services')}
          className="mt-4 px-4 py-2 rounded-xl bg-primary text-black font-semibold"
        >
          Back to Services
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <h2 className="font-bold text-2xl mb-4">Checkout</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-sm text-gray-600 mb-2">Delivery / Service Address</div>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />

          <div className="mt-6">
            <div className="font-semibold mb-2">Payment</div>
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="pay"
                checked={method === 'card'}
                onChange={() => setMethod('card')}
              />
              <span className="text-sm">Card</span>
            </label>
            <label className="flex items-center gap-3 mt-2">
              <input
                type="radio"
                name="pay"
                checked={method === 'cash'}
                onChange={() => setMethod('cash')}
              />
              <span className="text-sm">Cash</span>
            </label>
          </div>
        </div>

        {/* Booking summary is shown in an aside for clarity */}
        <aside className="bg-gray-50 rounded-xl p-4">
          <div className="font-semibold">Booking Summary</div>
          <div className="mt-2 text-sm">Service: {serviceId}</div>
          <div className="flex justify-between mt-4">
            <div>Service</div>
            <div>
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 2,
              }).format(price)}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <div>Tax</div>
            <div>
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 2,
              }).format(tax)}
            </div>
          </div>
          <div className="flex justify-between mt-4 font-bold text-lg">
            <div>Total</div>
            <div>
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 2,
              }).format(total)}
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleBook}
          disabled={loading}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl btn-primary font-semibold text-lg"
        >
          {loading ? 'Booking...' : 'Book Now'}
        </button>
      </div>
    </div>
  );
}
