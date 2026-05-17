import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Check, ArrowRight, Scissors, Pin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import BrandMark from '../components/layout/BrandMark';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    role: z.enum(['buyer', 'seller']),
    studentId: z.string().optional(),
    department: z.string().min(2, 'Please enter your program of study'),
    residenceHall: z.string().min(2, 'Please enter your residence hall/hostel'),
    currentLevel: z.string().min(1, 'Please enter your academic level or status'),
    location: z.string().optional(),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to the Terms and Privacy Policy' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;
type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
  1: 'Role',
  2: 'Account',
  3: 'Campus',
  4: 'Password',
};

const fieldBase = 'w-full border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] px-4 py-4 text-[16px] font-black focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] text-[var(--bulletin-text)] placeholder:text-[var(--bulletin-text)] placeholder:opacity-30 shadow-[4px_4px_0_0_var(--bulletin-shadow)]';

const selectBase = 'w-full border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] px-4 py-4 text-[16px] font-black focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] text-[var(--bulletin-text)] appearance-none shadow-[4px_4px_0_0_var(--bulletin-shadow)] bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%224%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")] bg-[length:16px] bg-[right_16px_center] bg-no-repeat';

/* Scattered note on the cork board */
const ScatteredNote: React.FC<{
  bg: string;
  rotation: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  w?: string;
  tapeColor?: string;
  children: React.ReactNode;
}> = ({ bg, rotation, children, top, left, right, bottom, w = '150px', tapeColor = '#ffd700' }) => (
  <div
    className={`absolute border-4 border-[var(--bulletin-bg)] ${bg} shadow-[8px_8px_0_0_rgba(255,255,255,0.1)] p-4`}
    style={{ transform: `rotate(${rotation}deg)`, top, left, right, bottom, width: w }}
  >
    {/* Tape */}
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-20 opacity-50"
      style={{ background: tapeColor, transform: 'translateX(-50%) rotate(-1deg)' }} />
    {children}
  </div>
);

/* String line decoration */
const StringLine: React.FC<{ from: string; to: string }> = ({ from, to }) => {
  const [x1, y1] = from.split(',').map(Number);
  const [x2, y2] = to.split(',').map(Number);
  const len = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
  const angle = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;
  return (
    <div className="absolute pointer-events-none hidden md:block"
      style={{
        left: x1, top: y1,
        width: len,
        height: 2,
        background: 'linear-gradient(90deg, var(--bulletin-text) 50%, transparent 50%)',
        backgroundSize: '12px 2px',
        transform: `rotate(${angle}deg)`,
        transformOrigin: '0 0',
        opacity: 0.15
      }}
    />
  );
};

