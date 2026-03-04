import React, { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import api from '../utils/api';
import { AuthSticker } from '../components/illustrations/SalonIllustrations';

// Simple forgot-password request screen supporting email or phone identifier.
export default function ForgotPassword() {
  const [loginId, setLoginId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Submits password-reset request payload to backend.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!loginId.trim()) {
      setError('Email or phone is required');
      return;
    }

    setLoading(true);
    try {
      // Backend accepts either email or phone field.
      const value = loginId.trim();
      const payload = value.includes('@') ? { email: value.toLowerCase() } : { phone: value };
      const response = await api.post('/auth/forgot-password', payload);

      if (response.data?.success) {
        setSuccess(response.data.message || 'Password reset request accepted.');
        setLoginId('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit password reset request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 sm:py-12 flex items-center">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
          <section className="hidden md:flex items-center bg-gradient-to-br from-amber-50 to-yellow-100 p-8">
            <AuthSticker />
          </section>

          <section className="p-5 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Forgot Password</h1>
            <p className="mt-1 text-sm text-gray-600">
              Enter your registered email or phone number and we will process your reset request.
            </p>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email or phone</label>
                <Input
                  placeholder="e.g. +91 9999999999 or name@email.com"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  disabled={loading}
                  error={Boolean(error)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary rounded-2xl py-3 font-semibold text-black disabled:opacity-60 disabled:cursor-not-allowed inline-flex justify-center items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Submitting...' : 'Send Request'}
              </button>
            </form>

            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
