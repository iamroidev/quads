import React from 'react';
import { Shield, Lock, Eye, Server, UserCheck } from 'lucide-react';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <BulletinLayout title="Privacy" subtitle="Your Data Rights" section="11">
      
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="max-w-4xl mx-auto space-y-12 py-12">
          
          {/* Header Card */}
          <div className="border-4 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/20 p-10 shadow-[12px_12px_0_0_var(--bulletin-shadow)] relative overflow-hidden" style={{ transform: 'rotate(-0.5deg)' }}>
            <div className="absolute top-0 right-0 h-32 w-32 bg-yellow-500 opacity-10 rotate-45 transform translate-x-1/2 -translate-y-1/2" />
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 relative z-10 text-black dark:text-yellow-100">Privacy Policy</h2>
            <p className="text-lg font-bold leading-relaxed opacity-80 text-black dark:text-yellow-100 relative z-10">
              At QUADS, your privacy is our priority. This policy outlines how we collect, use, and protect your personal information within the UMaT student community.
            </p>
            <div className="mt-8 pt-6 border-t-2 border-black/10 text-[11px] font-black uppercase tracking-widest text-black dark:text-yellow-100">
              Last Updated: May 16, 2026
            </div>
          </div>

          {/* 1. Data Collection */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 border-4 border-black bg-white dark:bg-black/40">
                <UserCheck className="h-6 w-6 text-[#ff6b6b]" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">1. Information We Collect</h3>
            </div>
            <div className="border-l-4 border-[var(--bulletin-border)] pl-8 space-y-4 text-base font-bold opacity-80">
              <p>We collect information to provide a secure marketplace for students, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Identity Info:</strong> Full name, institutional email address (@student.umat.edu.gh), and student ID number.</li>
                <li><strong>Contact Info:</strong> Phone number and optional campus location (hostel/hall).</li>
                <li><strong>Transaction Info:</strong> Details of items you buy or sell, including payment history via Paystack.</li>
                <li><strong>Device Info:</strong> IP address and browser type for security and fraud prevention.</li>
              </ul>
            </div>
          </div>

          {/* 2. Use of Data */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 border-4 border-black bg-white dark:bg-black/40">
                <Eye className="h-6 w-6 text-sky-500" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">2. How We Use Your Data</h3>
            </div>
            <div className="border-l-4 border-[var(--bulletin-border)] pl-8 space-y-4 text-base font-bold opacity-80">
              <p>Your data is used strictly for platform operations:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Verifying that you are a legitimate member of the UMaT community.</li>
                <li>Facilitating communication between buyers and sellers.</li>
                <li>Processing payments and managing the secure escrow system.</li>
                <li>Improving platform security and preventing fraudulent listings.</li>
              </ul>
              <div className="p-4 bg-[#e0f2f7] dark:bg-sky-900/20 border-2 border-dashed border-sky-500 text-sky-800 dark:text-sky-200 text-sm italic">
                We NEVER sell your personal data to third-party advertisers or external marketing agencies.
              </div>
            </div>
          </div>

          {/* 3. Data Storage & Security */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 border-4 border-black bg-white dark:bg-black/40">
                <Server className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">3. Security & Retention</h3>
            </div>
            <div className="border-l-4 border-[var(--bulletin-border)] pl-8 space-y-4 text-base font-bold opacity-80">
              <p>We use industry-standard encryption to protect your data:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Encryption:</strong> Data is encrypted both in transit (SSL/TLS) and at rest.</li>
                <li><strong>Verification Cleanup:</strong> Sensitive documents uploaded for identity verification are purged from our active storage after verification is successful.</li>
                <li><strong>Retention:</strong> We retain account data only as long as your account is active or as needed to provide you with services.</li>
              </ul>
            </div>
          </div>

          {/* 4. Your Rights */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 border-4 border-black bg-white dark:bg-black/40">
                <Lock className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">4. Your Data Rights</h3>
            </div>
            <div className="border-l-4 border-[var(--bulletin-border)] pl-8 space-y-4 text-base font-bold opacity-80">
              <p>You have full control over your information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> You can request a copy of the personal data we hold about you.</li>
                <li><strong>Correction:</strong> You can update your profile information at any time via Settings.</li>
                <li><strong>Deletion:</strong> You can request to delete your account and all associated data via the Settings page.</li>
              </ul>
            </div>
          </div>

          {/* 5. Contact Info */}
          <div className="border-t-4 border-black pt-12">
            <h3 className="text-xl font-black uppercase tracking-widest mb-6">Contact Privacy Team</h3>
            <p className="text-sm font-bold opacity-70 mb-8">
              If you have questions about this policy or your data, contact our security officer at:
            </p>
            <div className="inline-block border-4 border-black bg-black text-white px-8 py-4 font-black uppercase tracking-widest">
              privacy@quadsmarket.tech
            </div>
          </div>

        </div>
      </BulletinSection>

    </BulletinLayout>
  );
};

export default PrivacyPolicyPage;
