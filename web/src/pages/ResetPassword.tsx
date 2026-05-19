import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Check, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
  confirm:  z.string().min(1, 'Please confirm your password'),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] });

type FormData = z.infer<typeof schema>;

const fieldBase = 'w-full border-4 border-black bg-[var(--bulletin-bg)] px-5 py-5 text-[16px] font-black focus:outline-none focus:ring-0 text-[var(--bulletin-text)] placeholder:text-[var(--bulletin-text)] placeholder:opacity-20 shadow-[6px_6px_0_0_var(--bulletin-shadow)]';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [otp, setOtp]               = useState('');
  const [otpError, setOtpError]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const emailValue = watch('email') || '';

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const onSubmit = async (data: FormData) => {
    if (otp.length !== 6) { setOtpError('Enter the 6-digit code from your email.'); return; }
    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { email: data.email.toLowerCase(), code: otp, password: data.password });
      setDone(true);
      toast.success('Password updated!');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to reset password.';
      if (msg.toLowerCase().includes('code') || msg.toLowerCase().includes('expired')) {
        setOtpError(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!emailValue || resendCountdown > 0) return;
    try {
      await api.post('/auth/forgot-password', { email: emailValue.toLowerCase() });
      setResendCountdown(60);
      toast.success('New code sent.');
    } catch { toast.error('Failed to resend.'); }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[var(--bulletin-bg)] flex items-center justify-center p-6">
        <div className="border-4 border-black bg-[var(--bulletin-card)] p-12 shadow-[8px_8px_0_0_var(--bulletin-shadow)] text-center max-w-sm">
          <div className="w-16 h-16 border-4 border-black bg-black flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-[var(--bulletin-text)] mb-3">Password Updated</h2>
          <p className="text-sm text-[var(--bulletin-text)] opacity-60">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bulletin-bg)] flex flex-col items-center justify-center p-6 font-sans">
      <Link to="/login" className="fixed top-8 left-8 flex items-center gap-2 border-4 border-black bg-white px-5 py-3 text-[11px] font-black uppercase tracking-widest shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all z-50">
        <ArrowLeft className="h-4 w-4" /> Return to Login
      </Link>

      <div className="w-full max-w-md border-4 border-black bg-[var(--bulletin-card)] shadow-[8px_8px_0_0_var(--bulletin-shadow)] p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 border-4 border-black bg-black flex items-center justify-center">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-[var(--bulletin-text)]">Account Recovery</p>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-[var(--bulletin-text)] leading-none">Reset Password</h1>
          </div>
        </div>

        <p className="text-sm text-[var(--bulletin-text)] opacity-60 mb-8">
          Enter your email, the 6-digit code we sent you, and your new password.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-[var(--bulletin-text)]">Email</label>
            <input type="email" placeholder="you@email.com" autoComplete="email" className={fieldBase} {...register('email')} />
            {errors.email && <p className="mt-2 text-[12px] text-red-600 font-black uppercase tracking-widest">{errors.email.message}</p>}
          </div>

          {/* OTP */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 text-[var(--bulletin-text)]">Verification Code</label>
              <button type="button" onClick={handleResend} disabled={resendCountdown > 0 || !emailValue}
                className="text-[11px] font-black uppercase tracking-widest underline disabled:opacity-40 text-[var(--bulletin-text)]">
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Send Code'}
              </button>
            </div>
            <div className="flex gap-2 justify-center">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  ref={r => { otpRefs.current[i] = r; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  value={otp[i] || ''}
                  className={`w-11 text-center text-[20px] font-black border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] text-[var(--bulletin-text)] shadow-[3px_3px_0_0_var(--bulletin-shadow)] focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] ${otpError ? 'border-red-500' : ''}`}
                  style={{ height: '52px' }}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    const arr = otp.split('');
                    arr[i] = val.slice(-1);
                    const joined = arr.join('').slice(0, 6);
                    setOtp(joined); setOtpError('');
                    if (val && i < 5) otpRefs.current[i + 1]?.focus();
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                  }}
                  onPaste={e => {
                    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                    if (p) { setOtp(p); setOtpError(''); e.preventDefault(); otpRefs.current[Math.min(p.length, 5)]?.focus(); }
                  }}
                />
              ))}
            </div>
            {otpError && <p className="mt-2 text-[12px] text-red-600 font-black uppercase tracking-widest text-center">{otpError}</p>}
          </div>

          {/* New password */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-[var(--bulletin-text)]">New Password</label>
            <div className="relative flex items-center">
              <input type={showPw ? 'text' : 'password'} placeholder="At least 6 characters" autoComplete="new-password"
                className={`${fieldBase} pr-16`} {...register('password')} />
              <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-4 opacity-40 hover:opacity-100 text-[var(--bulletin-text)]">
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-2 text-[12px] text-red-600 font-black uppercase tracking-widest">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-[var(--bulletin-text)]">Confirm Password</label>
            <div className="relative flex items-center">
              <input type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password" autoComplete="new-password"
                className={`${fieldBase} pr-16`} {...register('confirm')} />
              <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-4 opacity-40 hover:opacity-100 text-[var(--bulletin-text)]">
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirm && <p className="mt-2 text-[12px] text-red-600 font-black uppercase tracking-widest">{errors.confirm.message}</p>}
          </div>

          <button type="submit" disabled={submitting}
            className="w-full border-4 border-black bg-black px-6 py-5 text-[14px] font-black uppercase tracking-widest text-white shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:opacity-40 transition-all">
            {submitting ? 'Updating...' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
