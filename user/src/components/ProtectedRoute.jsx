import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clearAuthSession, getAuthSnapshot } from '../utils/auth';

/**
 * Wrap a route element in this component to require authentication and optionally role.
 * Props:
 *   - children: element to render when allowed
 *   - role: string or array of roles allowed (optional)
 */
export default function ProtectedRoute({ children, role }) {
  const location = useLocation();
  const { token, role: userRole } = getAuthSnapshot();

  if (!token || !userRole) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!role) {
    return children;
  }

  const allowed = Array.isArray(role) ? role : [role];
  if (allowed.includes(userRole)) {
    return children;
  }

  // User app should only expose customer-role surfaces.
  clearAuthSession();
  return (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname, error: 'Only customer accounts are allowed in this app.' }}
    />
  );
}
