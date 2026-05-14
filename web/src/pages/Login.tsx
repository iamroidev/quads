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

const fieldBase = 'w-full border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-4 text-[14px] font-black focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] text-[var(--bulletin-text)] placeholder:text-[var(--bulletin-text)] placeholder:opacity-30 shadow-[4px_4px_0_0_var(--bulletin-shadow)]';

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
      stroke="var(--bulletin-border)"
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
    className={`absolute border-4 border-[var(--bulletin-bg)] ${bg} shadow-[8px_8px_0_0_rgba(255,255,255,0.1)] p-6`}
    style={{
      transform: `rotate(${rotation}deg)`,
      top,
      left,
      right,
      bottom,
      width: w,
    }}
  >
    <Pin className="absolute -top-3 left-1/2 -translate-x-1/2 h-5 w-5 text-red-500" />
    {children}
  </div>
);

const LoginPage: React.FC = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [protocolAccepted, setProtocolAccepted] = useState(false);

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
    <div className="flex min-h-screen flex-col md:flex-row bg-[var(--bulletin-bg)] font-mono text-[13px] leading-tight overflow-hidden w-full max-w-full">
      
      {/* ── LEFT: Dark bulletin board with pinned notes ── */}
      <div className="hidden md:block w-[45%] min-w-0 bg-[#111] relative overflow-hidden">
        {/* Cork texture feel with dots */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--bulletin-bg) 2px, transparent 2px)',
            backgroundSize: '24px 24px',
          }}
        />
        
        {/* Scattered pinned notes */}
        <PinnedNote bg="bg-[#fffacd] dark:bg-yellow-900" rotation={-3} top="8%" left="8%" w="200px">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-black dark:text-yellow-200">📌 Notice</div>
          <div className="mt-2 text-2xl font-black uppercase text-black dark:text-yellow-200 tracking-tighter">2,400+ listings</div>
          <div className="mt-2 text-[12px] font-bold opacity-70 leading-relaxed text-black dark:text-yellow-200">Browse textbooks, gadgets & fashion from students.</div>
        </PinnedNote>

        <PinnedNote bg="bg-[#e0f2f7] dark:bg-sky-900" rotation={2} top="15%" right="10%" w="160px">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-black dark:text-sky-200">💬 Chat</div>
          <div className="mt-2 text-2xl font-black uppercase text-black dark:text-sky-200 tracking-tighter">Real-time</div>
          <div className="mt-2 text-[12px] font-bold opacity-70 text-black dark:text-sky-200">Message sellers directly on campus.</div>
        </PinnedNote>

        <PinnedNote bg="bg-[#fce4ec] dark:bg-red-900" rotation={-1.5} top="45%" left="12%" w="180px">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-black dark:text-red-200">🛡️ Safe</div>
          <div className="mt-2 text-2xl font-black uppercase text-black dark:text-red-200 tracking-tighter">Protection</div>
          <div className="mt-2 text-[12px] font-bold opacity-70 text-black dark:text-red-200">Payments held securely until you confirm.</div>
        </PinnedNote>


        {/* Large polaroid-style ID card */}
        <div
          className="absolute top-[50%] right-[12%] border-4 border-[var(--bulletin-bg)] bg-[var(--bulletin-card)] p-6 shadow-[12px_12px_0_0_rgba(255,255,255,0.15)]"
          style={{ transform: 'rotate(4deg)', width: '220px' }}
        >
          <div className="border-4 border-[var(--bulletin-bg)]/20 bg-[var(--bulletin-bg)] h-32 flex items-center justify-center mb-4">
            <div className="h-16 w-16 border-4 border-[var(--bulletin-text)]/30 flex items-center justify-center">
              <span className="text-4xl opacity-50">👤</span>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-3 py-1.5 text-2xl font-black uppercase tracking-tighter">
              Q
            </div>
            <div className="text-lg font-black uppercase tracking-tight text-[var(--bulletin-text)] mt-1">QUADS</div>
          </div>
          {/* Tape effect */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-8 w-24 bg-[#ffd700]/50 rotate-[-2deg]" />
        </div>

        <PinnedNote bg="bg-[#fffacd] dark:bg-yellow-900" rotation={-2} bottom="10%" right="15%" w="150px">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-black dark:text-yellow-200">⭐ New</div>
          <div className="mt-2 text-2xl font-black uppercase text-black dark:text-yellow-200 tracking-tighter">Latest</div>
          <div className="mt-2 text-[12px] font-bold opacity-70 text-black dark:text-yellow-200">Fresh items posted daily.</div>
        </PinnedNote>

        {/* Bottom brand */}
        <div className="absolute bottom-8 left-8">
          <div className="inline-flex items-center gap-3 border-4 border-[var(--bulletin-bg)]/20 px-4 py-2">
            <BrandMark className="h-6 w-6 text-[var(--bulletin-bg)]" />
            <span className="text-[12px] font-black uppercase tracking-[0.3em] text-[var(--bulletin-bg)]">QUADS</span>
          </div>
        </div>

        {/* Zigzag divider on right edge */}
        <ZigzagDivider />
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div className="flex flex-1 min-w-0 flex-col relative z-10 bg-[var(--bulletin-bg)] dark:bg-[#1a1a1a] overflow-hidden">
        {/* Mobile header */}
        <div className="flex md:hidden items-stretch border-b-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)]">
          <Link to="/" className="flex-1 border-r-4 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/40 px-4 py-3 flex items-center gap-2">
            <BrandMark className="h-5 w-5 text-[var(--bulletin-text)]" />
            <div>
              <span className="block text-[8px] font-black uppercase tracking-[0.2em] opacity-40 text-[var(--bulletin-text)]">Network</span>
              <span className="block font-black uppercase tracking-tight text-[var(--bulletin-text)] text-xs">QUADS</span>
            </div>
          </Link>
          <div className="flex-1 bg-[#e0f2f7] dark:bg-sky-900/40 px-4 py-3 flex items-center justify-center">
            <Link to="/register" className="text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-text)] underline decoration-2 underline-offset-4">Register</Link>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 md:p-12 lg:p-20">
          <div className="w-full max-w-md">
            <div className="mb-12 border-b-4 border-[var(--bulletin-border)] pb-6">
              <Link to="/" className="hidden md:inline-flex items-center gap-3 mb-8 hover:opacity-70 transition-opacity">
                <BrandMark className="h-6 w-6 text-[var(--bulletin-text)]" />
                <span className="text-[14px] font-black uppercase tracking-[0.2em] text-[var(--bulletin-text)]">QUADS</span>
              </Link>
              <h1 className="text-5xl font-black uppercase tracking-tighter text-[var(--bulletin-text)] leading-none">Authentication</h1>
              <p className="text-[12px] font-bold opacity-60 mt-4 text-[var(--bulletin-text)] uppercase tracking-widest">Sign in to your account.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-[var(--bulletin-text)]">Email</label>
                <input type="email" placeholder="you@example.com" autoComplete="email" autoFocus className={fieldBase} {...register('email')} />
                {errors.email && <p className="mt-2 text-[12px] text-red-600 font-black uppercase tracking-widest">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-[var(--bulletin-text)]">Password</label>
                <div className="relative flex items-center">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Your password" autoComplete="current-password" className={`flex-1 pr-16 ${fieldBase}`} {...register('password')} />
                  <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-4 text-[var(--bulletin-text)] opacity-40 hover:opacity-100 transition-colors">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-2 text-[12px] text-red-600 font-black uppercase tracking-widest">{errors.password.message}</p>}
                <div className="mt-4 flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-text)] opacity-60 hover:opacity-100 underline decoration-2 underline-offset-4 transition-all"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="mt-8 p-5 border-2 border-dashed border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] relative">
                  <div className="absolute -top-3 left-4 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                    SESSION PROTOCOL
                  </div>
                  <div className="flex items-start gap-4">
                    <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center border-2 border-black bg-white shadow-[3px_3px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={protocolAccepted}
                        onChange={(e) => setProtocolAccepted(e.target.checked)}
                        required
                      />
                      <Pin className="h-4 w-4 text-gray-300 peer-checked:text-red-600 peer-checked:rotate-45 transition-all" />
                    </label>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-tight text-[var(--bulletin-text)] leading-tight">
                        I acknowledge the <Link to="/terms" className="underline decoration-2 underline-offset-2">Honor Code</Link> & <Link to="/terms#privacy" className="underline decoration-2 underline-offset-2">Safety Protocols</Link> for this session.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={isSubmitting || !protocolAccepted}
                className="w-full border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-8 py-5 text-[14px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] shadow-[8px_8px_0_0_var(--bulletin-shadow)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] disabled:opacity-40 transition-all">
                {isSubmitting ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="flex items-center gap-4 my-12">
              <div className="flex-1 h-1 bg-[var(--bulletin-border)] opacity-20" />
              <span className="text-[12px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">Or</span>
              <div className="flex-1 h-1 bg-[var(--bulletin-border)] opacity-20" />
            </div>

            <div className="flex justify-center mb-12">
              <div 
                className={`border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] shadow-[6px_6px_0_0_var(--bulletin-shadow)] transition-all overflow-hidden ${!protocolAccepted ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-[10px_10px_0_0_var(--bulletin-shadow)]'}`} 
                style={{ transform: 'rotate(-0.5deg)' }}
                onClick={() => {
                  if (!protocolAccepted) {
                    toast.error('Please accept the Session Protocol first.');
                  }
                }}
              >
                <div className={!protocolAccepted ? 'pointer-events-none' : ''}>
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
            </div>

            <div className="border-t-4 border-[var(--bulletin-border)] pt-8 text-center bg-[var(--bulletin-card)] p-6 border-2 shadow-[8px_8px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(1deg)' }}>
              <p className="text-[12px] font-bold text-[var(--bulletin-text)] uppercase tracking-widest">
                No account?{' '}
                <Link to="/register" className="font-black underline decoration-2 underline-offset-4 hover:no-underline">Create one</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;