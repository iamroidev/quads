import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '../services/supabase';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
});
type FormData = z.infer<typeof schema>;

const fieldBase =
  'w-full border border-black bg-[#fefdfb] px-4 py-3 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-black placeholder:text-black/30';

const ForgotPasswordPage: React.FC = () => {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        data.email.toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BulletinLayout title="Reset Password" subtitle="Account" section="00">
      <BulletinSection bgColor="bg-[#faf8f5]">
        <div className="mx-auto max-w-sm py-8">
          {sent ? (
            /* ── Success state ── */
            <div
              className="border border-black bg-[#fffacd] p-8 shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-center"
              style={{ transform: 'rotate(-0.5deg)' }}
            >
              {/* Tape effect */}
              <div className="absolute -top-2 left-1/2 h-4 w-20 -translate-x-1/2 bg-[#ffd700]/40" />
              <div className="text-[10px] font-bold uppercase tracking-[3px] opacity-50 mb-3">
                📬 Check your inbox
              </div>
              <h1 className="text-2xl font-bold mb-3">Reset link sent</h1>
              <p className="text-[12px] opacity-60 mb-1">
                We emailed a password reset link to:
              </p>
              <p className="text-[13px] font-bold mb-4 border border-black bg-[#fefdfb] px-3 py-1.5 inline-block">
                {getValues('email')}
              </p>
              <p className="text-[11px] opacity-50 mb-6">
                Click the link in the email to set a new password. The link expires in 1 hour.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 border border-black bg-black px-5 py-2.5 text-[11px] font-bold uppercase text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to login
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <div className="border border-black bg-[#fefdfb] p-8 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <div className="mb-6 border-b border-black pb-4">
                <div className="text-[10px] font-bold uppercase tracking-[3px] opacity-50 mb-1">
                  Account recovery
                </div>
                <h1 className="text-2xl font-bold">Forgot your password?</h1>
                <p className="text-[12px] opacity-60 mt-2">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">
                    Email address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 h-4 w-4 opacity-30 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoFocus
                      className={`${fieldBase} pl-10`}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-[11px] font-bold border border-black bg-[#fce4ec] px-2 py-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {errorMsg && (
                  <div className="border border-black bg-[#fce4ec] px-3 py-2 text-[11px] font-bold">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full border border-black bg-black px-6 py-3 text-[11px] font-bold uppercase text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black disabled:opacity-40 transition-all"
                >
                  {submitting ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <div className="mt-6 border-t border-black/20 pt-4 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold opacity-50 hover:opacity-100 hover:underline transition-opacity"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
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

export default ForgotPasswordPage;
