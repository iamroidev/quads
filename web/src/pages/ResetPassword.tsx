import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { supabase } from '../services/supabase';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';
import toast from 'react-hot-toast';

const schema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters').max(72),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ['confirm'],
  });

type FormData = z.infer<typeof schema>;

const fieldBase =
  'w-full border border-black bg-[#fefdfb] px-4 py-3 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-black placeholder:text-black/30';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessionReady, setSessionReady] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!sessionReady) {
      toast.error('No valid reset session. Please request a new reset link.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw error;
      setDone(true);
      toast.success('Password updated!');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BulletinLayout title="New Password" subtitle="Account" section="00">
      <BulletinSection bgColor="bg-[#faf8f5]">
        <div className="mx-auto max-w-sm py-8">
          {done ? (
            /* ── Success ── */
            <div
              className="border border-black bg-[#fffacd] p-8 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-center"
              style={{ transform: 'rotate(-0.5deg)' }}
            >
              <div className="absolute -top-2 left-1/2 h-4 w-20 -translate-x-1/2 bg-[#ffd700]/40" />
              <div className="text-[10px] font-bold uppercase tracking-[3px] opacity-50 mb-3">
                ✓ Done
              </div>
              <h1 className="text-2xl font-bold mb-2">Password updated!</h1>
              <p className="text-[12px] opacity-60 mb-6">Redirecting you to login…</p>
              <Link
                to="/login"
                className="inline-block border border-black bg-black px-5 py-2.5 text-[11px] font-bold uppercase text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-colors"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            /* ── Form ── */
            <div className="border border-black bg-[#fefdfb] p-8 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <div className="mb-6 border-b border-black pb-4">
                <div className="text-[10px] font-bold uppercase tracking-[3px] opacity-50 mb-1">
                  Account recovery
                </div>
                <h1 className="text-2xl font-bold">Set new password</h1>
                <p className="text-[12px] opacity-60 mt-2">
                  Choose a strong password for your account.
                </p>
              </div>

              {!sessionReady && (
                <div className="mb-4 border border-black bg-[#fff5e1] px-3 py-2 text-[11px] font-bold">
                  ⏳ Waiting for reset token — make sure you opened this page from the email link.
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">
                    New password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 h-4 w-4 opacity-30 pointer-events-none" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      autoComplete="new-password"
                      autoFocus
                      className={`${fieldBase} pl-10 pr-12`}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((p) => !p)}
                      className="absolute right-3 text-black/40 hover:text-black transition-colors"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-[11px] font-bold border border-black bg-[#fce4ec] px-2 py-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">
                    Confirm password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 h-4 w-4 opacity-30 pointer-events-none" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      className={`${fieldBase} pl-10 pr-12`}
                      {...register('confirm')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      className="absolute right-3 text-black/40 hover:text-black transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirm && (
                    <p className="mt-1 text-[11px] font-bold border border-black bg-[#fce4ec] px-2 py-1">
                      {errors.confirm.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || !sessionReady}
                  className="w-full border border-black bg-black px-6 py-3 text-[11px] font-bold uppercase text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black disabled:opacity-40 transition-all"
                >
                  {submitting ? 'Updating…' : 'Update password'}
                </button>
              </form>

              <div className="mt-6 border-t border-black/20 pt-4 text-center">
                <Link
                  to="/login"
                  className="text-[12px] font-bold opacity-50 hover:opacity-100 hover:underline transition-opacity"
                >
                  Back to login
                </Link>
              </div>
            </div>
          )}
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default ResetPasswordPage;
