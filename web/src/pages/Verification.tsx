import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import verificationService from '../services/verification.service';
import toast from 'react-hot-toast';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';
import { ShieldCheck, ShieldOff, Mail, Phone, Check, Loader2 } from 'lucide-react';

const fieldBase = 'w-full border border-black bg-[#fefdfb] px-4 py-3 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-black placeholder:text-black/30';

type VerifyMethod = 'email' | 'phone';
type Step = 'select' | 'enter_code';

const VerificationPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [method, setMethod] = useState<VerifyMethod>('email');
  const [step, setStep] = useState<Step>('select');

  // Email fields
  const [email, setEmail] = useState(user?.email || '');
  // Phone fields
  const [phone, setPhone] = useState(user?.phone || '');
  // Code fields
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  // UI state
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showForm, setShowForm] = useState(true);

  // Auto-hide form if everything verified
  useEffect(() => {
    if (user?.emailVerified && user?.phoneVerified) {
      setShowForm(false);
    }
  }, [user]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (method === 'email' && !email.trim()) {
      toast.error('Enter your email address');
      return;
    }
    if (method === 'phone' && !phone.trim()) {
      toast.error('Enter your phone number');
      return;
    }

    setSending(true);
    try {
      if (method === 'email') {
        await verificationService.sendEmailOTP(email.trim());
      } else {
        await verificationService.sendPhoneOTP(phone.trim());
      }
      setSent(true);
      setStep('enter_code');
      setCountdown(60);
      toast.success(`Code sent to your ${method === 'email' ? 'email' : 'phone'}!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send code');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setCodeError('Enter the 6-digit code');
      return;
    }
    setCodeError('');
    setVerifying(true);
    try {
      await verificationService.verifyCode(code, method);
      toast.success(method === 'email' ? 'Email verified!' : 'Phone verified!');
      await refreshUser();
      setCode('');
      setStep('select');
      setSent(false);
    } catch (err: any) {
      setCodeError(err.response?.data?.message || err.message || 'Invalid code');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = () => {
    if (countdown > 0) return;
    handleSendCode();
  };

  const changeMethod = (m: VerifyMethod) => {
    setMethod(m);
    setStep('select');
    setCode('');
    setCodeError('');
    setSent(false);
    setCountdown(0);
  };

  const emailVerified = user?.emailVerified;
  const phoneVerified = user?.phoneVerified;
  const isVerified = user?.isVerified;

  // Already fully verified
  if (!showForm) {
    return (
      <BulletinLayout title="Verification" subtitle="Trust & Safety" section="10">
        <BulletinSection bgColor="bg-[#faf8f5]">
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
              <ShieldCheck className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You're all verified!</h2>
            <p className="text-[13px] opacity-60 mb-6">
              Both your email and phone are verified. You have full access to all features.
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="border border-black bg-black px-6 py-2 text-[11px] font-bold uppercase text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-colors"
            >
              Back to Profile
            </button>
          </div>
        </BulletinSection>
      </BulletinLayout>
    );
  }

  return (
    <BulletinLayout title="Verification" subtitle="Trust & Safety" section="10">
      <BulletinSection bgColor="bg-[#faf8f5]">
        <div className="max-w-lg mx-auto">
          {/* Back button at the top */}
          <button
            onClick={() => navigate('/profile')}
            className="mb-6 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-black opacity-60 hover:opacity-100 transition-opacity"
          >
            ← Back to Profile
          </button>

          {/* Status cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className={`border p-4 ${emailVerified ? 'border-emerald-400 bg-emerald-50' : 'border-black/20 bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <Mail className={`h-5 w-5 ${emailVerified ? 'text-emerald-600' : 'opacity-40'}`} />
                {emailVerified ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ShieldOff className="h-4 w-4 text-black/30" />
                )}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider">Email</div>
              <div className={`text-[12px] mt-1 ${emailVerified ? 'text-emerald-700' : 'opacity-50'}`}>
                {emailVerified ? 'Verified' : 'Not verified'}
              </div>
              {!emailVerified && (
                <button
                  onClick={() => changeMethod('email')}
                  className={`mt-2 text-[10px] font-bold uppercase underline ${method === 'email' ? 'text-black' : 'opacity-50 hover:opacity-100'}`}
                >
                  {method === 'email' ? 'Selected' : 'Verify'}
                </button>
              )}
            </div>
            <div className={`border p-4 ${phoneVerified ? 'border-emerald-400 bg-emerald-50' : 'border-black/20 bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <Phone className={`h-5 w-5 ${phoneVerified ? 'text-emerald-600' : 'opacity-40'}`} />
                {phoneVerified ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ShieldOff className="h-4 w-4 text-black/30" />
                )}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider">Phone</div>
              <div className={`text-[12px] mt-1 ${phoneVerified ? 'text-emerald-700' : 'opacity-50'}`}>
                {phoneVerified ? 'Verified' : 'Not verified'}
              </div>
              {!phoneVerified && (
                <button
                  onClick={() => changeMethod('phone')}
                  className={`mt-2 text-[10px] font-bold uppercase underline ${method === 'phone' ? 'text-black' : 'opacity-50 hover:opacity-100'}`}
                >
                  {method === 'phone' ? 'Selected' : 'Verify'}
                </button>
              )}
            </div>
          </div>

          {/* Verify method cards */}
          {method === 'email' && !emailVerified && step === 'select' && (
            <div className="border border-black bg-white p-6">
              <h3 className="text-lg font-bold mb-1">Verify your email</h3>
              <p className="text-[12px] opacity-60 mb-4">
                We'll send a 6-digit code to your email. If you have a <strong>@st.umat.edu.gh</strong> email, it proves you're a UMaT student.
              </p>
              <input
                type="email"
                placeholder="you@example.com or you@st.umat.edu.gh"
                className={fieldBase}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                onClick={handleSendCode}
                disabled={sending || !email.trim()}
                className="mt-4 w-full border border-black bg-black px-6 py-3 text-[11px] font-bold uppercase text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-colors disabled:opacity-40"
              >
                {sending ? <><Loader2 className="inline-block h-3.5 w-3.5 animate-spin mr-1" /> Sending...</> : 'Send verification code'}
              </button>
            </div>
          )}

          {method === 'phone' && !phoneVerified && step === 'select' && (
            <div className="border border-black bg-white p-6">
              <h3 className="text-lg font-bold mb-1">Verify your phone</h3>
              <p className="text-[12px] opacity-60 mb-4">
                AWS SNS SMS will send a 6-digit code to your phone. Standard SMS rates apply.
              </p>
              <input
                type="tel"
                placeholder="0XX XXX XXXX"
                className={fieldBase}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button
                onClick={handleSendCode}
                disabled={sending || !phone.trim()}
                className="mt-4 w-full border border-black bg-black px-6 py-3 text-[11px] font-bold uppercase text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-colors disabled:opacity-40"
              >
                {sending ? <><Loader2 className="inline-block h-3.5 w-3.5 animate-spin mr-1" /> Sending...</> : 'Send verification code'}
              </button>
            </div>
          )}

          {/* Code entry step */}
          {step === 'enter_code' && (
            <div className="border border-black bg-white p-6">
              <h3 className="text-lg font-bold mb-1">Enter the code</h3>
              <p className="text-[12px] opacity-60 mb-4">
                A 6-digit code was sent to your {method === 'email' ? 'email' : 'phone'}. It expires in 10 minutes.
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className={`${fieldBase} text-center text-2xl tracking-[0.5em]`}
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(val);
                  setCodeError('');
                }}
              />
              {codeError && <p className="mt-1 text-[11px] text-red-600 font-bold">{codeError}</p>}
              <button
                onClick={handleVerifyCode}
                disabled={verifying || code.length !== 6}
                className="mt-4 w-full border border-black bg-black px-6 py-3 text-[11px] font-bold uppercase text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-colors disabled:opacity-40"
              >
                {verifying ? <><Loader2 className="inline-block h-3.5 w-3.5 animate-spin mr-1" /> Verifying...</> : 'Verify code'}
              </button>
              <div className="mt-4 flex flex-col items-center gap-3">
                <button
                  onClick={handleResend}
                  disabled={countdown > 0 || sending}
                  className="text-[11px] font-bold underline opacity-60 hover:opacity-100 disabled:opacity-30"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                </button>
                <button
                  onClick={() => {
                    setStep('select');
                    setCode('');
                  }}
                  className="text-[11px] font-bold uppercase tracking-wider opacity-40 hover:opacity-100"
                >
                  Change {method === 'email' ? 'Email' : 'Phone Number'}
                </button>
              </div>
            </div>
          )}

          {/* Already verified but not fully */}
          {((method === 'email' && emailVerified) || (method === 'phone' && phoneVerified)) && step === 'select' && (
            <div className="border border-emerald-400 bg-emerald-50 p-6 text-center">
              <Check className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-[13px] font-bold text-emerald-800">
                Your {method === 'email' ? 'email' : 'phone'} is already verified!
              </p>
              <p className="text-[12px] text-emerald-600 mt-1">
                {!emailVerified && 'Verify your email too for full access.'}
                {!phoneVerified && 'Verify your phone too for full access.'}
              </p>
            </div>
          )}

          {/* Verification info */}
          <div className="mt-6 border border-black/20 bg-white/50 p-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-2">Why verify?</h4>
            <ul className="space-y-1.5 text-[12px] opacity-70">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Email verification confirms you're a real UMaT student (use @st.umat.edu.gh).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Phone verification adds an extra layer of trust for buyers and sellers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Sellers must verify at least one method before listing items.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Verified users get a badge, building trust in the campus community.</span>
              </li>
            </ul>
          </div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default VerificationPage;