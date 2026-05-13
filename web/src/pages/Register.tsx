import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Check, ArrowRight, Scissors } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import BrandMark from '../components/layout/BrandMark';

const PROGRAMS = [
  'Computer Science & Engineering',
  'Geological Engineering',
  'Mining Engineering',
  'Petroleum Engineering',
  'Electrical & Electronic Engineering',
  'Mechanical Engineering',
  'Chemical Engineering',
  'Mathematics',
  'Physics',
  'Environmental Science',
  'Business Administration',
  'Accounting & Finance',
  'Humanities & Social Sciences',
  'Other',
];

const RESIDENCE_HALLS = [
  'D. A. Opoku Mensah (D.A.O.) Hall',
  'J. C. S. Hagan Hall',
  'A. A. Adumua-Bossman Hall',
  'Mensah Sarbah Hall',
  'Jubilee Hall',
  'Tarkwaian Hostel',
  'Off-campus',
  'Other',
];

const ACADEMIC_LEVELS = [
  '100',
  '200',
  '300',
  '400',
  'Graduate',
  'Staff',
];

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    role: z.enum(['buyer', 'seller']),
    studentId: z.string().optional(),
    department: z.string().optional(),
    residenceHall: z.string().optional(),
    currentLevel: z.string().optional(),
    location: z.string().optional(),
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

const fieldBase = 'w-full border border-black bg-[#fefdfb] px-4 py-3 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-black placeholder:text-black/30';

const selectBase = 'w-full border border-black bg-[#fefdfb] px-4 py-3 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-black appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")] bg-[length:16px] bg-[right_12px_center] bg-no-repeat';

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
    className={`absolute border border-black/20 ${bg} shadow-[4px_4px_0_0_rgba(0,0,0,0.15)] p-3`}
    style={{ transform: `rotate(${rotation}deg)`, top, left, right, bottom, width: w }}
  >
    {/* Tape */}
    <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-5 w-16 opacity-50"
      style={{ background: `${tapeColor}40`, transform: 'translateX(-50%) rotate(-1deg)' }} />
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
    <div className="absolute pointer-events-none"
      style={{
        left: x1, top: y1,
        width: len,
        height: 1,
        background: 'linear-gradient(90deg, #8b7355 50%, transparent 50%)',
        backgroundSize: '8px 1px',
        transform: `rotate(${angle}deg)`,
        transformOrigin: '0 0',
      }}
    />
  );
};

