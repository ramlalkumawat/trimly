import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { PulseLoader } from 'react-spinners';
import useDelayedLoading from '../hooks/useDelayedLoading';

// Provider login page with validation and redirect to last requested route.
const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const { login, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showSlowNetworkHint = useDelayedLoading(submitting, 2500);

  const from = location.state?.from?.pathname || '/dashboard';
  const normalizedIdentifier = useMemo(
    () => formData.identifier.trim(),
    [formData.identifier]
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    if (error) {
      setErrors({ submit: error });
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (errors[name] || errors.submit) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        submit: ''
      }));
      clearError();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!normalizedIdentifier) {
      newErrors.identifier = 'Email or phone is required';
    } else {
      const isEmail = /\S+@\S+\.\S+/.test(normalizedIdentifier);
      const isPhone = /^\+?[\d\s\-()]{8,}$/.test(normalizedIdentifier);

      if (!isEmail && !isPhone) {
        newErrors.identifier = 'Enter a valid email or phone number';
      }
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;
    
    if (!validateForm()) {
      return;
    }

    const payload = /^\+?[\d\s\-()]{8,}$/.test(normalizedIdentifier)
      ? {
          phone: normalizedIdentifier,
          password: formData.password,
        }
      : {
          email: normalizedIdentifier,
          password: formData.password,
        };

    setSubmitting(true);
    const result = await login(payload);
    setSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md items-center">
        <div className="w-full">
          <div className="mb-6 text-center sm:mb-8">
            <h1 className="text-3xl font-bold text-primary">Trimly</h1>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">Provider Portal</h2>
            <p className="mt-2 text-sm text-zinc-600">Sign in to manage your services</p>
          </div>

          <div className="w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {errors.submit && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <p className="text-sm font-medium text-rose-800 break-words">{errors.submit}</p>
                </div>
              )}

              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-zinc-700">
                  Email or Phone
                </label>
                <div className="mt-1">
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.identifier}
                    onChange={handleChange}
                    inputMode="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className={[
                      'block w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition',
                      'focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10',
                      errors.identifier ? 'border-rose-300' : 'border-zinc-300',
                    ].join(' ')}
                    placeholder="Enter email or phone number"
                  />
                  {errors.identifier ? (
                    <p className="mt-1 text-xs text-rose-600">{errors.identifier}</p>
                  ) : null}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                  Password
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className={[
                      'block w-full rounded-xl border bg-white px-3 py-2.5 pr-10 text-sm text-zinc-900 outline-none transition',
                      'focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10',
                      errors.password ? 'border-rose-300' : 'border-zinc-300',
                    ].join(' ')}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 inline-flex items-center pr-3 text-zinc-500 hover:text-zinc-700"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.password}</p>
                ) : null}
              </div>

              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-primary hover:text-primary-hover">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <PulseLoader color="#ffffff" size={7} />
                      <span>Signing in...</span>
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </button>
                {showSlowNetworkHint ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    Network is taking longer than usual. Please wait...
                  </p>
                ) : null}
              </div>

              <div className="pt-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-zinc-500">New to Trimly?</span>
                  </div>
                </div>

                <div className="mt-5 text-center">
                  <Link
                    to="/register"
                    className="font-medium text-primary hover:text-primary-hover"
                  >
                    Apply to become a service provider
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
