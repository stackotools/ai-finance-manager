import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/Loader';

const ProtectedRoute = () => {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader message="Loading application..." />
      </div>
    );
  }

  if (!token) {
    // Redirect to landing page for root path, login for other protected routes
    const redirectTo = location.pathname === '/' ? '/landing' : '/login';
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