const RegisterPage: React.FC = () => {
  const { register: registerUser, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [roleShake, setRoleShake] = useState(false);

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
        // Google flow: skip password validation — no password fields rendered
        const googleCredential = sessionStorage.getItem('google_credential');
        if (!googleCredential) {
          toast.error('Google session expired. Please try again.');
          navigate('/register');
          return;
        }
        await googleLogin(googleCredential, data.role);
        toast.success('Account created with Google!', { duration: 1400 });
        sessionStorage.removeItem('google_credential');
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
        // Store credential and redirect to register with google param
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
    if (isRoleChosen) return;
    window.requestAnimationFrame(() => setRoleShake(true));
    setTimeout(() => setRoleShake(false), 360);
    toast('Choose Buy or Sell first to continue with Google.');
  };

  return (
    <div className="relative min-h-screen bg-[#d4c4a8] font-mono text-[13px] leading-tight overflow-hidden">
      
      {/* Cork board texture */}
      <div className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, #a08060 1px, transparent 1px), radial-gradient(circle at 75% 75%, #907050 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Top brand bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-black/20 bg-[#c4b498] px-4 py-2">
        <Link to="/" className="inline-flex items-center gap-2">
          <BrandMark className="h-4 w-4" />
          <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">CampusMarket</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold uppercase tracking-wider opacity-40">Step {step} of 4</span>
          {step > 1 && (
            <button onClick={() => setStep((s) => (s - 1) as Step)} className="text-[9px] font-bold uppercase tracking-wider underline opacity-60 hover:opacity-100">Back</button>
          )}
        </div>
      </div>

      {/* Scattered notes around the board */}
      <ScatteredNote bg="bg-[#fffacd]" rotation={-4} top="12%" left="5%" w="130px" tapeColor="#ff6b6b">
        <div className="text-[10px] font-bold">📚 Textbooks</div>
        <div className="text-[9px] opacity-60 mt-1">From GHS 15</div>
      </ScatteredNote>

      <ScatteredNote bg="bg-[#e0f2f7]" rotation={3} top="8%" right="8%" w="120px" tapeColor="#4ecdc4">
        <div className="text-[10px] font-bold">📱 Gadgets</div>
        <div className="text-[9px] opacity-60 mt-1">Phones, laptops</div>
      </ScatteredNote>

      <ScatteredNote bg="bg-[#fce4ec]" rotation={-2} top="28%" left="3%" w="110px" tapeColor="#a8e6cf">
        <div className="text-[10px] font-bold">👕 Fashion</div>
        <div className="text-[9px] opacity-60 mt-1">Campus style</div>
      </ScatteredNote>

      <ScatteredNote bg="bg-[#f0e8f4]" rotation={5} top="22%" right="4%" w="140px" tapeColor="#ffd93d">
        <div className="text-[10px] font-bold">🍔 Food & More</div>
        <div className="text-[9px] opacity-60 mt-1">Meal prep, snacks</div>
      </ScatteredNote>

      <ScatteredNote bg="bg-[#fffacd]" rotation={-3} bottom="15%" left="6%" w="125px" tapeColor="#ff6b6b">
        <div className="text-[10px] font-bold">🚲 Transport</div>
        <div className="text-[9px] opacity-60 mt-1">Bikes, rides</div>
      </ScatteredNote>

      <ScatteredNote bg="bg-[#e0f2f7]" rotation={2} bottom="10%" right="7%" w="115px" tapeColor="#4ecdc4">
        <div className="text-[10px] font-bold">🏠 Dorms</div>
        <div className="text-[9px] opacity-60 mt-1">Furniture, decor</div>
      </ScatteredNote>

      {/* String lines connecting notes */}
      <StringLine from="130,180" to="280,280" />
      <StringLine from="800,150" to="650,320" />
      <StringLine from="100,400" to="250,500" />

      {/* Main central pinned form */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-48px)] p-6">
        <div
          className="relative border border-black/30 bg-[#fffef5] p-6 md:p-8 shadow-[8px_8px_0_0_rgba(0,0,0,0.2)] w-full max-w-md"
          style={{ transform: 'rotate(-0.5deg)' }}
        >
          {/* Large tape across top */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-8 w-32 bg-[#ffd700]/40 rotate-1" />
          
          {/* Torn edge effect at top */}
          <div className="absolute -top-1 left-0 right-0 h-3 overflow-hidden">
            <svg viewBox="0 0 400 12" className="w-full h-full" preserveAspectRatio="none">
              <path d="M0,12 L5,2 L12,10 L20,3 L28,11 L35,2 L42,10 L50,4 L58,11 L65,2 L72,10 L80,3 L88,11 L95,2 L102,10 L110,4 L118,11 L125,2 L132,10 L140,3 L148,11 L155,2 L162,10 L170,4 L178,11 L185,2 L192,10 L200,3 L208,11 L215,2 L222,10 L230,4 L238,11 L245,2 L252,10 L260,3 L268,11 L275,2 L282,10 L290,4 L298,11 L305,2 L312,10 L320,3 L328,11 L335,2 L342,10 L350,4 L358,11 L365,2 L372,10 L380,3 L388,11 L395,2 L400,10 L400,12 L0,12 Z" fill="#f8f7f4" />
            </svg>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step indicator strip */}
            <div className="flex border-b border-black/20 pb-3 mb-6">
              {([1, 2, 3, 4] as Step[]).map((s) => (
                <div key={s} className="flex-1 text-center">
                  <div className={`inline-flex h-6 w-6 items-center justify-center border text-[10px] font-bold ${step >= s ? 'border-black bg-black text-white' : 'border-black/30 text-black/30'}`}>
                    {step > s ? <Check className="h-3 w-3" /> : s}
                  </div>
                  <div className={`mt-1 text-[8px] uppercase tracking-wider ${step === s ? '' : 'opacity-40'}`}>{STEP_LABELS[s]}</div>
                </div>
              ))}
            </div>

            {/* STEP 1: Role choice — torn paper style */}
            {step === 1 && (
              <div>
                {isGoogleFlow && (
                  <div className="mb-4 p-3 border border-black/20 bg-[#e0f2f7] text-[11px]">
                    <strong>Google account detected.</strong> Choose your role below to complete registration.
                  </div>
                )}
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center gap-1 border border-black px-2 py-1 mb-3">
                    <Scissors className="h-3 w-3" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Cut here to choose</span>
                  </div>
                  <h1 className="text-2xl font-bold">I want to...</h1>
                </div>

                <div className={`grid grid-cols-2 gap-0 mb-6 ${roleShake ? 'animate-role-shake' : ''}`}>
                  <button type="button" onClick={() => setValue('role', 'buyer')}
                    className={`relative border-2 border-dashed border-black py-10 text-center transition-all ${selectedRole === 'buyer' ? 'bg-[#e0f2f7] border-solid shadow-[4px_4px_0_0_rgba(0,0,0,1)]' : 'bg-white border-dashed hover:border-solid'}`}>
                    <div className="text-lg font-bold uppercase tracking-wider">Buy</div>
                    <div className="text-[10px] opacity-60 mt-1">Browse & purchase items</div>
                    {selectedRole === 'buyer' && <div className="absolute -top-2 right-2 h-4 w-4 bg-black text-white text-[8px] flex items-center justify-center">✓</div>}
                  </button>
                  <button type="button" onClick={() => setValue('role', 'seller')}
                    className={`relative border-2 border-dashed border-black py-10 text-center transition-all ${selectedRole === 'seller' ? 'bg-[#fffacd] border-solid shadow-[4px_4px_0_0_rgba(0,0,0,1)]' : 'bg-white border-dashed hover:border-solid'}`}>
                    <div className="text-lg font-bold uppercase tracking-wider">Sell</div>
                    <div className="text-[10px] opacity-60 mt-1">List your own items</div>
                    {selectedRole === 'seller' && <div className="absolute -top-2 right-2 h-4 w-4 bg-black text-white text-[8px] flex items-center justify-center">✓</div>}
                  </button>
                </div>
                <input type="hidden" {...register('role')} />

                <button type="button" onClick={goNext} disabled={!isRoleChosen}
                  className="w-full border border-black bg-black px-6 py-3 text-[11px] font-bold uppercase text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black disabled:opacity-40 transition-all">
                  Continue <ArrowRight className="inline-block h-3 w-3 ml-1" />
                </button>

                {!isGoogleFlow && (
                  <>
                    <div className="flex items-center gap-4 my-6">
                      <div className="flex-1 border-t border-dashed border-black/30" />
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Or</span>
                      <div className="flex-1 border-t border-dashed border-black/30" />
                    </div>

                    <div className="flex justify-center">
                      <div onClick={handleLockedGoogleTap} role="button" tabIndex={0}
                        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isRoleChosen) { e.preventDefault(); handleLockedGoogleTap(); } }}>
                        <div className={`${!isRoleChosen ? 'pointer-events-none opacity-45 grayscale' : ''} flex justify-center`}>
                          <div className="border border-black bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all overflow-hidden">
                            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google sign-up failed.')} useOneTap={false} shape="rectangular" theme="outline" size="large" text="continue_with" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-6 text-center">
                  <p className="text-[11px] opacity-60">Already have an account? <Link to="/login" className="font-bold underline hover:no-underline">Sign in</Link></p>
                </div>
              </div>
            )}

            {/* STEP 2: Account Details */}
            {step === 2 && (
              <div>
                <h1 className="text-2xl font-bold mb-1">Tell us about yourself</h1>
                <p className="text-[11px] opacity-60 mb-5">Fill in your student details.</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Full name</label>
                    <input type="text" placeholder="Kwame Asante" autoComplete="name" autoFocus className={fieldBase} {...register('name')} />
                    {errors.name && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Email</label>
                    <input type="email" placeholder="you@example.com" autoComplete="email" className={fieldBase} {...register('email')} />
                    {errors.email && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Phone</label>
                    <input type="tel" placeholder="0XX XXX XXXX" autoComplete="tel" className={fieldBase} {...register('phone')} />
                    {errors.phone && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.phone.message}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 border border-black bg-white px-4 py-2.5 text-[9px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all">← Back</button>
                  <button type="button" onClick={goNext} className="flex-[2] border border-black bg-black px-4 py-2.5 text-[10px] font-bold uppercase text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-all">Continue →</button>
                </div>
              </div>
            )}

            {/* STEP 3: Campus Info */}
            {step === 3 && (
              <div>
                <h1 className="text-2xl font-bold mb-1">Campus info</h1>
                <p className="text-[11px] opacity-60 mb-5">Help others know where you're from.</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Program of Study</label>
                    <input type="text" placeholder="e.g. Geological Engineering" autoFocus className={fieldBase} {...register('department')} />
                    {errors.department && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.department.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Residence Hall</label>
                    <input type="text" placeholder="e.g. Jubilee Hall" className={fieldBase} {...register('residenceHall')} />
                    {errors.residenceHall && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.residenceHall.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Academic Level</label>
                    <select className={selectBase} {...register('currentLevel')}>
                      <option value="">Select level</option>
                      {ACADEMIC_LEVELS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    {errors.currentLevel && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.currentLevel.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Location <span className="normal-case font-normal opacity-60">— optional</span></label>
                    <input type="text" placeholder="e.g. Jubilee Hostel" className={fieldBase} {...register('location')} />
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 border border-black bg-white px-4 py-2.5 text-[9px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all">← Back</button>
                  <button type="button" onClick={goNext} className="flex-[2] border border-black bg-black px-4 py-2.5 text-[10px] font-bold uppercase text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-all">Continue →</button>
                </div>
              </div>
            )}

            {/* STEP 4: Password */}
            {step === 4 && (
              <div>
                {isGoogleFlow ? (
                  <>
                    <h1 className="text-2xl font-bold mb-1">Almost done!</h1>
                    <p className="text-[11px] opacity-60 mb-5">Your account will use Google authentication. No password needed.</p>
                    <div className="flex gap-2 mt-5">
                      <button type="button" onClick={() => setStep(3)} className="flex-1 border border-black bg-white px-4 py-2.5 text-[9px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all">← Back</button>
                      <button type="submit" disabled={isSubmitting} className="flex-[2] border border-black bg-black px-4 py-2.5 text-[10px] font-bold uppercase text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black disabled:opacity-40 transition-all">
                        {isSubmitting ? 'Creating...' : 'Complete with Google'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold mb-1">Secure your account</h1>
                    <p className="text-[11px] opacity-60 mb-5">Choose a strong password.</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Password</label>
                        <div className="relative flex items-center">
                          <input type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters" autoComplete="new-password" autoFocus className={`flex-1 pr-12 ${fieldBase}`} {...register('password')} />
                          <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 text-black/40 hover:text-black">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                        </div>
                        {errors.password && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.password.message}</p>}
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Confirm</label>
                        <div className="relative flex items-center">
                          <input type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password" autoComplete="new-password" className={`flex-1 pr-12 ${fieldBase}`} {...register('confirmPassword')} />
                          <button type="button" onClick={() => setShowConfirm((p) => !p)} className="absolute right-3 text-black/40 hover:text-black">{showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                        </div>
                        {errors.confirmPassword && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.confirmPassword.message}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-5">
                      <button type="button" onClick={() => setStep(3)} className="flex-1 border border-black bg-white px-4 py-2.5 text-[9px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all">← Back</button>
                      <button type="submit" disabled={isSubmitting} className="flex-[2] border border-black bg-black px-4 py-2.5 text-[10px] font-bold uppercase text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black disabled:opacity-40 transition-all">
                        {isSubmitting ? 'Creating...' : 'Create account'}
                      </button>
                    </div>
                  </>
                )}
                <div className="mt-4 text-center">
                  <p className="text-[11px] opacity-60">Already have an account? <Link to="/login" className="font-bold underline hover:no-underline">Sign in</Link></p>
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