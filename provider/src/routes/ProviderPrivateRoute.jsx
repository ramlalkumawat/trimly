import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

// Guard component that blocks unauthenticated/non-provider access to private pages.
const ProviderPrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, provider } = useAuth();
  const location = useLocation();

  // Memoize the redirect condition to prevent infinite re-renders
  const shouldRedirect = useMemo(() => {
    return !loading && (!isAuthenticated || !provider || provider.role !== 'provider');
  }, [loading, isAuthenticated, provider]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-zinc-700" />
          <p className="mt-4 text-zinc-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (shouldRedirect && location.pathname !== '/login') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProviderPrivateRoute;
