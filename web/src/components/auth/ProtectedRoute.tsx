import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: ('buyer' | 'seller' | 'admin')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.some(r => user.roles?.includes(r))) {
    return <Navigate to="/" replace />;
  }

  if (
    user &&
    user.roles?.includes('seller') &&
    location.pathname !== '/seller/onboarding' &&
    !user?.sellerOnboarding?.completed
  ) {
    return <Navigate to="/seller/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
