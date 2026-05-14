import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/auth.service';
import toast from 'react-hot-toast';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

const fieldBase = 'w-full border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-3 text-[12px] font-black focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] text-[var(--bulletin-text)] placeholder:text-[var(--bulletin-text)] placeholder:opacity-30';
const labelBase = 'block text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 text-[var(--bulletin-text)]';

const SellerOnboardingPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [storeName, setStoreName] = useState(user?.storeName || '');
  const [brandName, setBrandName] = useState(user?.brandName || '');
  const [responseTimeMinutes, setResponseTimeMinutes] = useState<number>(user?.responseTimeMinutes || 15);
  const [payoutMethod, setPayoutMethod] = useState<'momo' | 'bank'>((user?.sellerOnboarding?.payoutMethod as any) || 'momo');
  const [payoutProvider, setPayoutProvider] = useState(user?.sellerOnboarding?.payoutProvider || 'MTN');
  const [payoutAccountName, setPayoutAccountName] = useState(user?.sellerOnboarding?.payoutAccountName || '');
  const [payoutAccountNumber, setPayoutAccountNumber] = useState(user?.sellerOnboarding?.payoutAccountNumber || '');

  const steps = useMemo(
    () => [
      !!(storeName.trim() || brandName.trim()),
      !!(payoutAccountName.trim() && payoutAccountNumber.trim()),
      true,
    ],
    [storeName, brandName, payoutAccountName, payoutAccountNumber]
  );

  const allDone = steps.every(Boolean);

  const submit = async () => {
    setSubmitting(true);
    try {
      await authService.updateSellerOnboarding({
        storeName,
        brandName,
        responseTimeMinutes,
        payoutMethod,
        payoutProvider,
        payoutAccountName,
        payoutAccountNumber,
        completed: allDone,
      });
      await refreshUser();
      toast.success(allDone ? 'Onboarding complete' : 'Onboarding saved');
      if (allDone) navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BulletinLayout title="Seller Initialization" subtitle="Store Setup" section="17">
      <div className="border-b-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-6 py-12 relative overflow-hidden">
        <div className="absolute top-0 right-20 h-full w-40 bg-[var(--bulletin-bg)] opacity-5 rotate-[15deg]" />
        <div className="max-w-[1400px] mx-auto relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--bulletin-text)] opacity-40 mb-3">Workspace Activation</p>
          <h1 className="text-4xl font-black uppercase tracking-tight text-[var(--bulletin-text)]">Configure Operations</h1>
        </div>
      </div>

      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="max-w-3xl mx-auto">
          {/* Progress steps */}
          <div className="flex flex-wrap items-center gap-0 mb-12 border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 shadow-[8px_8px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(-0.5deg)' }}>
            {['Store Branding', 'Payout Infrastructure', 'Identity Verification'].map((label, idx) => (
              <React.Fragment key={label}>
                <div className="flex items-center gap-3 py-2">
                  {steps[idx] ? (
                    <CheckCircle2 className="h-6 w-6 text-[var(--bulletin-text)]" />
                  ) : (
                    <div className="h-6 w-6 border-2 border-[var(--bulletin-border)] flex items-center justify-center bg-[var(--bulletin-bg)]">
                      <span className="text-[10px] font-black text-[var(--bulletin-text)]">{idx + 1}</span>
                    </div>
                  )}
                  <span className={`text-[11px] font-black uppercase tracking-widest ${steps[idx] ? 'opacity-100 text-[var(--bulletin-text)]' : 'opacity-40 text-[var(--bulletin-text)]'}`}>{label}</span>
                </div>
                {idx < 2 && <div className="hidden sm:block mx-4 flex-1 border-t-2 border-dashed border-[var(--bulletin-border)] opacity-30" />}
              </React.Fragment>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <BulletinCard rotation={-0.3} bgColor="bg-[var(--bulletin-card)]" className="border-4 border-[var(--bulletin-border)] shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
              <label className={labelBase}>Store name</label>
              <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="e.g. Campus Gadget Hub" className={`${fieldBase} mt-2`} />
            </BulletinCard>
            
            <BulletinCard rotation={0.3} bgColor="bg-[var(--bulletin-card)]" className="border-4 border-[var(--bulletin-border)] shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
              <label className={labelBase}>Brand name</label>
              <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g. Kofi Tech" className={`${fieldBase} mt-2`} />
            </BulletinCard>
            
            <BulletinCard rotation={-0.3} bgColor="bg-[var(--bulletin-card)]" className="border-4 border-[var(--bulletin-border)] shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
              <label className={labelBase}>Target Response Time</label>
              <div className="relative">
                <input value={responseTimeMinutes} onChange={(e) => setResponseTimeMinutes(Number(e.target.value || 15))} type="number" className={`${fieldBase} mt-2 pr-16`} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">MIN</span>
              </div>
            </BulletinCard>
            
            <BulletinCard rotation={0.3} bgColor="bg-[var(--bulletin-card)]" className="border-4 border-[var(--bulletin-border)] shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
              <label className={labelBase}>Payout Protocol</label>
              <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value as any)} className={`${fieldBase} mt-2`}>
                <option value="momo">Mobile Money Network</option>
                <option value="bank">Direct Bank Transfer</option>
              </select>
            </BulletinCard>
            
            <BulletinCard rotation={-0.3} bgColor="bg-[var(--bulletin-card)]" className="border-4 border-[var(--bulletin-border)] shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
              <label className={labelBase}>Institution / Network</label>
              <input value={payoutProvider} onChange={(e) => setPayoutProvider(e.target.value)} placeholder="e.g. MTN, Telecel, GCB" className={`${fieldBase} mt-2`} />
            </BulletinCard>
            
            <BulletinCard rotation={0.3} bgColor="bg-[var(--bulletin-card)]" className="border-4 border-[var(--bulletin-border)] shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
              <label className={labelBase}>Account Bearer</label>
              <input value={payoutAccountName} onChange={(e) => setPayoutAccountName(e.target.value)} placeholder="Legal entity name" className={`${fieldBase} mt-2`} />
            </BulletinCard>
            
            <BulletinCard rotation={-0.3} bgColor="bg-[#fffacd] dark:bg-yellow-900/20" className="sm:col-span-2 border-4 border-[var(--bulletin-border)] shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 text-black dark:text-yellow-200">Account identifier</label>
              <input value={payoutAccountNumber} onChange={(e) => setPayoutAccountNumber(e.target.value)} placeholder="Routing or phone number" className={`w-full border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-4 text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] text-[var(--bulletin-text)] placeholder:text-[var(--bulletin-text)] placeholder:opacity-30 mt-2 tracking-widest`} />
            </BulletinCard>
          </div>

          <div className="mt-12 flex justify-end border-t-4 border-[var(--bulletin-border)] pt-8">
            <button
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-3 border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-8 py-4 text-[12px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] shadow-[8px_8px_0_0_var(--bulletin-shadow)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] disabled:opacity-40 transition-all"
            >
              {submitting ? 'Authenticating...' : allDone ? 'Initialize Workspace' : 'Commit Progress'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default SellerOnboardingPage;