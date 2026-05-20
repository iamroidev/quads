import React, { useState, useEffect } from 'react';
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

const fieldBase = 'w-full border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-4 text-[16px] font-black focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] text-[var(--bulletin-text)] placeholder:text-[var(--bulletin-text)] placeholder:opacity-30 shadow-[4px_4px_0_0_var(--bulletin-shadow)]';

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
  const { login, sendLoginOtp, verifyOtpAndLogin, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [protocolAccepted, setProtocolAccepted] = useState(false);
  const [useOtp, setUseOtp] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const from = (location.state as any)?.from || '/';
  // Read latest user after login via localStorage since React state may not have flushed yet
  const getRedirectAfterLogin = () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.roles?.includes('admin')) return '/admin';
      }
    } catch { /* ignore */ }
    return from;
  };

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
      navigate(getRedirectAfterLogin(), { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async () => {
    if (!otpEmail.trim() || !/\S+@\S+\.\S+/.test(otpEmail)) {
      setOtpError('Enter a valid email address.');
      return;
    }
    setOtpError('');
    setIsSubmitting(true);
    try {
      await sendLoginOtp(otpEmail.toLowerCase());
      setOtpSent(true);
      setResendCountdown(60);
    } catch (err: any) {
      setOtpError(err.message || 'Failed to send code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyLoginOtp = async () => {
    if (otpCode.length !== 6) { setOtpError('Enter the 6-digit code.'); return; }
    setOtpError('');
    setIsSubmitting(true);
    try {
      await verifyOtpAndLogin(otpEmail, otpCode);
      navigate(getRedirectAfterLogin(), { replace: true });
    } catch (err: any) {
      setOtpError(err.message || 'Incorrect code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendLoginOtp = async () => {
    if (resendCountdown > 0) return;
    try {
      await sendLoginOtp(otpEmail);
      setResendCountdown(60);
      toast.success('New code sent.', { duration: 3000 });
    } catch {
      toast.error('Failed to resend. Please try again.');
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
        navigate(getRedirectAfterLogin(), { replace: true });
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
          <div className="mt-2 text-2xl font-black uppercase text-black dark:text-yellow-200 tracking-tighter">Student listings</div>
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
          className="absolute top-[50%] right-[12%] border-4 border-white bg-white p-6 shadow-[12px_12px_0_0_rgba(255,255,255,0.15)] text-black"
          style={{ transform: 'rotate(4deg)', width: '220px' }}
        >
          <div className="border-4 border-black/10 bg-[#faf8f5] h-32 flex items-center justify-center mb-4">
            <div className="h-16 w-16 border-4 border-black/20 flex items-center justify-center">
              <span className="text-4xl opacity-50">👤</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <BrandMark className="h-16 w-16 mb-2 text-black" />
            <div className="text-lg font-black uppercase tracking-tight text-black mt-1">QUADS</div>
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
          <div className="inline-flex items-center gap-3 border-4 border-[#faf8f5]/20 px-4 py-2">
            <BrandMark className="h-6 w-6 text-[#faf8f5]" />
            <span className="text-[12px] font-black uppercase tracking-[0.3em] text-[#faf8f5]">QUADS</span>
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
            <div className="mb-8 md:mb-12 border-b-4 border-[var(--bulletin-border)] pb-4 md:pb-6">
              <Link to="/" className="hidden md:inline-flex items-center gap-3 mb-8 hover:opacity-70 transition-opacity">
                <BrandMark className="h-6 w-6 text-[var(--bulletin-text)]" />
                <span className="text-[14px] font-black uppercase tracking-[0.2em] text-[var(--bulletin-text)]">QUADS</span>
              </Link>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-[var(--bulletin-text)] leading-none">Authentication</h1>
              <p className="text-[10px] md:text-[12px] font-bold opacity-60 mt-2 md:mt-4 text-[var(--bulletin-text)] uppercase tracking-widest">Sign in to your account.</p>
            </div>

            {/* OTP Login (default) */}
            {useOtp && !otpSent && (
              <div className="space-y-8">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-[var(--bulletin-text)]">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={fieldBase}
                    value={otpEmail}
                    onChange={e => { setOtpEmail(e.target.value); setOtpError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  />
                  {otpError && <p className="mt-2 text-[12px] text-red-600 font-black uppercase tracking-widest">{otpError}</p>}
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSubmitting}
                  className="w-full border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-6 py-4 text-[14px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] disabled:opacity-40 transition-all"
                >
                  {isSubmitting ? 'Sending...' : 'Send Login Code'}
                </button>
                <p className="text-center text-[11px] font-black uppercase tracking-widest opacity-50 text-[var(--bulletin-text)]">
                  Use password instead?{' '}
                  <button type="button" onClick={() => setUseOtp(false)} className="underline decoration-2 underline-offset-4 opacity-100 hover:text-[#ff6b6b]">
                    Sign in with password
                  </button>
                </p>
              </div>
            )}

            {useOtp && otpSent && (
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ff6b6b] mb-3">Verify Identity</p>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-[var(--bulletin-text)]">Enter the code.</h2>
                  <p className="text-[13px] font-bold opacity-60 mt-2 text-[var(--bulletin-text)]">
                    6-digit code sent to <span className="opacity-100 underline decoration-2">{otpEmail}</span>
                  </p>
                </div>
                <div className="flex gap-3 justify-center my-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      id={`login-otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      maxLength={1}
                      value={otpCode[i] || ''}
                      className={`w-12 h-14 text-center text-[22px] font-black border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] text-[var(--bulletin-text)] shadow-[4px_4px_0_0_var(--bulletin-shadow)] focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] ${otpError ? 'border-red-500' : ''}`}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        const next = otpCode.split('');
                        next[i] = val.slice(-1);
                        const joined = next.join('').slice(0, 6);
                        setOtpCode(joined);
                        setOtpError('');
                        if (val && i < 5) document.getElementById(`login-otp-${i + 1}`)?.focus();
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Backspace' && !otpCode[i] && i > 0) document.getElementById(`login-otp-${i - 1}`)?.focus();
                        if (e.key === 'Enter' && otpCode.length === 6) handleVerifyLoginOtp();
                      }}
                      onPaste={e => {
                        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                        if (pasted) { setOtpCode(pasted); setOtpError(''); e.preventDefault(); document.getElementById(`login-otp-${Math.min(pasted.length, 5)}`)?.focus(); }
                      }}
                    />
                  ))}
                </div>
                {otpError && <p className="text-[12px] text-red-600 font-black uppercase tracking-widest text-center">{otpError}</p>}
                <button
                  type="button"
                  onClick={handleVerifyLoginOtp}
                  disabled={isSubmitting || otpCode.length !== 6}
                  className="w-full border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-6 py-4 text-[14px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] disabled:opacity-40 transition-all"
                >
                  {isSubmitting ? 'Verifying...' : 'Sign In'}
                </button>
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => { setOtpSent(false); setOtpCode(''); setOtpError(''); }} className="text-[12px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4 opacity-60 hover:opacity-100 text-[var(--bulletin-text)]">← Back</button>
                  <button type="button" onClick={handleResendLoginOtp} disabled={resendCountdown > 0} className="text-[12px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4 disabled:opacity-40 text-[var(--bulletin-text)]">
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}

            {/* Password Login (fallback) */}
            {!useOtp && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-[var(--bulletin-text)]">Email</label>
                  <input type="email" placeholder="you@example.com" autoComplete="email" className={fieldBase} {...register('email')} />
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
                    <Link to="/forgot-password" className="text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-text)] opacity-60 hover:opacity-100 underline decoration-2 underline-offset-4">
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting}
                  className="w-full border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-6 py-4 text-[14px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] disabled:opacity-40 transition-all">
                  {isSubmitting ? 'Authenticating...' : 'Sign In'}
                </button>
                <p className="text-center text-[11px] font-black uppercase tracking-widest opacity-50 text-[var(--bulletin-text)]">
                  Use email code instead?{' '}
                  <button type="button" onClick={() => setUseOtp(true)} className="underline decoration-2 underline-offset-4 opacity-100 hover:text-[#ff6b6b]">
                    Sign in with code
                  </button>
                </p>
              </form>
            )}

            <div className="flex items-center gap-3 md:gap-4 my-6 md:my-12">
              <div className="flex-1 h-1 bg-[var(--bulletin-border)] opacity-20" />
              <span className="text-[10px] md:text-[12px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">Or</span>
              <div className="flex-1 h-1 bg-[var(--bulletin-border)] opacity-20" />
            </div>

            <div className="flex justify-center mb-6 md:mb-12">
              <div
                className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] shadow-[6px_6px_0_0_var(--bulletin-shadow)] transition-all overflow-hidden hover:-translate-y-1 hover:shadow-[10px_10px_0_0_var(--bulletin-shadow)]"
                style={{ transform: 'rotate(-0.5deg)' }}
              >
                <div>
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

            <div className="border-t-4 border-[var(--bulletin-border)] pt-6 md:pt-8 text-center bg-[var(--bulletin-card)] p-4 md:p-6 border-2 shadow-[4px_4px_0_0_var(--bulletin-shadow)] md:shadow-[8px_8px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(1deg)' }}>
              <p className="text-[10px] md:text-[12px] font-bold text-[var(--bulletin-text)] uppercase tracking-widest">
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