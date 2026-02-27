import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Wrap a route element in this component to require authentication and optionally role.
 * Props:
 *   - children: element to render when allowed
 *   - role: string or array of roles allowed (optional)
 */
export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  const location = useLocation();

  if (!token && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (role && token) {
    const allowed = Array.isArray(role) ? role : [role];

    if (!allowed.includes(userRole)) {
      if (userRole === 'user' && location.pathname !== '/services') return <Navigate to="/services" replace />;
      if (userRole === 'provider' && location.pathname !== '/provider') return <Navigate to="/provider" replace />;
      if (userRole === 'admin') {
        window.location.href = '/admin';
        return null;
      }
      if (location.pathname !== '/') return <Navigate to="/" replace />;
    }
  }

  return children;
}
