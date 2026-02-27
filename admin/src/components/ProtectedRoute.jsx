import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Simple role-aware route guard kept for backward-compatible routes.
export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user } = useContext(AuthContext);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(user?.role)) {
      // redirect non-admins to appropriate home
      if (user?.role === 'customer') window.location.href = '/';
      if (user?.role === 'provider') window.location.href = '/provider';
      return <Navigate to="/" replace />;
    }
  }
  return children;
}
