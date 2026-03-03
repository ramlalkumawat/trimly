import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Route guard that allows only authenticated admin users.
const AdminPrivateRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-admin-app">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-700" />
          <span className="text-sm font-medium text-slate-700">Checking session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin() && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AdminPrivateRoute;
