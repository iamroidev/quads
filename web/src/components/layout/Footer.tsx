import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();

  const isHomeLanding = pathname === '/';

  /* ── Compact footer — all inner pages ── */
  if (!isHomeLanding) {
    return (
      <footer className="border-t border-earth-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-6 lg:px-8 text-center sm:text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-400">
            QUADS &copy; {year}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link to="/products" className="text-[9px] font-bold uppercase tracking-[0.15em] text-earth-400 hover:text-earth-900 transition-colors px-3 py-1">
              Browse
            </Link>
            <Link to="/categories" className="text-[9px] font-bold uppercase tracking-[0.15em] text-earth-400 hover:text-earth-900 transition-colors px-3 py-1">
              Categories
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/orders" className="text-[9px] font-bold uppercase tracking-[0.15em] text-earth-400 hover:text-earth-900 transition-colors px-3 py-1">
                  Orders
                </Link>
                <Link to="/profile" className="text-[9px] font-bold uppercase tracking-[0.15em] text-earth-400 hover:text-earth-900 transition-colors px-3 py-1">
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[9px] font-bold uppercase tracking-[0.15em] text-earth-400 hover:text-earth-900 transition-colors px-3 py-1">
                  Sign in
                </Link>
                <Link to="/register" className="text-[9px] font-bold uppercase tracking-[0.15em] text-earth-400 hover:text-earth-900 transition-colors px-3 py-1">
                  Register
                </Link>
              </>
            )}
            <Link to="/terms#privacy" className="text-[9px] font-bold uppercase tracking-[0.15em] text-earth-400 hover:text-earth-900 transition-colors px-3 py-1">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  /* ── Full editorial footer — home/landing only ── */
  return (
    <footer className="bg-[#0a0a0a] text-white">
      {/* Top: large typographic block */}
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
          {/* Statement */}
          <div className="items-center text-center lg:text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/25 mb-3">
              QUADS
            </p>
            <h2 className="text-[clamp(2rem,5vw,4.5rem)] font-black leading-[0.9] tracking-[-0.04em] text-white text-center lg:text-left">
              Buy it.<br />
              Sell it.<br />
              <span className="text-white/20">Keep it campus.</span>
            </h2>
          </div>

          {/* Link columns */}
          <div className="w-full flex flex-col lg:flex-row lg:space-x-8">
            <div className="flex-1 lg:w-1/3 space-y-4">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.28em] text-white/25">
                Marketplace
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  { to: '/products', label: 'All listings' },
                  { to: '/categories', label: 'Categories' },
                  ...(isAuthenticated ? [{ to: '/sell', label: 'Sell something' }] : []),
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="text-white/60 transition-colors hover:text-white px-2 py-1">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1 lg:w-1/3 space-y-4">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.28em] text-white/25">
                Account
              </p>
              <ul className="space-y-2 text-sm">
                {(isAuthenticated ? [
                  { to: '/profile', label: 'My profile' },
                  { to: '/orders', label: 'My orders' },
                  { to: '/saved', label: 'Saved items' },
                  { to: '/notifications', label: 'Notifications' },
                ] : [
                  { to: '/login', label: 'Sign in' },
                  { to: '/register', label: 'Register' },
                ]).map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="text-white/60 transition-colors hover:text-white px-2 py-1">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1 lg:w-1/3 space-y-4">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.28em] text-white/25">
                Support
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  { to: '/messages', label: 'Messages' },
                  { to: '/notifications', label: 'Notifications' },
                  { to: '/contact', label: 'Contact Us' },
                  { to: '/support', label: 'Help Center' },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="text-white/60 transition-colors hover:text-white px-2 py-1">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom rule + legal */}
      <div className="border-t border-white/[0.08]">
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-4 sm:px-6 lg:px-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-[9px] text-white/25">
            &copy; {year} QUADS. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link to="/terms#privacy" className="text-[9px] text-white/25 hover:text-white transition-colors px-2 py-1">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-[9px] text-white/25 hover:text-white transition-colors px-2 py-1">
              Terms of Service
            </Link>
            <p className="text-[9px] text-white/20 w-full text-center">
              Built for students, by students.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
