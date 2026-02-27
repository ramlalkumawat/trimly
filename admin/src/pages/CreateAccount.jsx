import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../utils/api';

// Admin self-service account creation form.
export default function CreateAccount() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await adminAPI.auth.createAccount({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });

      if (response.data) {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-default">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Create Admin Account</h2>
        
        {error && <div className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg">{error}</div>}
        {success && <div className="text-green-500 mb-4 p-3 bg-green-50 rounded-lg">{success}</div>}
        
        <div className="mb-4">
          <label className="block text-sm mb-1">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input-default w-full"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input-default w-full"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="input-default w-full"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="input-default w-full"
            required
            minLength="6"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm mb-1">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="input-default w-full"
            required
            minLength="6"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2 rounded-xl font-semibold"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:underline"
            >
              Login here
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
