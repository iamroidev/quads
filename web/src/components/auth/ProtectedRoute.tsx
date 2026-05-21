import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: ('buyer' | 'seller' | 'admin')[];
}

// Pages where we should NOT redirect a seller to onboarding —
// these are critical buyer flows that must work regardless of onboarding state.
const ONBOARDING_EXEMPT_PATHS = [
  '/seller/onboarding',
  '/checkout',
  '/cart',
  '/payment',
  '/orders',
  '/messages',
  '/profile',
  '/settings',
];

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

  // Only redirect to onboarding if:
  // - User has the seller role AND is in seller viewMode
  // - Not an admin
  // - Hasn't completed onboarding
  // - Not already on an exempt page (checkout, cart, orders, etc.)
  const isExemptPath = ONBOARDING_EXEMPT_PATHS.some(p => location.pathname.startsWith(p));
  if (
    user &&
    user.roles?.includes('seller') &&
    user.viewMode === 'seller' &&
    !user.roles?.includes('admin') &&
    !isExemptPath &&
    !user?.sellerOnboarding?.completed
  ) {
    return <Navigate to="/seller/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

