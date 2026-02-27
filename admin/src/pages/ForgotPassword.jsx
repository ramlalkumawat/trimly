import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../utils/api';

// Admin password-reset request page.
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
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
      const response = await adminAPI.auth.forgotPassword(email);

      if (response.data.success) {
        setSuccess(response.data.message || 'Password reset link has been sent to your email!');
        setEmail('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-default">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
        <p className="text-gray-600 mb-6 text-sm">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {error && <div className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg">{error}</div>}
        {success && <div className="text-green-500 mb-4 p-3 bg-green-50 rounded-lg">{success}</div>}
        
        <div className="mb-6">
          <label className="block text-sm mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-default w-full"
            placeholder="Enter your email"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2 rounded-xl font-semibold"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:underline"
            >
              Back to Login
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
