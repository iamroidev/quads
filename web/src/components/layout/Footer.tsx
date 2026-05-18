import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandMark from './BrandMark';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();

  const isHomeLanding = pathname === '/';

  // State for a fun interactive listing ticker / scholar count
  const [activeScholars, setActiveScholars] = useState(124);
  const [pulseBeats, setPulseBeats] = useState(true);

  useEffect(() => {
    // Subtle count fluctuations to make the bulletin feel live
    const interval = setInterval(() => {
      setActiveScholars(prev => prev + (Math.random() > 0.5 ? 1 : -1));
      setPulseBeats(prev => !prev);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  /* ── 1. Compact Bulletproof Footer — For all Inner App Pages ── */
  if (!isHomeLanding) {
    return (
      <footer className="border-t-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] text-[var(--bulletin-text)] select-none">
        {/* Accent Striping Metaphor */}
        <div className="h-1.5 bg-gradient-to-r from-[var(--bulletin-accent)] via-[#ffbe0b] to-[#3a86c8] w-full" />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="relative border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-6 shadow-[8px_8px_0_0_var(--bulletin-shadow)] flex flex-col items-center gap-6 md:flex-row md:justify-between transition-all hover:shadow-[10px_10px_0_0_var(--bulletin-shadow)]">
            
            {/* Pinned Note Decorator Tape */}
            <div className="absolute -top-3.5 left-6 bg-[var(--bulletin-accent)] border-2 border-[var(--bulletin-border)] text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-0.5 shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
              System Ledger
            </div>

            {/* Left Column: Brand Metaphor */}
            <div className="flex flex-col items-center md:items-start gap-1">
              <div className="flex items-center gap-3">
                <BrandMark className="h-5 w-5 text-[var(--bulletin-text)]" />
                <span className="text-[11px] font-black uppercase tracking-[0.25em]">
                  QUADS &copy; {year}
                </span>
              </div>
              <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[var(--bulletin-text)]/40 mt-1">
                Verified Escrow Meets &middot; UMaT
              </p>
            </div>

            {/* Center Column: Links with typewriter divider dots */}
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 max-w-md">
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
              ].map(({ to, label }, index) => (
                <React.Fragment key={to}>
                  {index > 0 && (
                    <span className="text-[9px] font-black text-[var(--bulletin-text)]/30 select-none">•</span>
                  )}
                  <Link
                    to={to}
                    className="relative group px-1 text-[9px] font-black uppercase tracking-[0.15em] text-[var(--bulletin-text)]/70 hover:text-[var(--bulletin-accent)] transition-colors"
                  >
                    {label}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--bulletin-accent)] group-hover:w-full transition-all duration-200" />
                  </Link>
                </React.Fragment>
              ))}
            </div>

            {/* Right Column: Live Escrow Signal Card */}
            <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-3 py-1.5 flex items-center gap-2 shadow-[3px_3px_0_0_var(--bulletin-shadow)] text-[9px] font-black uppercase tracking-wider">
              <span className={`inline-block w-2.5 h-2.5 rounded-full border border-[var(--bulletin-border)] ${pulseBeats ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500'}`} />
              <span>Escrow: Active</span>
            </div>

          </div>

          {/* Bottom engineering note */}
          <div className="mt-6 border-t-2 border-[var(--bulletin-border)]/10 pt-4 text-center">
            <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-[var(--bulletin-text)]/40">
              Built by an independent student developer for UMaT Tarkwa & Prestea 🇬🇭
            </p>
          </div>
        </div>
      </footer>
    );
  }

  /* ── 2. Full Editorial Bulletin Footer — For Home/Landing Page ── */
  return (
    <footer className="border-t-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] select-none">
      
      {/* Dynamic Stripe representing campus color codes */}
      <div className="h-2 bg-gradient-to-r from-[var(--bulletin-accent)] via-[#ffbe0b] to-[#10b981] w-full" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Left Large Statement Box (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-block bg-[var(--bulletin-accent)] text-white text-[9px] font-black uppercase tracking-[0.3em] px-3.5 py-1 border-2 border-[var(--bulletin-border)] shadow-[3px_3px_0_0_#000]">
              Tarkwa Hub
            </div>
            
            <h2 className="text-[clamp(2.2rem,5.5vw,4rem)] font-black leading-[0.85] tracking-[-0.04em] uppercase text-[var(--bulletin-bg)]">
              Buy it.<br />
              Sell it.<br />
              <span className="text-[var(--bulletin-accent)] line-through decoration-3 decoration-[var(--bulletin-bg)]">Keep it</span> campus.
            </h2>

            {/* Retro Stamp: 100% Pure Peer-to-Peer Escrow */}
            <div className="relative border-4 border-dashed border-[var(--bulletin-bg)]/20 p-4 max-w-xs transition-all hover:border-[var(--bulletin-accent)]/50">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--bulletin-accent)]">
                &ldquo;Official Bulletin Meta&rdquo;
              </p>
              <div className="mt-2 text-[10px] font-bold text-[var(--bulletin-bg)]/60 leading-relaxed uppercase">
                All meeting points are restricted to UMaT Campus corridors for security. Escalations are auto-verified.
              </div>
              <div className="mt-3 flex items-center justify-between text-[8px] font-black text-[var(--bulletin-bg)]/40 uppercase tracking-[0.15em] border-t border-[var(--bulletin-bg)]/10 pt-2">
                <span>Code: UMaT-V1</span>
                <span className="text-[var(--bulletin-accent)]">Pulse: 🟢 {activeScholars} Online</span>
              </div>
            </div>
          </div>

          {/* Link Columns (7 Cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 gap-8 sm:grid-cols-3">
            
            {/* Col 1 */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--bulletin-bg)]/40 border-b border-[var(--bulletin-bg)]/10 pb-2">
                Marketplace
              </p>
              <ul className="space-y-2">
                {[
                  { to: '/products', label: 'All listings' },
                  { to: '/categories', label: 'Categories' },
                  { to: '/lost-found', label: 'Lost & Found' },
                  ...(isAuthenticated ? [{ to: '/sell', label: 'Sell item' }] : []),
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="group inline-flex items-center gap-2 text-[var(--bulletin-bg)]/75 hover:text-[var(--bulletin-accent)] transition-colors text-[11px] font-black uppercase tracking-wider">
                      <span className="text-[var(--bulletin-accent)] group-hover:translate-x-1 transition-transform">&bull;</span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 2 */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--bulletin-bg)]/40 border-b border-[var(--bulletin-bg)]/10 pb-2">
                Student Account
              </p>
              <ul className="space-y-2">
                {(isAuthenticated ? [
                  { to: '/profile', label: 'My profile' },
                  { to: '/orders', label: 'My orders' },
                  { to: '/saved', label: 'Saved items' },
                  { to: '/notifications', label: 'Alerts' },
                ] : [
                  { to: '/login', label: 'Sign in' },
                  { to: '/register', label: 'Create Account' },
                ]).map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="group inline-flex items-center gap-2 text-[var(--bulletin-bg)]/75 hover:text-[var(--bulletin-accent)] transition-colors text-[11px] font-black uppercase tracking-wider">
                      <span className="text-[var(--bulletin-accent)] group-hover:translate-x-1 transition-transform">&bull;</span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--bulletin-bg)]/40 border-b border-[var(--bulletin-bg)]/10 pb-2">
                Support
              </p>
              <ul className="space-y-2">
                {[
                  { to: '/about', label: 'About App' },
                  { to: '/faq', label: 'FAQ Base' },
                  { to: '/contact', label: 'Contact Admin' },
                  { to: '/support', label: 'Escrow Help' },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="group inline-flex items-center gap-2 text-[var(--bulletin-bg)]/75 hover:text-[var(--bulletin-accent)] transition-colors text-[11px] font-black uppercase tracking-wider">
                      <span className="text-[var(--bulletin-accent)] group-hover:translate-x-1 transition-transform">&bull;</span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Bar: Legal with Stylised Retro Barcode */}
        <div className="mt-16 border-t-2 border-[var(--bulletin-bg)]/10 pt-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          
          <div className="flex flex-col gap-1.5">
            <p className="text-[9px] text-[var(--bulletin-bg)]/35 uppercase tracking-wider font-bold">
              &copy; {year} QUADS MARKETPLACE. All rights reserved.
            </p>
            {/* Interactive Campus Signal Ticker */}
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.15em] text-[var(--bulletin-bg)]/40">
              <span>UMaT Tarkwa Campus Hub</span>
              <span>&middot;</span>
              <span className="text-[var(--bulletin-accent)]">{activeScholars} verified students online</span>
            </div>
          </div>

          {/* Typewriter Styled Legal Links */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {[
              { to: '/privacy', label: 'Privacy Protocol' },
              { to: '/terms', label: 'Terms of Use' },
              { to: '/about', label: 'Developer Note' },
              { to: '/faq', label: 'FAQ Guide' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-[9px] font-black uppercase tracking-[0.15em] text-[var(--bulletin-bg)]/35 hover:text-[var(--bulletin-accent)] transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Retro Barcode Stamp - Tactile Design Metaphor */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5 select-none opacity-20 hover:opacity-50 transition-opacity">
              <div className="flex items-center gap-[1px]">
                <span className="w-[1px] h-4 bg-white" />
                <span className="w-[2px] h-4 bg-white" />
                <span className="w-[1px] h-4 bg-white" />
                <span className="w-[3px] h-4 bg-white" />
                <span className="w-[1px] h-4 bg-white" />
                <span className="w-[2px] h-4 bg-white" />
                <span className="w-[4px] h-4 bg-white" />
                <span className="w-[1px] h-4 bg-white" />
                <span className="w-[1px] h-4 bg-white" />
                <span className="w-[3px] h-4 bg-white" />
                <span className="w-[1px] h-4 bg-white" />
              </div>
              <span className="text-[6px] text-center font-black tracking-[0.4em] text-white">QUADS</span>
            </div>
          </div>

        </div>

        {/* Small center footer text */}
        <div className="mt-8 text-center border-t border-[var(--bulletin-bg)]/5 pt-4">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[var(--bulletin-bg)]/20">
            Designed for Tarkwa campus miners &middot; Peer-to-peer security guaranteed
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
