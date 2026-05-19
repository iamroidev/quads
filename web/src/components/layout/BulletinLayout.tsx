import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Repeat,
  Bell,
  Sun,
  Moon,
  Mail,
  MessageCircle,
  Twitter,
  ShoppingCart,
  Shield,
  TrendingUp,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { BulletinMarquee } from '../ui/BulletinMarquee';
import BrandMark from './BrandMark';
import Footer from './Footer';
import authService from '../../services/auth.service';
import toast from 'react-hot-toast';

const EmailVerificationBanner: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  if (!user || user.emailVerified || dismissed) return null;

  const handleSend = async () => {
    setSending(true);
    try {
      await authService.sendEmailVerification();
      setCodeSent(true);
      toast.success('Verification code sent to your email.');
    } catch {
      toast.error('Failed to send code. Try again.');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) return;
    setVerifying(true);
    try {
      await authService.verifyEmail(code.trim());
      await refreshUser();
      toast.success('Email verified!');
      setDismissed(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="relative z-[999] border-b-4 border-[#f59e0b] bg-[#fffbeb] px-4 py-3">
      <div className="mx-auto max-w-[1400px] flex flex-wrap items-center gap-3">
        <ShieldCheck className="h-4 w-4 text-[#d97706] flex-shrink-0" />
        <span className="text-[11px] font-black uppercase tracking-widest text-[#92400e]">
          Verify your email to unlock all features
        </span>
        {!codeSent ? (
          <button
            onClick={handleSend}
            disabled={sending}
            className="border-2 border-[#d97706] bg-[#d97706] text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Code'}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="border-2 border-[#d97706] bg-white px-3 py-1 text-[12px] font-bold w-36 focus:outline-none"
            />
            <button
              onClick={handleVerify}
              disabled={verifying || code.length < 6}
              className="border-2 border-[#d97706] bg-[#d97706] text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {verifying ? '...' : 'Verify'}
            </button>
            <button onClick={handleSend} disabled={sending} className="text-[10px] font-bold text-[#92400e] underline opacity-60 hover:opacity-100">
              Resend
            </button>
          </div>
        )}
        <button onClick={() => setDismissed(true)} className="ml-auto opacity-40 hover:opacity-100">
          <X className="h-4 w-4 text-[#92400e]" />
        </button>
      </div>
    </div>
  );
};

interface BulletinLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  section?: string;
  hideBreadcrumbs?: boolean;
  hideHero?: boolean;
  showFooter?: boolean;
}

export const BulletinLayout: React.FC<BulletinLayoutProps> = ({
  children,
  title,
  subtitle,
  section = '01',
  hideBreadcrumbs = false,
  hideHero = false,
  showFooter = true,
}) => {
  const { user, isAuthenticated, logout, switchRole } = useAuth();
  const { totalItems } = useCart();
  const isSeller = user?.roles?.includes('seller') || user?.roles?.includes('admin');
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isSwitching, setIsSwitching] = React.useState(false);

  const [mobileOpen, setMobileOpen] = React.useState(false);

  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Scroll to top on route change
  React.useEffect(() => {
    window.scrollTo(0, 0);
    setMobileOpen(false);
  }, [location.pathname]);

  // Sync theme with DOM
  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleRoleSwitch = async () => {
    setIsSwitching(true);
    try {
      const targetMode = user?.viewMode === 'seller' ? 'buyer' : 'seller';
      await switchRole(targetMode);
      setIsProfileOpen(false);
    } catch (err) {
      console.error('Failed to switch role', err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bulletin-bg)] text-[var(--bulletin-text)] font-sans selection:bg-[#ff6b6b] selection:text-white overflow-x-hidden">
      {/* Heavy Header Border */}
      <div className="h-2 bg-[var(--bulletin-border)] w-full fixed top-0 z-[1001]" />

      {/* Global Announcement Marquee */}
      <div className="fixed top-2 left-0 w-full z-[1001]">
        <BulletinMarquee
          messages={[
            "System Audit Complete: QUADS Platform is now Production Ready",
            "Safe Trading: Always meet in safe places on campus",
            "Listing Alert: Electronics category is trending this week",
            "Security Notice: Never share your login credentials with anyone"
          ]}
        />
      </div>

      {/* Main Container */}
      <div className="pt-[42px]">
        {/* Email verification banner — shown to logged-in users with unverified email */}
        <EmailVerificationBanner />

        {/* Bulletin-Style Top Nav */}
        <nav className="border-b-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-3 py-4 sm:px-6 md:px-12 relative z-[900]">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
              <BrandMark className="h-8 w-8 transition-transform group-hover:scale-110" />
              <span className="hidden md:block text-sm font-black uppercase tracking-widest text-[var(--bulletin-text)]">QUADS</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-6 md:gap-8">
              <div className="hidden lg:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                {user?.viewMode === 'seller' ? (
                  <>
                    <Link to="/dashboard" className="hover:text-[#ff6b6b]">My Shop</Link>
                    <Link to="/seller/analytics" className="hover:text-[#ff6b6b]">My Stats</Link>
                    <Link to="/my-listings" className="hover:text-[#ff6b6b]">My Items</Link>
                    <Link to="/seller/orders" className="hover:text-[#ff6b6b]">Orders</Link>
                    <Link to="/seller/payouts" className="hover:text-[#ff6b6b]">Payments</Link>
                    <Link to="/seller/growth" className="hover:text-[#ff6b6b]">Growth Tools</Link>
                  </>
                ) : isAuthenticated ? (
                  <>
                    <Link to="/products" className="hover:text-[#ff6b6b]">All Items</Link>
                    <Link to="/categories" className="hover:text-[#ff6b6b]">Categories</Link>
                    <Link to="/lost-found" className="hover:text-[#ff6b6b]">Lost & Found</Link>
                    <Link to="/pulse" className="hover:text-[#ff6b6b]">Activity</Link>
                    <Link to="/saved" className="hover:text-[#ff6b6b]">Saved</Link>
                    <Link to="/orders" className="hover:text-[#ff6b6b]">Orders</Link>
                    <Link to="/messages" className="hover:text-[#ff6b6b]">Messages</Link>
                  </>
                ) : (
                  <>
                    <Link to="/products" className="hover:text-[#ff6b6b]">All Items</Link>
                    <Link to="/categories" className="hover:text-[#ff6b6b]">Categories</Link>
                    <Link to="/lost-found" className="hover:text-[#ff6b6b]">Lost & Found</Link>
                    <Link to="/sellers" className="hover:text-[#ff6b6b]">Sellers</Link>
                    <Link to="/pulse" className="hover:text-[#ff6b6b]">Activity</Link>
                    <Link to="/support" className="hover:text-[#ff6b6b]">Safety & Rules</Link>
                  </>
                )}
              </div>

               {(!isAuthenticated || user?.viewMode === 'buyer') && (
                <Link
                  to={isAuthenticated ? "/seller/onboarding" : "/register"}
                  className="hidden md:flex items-center gap-2 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0_0_var(--bulletin-accent)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                  id="sell-on-quads-btn"
                >
                  Sell on QUADS
                </Link>
              )}
               {user?.viewMode === 'seller' && (
                <Link
                  to="/sell"
                  className="hidden md:flex items-center gap-2 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-accent)] text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0_0_var(--bulletin-text)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  + Sell Something
                </Link>
              )}

              <button
                onClick={toggleTheme}
                className="p-2 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] hover:bg-[#fffacd] dark:hover:bg-white/10 transition-colors shadow-[2px_2px_0_0_var(--bulletin-shadow)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              <Link
                to="/cart"
                className="p-2 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] hover:bg-[#ffd700] dark:hover:bg-white/10 transition-colors shadow-[2px_2px_0_0_var(--bulletin-shadow)] relative active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                title="Your Shopping Cart"
              >
                <ShoppingCart className="h-4 w-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#ff6b6b] text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-black animate-pulse">
                    {totalItems}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-3 py-1.5 shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:scale-95"
                  >
                    <div className="h-6 w-6 rounded-full bg-[#ff6b6b] border border-[var(--bulletin-border)] flex items-center justify-center text-[10px] text-white font-black">
                      {user?.name?.[0].toUpperCase()}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[80px] text-[var(--bulletin-text)]">
                      {user?.name.split(' ')[0]}
                    </span>
                    <ChevronDown className={`h-3 w-3 transition-transform text-[var(--bulletin-text)] ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileOpen && (
                    <>
                      <div className="fixed inset-0 z-[-1]" onClick={() => setIsProfileOpen(false)} />
                      <div className="absolute right-0 mt-3 w-64 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] shadow-[8px_8px_0_0_var(--bulletin-shadow)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-4 py-3 border-b-2 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/20">
                           <div className="text-[8px] font-black uppercase tracking-widest opacity-40 dark:opacity-70 text-black dark:text-white">Currently viewing as</div>
                           <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-black dark:text-white">
                             <div className={`h-2 w-2 rounded-full ${user?.viewMode === 'seller' ? 'bg-[#ff6b6b]' : 'bg-sky-500'} animate-pulse`} />
                             {(user?.viewMode || (user?.roles?.includes('seller') ? 'seller' : 'buyer')).toUpperCase()}
                           </div>
                        </div>

                        <Link to="/profile" className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b border-[var(--bulletin-border)]/10 hover:bg-[var(--bulletin-bg)] hover:text-[#ff6b6b] transition-colors flex items-center gap-2 text-[var(--bulletin-text)]">
                           <User className="h-3 w-3" /> My Profile
                        </Link>

                        {!user?.roles?.includes('admin') && (
                          <button
                            disabled={isSwitching}
                            onClick={handleRoleSwitch}
                            className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b border-[var(--bulletin-border)]/10 hover:bg-sky-50 dark:hover:bg-sky-900/10 hover:text-[#ff6b6b] transition-colors flex items-center gap-2 text-sky-700 dark:text-sky-400">
                             <Repeat className={`h-3 w-3 ${isSwitching ? 'animate-spin' : ''}`} />
                             {isSwitching ? 'Switching...' : `Switch to ${user?.viewMode === 'seller' ? 'Buyer' : 'Seller'} View`}
                          </button>
                        )}

                        <Link to="/settings" className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b border-[var(--bulletin-border)]/10 hover:bg-[var(--bulletin-bg)] hover:text-[#ff6b6b] transition-colors flex items-center gap-2 text-[var(--bulletin-text)]">
                           <Settings className="h-3 w-3" /> Account Settings
                        </Link>

                        <Link to="/dispute-center" className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b border-[var(--bulletin-border)]/10 hover:bg-[var(--bulletin-bg)] hover:text-[#ff6b6b] transition-colors flex items-center gap-2 text-[var(--bulletin-text)]">
                           <Shield className="h-3 w-3" /> Dispute Center
                        </Link>

                        <Link to="/messages?support=true" className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b border-[var(--bulletin-border)]/10 hover:bg-[var(--bulletin-bg)] hover:text-[#ff6b6b] transition-colors flex items-center gap-2 text-[var(--bulletin-text)]">
                           <MessageCircle className="h-3 w-3 text-[#ff6b6b]" /> QUADS AI Support
                        </Link>

                        <Link to="/notifications" className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b border-[var(--bulletin-border)]/10 hover:bg-[var(--bulletin-bg)] hover:text-[#ff6b6b] transition-colors flex items-center gap-2 text-[var(--bulletin-text)]">
                           <Bell className="h-3 w-3" /> Notifications
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-left text-[#ff6b6b] hover:bg-[#fff0f0] transition-colors flex items-center gap-2"
                        >
                           <LogOut className="h-3 w-3" /> Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link to="/login" className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-[#ff6b6b] hover:text-white transition-colors">
                  Join Market
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-2 shadow-[2px_2px_0_0_var(--bulletin-shadow)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-4 w-4 text-[var(--bulletin-text)]" /> : <Menu className="h-4 w-4 text-[var(--bulletin-text)]" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile menu drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-b-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] z-[800] relative">
            <div className="mx-auto max-w-[1400px] px-4 py-2">
              {/* Nav links */}
              {(user?.viewMode === 'seller' ? [
                { to: '/dashboard', label: 'My Shop' },
                { to: '/seller/analytics', label: 'My Stats' },
                { to: '/my-listings', label: 'My Items' },
                { to: '/seller/orders', label: 'Orders' },
                { to: '/seller/payouts', label: 'Payments' },
                { to: '/seller/growth', label: 'Growth Tools' },
              ] : isAuthenticated ? [
                { to: '/products', label: 'All Items' },
                { to: '/categories', label: 'Categories' },
                { to: '/lost-found', label: 'Lost & Found' },
                { to: '/pulse', label: 'Activity' },
                { to: '/saved', label: 'Saved' },
                { to: '/orders', label: 'Orders' },
                { to: '/messages', label: 'Messages' },
              ] : [
                { to: '/products', label: 'All Items' },
                { to: '/categories', label: 'Categories' },
                { to: '/lost-found', label: 'Lost & Found' },
                { to: '/sellers', label: 'Sellers' },
                { to: '/pulse', label: 'Activity' },
              ]).map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center border-b border-[var(--bulletin-border)]/10 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-text)] hover:text-[#ff6b6b] transition-colors"
                >
                  {label}
                </Link>
              ))}
              {/* Company links */}
              {[
                { to: '/about', label: 'About Us' },
                { to: '/faq', label: 'FAQ' },
                { to: '/support', label: 'Help Center' },
                { to: '/contact', label: 'Contact' },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center border-b border-[var(--bulletin-border)]/10 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-text)]/60 hover:text-[#ff6b6b] transition-colors"
                >
                  {label}
                </Link>
              ))}
              {/* Auth row */}
              <div className="py-4">
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="w-full border-2 border-[#ff6b6b] py-3 text-[11px] font-black uppercase tracking-widest text-[#ff6b6b] hover:bg-[#ff6b6b] hover:text-white transition-all"
                  >
                    Sign Out
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/login"
                      className="block border-2 border-[var(--bulletin-border)] py-3 text-center text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-text)] hover:bg-[var(--bulletin-bg)] transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="block border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] py-3 text-center text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] hover:bg-[#ff6b6b] hover:text-white transition-all"
                    >
                      Join Market
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Breadcrumbs */}
        {!hideBreadcrumbs && (
          <div className="border-b border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-1.5 md:px-6 md:py-3">
            <div className="mx-auto flex max-w-[1400px] items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">
              <Link to="/" className="hover:text-[#ff6b6b] text-[var(--bulletin-text)]"><Home className="h-3 w-3" /></Link>
              <ChevronRight className="h-3 w-3" />
              <span>{section}</span>
              {title && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="opacity-100">{title}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Hero Section */}
        {title && !hideHero && (
          <div className="border-b border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-5 md:px-12 md:py-16">
            <div className="mx-auto max-w-[1400px]">
              <div className="mb-2 md:mb-4 inline-block border-2 border-[var(--bulletin-border)] bg-[#ff6b6b] px-2 py-0.5 md:px-3 md:py-1 text-[9px] md:text-[10px] font-black uppercase tracking-tighter text-white">
                Bulletin · {section}
              </div>
              <h1 className="mb-2 md:mb-4 text-2xl sm:text-5xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter">
                {title}
              </h1>
              {subtitle && (
                <p className="max-w-xl text-xs sm:text-lg md:text-xl font-medium leading-tight opacity-60">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="relative">
          {children}
        </div>

        {/* Render our highly stylized, catchy neobrutalist footer */}
        {showFooter && <Footer />}
      </div>
    </div>
  );
};

// Content section component for consistent styling
export const BulletinSection: React.FC<{
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  bgColor?: string;
  id?: string;
  className?: string;
}> = ({ children, title, subtitle, action, bgColor, id, className = '' }) => {
  // If no bgColor provided, use theme variable
  const bgClass = bgColor ? bgColor : 'bg-[var(--bulletin-bg)]';

  return (
    <div id={id} className={`border-b border-[var(--bulletin-border)] ${bgClass} py-5 px-4 md:py-12 md:px-12 transition-colors duration-200 ${className}`}>
      <div className="mx-auto max-w-[1400px]">
        {(title || action) && (
          <div className="mb-4 md:mb-8 flex items-end justify-between border-b border-[var(--bulletin-border)] pb-2">
            <div>
              {subtitle && (
                <div className="text-[8px] md:text-[10px] uppercase tracking-wider opacity-40">{subtitle}</div>
              )}
              {title && (
                <div className="text-sm md:text-lg font-black uppercase tracking-tight">{title}</div>
              )}
            </div>
            {action}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

// Card component for consistent styling
export const BulletinCard: React.FC<{
  children: React.ReactNode;
  rotation?: number;
  bgColor?: string;
  className?: string;
  onClick?: () => void;
}> = ({ children, rotation = 0, bgColor, className = '', onClick }) => {
  const bgClass = bgColor ? bgColor : 'bg-[var(--bulletin-card)]';

  return (
    <div
      onClick={onClick}
      className={`border-2 border-[var(--bulletin-border)] ${bgClass} p-4 shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all hover:-translate-y-1 ${className} ${onClick ? 'cursor-pointer' : ''}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {children}
    </div>
  );
};
