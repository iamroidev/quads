import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/auth.service';
import toast from 'react-hot-toast';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

const fieldBase = 'w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black placeholder:text-black/30';
const labelBase = 'block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1';

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
    <BulletinLayout title="Seller Onboarding" subtitle="Setup" section="17">
      <BulletinSection bgColor="bg-[#faf8f5]">
        <div className="max-w-2xl mx-auto">
          {/* Progress steps */}
          <div className="flex items-center gap-0 mb-8">
            {['Store branding', 'Payout setup', 'Identity check'].map((label, idx) => (
              <React.Fragment key={label}>
                <div className="flex items-center gap-2">
                  {steps[idx] ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4 border border-black flex items-center justify-center">
                      <span className="text-[8px] font-bold">{idx + 1}</span>
                    </div>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                </div>
                {idx < 2 && <div className="mx-3 flex-1 border-t border-black" />}
              </React.Fragment>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <BulletinCard rotation={-0.3} bgColor="bg-white">
              <label className={labelBase}>Store name</label>
              <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="e.g. Campus Gadget Hub" className={`${fieldBase} mt-2`} />
            </BulletinCard>
            <BulletinCard rotation={0.3} bgColor="bg-white">
              <label className={labelBase}>Brand name</label>
              <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g. Kofi Tech" className={`${fieldBase} mt-2`} />
            </BulletinCard>
            <BulletinCard rotation={-0.3} bgColor="bg-white">
              <label className={labelBase}>Response time (min)</label>
              <input value={responseTimeMinutes} onChange={(e) => setResponseTimeMinutes(Number(e.target.value || 15))} type="number" className={`${fieldBase} mt-2`} />
            </BulletinCard>
            <BulletinCard rotation={0.3} bgColor="bg-white">
              <label className={labelBase}>Payout method</label>
              <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value as any)} className={`${fieldBase} mt-2`}>
                <option value="momo">Mobile money</option>
                <option value="bank">Bank</option>
              </select>
            </BulletinCard>
            <BulletinCard rotation={-0.3} bgColor="bg-white">
              <label className={labelBase}>Provider</label>
              <input value={payoutProvider} onChange={(e) => setPayoutProvider(e.target.value)} placeholder="MTN / Bank name" className={`${fieldBase} mt-2`} />
            </BulletinCard>
            <BulletinCard rotation={0.3} bgColor="bg-white">
              <label className={labelBase}>Account name</label>
              <input value={payoutAccountName} onChange={(e) => setPayoutAccountName(e.target.value)} placeholder="Full account name" className={`${fieldBase} mt-2`} />
            </BulletinCard>
            <BulletinCard rotation={-0.3} bgColor="bg-white" className="sm:col-span-2">
              <label className={labelBase}>Account number</label>
              <input value={payoutAccountNumber} onChange={(e) => setPayoutAccountNumber(e.target.value)} placeholder="Account number" className={`${fieldBase} mt-2`} />
            </BulletinCard>
          </div>

          <button
            onClick={submit}
            disabled={submitting}
            className="mt-8 inline-flex items-center gap-2 border border-black bg-black px-5 py-3 text-[11px] font-bold uppercase text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black disabled:opacity-40 transition-all"
          >
            {submitting ? 'Saving...' : allDone ? 'Finish and continue' : 'Save progress'}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default SellerOnboardingPage;