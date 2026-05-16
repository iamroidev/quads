import React from 'react';
import { Shield, FileText, Lock, Scale, AlertCircle } from 'lucide-react';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';

const TermsPage: React.FC = () => {
  return (
    <BulletinLayout title="Rules" subtitle="Privacy & Rules" section="10">
      
      {/* Table of Contents / Quick Links */}
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <a href="#tos" className="border-4 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/40 p-8 shadow-[8px_8px_0_0_var(--bulletin-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all group text-black dark:text-yellow-200" style={{ transform: 'rotate(-1deg)' }}>
            <FileText className="h-8 w-8 mb-6 opacity-40 group-hover:opacity-100" />
            <div className="text-[12px] font-black uppercase tracking-widest mb-2">Platform Rules</div>
            <div className="text-[13px] font-bold opacity-70 leading-relaxed">General marketplace rules and user conduct.</div>
          </a>
          
          <a href="#privacy" className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-8 shadow-[8px_8px_0_0_var(--bulletin-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all group text-[var(--bulletin-text)]" style={{ transform: 'rotate(1deg)' }}>
            <Lock className="h-8 w-8 mb-6 opacity-40 group-hover:opacity-100" />
            <div className="text-[12px] font-black uppercase tracking-widest mb-2">Privacy Policy</div>
            <div className="text-[13px] font-bold opacity-70 leading-relaxed">How we handle your data and student ID info.</div>
          </a>

          <a href="#protection" className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-8 shadow-[8px_8px_0_0_var(--bulletin-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all group text-[var(--bulletin-text)]" style={{ transform: 'rotate(-0.5deg)' }}>
            <Shield className="h-8 w-8 mb-6 opacity-40 group-hover:opacity-100 text-emerald-600" />
            <div className="text-[12px] font-black uppercase tracking-widest mb-2">Buyer Protection</div>
            <div className="text-[13px] font-bold opacity-70 leading-relaxed">Payment security and refund info.</div>
          </a>

          <a href="#prohibited" className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-8 shadow-[8px_8px_0_0_var(--bulletin-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all group text-[var(--bulletin-text)]" style={{ transform: 'rotate(0.5deg)' }}>
            <AlertCircle className="h-8 w-8 mb-6 opacity-40 group-hover:opacity-100 text-red-600" />
            <div className="text-[12px] font-black uppercase tracking-widest mb-2">Things you can't sell</div>
            <div className="text-[13px] font-bold opacity-70 leading-relaxed">What you cannot sell on campus.</div>
          </a>
        </div>
      </BulletinSection>

      {/* 01. Terms of Service */}
      <BulletinSection id="tos" title="01. Rules" subtitle="User Agreement" bgColor="bg-[var(--bulletin-bg)] border-t-4 border-[var(--bulletin-border)]">
        <div className="max-w-4xl space-y-10 py-8">
          <div className="prose prose-sm prose-slate max-w-none text-[var(--bulletin-text)]">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-6">By using QUADS</h3>
            <p className="text-base font-bold leading-relaxed opacity-80 mb-8">
              By accessing QUADS, you agree to comply with and be bound by these terms. This platform is strictly for students, staff, and faculty of the University of Mines and Technology (UMaT). Use of the platform for illegal activities or by non-institutional members is strictly prohibited.
            </p>

            <h3 className="text-2xl font-black uppercase tracking-tight mb-6">How to behave</h3>
            <ul className="list-none space-y-4 text-base font-bold opacity-80 border-l-4 border-[var(--bulletin-border)] pl-6">
              <li>— Users must represent items accurately in listings.</li>
              <li>— Harassment, spamming, or fraudulent behavior will result in immediate permanent suspension.</li>
              <li>— All physical meetups must occur in safe places on campus.</li>
              <li>— Trading of illegal substances, weapons, or academic-integrity-violating materials is banned.</li>
            </ul>
          </div>
        </div>
      </BulletinSection>

      {/* 02. Privacy Policy */}
      <BulletinSection id="privacy" title="02. Privacy Policy" subtitle="Data Handling" bgColor="bg-[#e8f4f8] dark:bg-[var(--bulletin-card)] border-t-4 border-[var(--bulletin-border)]">
        <div className="max-w-4xl space-y-10 py-8">
          <div className="border-l-8 border-[#ffd700] pl-8">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-6 text-[var(--bulletin-text)]">Information Collection</h3>
            <p className="text-base font-bold leading-relaxed opacity-80 mb-10 text-[var(--bulletin-text)]">
              We collect your name, institutional email, student ID (for verification purposes), and phone number. Your location is only used to facilitate on-campus pick-ups. We do NOT share your personal data with external marketing firms.
            </p>

            <h3 className="text-2xl font-black uppercase tracking-tight mb-6 text-[var(--bulletin-text)]">Security</h3>
            <p className="text-base font-bold leading-relaxed opacity-80 text-[var(--bulletin-text)]">
              User data is encrypted at rest and in transit. Student ID photos used for verification are deleted from our primary servers after the verification process is complete, maintaining only a 'Verified' status flag.
            </p>
          </div>
        </div>
      </BulletinSection>

      {/* 03. Buyer Protection */}
      <BulletinSection id="protection" title="03. Safety" subtitle="Payments & Problems" bgColor="bg-[var(--bulletin-bg)] border-t-4 border-[var(--bulletin-border)]">
        <div className="max-w-4xl py-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="bg-[#e0f2f7] dark:bg-sky-900/40 border-4 border-[var(--bulletin-border)] p-8 shadow-[8px_8px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(-0.5deg)' }}>
              <h4 className="font-black uppercase tracking-[0.2em] text-[12px] mb-4 text-black dark:text-sky-200">Secure Payment</h4>
              <p className="text-[14px] font-bold opacity-80 leading-relaxed text-black dark:text-sky-200">
                When you pay for an item, the funds are held by QUADS. The seller only receives payment once you confirm the item has been received and matches the description.
              </p>
            </div>

            <div className="bg-[var(--bulletin-card)] border-4 border-[var(--bulletin-border)] p-8 shadow-[8px_8px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(0.5deg)' }}>
              <h4 className="font-black uppercase tracking-[0.2em] text-[12px] mb-4 text-[var(--bulletin-text)]">Fixing Problems</h4>
              <p className="text-[14px] font-bold opacity-80 leading-relaxed text-[var(--bulletin-text)]">
                If an item is not as described, you can open a dispute. Our campus moderators will review the case. If the item is returned in its original condition, a refund is issued to your platform wallet.
              </p>
            </div>
          </div>
        </div>
      </BulletinSection>

      {/* 04. Prohibited Items */}
      <BulletinSection id="prohibited" title="04. Things you can't sell" subtitle="Safety Guidelines" bgColor="bg-[#fff0f0] dark:bg-red-900/20 border-t-4 border-[var(--bulletin-border)]">
        <div className="max-w-4xl py-8">
           <div className="bg-[var(--bulletin-card)] border-4 border-red-600 p-10 shadow-[12px_12px_0_0_rgba(220,38,38,0.5)] relative overflow-hidden" style={{ transform: 'rotate(-1deg)' }}>
             <div className="absolute top-0 right-0 h-32 w-32 bg-red-600 opacity-5 rotate-45 transform translate-x-1/2 -translate-y-1/2" />
             <div className="flex items-center gap-6 mb-10 relative z-10">
               <div className="p-4 border-4 border-red-600 bg-[var(--bulletin-bg)]">
                 <AlertCircle className="h-10 w-10 text-red-600" />
               </div>
               <h3 className="text-4xl font-black uppercase tracking-tighter text-red-600">Never sell these</h3>
             </div>
             <div className="grid gap-6 sm:grid-cols-2 text-[14px] font-black uppercase tracking-widest opacity-80 text-[var(--bulletin-text)] relative z-10">
               <div className="flex items-center gap-4"><span className="text-xl">❌</span> Alcohol & Narcotics</div>
               <div className="flex items-center gap-4"><span className="text-xl">❌</span> Counterfeit Currency</div>
               <div className="flex items-center gap-4"><span className="text-xl">❌</span> Exam Papers & Leaks</div>
               <div className="flex items-center gap-4"><span className="text-xl">❌</span> Prescription Meds</div>
               <div className="flex items-center gap-4"><span className="text-xl">❌</span> Weapons of any kind</div>
               <div className="flex items-center gap-4"><span className="text-xl">❌</span> Stolen Property</div>
             </div>
           </div>
        </div>
      </BulletinSection>

      {/* Final Clause */}
      <BulletinSection bgColor="bg-[var(--bulletin-card)]">
        <div className="text-center py-12 border-t-4 border-dashed border-[var(--bulletin-border)]/20 mt-8">
           <p className="text-[12px] font-black uppercase tracking-[0.3em] text-[var(--bulletin-text)] opacity-40 mb-4">Last Updated: May 2026</p>
           <p className="text-[var(--bulletin-text)] text-xl font-black uppercase tracking-tight">By using the platform, you acknowledge you have read and understood these policies.</p>
        </div>
      </BulletinSection>

    </BulletinLayout>
  );
};

export default TermsPage;