import React from 'react';
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
  Twitter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BulletinMarquee } from '../ui/BulletinMarquee';
import BrandMark from './BrandMark';

interface BulletinLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  section?: string;
  hideBreadcrumbs?: boolean;
  hideHero?: boolean;
}

export const BulletinLayout: React.FC<BulletinLayoutProps> = ({
  children,
  title,
  subtitle,
  section = '01',
  hideBreadcrumbs = false,
  hideHero = false,
}) => {
  const { user, isAuthenticated, logout, switchRole } = useAuth();
  const isSeller = user?.role === 'seller' || user?.role === 'admin';
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isSwitching, setIsSwitching] = React.useState(false);

  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Scroll to top on route change
  React.useEffect(() => {
    window.scrollTo(0, 0);
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
      const targetRole = user?.role === 'seller' ? 'buyer' : 'seller';
      await switchRole(targetRole);
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
      <div className="h-2 bg-black w-full fixed top-0 z-[1001]" />

      {/* Global Announcement Marquee */}
      <div className="fixed top-2 left-0 w-full z-[1001]">
        <BulletinMarquee 
          messages={[
            "System Audit Complete: QUADS Platform is now Production Ready",
            "Marketplace Safety: Always trade in designated 'Safe Zones'",
            "Listing Alert: Electronics category is trending this week",
            "Security Notice: Never share your login credentials with anyone"
          ]} 
        />
      </div>

      {/* Main Container */}
      <div className="pt-[42px]">
        {/* Bulletin-Style Top Nav */}
        <nav className="border-b-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-6 py-4 md:px-12 relative z-[900]">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-2 py-1 text-xl font-black uppercase tracking-tighter transition-colors group-hover:bg-[#ff6b6b]">
                Q
              </div>
              <span className="hidden md:block text-sm font-black uppercase tracking-widest text-[var(--bulletin-text)]">QUADS</span>
            </Link>

            <div className="flex items-center gap-8">
              <div className="hidden lg:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                {user?.role === 'seller' ? (
                  <>
                    <Link to="/seller/analytics" className="hover:text-[#ff6b6b]">Shop Insights</Link>
                    <Link to="/my-listings" className="hover:text-[#ff6b6b]">My Listings</Link>
                    <Link 
                      to={user?.sellerOnboarding?.payoutSetupComplete ? "/seller/payouts" : "/seller/onboarding"} 
                      className="hover:text-[#ff6b6b]"
                    >
                      Payouts
                    </Link>
                  </>
                ) : location.pathname === '/' ? (
                  <>
                    <Link to="/products" className="hover:text-[#ff6b6b]">The Board</Link>
                    <Link to="/sellers" className="hover:text-[#ff6b6b]">Merchants</Link>
                    <Link to="/pulse" className="hover:text-[#ff6b6b]">Pulse</Link>
                    <Link to="/safety" className="hover:text-[#ff6b6b]">Protocol</Link>
                  </>
                ) : (
                  <>
                    <Link to="/products" className="hover:text-[#ff6b6b]">Marketplace</Link>
                    <Link to="/saved" className="hover:text-[#ff6b6b]">Wishlist</Link>
                    <Link to="/orders" className="hover:text-[#ff6b6b]">Orders</Link>
                  </>
                )}
              </div>

              {!isSeller && (
                <Link 
                  to={isAuthenticated ? "/seller/onboarding" : "/register"} 
                  className="hidden md:flex items-center gap-2 border-2 border-black bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0_0_#ff6b6b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                  id="sell-on-quads-btn"
                >
                  Sell on Quads
                </Link>
              )}

              <button 
                onClick={toggleTheme}
                className="p-2 border-2 border-black bg-white dark:bg-black/20 hover:bg-[#fffacd] dark:hover:bg-white/10 transition-colors shadow-[2px_2px_0_0_var(--bulletin-shadow)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

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
                           <div className="text-[8px] font-black uppercase tracking-widest opacity-40 dark:opacity-70 text-black dark:text-white">Active Perspective</div>
                           <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-black dark:text-white">
                             <div className={`h-2 w-2 rounded-full ${user?.role === 'seller' ? 'bg-[#ff6b6b]' : 'bg-sky-500'} animate-pulse`} />
                             {user?.role?.toUpperCase()} VIEW
                           </div>
                        </div>
                        
                        <Link to="/profile" className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b border-[var(--bulletin-border)]/10 hover:bg-[var(--bulletin-bg)] transition-colors flex items-center gap-2 text-[var(--bulletin-text)]">
                           <User className="h-3 w-3" /> My Profile
                        </Link>
                        
                        {user?.role !== 'admin' && (
                          <button 
                            disabled={isSwitching}
                            onClick={handleRoleSwitch}
                            className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b border-[var(--bulletin-border)]/10 hover:bg-sky-50 dark:hover:bg-sky-900/10 transition-colors flex items-center gap-2 text-sky-700 dark:text-sky-400">
                             <Repeat className={`h-3 w-3 ${isSwitching ? 'animate-spin' : ''}`} />
                             {isSwitching ? 'Switching...' : `Switch to ${user?.role === 'seller' ? 'Buyer' : 'Seller'} View`}
                          </button>
                        )}

                        <Link to="/settings" className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b border-[var(--bulletin-border)]/10 hover:bg-[var(--bulletin-bg)] transition-colors flex items-center gap-2 text-[var(--bulletin-text)]">
                           <Settings className="h-3 w-3" /> Account Settings
                        </Link>

                        <Link to="/notifications" className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b border-[var(--bulletin-border)]/10 hover:bg-[var(--bulletin-bg)] transition-colors flex items-center gap-2 text-[var(--bulletin-text)]">
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
                <Link to="/login" className="border-2 border-black bg-black text-white px-4 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-[#fffacd] hover:text-black transition-colors">
                  Join Market
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Navigation Breadcrumbs */}
        {!hideBreadcrumbs && (
          <div className="border-b border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-6 py-3">
            <div className="mx-auto flex max-w-[1400px] items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">
              <Link to="/" className="hover:opacity-100 text-[var(--bulletin-text)]"><Home className="h-3 w-3" /></Link>
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
          <div className="border-b border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-6 py-12 md:px-12 md:py-20">
            <div className="mx-auto max-w-[1400px]">
              <div className="mb-4 inline-block border-2 border-[var(--bulletin-border)] bg-[#ff6b6b] px-3 py-1 text-[10px] font-black uppercase tracking-tighter text-white">
                Bulletin · {section}
              </div>
              <h1 className="mb-4 text-6xl font-black uppercase tracking-tighter md:text-8xl lg:text-9xl">
                {title}
              </h1>
              {subtitle && (
                <p className="max-w-xl text-xl font-medium leading-tight opacity-60">
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

        {/* ── SIMPLIFIED BULLETIN FOOTER ── */}
        <div className="border-t-4 border-black bg-[var(--bulletin-card)] px-6 py-16 md:px-12">
          <div className="mx-auto max-w-[1400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-24 mb-16">
              
              {/* Institutional Branding */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="border-4 border-black bg-white p-3 shadow-[4px_4px_0_0_#ff6b6b] rotate-[-2deg]">
                    <BrandMark className="h-8 w-8 text-black" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--bulletin-text)]">QUADS</h2>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40 text-[var(--bulletin-text)]">Institutional Exchange</p>
                  </div>
                </div>
                <p className="text-[11px] font-bold opacity-60 leading-relaxed max-w-[200px]">
                  The official UMaT student marketplace. Built for the community, powered by the community.
                </p>
              </div>
              
              {/* Marketplace Column */}
              <div className="flex flex-col gap-4">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-2">Marketplace</div>
                <Link to="/products" className="text-[14px] font-black uppercase tracking-widest hover:text-[#ff6b6b] transition-colors">All Listings</Link>
                <Link to="/categories" className="text-[14px] font-black uppercase tracking-widest hover:text-[#ff6b6b] transition-colors">Categories</Link>
                <Link to="/sellers" className="text-[14px] font-black uppercase tracking-widest hover:text-[#ff6b6b] transition-colors">Merchant Directory</Link>
              </div>

              {/* Protocols Column */}
              <div className="flex flex-col gap-4">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-2">Protocols</div>
                <Link to="/support" className="text-[14px] font-black uppercase tracking-widest hover:text-[#ff6b6b] transition-colors">Help Hub</Link>
                <Link to="/terms" className="text-[14px] font-black uppercase tracking-widest hover:text-[#ff6b6b] transition-colors">Terms of Service</Link>
                <Link to="/contact" className="text-[14px] font-black uppercase tracking-widest hover:text-[#ff6b6b] transition-colors">Direct Assistance</Link>
              </div>

              {/* My Hub Column */}
              <div className="flex flex-col gap-4">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-2">My Hub</div>
                {isAuthenticated ? (
                  <>
                    <Link to="/orders" className="text-[14px] font-black uppercase tracking-widest hover:text-[#ff6b6b] transition-colors">My Orders</Link>
                    <Link to="/messages" className="text-[14px] font-black uppercase tracking-widest hover:text-[#ff6b6b] transition-colors">Discussions</Link>
                    <Link to="/settings" className="text-[14px] font-black uppercase tracking-widest hover:text-[#ff6b6b] transition-colors">Preferences</Link>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-[14px] font-black uppercase tracking-widest hover:text-[#ff6b6b] transition-colors italic opacity-40">Login to Hub</Link>
                    <Link to="/register" className="text-[14px] font-black uppercase tracking-widest hover:text-[#ff6b6b] transition-colors">Create Account</Link>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Bar: Socials & Node */}
            <div className="flex flex-col md:flex-row items-center justify-between border-t-4 border-black pt-12 gap-8">
              <div className="flex items-center gap-10">
                 <a href="mailto:support@quadsmarket.tech" title="Email Support" className="text-[var(--bulletin-text)] hover:text-[#ff6b6b] transition-all hover:scale-110">
                   <Mail className="h-6 w-6" />
                 </a>
                 <a href="https://wa.me/233551500736" target="_blank" rel="noopener noreferrer" title="WhatsApp Support" className="text-[var(--bulletin-text)] hover:text-[#25D366] transition-all hover:scale-110">
                   <MessageCircle className="h-6 w-6" />
                 </a>
                 <a href="https://twitter.com/quadsmarket" target="_blank" rel="noopener noreferrer" title="Follow on X" className="text-[var(--bulletin-text)] hover:text-[#1DA1F2] transition-all hover:scale-110">
                   <Twitter className="h-6 w-6" />
                 </a>
              </div>

              <div className="border-4 border-black bg-[#fffacd] dark:bg-yellow-900/20 px-6 py-2 shadow-[4px_4px_0_0_#000]">
                 <div className="text-[10px] font-black uppercase tracking-tighter flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                   SYSTEM NODE: TARKWA-HQ-01
                 </div>
              </div>
            </div>

            {/* Legal / Metadata */}
            <div className="mt-16 flex flex-col md:flex-row items-center justify-between border-t-2 border-black/10 pt-8 gap-6">
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-[#ff6b6b] animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 text-[var(--bulletin-text)]">System Online · {new Date().getFullYear()} Operations</span>
              </div>
              <div className="text-[9px] font-black uppercase tracking-[0.5em] opacity-30 text-[var(--bulletin-text)]">
                /// QUADS DEPLOYMENT V2.4.0 ///
              </div>
            </div>
          </div>
        </div>
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
    <div id={id} className={`border-b border-black dark:border-white/20 ${bgClass} p-6 md:p-12 transition-colors duration-200 ${className}`}>
      <div className="mx-auto max-w-[1400px]">
        {(title || action) && (
          <div className="mb-8 flex items-end justify-between border-b border-black dark:border-white/20 pb-2">
            <div>
              {subtitle && (
                <div className="text-[10px] uppercase tracking-wider opacity-40">{subtitle}</div>
              )}
              {title && (
                <div className="text-lg font-black uppercase tracking-tight">{title}</div>
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
      className={`border border-black dark:border-white/40 ${bgClass} p-4 shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all hover:-translate-y-1 ${className} ${onClick ? 'cursor-pointer' : ''}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {children}
    </div>
  );
};
