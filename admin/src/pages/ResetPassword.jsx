import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminAPI } from '../utils/api';

/**
 * Admin Password Reset Page
 * 
 * SECURITY NOTE:
 * - Token is passed via URL query parameter (provided in reset email link)
 * - Reset tokens expire after 1 hour
 * - New password must meet NIST guidelines (12+ chars, complexity)
 * - After successful reset, user must login with new password
 */
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validating, setValidating] = useState(true);
  const navigate = useNavigate();

  // Validate token exists
  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. No token provided.');
      setValidating(false);
    } else {
      setValidating(false);
    }
  }, [token]);

  // Password validation rules (NIST guidelines)
  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 12) {
      errors.push('At least 12 characters');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('At least one uppercase letter (A-Z)');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('At least one lowercase letter (a-z)');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('At least one digit (0-9)');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('At least one special character (!@#$%^&* etc)');
    }
    
    return errors;
  };

  const passwordErrors = newPassword ? validatePassword(newPassword) : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation checks
    if (!newPassword || !confirmPassword) {
      setError('Both password fields are required');
      return;
    }

    if (passwordErrors.length > 0) {
      setError('Password does not meet security requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid reset link. Token is missing.');
      return;
    }

    setLoading(true);

    try {
      const response = await adminAPI.auth.resetPassword({
        token,
        newPassword,
        confirmPassword,
      });

      if (response.data.success) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setNewPassword('');
        setConfirmPassword('');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to reset password';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-default">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
          <p className="text-center text-gray-600">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!token || error === 'Invalid reset link. No token provided.') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-default">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-6">
            The reset link is invalid or has expired. Reset links are valid for 1 hour.
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="btn-primary w-full py-2 rounded-xl font-semibold"
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-default">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-2">Reset Your Password</h2>
        <p className="text-gray-600 mb-6 text-sm">
          Enter a strong password that meets all requirements below.
        </p>

        {error && (
          <div className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="text-green-500 mb-4 p-3 bg-green-50 rounded-lg text-sm">
            {success}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`input-default w-full ${passwordErrors.length > 0 && newPassword ? 'border-red-300' : ''}`}
            placeholder="Enter your new password"
            required
            autoComplete="new-password"
          />

          {/* Password requirements checklist */}
          {newPassword && (
            <div className="mt-3 text-sm space-y-1">
              <p className="font-semibold text-gray-700">Password must contain:</p>
              <div className="space-y-1 ml-2">
                <p className={newPassword.length >= 12 ? 'text-green-600' : 'text-gray-500'}>
                  ✓ At least 12 characters
                </p>
                <p className={/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}>
                  ✓ Uppercase letter (A-Z)
                </p>
                <p className={/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}>
                  ✓ Lowercase letter (a-z)
                </p>
                <p className={/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}>
                  ✓ Number (0-9)
                </p>
                <p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}>
                  ✓ Special character (!@#$%^&* etc)
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`input-default w-full ${confirmPassword && newPassword !== confirmPassword ? 'border-red-300' : ''}`}
            placeholder="Confirm your new password"
            required
            autoComplete="new-password"
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || passwordErrors.length > 0 || !newPassword || !confirmPassword || newPassword !== confirmPassword}
          className="btn-primary w-full py-2 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Resetting Password...' : 'Reset Password'}
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
