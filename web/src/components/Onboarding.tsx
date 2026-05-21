import { useState, useEffect } from 'react';
import { X, ShoppingBag, Shield, MessageCircle, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  {
    icon: ShoppingBag,
    title: 'Browse Campus Listings',
    desc: 'Find textbooks, electronics, clothing, food and services from verified UMaT students.',
  },
  {
    icon: Shield,
    title: 'Pay Securely via Escrow',
    desc: 'Your money is held safely until you confirm receipt. MTN, Vodafone, AirtelTigo supported.',
  },
  {
    icon: MapPin,
    title: 'Meet on Campus',
    desc: 'Choose a verified pickup spot — library, halls, canteen, or custom location.',
  },
  {
    icon: MessageCircle,
    title: 'Chat & Negotiate',
    desc: 'Message sellers directly. Make offers, ask questions, coordinate handoff.',
  },
];

export default function Onboarding() {
  const { user, isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user || !isAuthenticated) {
      setVisible(false);
      return;
    }
    // Only show the tour if the user is newly registered ('quads_is_new_user' flag exists)
    // AND they have not completed/dismissed it yet ('quads_onboarded' doesn't exist).
    if (localStorage.getItem('quads_is_new_user') && !localStorage.getItem('quads_onboarded')) {
      setVisible(true);
    }
  }, [user, isAuthenticated]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('quads_onboarded', '1');
    localStorage.removeItem('quads_is_new_user');
  };

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[var(--bulletin-card)] border-4 border-[var(--bulletin-border)] shadow-[12px_12px_0_0_var(--bulletin-shadow)] relative overflow-hidden">
        {/* Close */}
        <button onClick={dismiss} className="absolute top-4 right-4 p-1 opacity-40 hover:opacity-100 z-10">
          <X className="h-5 w-5 text-[var(--bulletin-text)]" />
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 border-4 border-[var(--bulletin-border)] bg-[#ff6b6b] flex items-center justify-center shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
            <Icon className="h-7 w-7 text-white" />
          </div>

          <p className="text-[10px] font-black uppercase tracking-[2px] text-[#ff6b6b] mb-2">
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 className="text-xl font-black uppercase tracking-tight text-[var(--bulletin-text)] mb-3">
            {current.title}
          </h2>
          <p className="text-[13px] text-[var(--bulletin-text)] opacity-60 leading-relaxed">
            {current.desc}
          </p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 pb-4">
          {STEPS.map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 border-2 border-[var(--bulletin-border)] ${i === step ? 'bg-[#ff6b6b]' : 'bg-transparent'}`} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex border-t-2 border-[var(--bulletin-border)]">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-text)] hover:bg-[var(--bulletin-bg)] transition-colors border-r-2 border-[var(--bulletin-border)]">
              Back
            </button>
          )}
          <button
            onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : dismiss()}
            className="flex-[2] py-4 text-[11px] font-black uppercase tracking-widest bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] hover:bg-[#ff6b6b] transition-colors"
          >
            {step < STEPS.length - 1 ? 'Next' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
}
