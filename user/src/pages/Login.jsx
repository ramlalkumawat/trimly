import React, { useState } from 'react';
import Input from '../components/Input';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

// Login / registration page. Phone + password credentials are sent to backend.
export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const url = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? { name, phone, password }
        : { phone, password };

      const res = await api.post(url, payload);
      const { token, user } = res.data.data;
      // store token and role
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      localStorage.setItem('user', JSON.stringify(user));

      // redirect by role
      if (user.role === 'user') {
        nav('/services');
      } else if (user.role === 'provider') {
        window.location.href = '/provider';
      } else if (user.role === 'admin') {
        window.location.href = '/admin';
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center">
      <div className="w-full max-w-sm mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h2 className="font-bold text-2xl text-[var(--text-primary)] mb-1">
            {isRegister ? 'Register' : 'Login'}
          </h2>
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <label className="block text-xs text-gray-600">Name</label>
                <Input
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </>
            )}

            <label className="block text-xs text-gray-600">Phone number</label>
            <Input
              placeholder="e.g. +1 555 0123"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <label className="block text-xs text-gray-600">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {!isRegister && (
              <div className="text-right -mt-2">
                <Link to="/forgot-password" className="text-sm underline text-gray-600 hover:text-gray-900">
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl btn-primary font-semibold"
              disabled={loading}
            >
              {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
            </button>
          </form>

          <div className="text-center text-sm text-gray-500 mt-4">
            {isRegister ? (
              <>Already have an account?{' '}
                <button
                  className="underline"
                  onClick={() => setIsRegister(false)}
                >
                  Login
                </button>
              </>
            ) : (
              <>Don't have an account?{' '}
                <button
                  className="underline"
                  onClick={() => setIsRegister(true)}
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
