import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandMark from './BrandMark';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();

  const isHomeLanding = pathname === '/';

  /* ── 1. Compact Footer — For all Inner App Pages ── */
  if (!isHomeLanding) {
    return (
      <footer className="border-t-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] text-[var(--bulletin-text)] select-none">
        {/* Accent Brand Top Stripe */}
        <div className="h-1.5 bg-gradient-to-r from-[#ff6b6b] via-[#ffd700] to-[#10b981] w-full" />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="relative border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-6 shadow-[6px_6px_0_0_var(--bulletin-shadow)] flex flex-col items-center gap-6 md:flex-row md:justify-between transition-all hover:shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
            
            {/* Pinned Note Decorator Tag */}
            <div className="absolute -top-3.5 left-6 bg-[#ff6b6b] border-2 border-[var(--bulletin-border)] text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-0.5 shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
              QUADS info
            </div>

            {/* Left Column: Brand Metaphor */}
            <div className="flex flex-col items-center md:items-start gap-1">
              <div className="flex items-center gap-3">
                <BrandMark className="h-5 w-5 text-[var(--bulletin-text)]" />
                <span className="text-[11px] font-black uppercase tracking-[0.25em]">
                  QUADS &copy; {year}
                </span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--bulletin-text)] opacity-40 mt-1">
                Verified Campus Marketplace &bull; UMaT
              </p>
            </div>

            {/* Center Column: Links with divider dots */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 max-w-md">
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
                      { to: '/login', label: 'Sign In' },
                      { to: '/register', label: 'Register' },
                    ]),
                { to: '/privacy', label: 'Privacy' },
                { to: '/terms', label: 'Terms' },
              ].map(({ to, label }, index) => (
                <React.Fragment key={to}>
                  {index > 0 && (
                    <span className="text-[9px] font-black text-[var(--bulletin-text)] opacity-30 select-none">•</span>
                  )}
                  <Link
                    to={to}
                    className="px-1 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--bulletin-text)] opacity-70 hover:opacity-100 hover:text-[var(--bulletin-accent)] transition-all underline decoration-[var(--bulletin-accent)] decoration-2 underline-offset-4"
                  >
                    {label}
                  </Link>
                </React.Fragment>
              ))}
            </div>

            {/* Right Column: Live Status Card */}
            <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-3 py-1.5 flex items-center gap-2 shadow-[3px_3px_0_0_var(--bulletin-shadow)] text-[9px] font-black uppercase tracking-wider">
              <span className={`inline-block w-2.5 h-2.5 rounded-full border border-[var(--bulletin-border)] bg-emerald-400 animate-pulse`} />
              <span>Escrow: Active</span>
            </div>

          </div>

          {/* Bottom engineering note */}
          <div className="mt-6 border-t-2 border-[var(--bulletin-border)] opacity-10 pt-4 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--bulletin-text)] opacity-50">
              Built by an independent student developer for the UMaT student community 🇬🇭
            </p>
          </div>
        </div>
      </footer>
    );
  }

  /* ── 2. Full Premium Editorial Landing Page Footer (Retool-Inspired Layout with Brand Accents) ── */
  return (
    <footer className="bg-[#08090d] text-white border-t-2 border-white/10 select-none font-sans">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        
        {/* Top Part: Vertical Link Columns with Individual Brand Accent Divider Lines */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          
          {/* Column 1: Marketplace (Accent: Coral Red) */}
          <div className="border-l-2 border-[#ff6b6b]/40 pl-4 space-y-4">
            <h4 className="text-[9px] font-bold text-[#ff6b6b] uppercase tracking-widest">
              Marketplace
            </h4>
            <ul className="space-y-3">
              {[
                { to: '/products', label: 'All Products' },
                { to: '/categories', label: 'Categories' },
                { to: '/lost-found', label: 'Lost & Found' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-white/70 hover:text-[#ff6b6b] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Account (Accent: UMaT Gold) */}
          <div className="border-l-2 border-[#ffd700]/40 pl-4 space-y-4">
            <h4 className="text-[9px] font-bold text-[#ffd700] uppercase tracking-widest">
              Account
            </h4>
            <ul className="space-y-3">
              {isAuthenticated ? (
                <>
                  <li><Link to="/profile" className="text-sm text-white/70 hover:text-[#ffd700] transition-colors">Profile</Link></li>
                  <li><Link to="/orders" className="text-sm text-white/70 hover:text-[#ffd700] transition-colors">My Orders</Link></li>
                  <li><Link to="/saved" className="text-sm text-white/70 hover:text-[#ffd700] transition-colors">Saved Items</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/login" className="text-sm text-white/70 hover:text-[#ffd700] transition-colors">Sign In</Link></li>
                  <li><Link to="/register" className="text-sm text-white/70 hover:text-[#ffd700] transition-colors">Register</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Column 3: Support (Accent: Mint Green) */}
          <div className="border-l-2 border-[#10b981]/40 pl-4 space-y-4">
            <h4 className="text-[9px] font-bold text-[#10b981] uppercase tracking-widest">
              Support
            </h4>
            <ul className="space-y-3">
              {[
                { to: '/faq', label: 'FAQs' },
                { to: '/contact', label: 'Contact Us' },
                { to: '/support', label: 'Disputes' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-white/70 hover:text-[#10b981] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Project (Accent: Cyan Blue) */}
          <div className="border-l-2 border-[#00e5ff]/40 pl-4 space-y-4">
            <h4 className="text-[9px] font-bold text-[#00e5ff] uppercase tracking-widest">
              Project
            </h4>
            <ul className="space-y-3">
              {[
                { to: '/about', label: 'About Us' },
                { to: '/privacy', label: 'Privacy Policy' },
                { to: '/terms', label: 'Terms of Use' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-white/70 hover:text-[#00e5ff] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Call to Action (CTA) & Institutional copyright */}
          <div className="border-l-2 border-white/10 pl-4 flex flex-col gap-4 col-span-2 md:col-span-1">
            <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
              Action
            </h4>
            <div className="flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/sell"
                    className="w-full text-center py-2 px-3 text-xs font-black uppercase tracking-wider bg-[#ff6b6b] text-black border-2 border-black shadow-[3px_3px_0_0_#ffd700] hover:bg-[#fff9db] hover:shadow-none transition-all"
                  >
                    List an Item
                  </Link>
                  <Link
                    to="/profile"
                    className="w-full text-center py-2 px-3 text-xs font-black uppercase tracking-wider border-2 border-white/20 text-white hover:bg-white/5 transition-colors"
                  >
                    My Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="w-full text-center py-2 px-3 text-xs font-black uppercase tracking-wider bg-[#fffdf8] text-black border-2 border-black shadow-[3px_3px_0_0_#ff6b6b] hover:bg-[#fff9db] hover:shadow-none transition-all"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="w-full text-center py-2 px-3 text-xs font-black uppercase tracking-wider border-2 border-white/20 text-white hover:bg-white/5 transition-colors"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
            <div className="mt-2 text-[9px] font-bold uppercase tracking-wider text-white/20">
              Verified Student Network
            </div>
          </div>

        </div>

        {/* Bottom Part: Massive Brand Title with Brand-Colored Emblems */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-end justify-between gap-6">
          <div className="flex items-end gap-3 text-white">
            <BrandMark className="h-16 w-16 text-[#ff6b6b] mb-2 sm:mb-3" />
            <span className="text-[4rem] sm:text-[6.5rem] font-black tracking-tighter leading-none uppercase select-none opacity-90">
              QUADS
            </span>
          </div>
          
          <div className="text-[9px] font-black uppercase tracking-[0.25em] text-[#ff6b6b] text-right md:max-w-xs leading-relaxed mb-1">
            BUILT FOR THE UNIVERSITY OF MINES AND TECHNOLOGY CORRIDORS
          </div>
        </div>

        {/* Bottom Strip: Copyright & Social Media Icons */}
        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/40 text-xs">
          <div>
            &copy; {year} QUADS Marketplace. All rights reserved.
          </div>
          
          {/* Social Media Icons */}
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com/quads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-[#ff6b6b] transition-colors"
              aria-label="Twitter"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://github.com/quads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-[#ffd700] transition-colors"
              aria-label="GitHub"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </a>
            <a
              href="https://instagram.com/quads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-[#10b981] transition-colors"
              aria-label="Instagram"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
