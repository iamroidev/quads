import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandMark from './BrandMark';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();

  const isHomeLanding = pathname === '/';

  /* ── Restyled compact footer — all inner pages ── */
  if (!isHomeLanding) {
    return (
      <footer className="bg-[#0f0f0f] text-white">
        {/* Coral accent stripe */}
        <div className="h-1 bg-[#ff6b6b] w-full" />

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <BrandMark className="h-5 w-5 text-white opacity-70" />
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">
                QUADS &copy; {year}
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2">
              {[
                { to: '/products', label: 'Browse' },
                { to: '/categories', label: 'Categories' },
                { to: '/about', label: 'About' },
                { to: '/faq', label: 'FAQ' },
                ...(isAuthenticated
                  ? [
                      { to: '/orders', label: 'Orders' },
                      { to: '/profile', label: 'Profile' },
                    ]
                  : [
                      { to: '/login', label: 'Sign in' },
                      { to: '/register', label: 'Register' },
                    ]),
                { to: '/privacy', label: 'Privacy' },
                { to: '/terms', label: 'Terms' },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-white/50 hover:text-white hover:underline decoration-[#ff6b6b] underline-offset-4 transition-all"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom tagline */}
          <div className="mt-4 border-t border-white/10 pt-4 text-center">
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20">
              Engineered by an independent student developer &mdash; UMaT, Tarkwa 🇬🇭
            </p>
          </div>
        </div>
      </footer>
    );
  }

  /* ── Full editorial footer — home/landing only ── */
  return (
    <footer className="bg-[#0a0a0a] text-white">
      {/* Coral accent stripe */}
      <div className="h-2 bg-[#ff6b6b] w-full" />

      {/* Top: large typographic block */}
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6 lg:px-8">
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
          <div className="w-full flex flex-col gap-8 sm:flex-row sm:gap-4 lg:gap-8">
            <div className="flex-1 space-y-3">
              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.28em] text-white/25">
                Marketplace
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  { to: '/products', label: 'All listings' },
                  { to: '/categories', label: 'Categories' },
                  { to: '/lost-found', label: 'Lost & Found' },
                  ...(isAuthenticated ? [{ to: '/sell', label: 'Sell something' }] : []),
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="text-white/60 transition-colors hover:text-white hover:underline decoration-[#ff6b6b] underline-offset-4 text-sm">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1 space-y-3">
              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.28em] text-white/25">
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
                    <Link to={to} className="text-white/60 transition-colors hover:text-white hover:underline decoration-[#ff6b6b] underline-offset-4 text-sm">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1 space-y-3">
              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.28em] text-white/25">
                Company
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  { to: '/about', label: 'About' },
                  { to: '/faq', label: 'FAQ' },
                  { to: '/contact', label: 'Contact Us' },
                  { to: '/support', label: 'Help Center' },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="text-white/60 transition-colors hover:text-white hover:underline decoration-[#ff6b6b] underline-offset-4 text-sm">
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
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-5 sm:px-6 lg:px-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-[9px] text-white/25">
            &copy; {year} QUADS. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <Link to="/privacy" className="text-[9px] text-white/25 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-white/10">·</span>
            <Link to="/terms" className="text-[9px] text-white/25 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span className="text-white/10">·</span>
            <Link to="/about" className="text-[9px] text-white/25 hover:text-white transition-colors">
              About
            </Link>
            <span className="text-white/10">·</span>
            <Link to="/faq" className="text-[9px] text-white/25 hover:text-white transition-colors">
              FAQ
            </Link>
          </div>
            <div className="flex-grow flex flex-col gap-1.5 items-center justify-center">
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/15 text-center">
                Engineered by an independent student developer &middot; UMaT, Tarkwa 🇬🇭
              </p>
            </div>
      </div>
    </footer>
  );
};

export default Footer;
