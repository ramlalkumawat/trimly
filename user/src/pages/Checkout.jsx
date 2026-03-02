import React, { useMemo, useState } from 'react';
import { CreditCard, Home, IndianRupee, Wallet } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import api from '../utils/api';

export default function Checkout() {
  const location = useLocation();
  const nav = useNavigate();
  const { serviceId, date, time, price } = location.state || {};

  const [address, setAddress] = useState('');
  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addressError, setAddressError] = useState('');

  const tax = useMemo(() => (price ? price * 0.1 : 0), [price]);
  const total = useMemo(() => (price ? price + tax : 0), [price, tax]);

  const validate = () => {
    if (!address.trim()) {
      setAddressError('Please enter service address');
      return false;
    }
    if (address.trim().length < 8) {
      setAddressError('Address is too short');
      return false;
    }
    setAddressError('');
    return true;
  };

  const handleBook = async () => {
    setError('');
    if (!validate()) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expired. Please login again.');
      nav('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(
        '/bookings',
        {
          serviceId,
          date,
          time,
          totalAmount: total,
          address: address.trim(),
          paymentMethod: method
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      nav('/success', { state: { booking: res.data.data } });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to place booking');
    } finally {
      setLoading(false);
    }
  };

  if (!serviceId || !date || !time) {
    return (
      <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
        <div className="text-red-600 mb-4">Missing booking information.</div>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Service ID: {serviceId || 'missing'}</p>
          <p>Date: {date || 'missing'}</p>
          <p>Time: {time || 'missing'}</p>
        </div>
        <button
          onClick={() => nav('/services')}
          className="mt-4 px-4 py-2 rounded-xl btn-primary font-semibold text-black"
        >
          Back to Services
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 section-fade">
      <section className="rounded-3xl border border-amber-100 bg-gradient-to-r from-yellow-50 to-amber-50 px-5 sm:px-7 py-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Checkout</h1>
        <p className="mt-1 text-sm sm:text-base text-gray-600">Review details and confirm your booking.</p>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-lg">Service Address</h2>
          </div>

          <Input
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (addressError) setAddressError('');
            }}
            placeholder="Flat / House no, street, area, city"
            error={Boolean(addressError)}
            disabled={loading}
          />
          {addressError && <p className="mt-1 text-xs text-red-600">{addressError}</p>}

          <div className="mt-7">
            <h3 className="font-semibold mb-3">Payment Method</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`border rounded-xl px-4 py-3 text-left transition-all ${
                  method === 'card'
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={loading}
              >
                <div className="inline-flex items-center gap-2 font-medium text-sm">
                  <CreditCard className="w-4 h-4" />
                  Card
                </div>
                <p className="text-xs text-gray-500 mt-1">Pay securely with your card</p>
              </button>

              <button
                type="button"
                onClick={() => setMethod('cash')}
                className={`border rounded-xl px-4 py-3 text-left transition-all ${
                  method === 'cash'
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={loading}
              >
                <div className="inline-flex items-center gap-2 font-medium text-sm">
                  <Wallet className="w-4 h-4" />
                  Cash
                </div>
                <p className="text-xs text-gray-500 mt-1">Pay at the time of service</p>
              </button>
            </div>
          </div>
        </section>

        <aside className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 sm:p-6 h-fit">
          <h2 className="font-semibold text-lg">Booking Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Service</span>
              <span className="font-medium text-right">{serviceId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium">{date}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Time</span>
              <span className="font-medium">{time}</span>
            </div>
          </div>

          <div className="my-4 border-t border-gray-100" />

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Service Charge</span>
              <span>
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 2
                }).format(price || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>Tax</span>
              <span>
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 2
                }).format(tax)}
              </span>
            </div>
            <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between font-bold text-lg">
              <span>Total</span>
              <span className="inline-flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />
                {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(total)}
              </span>
            </div>
          </div>

          <button
            onClick={handleBook}
            disabled={loading}
            className="mt-6 w-full rounded-2xl btn-primary py-3.5 font-semibold text-black disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </aside>
      </div>
    </div>
  );
}