const RegisterPage: React.FC = () => {
  const { user, register: registerUser, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize step from sessionStorage if available
  const [step, setStep] = useState<Step>(() => {
    const saved = sessionStorage.getItem('reg_step');
    return (saved ? Number(saved) : 1) as Step;
  });
  
  const [roleShake, setRoleShake] = useState(false);
  const [protocolAccepted, setProtocolAccepted] = useState(() => {
    return sessionStorage.getItem('reg_protocol') === 'true';
  });

  const isGoogleFlow = searchParams.get('google') === '1';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'buyer' },
  });

  const selectedRole = watch('role');
  const isRoleChosen = selectedRole === 'buyer' || selectedRole === 'seller';

  // Prefill Google data if available OR if user is already logged in (incomplete profile)
  useEffect(() => {
    if (isGoogleFlow) {
      // 1. Try to pre-fill from existing user object (if backend linked them already)
      if (user) {
        if (user.name) setValue('name', user.name);
        if (user.email) setValue('email', user.email);
        if (user.phone) setValue('phone', user.phone);
        if (user.department) setValue('department', user.department);
        if (user.residenceHall) setValue('residenceHall', user.residenceHall);
        if (user.currentLevel) setValue('currentLevel', user.currentLevel);
        if (user.roles?.length > 0) {
           setValue('role', (user.viewMode || user.roles[0]) as any);
        }
      }

      // 2. Fallback to decoding the credential (for first-time signups)
      const cred = sessionStorage.getItem('google_credential');
      if (cred) {
        try {
          const base64Url = cred.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          
          if (payload.name && !watch('name')) setValue('name', payload.name);
          if (payload.email && !watch('email')) setValue('email', payload.email);
        } catch (err) {
          console.error('Failed to decode google credential', err);
        }
      }
    }
  }, [isGoogleFlow, user, setValue]);

  // Auto-jump to the appropriate step if we already have data (for returning users with incomplete profiles)
  useEffect(() => {
    if (isGoogleFlow && user && step === 1) {
      // Step 1: Role
      if (user.roles?.length > 0) {
        // Step 2: Account details (name, email, phone)
        if (user.phone && user.phone.trim().length >= 10) {
          // Step 3: Campus info (department, residenceHall, level)
          if (user.department && user.residenceHall && user.currentLevel) {
            setStep(4);
          } else {
            setStep(3);
          }
        } else {
          setStep(2);
        }
      }
    }
  }, [isGoogleFlow, user, step]);

  // Persist current step and data to handle refreshes
  useEffect(() => {
    sessionStorage.setItem('reg_step', step.toString());
    sessionStorage.setItem('reg_protocol', protocolAccepted.toString());
  }, [step, protocolAccepted]);

  // Handle data persistence - watch is expensive so we could do it on step change
  useEffect(() => {
    const savedData = sessionStorage.getItem('reg_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        Object.entries(parsed).forEach(([key, val]) => {
          if (val) setValue(key as any, val);
        });
      } catch (e) {
        console.error('Failed to parse saved registration data', e);
      }
    }
  }, [setValue]);

  // Update saved data on field changes (debounced or on step change is better, but watch() is simplest for now)
  const formData = watch();
  useEffect(() => {
    sessionStorage.setItem('reg_data', JSON.stringify(formData));
  }, [formData]);

  const goNext = async () => {
    let fields: (keyof RegisterFormData)[] = [];
    if (step === 1) fields = ['role'];
    if (step === 2) fields = ['name', 'email', 'phone'];
    if (step === 3) fields = ['department', 'residenceHall', 'currentLevel'];
    const ok = await trigger(fields);
    if (ok) setStep((s) => (s + 1) as Step);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      if (isGoogleFlow) {
        const googleCredential = sessionStorage.getItem('google_credential');
        if (!googleCredential) {
          toast.error('Google session expired. Please try again.');
          navigate('/register');
          return;
        }
        const { confirmPassword, ...registerData } = data;
        await googleLogin(googleCredential, data.role, registerData as any);
        sessionStorage.removeItem('google_credential');
        sessionStorage.removeItem('reg_step');
        sessionStorage.removeItem('reg_data');
        sessionStorage.removeItem('reg_protocol');
        navigate('/');
        return;
      }

      const ok = await trigger(['password', 'confirmPassword']);
      if (!ok) return;

      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData as any);
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      setIsSubmitting(true);
      try {
        sessionStorage.setItem('google_credential', credentialResponse.credential);
        navigate('/register?google=1');
      } catch (err: any) {
        toast.error(err.message || 'Google sign-in failed');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleLockedGoogleTap = () => {
    if (!protocolAccepted) {
      toast.error('Please accept the Session Protocol first.');
      return;
    }
    if (isRoleChosen) return;
    window.requestAnimationFrame(() => setRoleShake(true));
    setTimeout(() => setRoleShake(false), 360);
    toast('Choose Buy or Sell first to continue with Google.');
  };

  return (
    <div className="relative min-h-screen bg-[#111] font-mono text-[13px] leading-tight overflow-hidden w-full max-w-full">
      
      {/* Cork board texture */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, var(--bulletin-bg) 2px, transparent 2px), radial-gradient(circle at 75% 75%, var(--bulletin-bg) 2px, transparent 2px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top brand bar */}
      <div className="relative z-10 flex items-center justify-between border-b-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-6 py-4 shadow-[0_8px_0_0_var(--bulletin-shadow)]">
        <Link to="/" className="inline-flex items-center gap-3">
          <BrandMark className="h-6 w-6 text-[var(--bulletin-text)]" />
          <span className="text-[12px] font-black uppercase tracking-[0.3em] opacity-60 text-[var(--bulletin-text)]">QUADS</span>
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-[12px] font-black uppercase tracking-[0.2em] opacity-40 text-[var(--bulletin-text)]">Step {step} of 4</span>
          {step > 1 && (
            <button onClick={() => setStep((s) => (s - 1) as Step)} className="text-[12px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4 opacity-60 hover:opacity-100 text-[var(--bulletin-text)]">Back</button>
          )}
        </div>
      </div>

      {/* Scattered notes around the board (hidden on mobile) */}
      <div className="hidden md:block">
        <ScatteredNote bg="bg-[#fffacd] dark:bg-yellow-900" rotation={-4} top="15%" left="8%" w="160px" tapeColor="#ff6b6b">
          <div className="text-[14px] font-black text-black dark:text-yellow-200 uppercase tracking-tighter">📚 Textbooks</div>
          <div className="text-[11px] font-bold opacity-60 mt-1 text-black dark:text-yellow-200">From GHS 15</div>
        </ScatteredNote>

        <ScatteredNote bg="bg-[#e0f2f7] dark:bg-sky-900" rotation={3} top="12%" right="10%" w="150px" tapeColor="#4ecdc4">
          <div className="text-[14px] font-black text-black dark:text-sky-200 uppercase tracking-tighter">📱 Gadgets</div>
          <div className="text-[11px] font-bold opacity-60 mt-1 text-black dark:text-sky-200">Phones, laptops</div>
        </ScatteredNote>

        <ScatteredNote bg="bg-[#fce4ec] dark:bg-red-900" rotation={-2} top="40%" left="5%" w="140px" tapeColor="#a8e6cf">
          <div className="text-[14px] font-black text-black dark:text-red-200 uppercase tracking-tighter">👕 Fashion</div>
          <div className="text-[11px] font-bold opacity-60 mt-1 text-black dark:text-red-200">Campus style</div>
        </ScatteredNote>

        <ScatteredNote bg="bg-[#f0e8f4] dark:bg-purple-900" rotation={5} top="35%" right="6%" w="180px" tapeColor="#ffd93d">
          <div className="text-[14px] font-black text-black dark:text-purple-200 uppercase tracking-tighter">🍔 Food & More</div>
          <div className="text-[11px] font-bold opacity-60 mt-1 text-black dark:text-purple-200">Meal prep, snacks</div>
        </ScatteredNote>

        <ScatteredNote bg="bg-[#fffacd] dark:bg-yellow-900" rotation={-3} bottom="15%" left="8%" w="155px" tapeColor="#ff6b6b">
          <div className="text-[14px] font-black text-black dark:text-yellow-200 uppercase tracking-tighter">🚲 Transport</div>
          <div className="text-[11px] font-bold opacity-60 mt-1 text-black dark:text-yellow-200">Bikes, rides</div>
        </ScatteredNote>

        <ScatteredNote bg="bg-[#e0f2f7] dark:bg-sky-900" rotation={2} bottom="12%" right="10%" w="145px" tapeColor="#4ecdc4">
           <div className="text-[14px] font-black text-black dark:text-sky-200 uppercase tracking-tighter">🏠 Hostels</div>
          <div className="text-[11px] font-bold opacity-60 mt-1 text-black dark:text-sky-200">Furniture, decor</div>
        </ScatteredNote>

        {/* String lines connecting notes */}
        <StringLine from="160,200" to="350,300" />
        <StringLine from="900,180" to="700,350" />
        <StringLine from="120,450" to="300,550" />
      </div>

      {/* Main central pinned form */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] p-6 my-8">
        <div
          className="relative border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-8 md:p-12 shadow-[16px_16px_0_0_rgba(0,0,0,1)] dark:shadow-[16px_16px_0_0_rgba(255,255,255,0.1)] w-full max-w-lg"
          style={{ transform: 'rotate(-0.5deg)' }}
        >
          {/* Large tape across top */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 h-10 w-40 bg-[#ffd700]/50 rotate-1 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]" />
          
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step indicator strip */}
            <div className="flex border-b-4 border-[var(--bulletin-border)] pb-6 mb-8 mt-4">
              {([1, 2, 3, 4] as Step[]).map((s) => (
                <div key={s} className="flex-1 text-center">
                  <div className={`inline-flex h-8 w-8 items-center justify-center border-2 text-[12px] font-black shadow-[2px_2px_0_0_var(--bulletin-shadow)] ${step >= s ? 'border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)]' : 'border-[var(--bulletin-border)]/30 opacity-40 text-[var(--bulletin-text)] bg-transparent shadow-none'}`}>
                    {step > s ? <Check className="h-4 w-4" /> : s}
                  </div>
                  <div className={`mt-3 text-[9px] font-black uppercase tracking-widest text-[var(--bulletin-text)] ${step === s ? '' : 'opacity-40'}`}>{STEP_LABELS[s]}</div>
                </div>
              ))}
            </div>

            {/* STEP 1: Role choice */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {isGoogleFlow && (
                  <div className="mb-6 p-4 border-2 border-[var(--bulletin-border)] bg-[#e0f2f7] dark:bg-sky-900/40 text-[12px] font-bold text-black dark:text-sky-200">
                    <strong>Google account detected.</strong> Choose your role below to complete registration.
                  </div>
                )}
                <div className="mb-8 text-center">
                  <div className="inline-flex items-center gap-2 border-2 border-[var(--bulletin-border)] px-3 py-1 mb-6 bg-[var(--bulletin-bg)] text-[var(--bulletin-text)] shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
                    <Scissors className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Choose your side</span>
                  </div>
                  <h1 className="text-4xl font-black uppercase tracking-tighter text-[var(--bulletin-text)]">I want to...</h1>
                </div>

                <div className={`grid grid-cols-2 gap-0 mb-8 border-4 border-[var(--bulletin-border)] ${roleShake ? 'animate-role-shake' : ''}`}>
                  <button type="button" onClick={() => setValue('role', 'buyer')}
                    className={`relative border-r-4 border-[var(--bulletin-border)] py-12 text-center transition-all ${selectedRole === 'buyer' ? 'bg-[#e0f2f7] dark:bg-sky-900/40' : 'bg-[var(--bulletin-bg)] hover:bg-[#e0f2f7]/50 dark:hover:bg-sky-900/20'}`}>
                    <div className={`text-2xl font-black uppercase tracking-widest ${selectedRole === 'buyer' ? 'text-black dark:text-sky-200' : 'text-[var(--bulletin-text)]'}`}>Buy</div>
                    <div className={`text-[11px] font-bold mt-2 ${selectedRole === 'buyer' ? 'text-black/60 dark:text-sky-200/60' : 'text-[var(--bulletin-text)] opacity-60'}`}>Browse & purchase items</div>
                    {selectedRole === 'buyer' && <div className="absolute top-4 right-4 h-6 w-6 border-2 border-black dark:border-sky-200 bg-black dark:bg-sky-200 text-white dark:text-black text-[12px] font-black flex items-center justify-center">✓</div>}
                  </button>
                  <button type="button" onClick={() => setValue('role', 'seller')}
                    className={`relative py-12 text-center transition-all ${selectedRole === 'seller' ? 'bg-[#fffacd] dark:bg-yellow-900/40' : 'bg-[var(--bulletin-bg)] hover:bg-[#fffacd]/50 dark:hover:bg-yellow-900/20'}`}>
                    <div className={`text-2xl font-black uppercase tracking-widest ${selectedRole === 'seller' ? 'text-black dark:text-yellow-200' : 'text-[var(--bulletin-text)]'}`}>Sell</div>
                    <div className={`text-[11px] font-bold mt-2 ${selectedRole === 'seller' ? 'text-black/60 dark:text-yellow-200/60' : 'text-[var(--bulletin-text)] opacity-60'}`}>List your own items</div>
                    {selectedRole === 'seller' && <div className="absolute top-4 right-4 h-6 w-6 border-2 border-black dark:border-yellow-200 bg-black dark:bg-yellow-200 text-white dark:text-black text-[12px] font-black flex items-center justify-center">✓</div>}
                  </button>
                </div>
                <input type="hidden" {...register('role')} />

                <div className="mb-8 p-5 border-2 border-dashed border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] relative">
                  <div className="absolute -top-3 left-4 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                    SESSION RULES
                  </div>
                  <div className="flex items-start gap-4">
                    <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] shadow-[3px_3px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={protocolAccepted}
                        onChange={(e) => setProtocolAccepted(e.target.checked)}
                        required
                      />
                      <Pin className="h-4 w-4 text-[var(--bulletin-text)] opacity-35 peer-checked:text-[#ff6b6b] peer-checked:fill-[#ff6b6b] peer-checked:opacity-100 peer-checked:rotate-45 transition-all" />
                    </label>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-tight text-[var(--bulletin-text)] leading-tight">
                        I acknowledge the <Link to="/terms" className="underline decoration-2 underline-offset-2">Community Rules</Link> & <Link to="/terms#privacy" className="underline decoration-2 underline-offset-2">Safety Rules</Link> for this session.
                      </p>
                    </div>
                  </div>
                </div>

                <button type="button" onClick={goNext} disabled={!isRoleChosen || !protocolAccepted}
                  className="w-full border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-8 py-5 text-[14px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] shadow-[8px_8px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-[8px_8px_0_0_var(--bulletin-shadow)] transition-all">
                  Continue <ArrowRight className="inline-block h-4 w-4 ml-2" />
                </button>

                {!isGoogleFlow && (
                  <>
                    <div className="flex items-center gap-6 my-8">
                      <div className="flex-1 border-t-2 border-dashed border-[var(--bulletin-border)]/30" />
                      <span className="text-[12px] font-black uppercase tracking-[0.2em] opacity-40 text-[var(--bulletin-text)]">Or</span>
                      <div className="flex-1 border-t-2 border-dashed border-[var(--bulletin-border)]/30" />
                    </div>

                    <div className="flex justify-center">
                      <div onClick={handleLockedGoogleTap} role="button" tabIndex={0}
                        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && (!isRoleChosen || !protocolAccepted)) { e.preventDefault(); handleLockedGoogleTap(); } }}>
                        <div className={`${(!isRoleChosen || !protocolAccepted) ? 'pointer-events-none opacity-45 grayscale' : ''} flex justify-center`}>
                          <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_var(--bulletin-shadow)] transition-all overflow-hidden" style={{ transform: 'rotate(0.5deg)' }}>
                            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google sign-up failed.')} useOneTap={false} shape="rectangular" theme="outline" size="large" text="continue_with" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-10 text-center bg-[#f0e8f4] dark:bg-purple-900/20 p-4 border-2 border-[var(--bulletin-border)] shadow-[4px_4px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(-1deg)' }}>
                  <p className="text-[12px] font-bold text-[var(--bulletin-text)] uppercase tracking-widest">Already have an account? <Link to="/login" className="font-black underline decoration-2 underline-offset-4 hover:no-underline ml-2">Sign in</Link></p>
                </div>
              </div>
            )}

            {/* STEP 2: Account Details */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 text-[var(--bulletin-text)]">Your Details</h1>
                <p className="text-[12px] font-bold opacity-60 mb-8 text-[var(--bulletin-text)]">Fill in your student details.</p>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-[var(--bulletin-text)]">Full name</label>
                    <input type="text" placeholder="Kwame Asante" autoComplete="name" className={fieldBase} {...register('name')} readOnly={isGoogleFlow} />
                    {errors.name && <p className="mt-2 text-[12px] text-red-600 font-black uppercase tracking-widest">{errors.name.message}</p>}
                    {isGoogleFlow && <p className="mt-2 text-[9px] font-bold opacity-40 uppercase tracking-widest text-[var(--bulletin-text)]">Linked to Google Account</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-[var(--bulletin-text)]">Email</label>
                    <input type="email" placeholder="you@example.com" autoComplete="email" className={fieldBase} {...register('email')} readOnly={isGoogleFlow} />
                    {errors.email && <p className="mt-2 text-[12px] text-red-600 font-black uppercase tracking-widest">{errors.email.message}</p>}
                    {isGoogleFlow && <p className="mt-2 text-[9px] font-bold opacity-40 uppercase tracking-widest text-[var(--bulletin-text)]">Verified by Google</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-[var(--bulletin-text)]">Phone</label>
                    <input type="tel" placeholder="0XX XXX XXXX" autoComplete="tel" className={fieldBase} {...register('phone')} />
                    {errors.phone && <p className="mt-2 text-[12px] text-red-600 font-black uppercase tracking-widest">{errors.phone.message}</p>}
                  </div>
                </div>
                <div className="flex gap-4 mt-10">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-4 text-[12px] font-black uppercase shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all text-[var(--bulletin-text)]">← Back</button>
                  <button type="button" onClick={goNext} className="flex-[2] border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-4 py-4 text-[14px] font-black uppercase text-[var(--bulletin-bg)] shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all tracking-widest">Continue →</button>
                </div>
              </div>
            )}

            {/* STEP 3: Campus Info */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 text-[var(--bulletin-text)]">Campus Details</h1>
                <p className="text-[12px] font-bold opacity-60 mb-8 text-[var(--bulletin-text)]">Help others know where you're from.</p>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-[var(--bulletin-text)]">Program of Study</label>
                    <input type="text" placeholder="e.g. Geological Engineering" className={fieldBase} {...register('department')} />
                    {errors.department && <p className="mt-2 text-[12px] text-red-600 font-black uppercase tracking-widest">{errors.department.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-[var(--bulletin-text)]">Residence Hall / Hostel</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Chamber of Mines Hall" 
                      className={fieldBase} 
                      {...register('residenceHall')} 
                    />
                    {errors.residenceHall && <p className="mt-2 text-[12px] text-red-600 font-black uppercase tracking-widest">{errors.residenceHall.message}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-[var(--bulletin-text)]">Academic Level / Status</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 400, Graduate, or Staff" 
                      className={fieldBase} 
                      {...register('currentLevel')} 
                    />
                    {errors.currentLevel && <p className="mt-2 text-[12px] text-red-600 font-black uppercase tracking-widest">{errors.currentLevel.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-[var(--bulletin-text)]">Location <span className="font-bold opacity-60">— optional</span></label>
                    <input type="text" placeholder="e.g. Jubilee Hostel" className={fieldBase} {...register('location')} />
                  </div>
                </div>
                <div className="flex gap-4 mt-10">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-4 text-[12px] font-black uppercase shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all text-[var(--bulletin-text)]">← Back</button>
                  <button type="button" onClick={goNext} className="flex-[2] border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-4 py-4 text-[14px] font-black uppercase text-[var(--bulletin-bg)] shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all tracking-widest">Continue →</button>
                </div>
              </div>
            )}

            {/* STEP 4: Password */}
            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                {isGoogleFlow ? (
                  <>
                    <div className="mb-8 p-6 border-4 border-[var(--bulletin-border)] bg-[#e0f2f7] dark:bg-sky-900/40 shadow-[8px_8px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(-1deg)' }}>
                      <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 text-[var(--bulletin-text)]">Last Step</h1>
                      <p className="text-[14px] font-bold opacity-80 text-[var(--bulletin-text)] mb-8">Your account will use Google authentication.</p>
                      
                      <div className="mt-8 p-6 border-2 border-dashed border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] relative">
                        <div className="absolute -top-3 left-4 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                          LEGAL RULES
                        </div>
                        <div className="flex items-start gap-4">
                          <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] shadow-[3px_3px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              {...register('termsAccepted')}
                            />
                            <Pin className="h-4 w-4 text-[var(--bulletin-text)] opacity-35 peer-checked:text-[#ff6b6b] peer-checked:fill-[#ff6b6b] peer-checked:opacity-100 peer-checked:rotate-45 transition-all" />
                          </label>
                          <div className="flex-1">
                            <p className="text-[11px] font-black uppercase tracking-tight text-[var(--bulletin-text)] leading-tight">
                              I verify that I have read and agree to the <Link to="/terms" target="_blank" className="underline decoration-2 underline-offset-2 hover:text-[#ff6b6b]">Campus Rules</Link> & <Link to="/terms#privacy" target="_blank" className="underline decoration-2 underline-offset-2 hover:text-[#ff6b6b]">Privacy Policy</Link>.
                            </p>
                          </div>
                        </div>
                        {errors.termsAccepted && <p className="mt-3 text-[12px] text-red-600 font-black uppercase tracking-widest">{errors.termsAccepted.message}</p>}
                      </div>
                    </div>
                    <div className="flex gap-4 mt-10">
                      <button type="button" onClick={() => setStep(3)} className="flex-1 border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-4 text-[12px] font-black uppercase shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all text-[var(--bulletin-text)]">← Back</button>
                      <button 
                        type="button" 
                        onClick={() => {
                          const data = watch() as RegisterFormData;
                          onSubmit(data);
                        }} 
                        disabled={isSubmitting} 
                        className="flex-[2] border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-4 py-4 text-[14px] font-black uppercase text-[var(--bulletin-bg)] shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] disabled:opacity-40 transition-all tracking-widest"
                      >
                        {isSubmitting ? 'Connecting...' : 'Complete with Google'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 text-[var(--bulletin-text)]">Account Security</h1>
                    <p className="text-[12px] font-bold opacity-60 mb-8 text-[var(--bulletin-text)]">Choose a strong password.</p>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-[var(--bulletin-text)]">Password</label>
                        <div className="relative flex items-center">
                          <input type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters" autoComplete="new-password" className={`flex-1 pr-16 ${fieldBase}`} {...register('password')} />
                          <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-4 opacity-40 hover:opacity-100 text-[var(--bulletin-text)]">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                        </div>
                        {errors.password && <p className="mt-2 text-[12px] text-red-600 font-black uppercase tracking-widest">{errors.password.message}</p>}
                      </div>
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-[var(--bulletin-text)]">Confirm</label>
                        <div className="relative flex items-center">
                          <input type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password" autoComplete="new-password" className={`flex-1 pr-16 ${fieldBase}`} {...register('confirmPassword')} />
                          <button type="button" onClick={() => setShowConfirm((p) => !p)} className="absolute right-4 opacity-40 hover:opacity-100 text-[var(--bulletin-text)]">{showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                        </div>
                        {errors.confirmPassword && <p className="mt-2 text-[12px] text-red-600 font-black uppercase tracking-widest">{errors.confirmPassword.message}</p>}
                      </div>
                    </div>

                    <div className="mt-10 p-6 border-2 border-dashed border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] relative">
                      <div className="absolute -top-3 left-4 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                        LEGAL RULES
                      </div>
                      <div className="flex items-start gap-4">
                        <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] shadow-[3px_3px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            {...register('termsAccepted')}
                          />
                          <Pin className="h-4 w-4 text-[var(--bulletin-text)] opacity-35 peer-checked:text-[#ff6b6b] peer-checked:fill-[#ff6b6b] peer-checked:opacity-100 peer-checked:rotate-45 transition-all" />
                        </label>
                        <div className="flex-1">
                          <p className="text-[11px] font-black uppercase tracking-tight text-[var(--bulletin-text)] leading-tight">
                            I verify that I have read and agree to the <Link to="/terms" target="_blank" className="underline decoration-2 underline-offset-2 hover:text-[#ff6b6b]">Institutional Terms</Link> & <Link to="/terms#privacy" target="_blank" className="underline decoration-2 underline-offset-2 hover:text-[#ff6b6b]">Privacy Charter</Link>.
                          </p>
                        </div>
                      </div>
                      {errors.termsAccepted && <p className="mt-3 text-[12px] text-red-600 font-black uppercase tracking-widest">{errors.termsAccepted.message}</p>}
                    </div>

                    <div className="flex gap-4 mt-10">
                      <button type="button" onClick={() => setStep(3)} className="flex-1 border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-4 text-[12px] font-black uppercase shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all text-[var(--bulletin-text)]">← Back</button>
                      <button type="submit" disabled={isSubmitting} className="flex-[2] border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-4 py-4 text-[14px] font-black uppercase text-[var(--bulletin-bg)] shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] disabled:opacity-40 transition-all tracking-widest">
                        {isSubmitting ? 'Creating...' : 'Create Account'}
                      </button>
                    </div>
                  </>
                )}
                <div className="mt-8 text-center bg-[#fffacd] dark:bg-yellow-900/40 p-4 border-2 border-[var(--bulletin-border)] shadow-[4px_4px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(1deg)' }}>
                  <p className="text-[12px] font-bold text-[var(--bulletin-text)] uppercase tracking-widest">Already have an account? <Link to="/login" className="font-black underline decoration-2 underline-offset-4 hover:no-underline ml-2">Sign in</Link></p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;