import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, Home, IndianRupee, MapPin, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import api from '../utils/api';
import BackNavButton from '../components/common/BackNavButton';

export default function Checkout() {
  const location = useLocation();
  const nav = useNavigate();
  const { serviceId, serviceName, date, time, price } = location.state || {};
  const backTarget = serviceId ? `/slots/${serviceId}` : '/services';
  const [resolvedServiceName, setResolvedServiceName] = useState(serviceName || '');

  const [address, setAddress] = useState('');
  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addressError, setAddressError] = useState('');

  const tax = useMemo(() => (price ? price * 0.1 : 0), [price]);
  const total = useMemo(() => (price ? price + tax : 0), [price, tax]);

  useEffect(() => {
    if (resolvedServiceName || !serviceId) {
      return;
    }

    api
      .get('/services')
      .then((res) => {
        const found = (res.data.data || []).find((item) => (item._id || item.id) === serviceId);
        if (found?.name) {
          setResolvedServiceName(found.name);
        }
      })
      .catch(() => {
        // silent fallback to serviceId if service list fetch fails
      });
  }, [resolvedServiceName, serviceId]);

  const formattedDate = useMemo(() => {
    if (!date) return '';
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, [date]);

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
      <div className="space-y-4">
        <BackNavButton fallback="/services" label="Back to Services" />
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
      </div>
    );
  }

  return (
    <div className="space-y-6 section-fade">
      <BackNavButton fallback={backTarget} label="Back to Slots" />

      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-5 py-6 sm:px-7 sm:py-7">
        <div className="absolute -top-10 -right-8 h-40 w-40 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
            <Sparkles className="h-3.5 w-3.5" />
            Secure Checkout
          </span>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Confirm your booking details</h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Review service info, add address, and complete your booking in one step.
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5">
          <article className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-lg text-slate-900">Service Address</h2>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 mb-4 text-xs text-slate-600">
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-indigo-600 shrink-0" />
                <span>Please enter full address with landmark so the professional reaches on time.</span>
              </p>
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
          </article>

          <article className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-lg text-slate-900">Payment Method</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                  method === 'card'
                    ? 'border-indigo-300 bg-indigo-50 shadow-[0_16px_30px_-24px_rgba(67,56,202,0.9)]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={loading}
              >
                <div className="inline-flex items-center gap-2 font-medium text-sm text-slate-900">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  Card
                </div>
                <p className="text-xs text-gray-500 mt-1">Pay securely with your card</p>
              </button>

              <button
                type="button"
                onClick={() => setMethod('cash')}
                className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                  method === 'cash'
                    ? 'border-indigo-300 bg-indigo-50 shadow-[0_16px_30px_-24px_rgba(67,56,202,0.9)]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={loading}
              >
                <div className="inline-flex items-center gap-2 font-medium text-sm text-slate-900">
                  <Wallet className="w-4 h-4 text-indigo-600" />
                  Cash
                </div>
                <p className="text-xs text-gray-500 mt-1">Pay at the time of service</p>
              </button>
            </div>
          </article>

          <article className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-900">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="h-4.5 w-4.5 mt-0.5 shrink-0 text-emerald-600" />
              <span>Your booking is confirmed only after successful checkout.</span>
            </p>
          </article>
        </section>

        <aside className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 sm:p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-semibold text-lg text-slate-900">Booking Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Service</span>
              <span className="font-medium text-right">{resolvedServiceName || serviceId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium">{formattedDate || date}</span>
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
            className="mt-6 w-full rounded-2xl bg-emerald-500 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </aside>
      </div>
    </div>
  );
}
