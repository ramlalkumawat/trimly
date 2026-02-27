import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import api from '../utils/api';

// Password reset request page. Accepts either email or phone as login identifier.
export default function ForgotPassword() {
  const [loginId, setLoginId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Backend supports both formats; payload is shaped based on user input.
      const value = loginId.trim();
      const payload = value.includes('@')
        ? { email: value.toLowerCase() }
        : { phone: value };

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
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center">
      <div className="w-full max-w-sm mx-auto px-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-soft p-6">
          <h2 className="font-bold text-2xl text-[var(--text-primary)] mb-2">Forgot Password</h2>
          <p className="text-sm text-gray-600 mb-5">
            Enter your registered email or phone number.
          </p>

          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          {success && <div className="text-green-600 text-sm mb-4">{success}</div>}

          <label className="block text-xs text-gray-600">Email or phone</label>
          <Input
            placeholder="e.g. +1 555 0123 or name@email.com"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full mt-4 py-3 rounded-2xl btn-primary font-semibold"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Send Request'}
          </button>

          <div className="text-center text-sm text-gray-500 mt-4">
            Remember password?{' '}
            <button
              type="button"
              className="underline"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
