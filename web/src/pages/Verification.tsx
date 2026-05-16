import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import verificationService from '../services/verification.service';
import { setupRecaptcha, sendOtp, resetRecaptcha } from '../services/firebase';
import { ConfirmationResult } from 'firebase/auth';
import toast from 'react-hot-toast';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';
import { ShieldCheck, ShieldOff, Mail, Phone, Check, Loader2, ArrowRight, Smartphone, Lock } from 'lucide-react';

const fieldBase = 'w-full border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] px-4 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] shadow-[4px_4px_0_0_var(--bulletin-shadow)] text-[var(--bulletin-text)] placeholder:text-[var(--bulletin-text)] placeholder:opacity-30';

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
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = async (overrideMethod?: VerifyMethod) => {
    const activeMethod = overrideMethod || method;
    
    if (activeMethod === 'email' && !email.trim()) {
      toast.error('Enter your email address');
      return;
    }
    if (activeMethod === 'phone' && !phone.trim()) {
      toast.error('Enter your phone number');
      return;
    }

    setSending(true);
    try {
      if (activeMethod === 'email') {
        await verificationService.sendEmailOTP(email.trim());
      } else {
        // Firebase Phone Auth
        const appVerifier = setupRecaptcha('recaptcha-container');
        
        // Ensure Ghana country code if not present
        let formattedPhone = phone.trim();
        if (!formattedPhone.startsWith('+')) {
          if (formattedPhone.startsWith('0')) {
            formattedPhone = '+233' + formattedPhone.substring(1);
          } else {
            formattedPhone = '+233' + formattedPhone;
          }
        }
        
        const result = await sendOtp(formattedPhone, appVerifier);
        setConfirmationResult(result);
      }
      setSent(true);
      setStep('enter_code');
      setCountdown(60);
      toast.success(`Code sent to your ${activeMethod === 'email' ? 'email' : 'phone'}!`);
    } catch (err: any) {
      console.error('Send error:', err);
      
      let errorMessage = err.response?.data?.message || err.message || 'Failed to send code';
      
      // Friendly check for common Firebase setup errors
      if (errorMessage.includes('billing-not-enabled')) {
        errorMessage = 'Phone verification is currently in maintenance. Please use Email verification for now.';
        console.warn('CRITICAL: Firebase Phone Auth requires Blaze Plan to be enabled in Firebase Console.');
      }

      toast.error(errorMessage);
      
      if (activeMethod === 'phone') {
        resetRecaptcha('recaptcha-container');
      }
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
      if (method === 'email') {
        await verificationService.verifyCode(code, 'email');
      } else {
        if (!confirmationResult) {
          throw new Error('No verification session found. Please resend code.');
        }
        // Verify with Firebase
        const result = await confirmationResult.confirm(code);
        const idToken = await result.user.getIdToken();
        
        // Finalize with our backend
        await verificationService.verifyFirebasePhone(idToken);
      }
      
      toast.success(method === 'email' ? 'Email verified!' : 'Phone verified!');
      await refreshUser();
      setCode('');
      setStep('select');
      setSent(false);
    } catch (err: any) {
      console.error('Verify error:', err);
      setCodeError(err.response?.data?.message || err.message || 'Invalid code');
    } finally {
      setVerifying(false);
    }
  };

  const isVerified = user?.emailVerified && user?.phoneVerified;

  return (
    <BulletinLayout title="Verify Me" subtitle="Security" section="05">
      {/* Dark Banner with Status */}
      <div className="border-b-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] relative overflow-hidden">
        {/* Subtle background pattern/tape */}
        <div className="absolute -top-4 -right-10 h-12 w-40 bg-[#ffd700]/10 rotate-[12deg]" />

        <div className="mx-auto max-w-[1400px] px-6 py-12 md:py-20 relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className={`p-4 border-2 border-[var(--bulletin-text)] ${isVerified ? 'bg-emerald-500 shadow-[4px_4px_0_0_var(--bulletin-text)]' : 'bg-red-500 animate-pulse shadow-[4px_4px_0_0_var(--bulletin-text)]'}`}>
                  {isVerified ? <ShieldCheck className="h-8 w-8 text-[var(--bulletin-bg)]" /> : <ShieldOff className="h-8 w-8 text-[var(--bulletin-bg)]" />}
                </div>
                <div className="text-[12px] font-black uppercase tracking-[0.4em] text-[var(--bulletin-text)] opacity-60">Verification</div>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-[var(--bulletin-text)] uppercase tracking-tighter leading-none mb-6">
                {isVerified ? "You're all set" : 'Action Required'}
              </h1>
              <p className="max-w-md text-lg text-[var(--bulletin-text)] opacity-70 font-bold leading-relaxed">
                Verify your account to unlock higher transaction limits, faster payouts, and the trusted "Verified Seller" badge.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="border-4 border-[var(--bulletin-border)] p-6 bg-[var(--bulletin-text)] shadow-[8px_8px_0_0_var(--bulletin-bg)]" style={{ transform: 'rotate(-1deg)' }}>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 border-2 border-[var(--bulletin-bg)]/20 bg-[var(--bulletin-bg)]/5">
                    <Mail className="h-5 w-5 text-[var(--bulletin-bg)]" />
                  </div>
                  {user?.emailVerified ? (
                    <span className="text-[10px] font-black uppercase bg-emerald-500 px-3 py-1 text-[var(--bulletin-bg)] border-2 border-[var(--bulletin-bg)] shadow-[2px_2px_0_0_var(--bulletin-bg)]">Active</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase bg-red-500 px-3 py-1 text-[var(--bulletin-bg)] border-2 border-[var(--bulletin-bg)] shadow-[2px_2px_0_0_var(--bulletin-bg)]">Pending</span>
                  )}
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--bulletin-bg)] opacity-60 mb-1">Email Auth</div>
                <div className="text-[var(--bulletin-bg)] font-black text-lg truncate">{user?.email}</div>
              </div>

              <div className="border-4 border-[var(--bulletin-border)] p-6 bg-[var(--bulletin-text)] shadow-[8px_8px_0_0_var(--bulletin-bg)]" style={{ transform: 'rotate(1deg)' }}>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 border-2 border-[var(--bulletin-bg)]/20 bg-[var(--bulletin-bg)]/5">
                    <Smartphone className="h-5 w-5 text-[var(--bulletin-bg)]" />
                  </div>
                  {user?.phoneVerified ? (
                    <span className="text-[10px] font-black uppercase bg-emerald-500 px-3 py-1 text-[var(--bulletin-bg)] border-2 border-[var(--bulletin-bg)] shadow-[2px_2px_0_0_var(--bulletin-bg)]">Active</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase bg-red-500 px-3 py-1 text-[var(--bulletin-bg)] border-2 border-[var(--bulletin-bg)] shadow-[2px_2px_0_0_var(--bulletin-bg)]">Pending</span>
                  )}
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--bulletin-bg)] opacity-60 mb-1">Phone Link</div>
                <div className="text-[var(--bulletin-bg)] font-black text-lg truncate">{user?.phone || 'Not linked'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-6 text-[var(--bulletin-text)]">Why verify?</h2>
            <div className="space-y-8">
              {[
                { title: 'Trust Score', desc: 'Buyers prefer verified sellers by a ratio of 4:1.', icon: <Check className="h-5 w-5" /> },
                { title: 'Safety First', desc: 'Ensures all marketplace participants are UMaT community members.', icon: <Check className="h-5 w-5" /> },
                { title: 'Faster Payouts', desc: 'Verified accounts bypass standard 48-hour holding periods.', icon: <Check className="h-5 w-5" /> }
              ].map((item) => (
                <div key={item.title} className="flex gap-4 items-start">
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase text-[var(--bulletin-text)]">{item.title}</h3>
                    <p className="text-[12px] font-bold opacity-60 leading-relaxed mt-1 text-[var(--bulletin-text)]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-8 border-4 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/40 shadow-[8px_8px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(-1deg)' }}>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-5 w-5 text-[var(--bulletin-text)]" />
                <span className="text-[12px] font-black uppercase tracking-[0.2em] text-[var(--bulletin-text)]">Privacy</span>
              </div>
              <p className="text-[12px] font-bold leading-relaxed opacity-80 text-[var(--bulletin-text)]">
                Your verification data is encrypted and never shared with third parties or other users.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            {!isVerified ? (
              <BulletinCard bgColor="bg-[var(--bulletin-card)]" className="p-8 md:p-12 border-4 border-[var(--bulletin-border)] shadow-[12px_12px_0_0_var(--bulletin-shadow)]">
                {step === 'select' ? (
                  <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-10 text-[var(--bulletin-text)]">Choose Method</h2>
                    <div className="grid gap-8 sm:grid-cols-2">
                      <button
                        disabled={user?.emailVerified}
                        onClick={() => { setMethod('email'); handleSendCode('email'); }}
                        className={`group relative flex flex-col items-start border-4 border-[var(--bulletin-border)] p-8 text-left transition-all ${user?.emailVerified ? 'opacity-50 cursor-not-allowed bg-[var(--bulletin-bg)]' : 'bg-[var(--bulletin-card)] hover:-translate-y-2 hover:shadow-[8px_8px_0_0_var(--bulletin-shadow)] shadow-[4px_4px_0_0_var(--bulletin-shadow)]'
                          }`}
                      >
                        <Mail className="mb-6 h-10 w-10 text-[var(--bulletin-text)]" />
                        <div className="text-[11px] font-black uppercase tracking-widest opacity-40 mb-2 text-[var(--bulletin-text)]">Method 01</div>
                        <div className="text-2xl font-black uppercase text-[var(--bulletin-text)]">Email OTP</div>
                        <div className="mt-2 text-[12px] font-bold opacity-60 text-[var(--bulletin-text)]">Send code to {user?.email}</div>
                        {user?.emailVerified && (
                          <div className="absolute top-4 right-4 bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-3 py-1 text-[9px] font-black uppercase tracking-widest">Verified</div>
                        )}
                      </button>

                      <button
                        disabled={user?.phoneVerified}
                        onClick={() => { setMethod('phone'); handleSendCode('phone'); }}
                        className={`group relative flex flex-col items-start border-4 border-[var(--bulletin-border)] p-8 text-left transition-all ${user?.phoneVerified ? 'opacity-50 cursor-not-allowed bg-[var(--bulletin-bg)]' : 'bg-[var(--bulletin-card)] hover:-translate-y-2 hover:shadow-[8px_8px_0_0_var(--bulletin-shadow)] shadow-[4px_4px_0_0_var(--bulletin-shadow)]'
                          }`}
                      >
                        <Smartphone className="mb-6 h-10 w-10 text-[var(--bulletin-text)]" />
                        <div className="text-[11px] font-black uppercase tracking-widest opacity-40 mb-2 text-[var(--bulletin-text)]">Method 02</div>
                        <div className="text-2xl font-black uppercase text-[var(--bulletin-text)]">SMS Code</div>
                        <div className="mt-2 text-[12px] font-bold opacity-60 text-[var(--bulletin-text)]">Send code to your phone</div>
                        {user?.phoneVerified && (
                          <div className="absolute top-4 right-4 bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-3 py-1 text-[9px] font-black uppercase tracking-widest">Verified</div>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-10 flex items-center justify-between border-b-2 border-[var(--bulletin-border)] pb-6">
                      <div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-[var(--bulletin-text)]">Enter Code</h2>
                        <p className="text-[14px] font-bold opacity-60 mt-2 text-[var(--bulletin-text)]">Sent to your {method === 'email' ? 'email' : 'phone'}</p>
                      </div>
                      <button onClick={() => setStep('select')} className="text-[11px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4 hover:no-underline text-[var(--bulletin-text)]">
                        Change Method
                      </button>
                    </div>

                    <div className="max-w-sm">
                      <div className="mb-8">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 block mb-3 text-[var(--bulletin-text)]">6-Digit OTP</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                          className={`${fieldBase} text-2xl tracking-[0.5em] text-center font-mono`}
                          placeholder="000000"
                        />
                        {codeError && <p className="mt-3 text-[12px] font-black text-red-600 uppercase tracking-widest">{codeError}</p>}
                      </div>

                      <button
                        disabled={verifying || code.length !== 6}
                        onClick={handleVerifyCode}
                        className="w-full border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] py-4 text-[14px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] shadow-[6px_6px_0_0_var(--bulletin-shadow)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none disabled:opacity-40"
                      >
                        {verifying ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : 'Verify Me'}
                      </button>

                      <div className="mt-8 flex items-center justify-between border-t-2 border-[var(--bulletin-border)] pt-6">
                        <span className="text-[12px] font-black opacity-40 uppercase tracking-widest text-[var(--bulletin-text)]">Didn't get it?</span>
                        <button
                          disabled={countdown > 0}
                          onClick={() => handleSendCode()}
                          className={`text-[12px] font-black uppercase tracking-widest text-[var(--bulletin-text)] ${countdown > 0 ? 'opacity-30' : 'underline decoration-2 underline-offset-4'}`}
                        >
                          {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </BulletinCard>
            ) : (
              <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-16 text-center shadow-[12px_12px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(0.5deg)' }}>
                <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center border-4 border-[var(--bulletin-border)] bg-emerald-500 shadow-[6px_6px_0_0_var(--bulletin-shadow)]">
                  <ShieldCheck className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-5xl font-black uppercase tracking-tighter mb-6 text-[var(--bulletin-text)]">Account Verified</h2>
                <p className="max-w-md mx-auto text-[14px] font-bold opacity-70 leading-relaxed mb-10 text-[var(--bulletin-text)]">
                  Your account has been successfully verified. You now have full access to all marketplace features.
                </p>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-3 border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-8 py-4 text-[12px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--bulletin-shadow)] transition-all"
                >
                  Return to Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
            
            {/* Invisible ReCAPTCHA Container - Moved here to be always in DOM */}
            <div id="recaptcha-container"></div>
          </div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default VerificationPage;