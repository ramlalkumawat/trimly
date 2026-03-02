import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Phone, UserCircle2 } from 'lucide-react';
import Input from '../components/Input';
import api from '../utils/api';
import { AuthSticker } from '../components/illustrations/SalonIllustrations';

const phoneRegex = /^\+?[0-9\s()-]{8,20}$/;

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const nav = useNavigate();

  const title = useMemo(() => (isRegister ? 'Create your account' : 'Welcome back'), [isRegister]);
  const subtitle = useMemo(
    () =>
      isRegister
        ? 'Join Trimly and book salon services in minutes.'
        : 'Sign in to continue your salon-at-home experience.',
    [isRegister]
  );

  const validateForm = () => {
    const nextErrors = {};

    if (isRegister && !name.trim()) {
      nextErrors.name = 'Name is required';
    }

    if (!phone.trim()) {
      nextErrors.phone = 'Phone or email is required';
    } else if (!phone.includes('@') && !phoneRegex.test(phone.trim())) {
      nextErrors.phone = 'Please enter a valid phone number or email';
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetFormState = () => {
    setError('');
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetFormState();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const url = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? { name: name.trim(), phone: phone.trim(), password } : { phone: phone.trim(), password };
      const res = await api.post(url, payload);

      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'user') {
        nav('/services');
      } else if (user.role === 'provider') {
        window.location.href = '/provider';
      } else if (user.role === 'admin') {
        window.location.href = '/admin';
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsRegister((prev) => !prev);
    setError('');
    setFieldErrors({});
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] overflow-x-hidden py-4 sm:py-8 md:py-10">
      <div className="mx-auto w-full max-w-5xl px-1 sm:px-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
          <section className="hidden lg:flex bg-gradient-to-br from-yellow-100 via-amber-50 to-white p-8 xl:p-10">
            <div className="flex flex-col justify-between w-full">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 leading-tight">Salon quality, now at your doorstep.</h2>
                <p className="mt-3 text-sm text-gray-600">
                  Easy bookings, verified professionals, and transparent pricing for every appointment.
                </p>
              </div>
              <div className="w-full max-w-sm mx-auto">
                <AuthSticker />
              </div>
            </div>
          </section>

          <section className="p-4 sm:p-7 md:p-8">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2 break-words">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="pl-9"
                      autoCapitalize="words"
                      autoCorrect="off"
                      spellCheck={false}
                      error={Boolean(fieldErrors.name)}
                      disabled={loading}
                    />
                  </div>
                  {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone or Email</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 9999999999 or you@email.com"
                      className="pl-9"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      error={Boolean(fieldErrors.phone)}
                      disabled={loading}
                    />
                </div>
                {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="pl-9 pr-10"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      error={Boolean(fieldErrors.password)}
                      disabled={loading}
                    />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-700 rounded-md"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
              </div>

              {!isRegister && (
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-gray-600 hover:text-gray-900 underline">
                    Forgot password?
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 rounded-2xl btn-primary font-semibold text-black disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
              </button>
            </form>

            <div className="text-center text-sm text-gray-600 mt-5">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={switchMode}
                className="font-semibold text-gray-900 underline underline-offset-2"
                disabled={loading}
              >
                {isRegister ? 'Login' : 'Register'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
