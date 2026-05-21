import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { CookieConsent } from '../ui';

const Layout: React.FC = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    const links = ['/products', '/categories', '/seller/onboarding', '/seller/analytics', '/admin/growth'];
    links.forEach((to) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = to;
      document.head.appendChild(link);
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <Outlet />
      </main>
      <CookieConsent />
    </div>
  );
};

export default Layout;
