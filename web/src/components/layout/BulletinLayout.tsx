import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';

interface BulletinLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  section?: string;
}

export const BulletinLayout: React.FC<BulletinLayoutProps> = ({ 
  children, 
  title, 
  subtitle,
  section = '01'
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Close dropdown on route change
  React.useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen bg-[#f8f7f4] font-mono text-[13px] leading-tight">
      
      {/* Fragmented header strip */}
      <div className="sticky top-0 z-50 flex items-stretch border-b border-black bg-[#f8f7f4]">
        <Link to="/" className="w-[40%] border-r border-black bg-[#fff5e1] px-3 py-2 transition-colors hover:bg-[#fff0d0]">
          <span className="block text-[10px] uppercase tracking-wider opacity-40">UMaT</span>
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap font-bold">Campus Market</span>
        </Link>
        <div className="w-[35%] border-r border-black bg-[#e8f4f8] px-3 py-2">
          <span className="block text-[10px] uppercase tracking-wider opacity-40">Section</span>
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap font-bold">{section}</span>
        </div>

        {/* Profile / auth segment - compact */}
        <div className="relative w-[25%] bg-[#f0e8f4]">
          {isAuthenticated && user ? (
            <>
              <button
                className="flex w-full items-center justify-center gap-1 px-2 py-2 text-left transition-colors hover:bg-[#e4dce8]"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              >
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-black">
                  <User className="h-3 w-3 text-white" />
                </div>
                <span className="hidden lg:inline text-[9px] uppercase tracking-wider opacity-50 truncate max-w-[50px]">
                  {user.name?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown className="h-3 w-3 text-black/50 flex-shrink-0" />
              </button>

              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsProfileMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-40 w-44 border border-black bg-white shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                    <div className="border-b border-black px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider">{user.name}</p>
                      <p className="text-[9px] text-black/40 mt-0.5">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 border-b border-black/20 px-3 py-2.5 text-[11px] font-bold transition-colors hover:bg-[#f0e8f4]"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <User className="h-3 w-3" />
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2.5 border-b border-black/20 px-3 py-2.5 text-[11px] font-bold transition-colors hover:bg-[#f0e8f4]"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <Settings className="h-3 w-3" />
                      Settings
                    </Link>
                    <button
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-[11px] font-bold text-red-600 transition-colors hover:bg-red-50"
                      onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }}
                    >
                      <LogOut className="h-3 w-3" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex items-stretch h-full">
              <Link
                to="/login"
                className="flex flex-1 items-center px-3 py-2 text-[10px] uppercase tracking-wider text-black/60 transition-colors hover:bg-[#e4dce8] hover:text-black border-r border-black/30"
              >
                <span className="block opacity-40">Account</span>
                <span className="ml-auto block font-bold">Sign in</span>
              </Link>
              <Link
                to="/register"
                className="flex flex-1 items-center justify-end px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-black transition-colors hover:bg-[#e4dce8]"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Page title section */}
      {title && (
        <div className="border-b border-black bg-white p-6 md:p-12">
          <div className="mx-auto max-w-[1400px]">
            <div className="text-[10px] uppercase tracking-wider opacity-40">{subtitle || 'Page'}</div>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">{title}</h1>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative">
        {children}
      </div>

      {/* Footer strip */}
      <div className="border-t border-black bg-[#f8f7f4]">
        <div className="mx-auto max-w-[1400px] p-6 md:p-12">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Column 1 */}
            <div>
              <div className="mb-3 text-[10px] uppercase tracking-wider opacity-40">Marketplace</div>
              <div className="space-y-2 text-[12px]">
                <Link to="/products" className="block hover:underline">Browse listings</Link>
                <Link to="/categories" className="block hover:underline">Categories</Link>
                <Link to="/sell" className="block hover:underline">Sell an item</Link>
              </div>
            </div>

            {/* Column 2 */}
            <div>
              <div className="mb-3 text-[10px] uppercase tracking-wider opacity-40">Account</div>
              <div className="space-y-2 text-[12px]">
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard" className="block hover:underline">Dashboard</Link>
                    <Link to="/my-listings" className="block hover:underline">My listings</Link>
                    <Link to="/orders" className="block hover:underline">Orders</Link>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block hover:underline">Login</Link>
                    <Link to="/register" className="block hover:underline">Register</Link>
                  </>
                )}
              </div>
            </div>

            {/* Column 3 */}
            <div>
              <div className="mb-3 text-[10px] uppercase tracking-wider opacity-40">Support</div>
              <div className="space-y-2 text-[12px]">
                <a href="#" className="block hover:underline">Help center</a>
                <a href="#" className="block hover:underline">Safety tips</a>
                <a href="#" className="block hover:underline">Contact us</a>
              </div>
            </div>

            {/* Column 4 */}
            <div>
              <div className="mb-3 text-[10px] uppercase tracking-wider opacity-40">Info</div>
              <div className="space-y-2 text-[12px]">
                <div className="border border-black bg-[#fffacd] p-2 text-[11px]">
                  <div className="font-bold">Campus only</div>
                  <div className="opacity-70">UMaT students & staff</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-black pt-6 text-center">
            <div className="text-[10px] uppercase tracking-wider opacity-40">
              UMaT Campus Marketplace · 2026 · Made for students, by students
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
}> = ({ children, title, subtitle, action, bgColor = 'bg-[#faf8f5]' }) => {
  return (
    <div className={`border-b border-black ${bgColor} p-6 md:p-12`}>
      <div className="mx-auto max-w-[1400px]">
        {(title || action) && (
          <div className="mb-8 flex items-end justify-between border-b border-black pb-2">
            <div>
              {subtitle && (
                <div className="text-[10px] uppercase tracking-wider opacity-40">{subtitle}</div>
              )}
              {title && (
                <div className="text-lg font-bold">{title}</div>
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
}> = ({ children, rotation = 0, bgColor = 'bg-white', className = '' }) => {
  return (
    <div
      className={`border border-black ${bgColor} p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {children}
    </div>
  );
};
