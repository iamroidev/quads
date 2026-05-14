import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Check, ArrowLeft } from 'lucide-react';
import { supabase } from '../services/supabase';
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
    <div className="min-h-screen w-full bg-[var(--bulletin-bg)] flex flex-col items-center justify-center p-6 font-sans selection:bg-black selection:text-white">
      {/* ── Background Branding ── */}
      <div className="fixed top-12 left-12 opacity-5 pointer-events-none select-none hidden lg:block">
        <h1 className="text-[200px] font-black uppercase leading-none tracking-tighter">QUADS</h1>
      </div>

      {/* ── Independent Back Button ── */}
      <Link 
        to="/login" 
        className="fixed top-8 left-8 flex items-center gap-2 border-4 border-black bg-white px-5 py-3 text-[11px] font-black uppercase tracking-widest shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all z-50 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Return to Login
      </Link>

      <div className="max-w-md w-full relative">
        {/* Decorative Tape */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-8 w-40 bg-[#ffd700]/60 rotate-[-1deg] z-10 shadow-sm" />
        
        {done ? (
          /* ── SUCCESS CARD ── */
          <div 
            className="border-4 border-black bg-[#e0f2f7] dark:bg-sky-900/40 p-12 shadow-[16px_16px_0_0_var(--bulletin-shadow)] text-center relative overflow-hidden"
            style={{ transform: 'rotate(-0.8deg)' }}
          >
            <div className="absolute top-0 right-0 h-24 w-24 bg-white/10 rotate-45 translate-x-12 -translate-y-12" />
            <div className="mb-8 flex justify-center">
              <div className="h-20 w-20 rounded-full border-4 border-black bg-white flex items-center justify-center shadow-[4px_4px_0_0_black]">
                <Check className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-black mb-4">Verified.</h2>
            <p className="text-[14px] font-bold opacity-60 text-black mb-10 leading-relaxed">
              Security update successful. <br />The board will now redirect you to the entrance.
            </p>
            <Link
              to="/login"
              className="inline-block w-full border-4 border-black bg-black px-10 py-5 text-[12px] font-black uppercase tracking-widest text-white shadow-[6px_6px_0_0_rgba(0,0,0,0.2)] hover:bg-[#fffacd] hover:text-black transition-all"
            >
              Proceed Now →
            </Link>
          </div>
        ) : (
          /* ── RESET FORM CARD ── */
          <div 
            className="border-4 border-black bg-[var(--bulletin-card)] p-10 md:p-14 shadow-[20px_20px_0_0_var(--bulletin-shadow)] relative"
            style={{ transform: 'rotate(0.5deg)' }}
          >
            {/* Thumbtack */}
            <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-red-600 border-2 border-black shadow-inner">
               <div className="absolute top-1 left-1 h-1.5 w-1.5 rounded-full bg-white/40" />
            </div>

            <div className="mb-10">
              <div className="inline-block border-2 border-black px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] mb-4 text-[var(--bulletin-text)]">
                Security Protocol
              </div>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-[var(--bulletin-text)] leading-none">New Secret.</h1>
              <p className="mt-4 text-[14px] font-bold opacity-60 text-[var(--bulletin-text)] leading-tight">
                Authorize a new security key to regain access to the QUADS network.
              </p>
            </div>

            {!sessionReady && (
              <div className="mb-8 border-4 border-black bg-[#fffacd] dark:bg-yellow-900/20 px-4 py-3 text-[11px] font-black uppercase tracking-tight text-black dark:text-yellow-200 animate-pulse">
                ⏳ Waiting for auth session...
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* New Password */}
              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 text-[var(--bulletin-text)]">
                  New Security Key
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 h-5 w-5 opacity-30 group-focus-within:opacity-100 transition-opacity text-[var(--bulletin-text)]" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    className="w-full border-4 border-black bg-[var(--bulletin-bg)] p-5 pl-14 pr-14 text-[15px] font-black focus:outline-none focus:ring-0 placeholder:opacity-20 text-[var(--bulletin-text)]"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-5 text-[var(--bulletin-text)] opacity-40 hover:opacity-100"
                  >
                    {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <div className="mt-3 border-2 border-black bg-[#ff6b6b] text-white px-4 py-2 text-[10px] font-black uppercase tracking-tight">
                    {errors.password.message}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 text-[var(--bulletin-text)]">
                  Confirm Key
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 h-5 w-5 opacity-30 group-focus-within:opacity-100 transition-opacity text-[var(--bulletin-text)]" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat key"
                    className="w-full border-4 border-black bg-[var(--bulletin-bg)] p-5 pl-14 pr-14 text-[15px] font-black focus:outline-none focus:ring-0 placeholder:opacity-20 text-[var(--bulletin-text)]"
                    {...register('confirm')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    className="absolute right-5 text-[var(--bulletin-text)] opacity-40 hover:opacity-100"
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirm && (
                  <div className="mt-3 border-2 border-black bg-[#ff6b6b] text-white px-4 py-2 text-[10px] font-black uppercase tracking-tight">
                    {errors.confirm.message}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !sessionReady}
                className="w-full border-4 border-black bg-black px-10 py-6 text-[13px] font-black uppercase tracking-[0.2em] text-white shadow-[8px_8px_0_0_rgba(255,107,107,0.5)] hover:bg-[#ff6b6b] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-10 disabled:grayscale"
              >
                {submitting ? 'Updating Core...' : 'Authorize Reset'}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t-4 border-black/5 text-center">
               <p className="text-[11px] font-bold opacity-40 text-[var(--bulletin-text)]">
                 Need assistance? Contact <a href="mailto:support@quads.edu.gh" className="underline font-black hover:opacity-100 transition-opacity">Network Ops</a>
               </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer Branding ── */}
      <div className="fixed bottom-8 text-[10px] font-black uppercase tracking-[0.5em] opacity-20 pointer-events-none">
        QUADS SECURITY SUBSYSTEM · VER 4.0.2
      </div>
    </div>
  );
};

export default ResetPasswordPage;
