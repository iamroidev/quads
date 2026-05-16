import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Mail, Send, Check, ShieldAlert } from 'lucide-react';
import { supabase } from '../services/supabase';
import BrandMark from '../components/layout/BrandMark';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
});
type FormData = z.infer<typeof schema>;

const fieldBase =
  'w-full border-4 border-black bg-[var(--bulletin-bg)] px-5 py-5 text-[16px] font-black focus:outline-none focus:ring-0 text-[var(--bulletin-text)] placeholder:text-[var(--bulletin-text)] placeholder:opacity-20 shadow-[6px_6px_0_0_var(--bulletin-shadow)]';

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
    <div className="min-h-screen w-full bg-[var(--bulletin-bg)] flex flex-col items-center justify-center p-6 font-mono selection:bg-black selection:text-white overflow-x-hidden">
      
      {/* ── Background Watermark ── */}
      <div className="fixed -bottom-10 -right-10 opacity-[0.03] pointer-events-none select-none hidden lg:block">
        <h1 className="text-[280px] font-black uppercase leading-none tracking-tighter">RECOVER</h1>
      </div>

      {/* ── Standalone Navigation ── */}
      <Link 
        to="/login" 
        className="fixed top-8 left-8 flex items-center gap-3 border-4 border-black bg-white px-6 py-4 text-[12px] font-black uppercase tracking-[0.2em] shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all z-50 group"
      >
        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-2 transition-transform" />
        Back to Login
      </Link>

      <div className="max-w-md w-full relative">
        {/* Decorative Tape at Top */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 h-10 w-48 bg-[#ffd700]/50 rotate-1 z-10 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]" />
        
        {sent ? (
          /* ── SUCCESS STATE CARD ── */
          <div 
            className="border-4 border-black bg-[#fffacd] dark:bg-yellow-900/40 p-12 md:p-16 shadow-[24px_24px_0_0_var(--bulletin-shadow)] text-center relative overflow-hidden"
            style={{ transform: 'rotate(-1.5deg)' }}
          >
            <div className="absolute top-0 right-0 h-32 w-32 bg-black/5 rotate-45 translate-x-16 -translate-y-16" />
            
            <div className="mb-10 flex justify-center">
              <div className="h-24 w-24 rounded-full border-4 border-black bg-white flex items-center justify-center shadow-[6px_6px_0_0_black]">
                <Check className="h-12 w-12 text-green-600" />
              </div>
            </div>

            <div className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 mb-4 text-black dark:text-yellow-200">Done</div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-yellow-200 mb-6 leading-none">Check<br/>Your Inbox.</h1>
            
            <p className="text-[14px] font-bold opacity-70 text-black dark:text-yellow-200 mb-8 leading-relaxed">
              We've sent a reset link to:<br/>
              <span className="inline-block mt-3 border-2 border-black bg-white/50 px-3 py-1 font-black text-black">
                {getValues('email')}
              </span>
            </p>

            <div className="bg-black/5 border-2 border-dashed border-black/20 p-4 mb-10 text-[11px] font-bold text-black/60 italic">
              "The link will remain active for exactly 60 minutes. Check your spam folder if the link hasn't arrived."
            </div>

            <Link
              to="/login"
              className="inline-block w-full border-4 border-black bg-black px-8 py-5 text-[12px] font-black uppercase tracking-widest text-white shadow-[8px_8px_0_0_rgba(0,0,0,0.2)] hover:bg-white hover:text-black transition-all"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          /* ── FORM STATE CARD ── */
          <div 
            className="border-4 border-black bg-[var(--bulletin-card)] p-10 md:p-14 shadow-[24px_24px_0_0_var(--bulletin-shadow)] relative"
            style={{ transform: 'rotate(0.8deg)' }}
          >
            {/* Red Thumbtack */}
            <div className="absolute top-6 right-6 h-8 w-8 rounded-full bg-red-600 border-4 border-black shadow-inner z-20 flex items-center justify-center">
               <div className="h-2 w-2 rounded-full bg-white/40" />
            </div>

            <div className="mb-12">
              <div className="flex items-center gap-3 mb-8">
                <BrandMark className="h-8 w-8" />
                <span className="text-[12px] font-black uppercase tracking-[0.3em] opacity-40">QUADS</span>
              </div>
              
              <h1 className="text-5xl font-black uppercase tracking-tighter text-[var(--bulletin-text)] leading-none mb-6">Forgot Password?</h1>
              <p className="text-[14px] font-bold opacity-60 text-[var(--bulletin-text)] leading-tight">
                Enter your student email to receive a password reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              <div className="group">
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-4 text-[var(--bulletin-text)]">
                  Your Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-5 h-6 w-6 opacity-20 group-focus-within:opacity-100 transition-opacity text-[var(--bulletin-text)]" />
                  <input
                    type="email"
                    placeholder="you@student.umat.edu.gh"
                    autoComplete="email"
                    className={`${fieldBase} pl-16`}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <div className="mt-4 border-2 border-black bg-[#ff6b6b] text-white px-4 py-2 text-[11px] font-black uppercase tracking-tight shadow-[4px_4px_0_0_black]">
                    <ShieldAlert className="inline-block h-4 w-4 mr-2 -mt-0.5" />
                    {errors.email.message}
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="border-4 border-black bg-[#ff6b6b] text-white px-5 py-4 text-[12px] font-black uppercase tracking-tight shadow-[6px_6px_0_0_black]">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full border-4 border-black bg-black px-10 py-6 text-[14px] font-black uppercase tracking-[0.2em] text-white shadow-[10px_10px_0_0_rgba(255,107,107,0.5)] hover:bg-[#ff6b6b] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all disabled:opacity-20 disabled:grayscale"
              >
                {submitting ? 'Sending...' : 'Send Reset Link'}
                {!submitting && <Send className="inline-block h-5 w-5 ml-3" />}
              </button>
            </form>

            <div className="mt-14 pt-8 border-t-4 border-black/5 flex flex-col gap-4">
               <Link to="/login" className="text-[12px] font-black uppercase tracking-widest text-center opacity-40 hover:opacity-100 hover:underline transition-all underline-offset-8">
                 Nevermind, I remembered it
               </Link>
               <p className="text-[10px] font-bold opacity-30 text-center uppercase tracking-widest mt-4">
                 System: Recover Sub-routine · PRT-092
               </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Fixed Footer ── */}
      <div className="fixed bottom-10 left-10 text-[10px] font-black uppercase tracking-[0.5em] opacity-10 pointer-events-none hidden md:block">
        QUADS SECURITY
      </div>
    </div>
  );
};

export default ForgotPasswordPage;