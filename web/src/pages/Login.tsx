import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Pin, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import BrandMark from '../components/layout/BrandMark';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const fieldBase = 'w-full border border-black bg-[#fefdfb] px-4 py-3 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-black placeholder:text-black/30';

/* Zigzag SVG divider */
const ZigzagDivider = () => (
  <svg
    className="absolute top-0 right-0 h-full w-5 hidden md:block"
    viewBox="0 0 16 100"
    preserveAspectRatio="none"
    fill="none"
  >
    <path
      d="M0 0 L16 2 L0 4 L16 6 L0 8 L16 10 L0 12 L16 14 L0 16 L16 18 L0 20 L16 22 L0 24 L16 26 L0 28 L16 30 L0 32 L16 34 L0 36 L16 38 L0 40 L16 42 L0 44 L16 46 L0 48 L16 50 L0 52 L16 54 L0 56 L16 58 L0 60 L16 62 L0 64 L16 66 L0 68 L16 70 L0 72 L16 74 L0 76 L16 78 L0 80 L16 82 L0 84 L16 86 L0 88 L16 90 L0 92 L16 94 L0 96 L16 98 L0 100"
      stroke="#f8f7f4"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

/* A pinned note card component */
const PinnedNote: React.FC<{
  bg: string;
  rotation: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  children: React.ReactNode;
  w?: string;
}> = ({ bg, rotation, children, top, left, right, bottom, w = '180px' }) => (
  <div
    className={`absolute border border-black/20 ${bg} shadow-[3px_3px_0_0_rgba(0,0,0,0.3)] p-4`}
    style={{
      transform: `rotate(${rotation}deg)`,
      top,
      left,
      right,
      bottom,
      width: w,
    }}
  >
    <Pin className="absolute -top-2 left-1/2 -translate-x-1/2 h-3 w-3 text-red-500/70" />
    {children}
  </div>
);

const LoginPage: React.FC = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login({ email: data.email.toLowerCase(), password: data.password });
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setIsSubmitting(true);
    try {
      // First try: attempt Google login directly (handles existing accounts)
      const result = await googleLogin(credentialResponse.credential);
      
      if (result.needsProfileCompletion) {
        // New or incomplete user — redirect to register to complete profile
        sessionStorage.setItem('google_credential', credentialResponse.credential);
        navigate('/register?google=1');
      } else {
        // Existing user with complete profile — login succeeded
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      // If googleLogin threw "No account found", redirect to register
      const msg = err.response?.data?.message || err.message || '';
      if (msg.toLowerCase().includes('no account found') || msg.toLowerCase().includes('sign up first')) {
        sessionStorage.setItem('google_credential', credentialResponse.credential);
        navigate('/register?google=1');
      } else {
        toast.error(msg || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#f8f7f4] font-mono text-[13px] leading-tight overflow-hidden">
      
      {/* ── LEFT: Dark bulletin board with pinned notes ── */}
      <div className="hidden md:block w-[48%] bg-[#1a1a1a] relative overflow-hidden">
        {/* Cork texture feel with dots */}
        <div className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        
        {/* Scattered pinned notes */}
        <PinnedNote bg="bg-[#fffacd]" rotation={-3} top="8%" left="8%" w="160px">
          <div className="text-[9px] font-bold uppercase tracking-wider opacity-50">📌 Notice</div>
          <div className="mt-1 text-[13px] font-bold">2,400+ listings</div>
          <div className="mt-1 text-[11px] opacity-70 leading-relaxed">Browse textbooks, gadgets & fashion from students.</div>
        </PinnedNote>

        <PinnedNote bg="bg-[#e0f2f7]" rotation={2} top="12%" right="12%" w="140px">
          <div className="text-[9px] font-bold uppercase tracking-wider opacity-50">💬 Chat</div>
          <div className="mt-1 text-[13px] font-bold">Real-time</div>
          <div className="mt-1 text-[11px] opacity-70">Message sellers directly on campus.</div>
        </PinnedNote>

        <PinnedNote bg="bg-[#fce4ec]" rotation={-1.5} top="38%" left="15%" w="150px">
          <div className="text-[9px] font-bold uppercase tracking-wider opacity-50">🛡️ Safe</div>
          <div className="mt-1 text-[13px] font-bold">Buyer protection</div>
          <div className="mt-1 text-[11px] opacity-70">Payments held securely until you confirm.</div>
        </PinnedNote>

        {/* Large polaroid-style ID card */}
        <div
          className="absolute top-[45%] right-[10%] border border-white/20 bg-[#2a2a2a] p-4 shadow-[6px_6px_0_0_rgba(0,0,0,0.5)]"
          style={{ transform: 'rotate(4deg)', width: '200px' }}
        >
          <div className="border border-white/10 bg-[#333] h-24 flex items-center justify-center mb-3">
            <div className="h-12 w-12 border-2 border-white/30 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-white/40">Member Access</div>
            <div className="text-sm font-bold text-white mt-0.5">UMaT Marketplace</div>
          </div>
          {/* Tape effect */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-5 w-20 bg-[#ffd700]/20 rotate-1" />
        </div>

        <PinnedNote bg="bg-[#f0e8f4]" rotation={2.5} bottom="18%" left="10%" w="170px">
          <div className="text-[9px] font-bold uppercase tracking-wider opacity-50">💰 Free</div>
          <div className="mt-1 text-[13px] font-bold">0% platform fee</div>
          <div className="mt-1 text-[11px] opacity-70">Students keep 100% of every sale.</div>
        </PinnedNote>

        <PinnedNote bg="bg-[#fffacd]" rotation={-2} bottom="10%" right="15%" w="130px">
          <div className="text-[9px] font-bold uppercase tracking-wider opacity-50">⭐ New</div>
          <div className="mt-1 text-[13px] font-bold">Just listed</div>
          <div className="mt-1 text-[11px] opacity-70">Fresh items posted daily.</div>
        </PinnedNote>

        {/* Bottom brand */}
        <div className="absolute bottom-6 left-6">
          <div className="inline-flex items-center gap-2 border border-white/20 px-3 py-1.5">
            <BrandMark className="h-4 w-4 text-white" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">CampusMarket</span>
          </div>
        </div>

        {/* Zigzag divider on right edge */}
        <ZigzagDivider />
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div className="flex flex-1 flex-col relative">
        {/* Mobile header */}
        <div className="flex md:hidden items-stretch border-b border-black bg-[#f8f7f4]">
          <Link to="/" className="flex-1 border-r border-black bg-[#fff5e1] px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wider opacity-40">UMaT</span>
            <span className="block font-bold">Campus Market</span>
          </Link>
          <div className="flex-1 bg-[#f0e8f4] px-3 py-2 flex items-center justify-end">
            <Link to="/register" className="text-[9px] font-bold uppercase tracking-wider underline">Register</Link>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <Link to="/" className="hidden md:inline-flex items-center gap-2 mb-6">
                <BrandMark className="h-5 w-5" />
                <span className="text-xs font-black uppercase">CampusMarket</span>
              </Link>
              <h1 className="text-3xl font-bold mt-2">Welcome back.</h1>
              <p className="text-[12px] opacity-60 mt-2">Sign in to your account.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">Email</label>
                <input type="email" placeholder="you@example.com" autoComplete="email" autoFocus className={fieldBase} {...register('email')} />
                {errors.email && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">Password</label>
                <div className="relative flex items-center">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Your password" autoComplete="current-password" className={`flex-1 pr-12 ${fieldBase}`} {...register('password')} />
                  <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 text-black/40 hover:text-black transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.password.message}</p>}
                <div className="mt-1.5 flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-[10px] font-bold opacity-50 hover:opacity-100 hover:underline transition-opacity"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
              <button type="submit" disabled={isSubmitting}
                className="w-full border border-black bg-black px-6 py-3 text-[11px] font-bold uppercase text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black disabled:opacity-40 transition-all">
                {isSubmitting ? 'Signing in...' : 'Continue'}
              </button>
            </form>

            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-black/20" />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Or</span>
              <div className="flex-1 h-px bg-black/20" />
            </div>

            <div className="flex justify-center">
              <div className="border border-black bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all overflow-hidden">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google sign-in could not start.')}
                  useOneTap={false}
                  shape="rectangular"
                  theme="outline"
                  size="large"
                />
              </div>
            </div>

            <div className="mt-8 border-t border-black/20 pt-6 text-center">
              <p className="text-[12px] opacity-60">
                No account?{' '}
                <Link to="/register" className="font-bold text-black underline hover:no-underline">Create one</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;