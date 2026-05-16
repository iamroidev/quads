import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import growthService from '../services/growth.service';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

const AdminGrowthPage: React.FC = () => {
  const [trustUserId, setTrustUserId] = useState('');
  const [trustType, setTrustType] = useState<'identity_verified' | 'safe_meetup' | 'scam_flag'>('safe_meetup');
  const [scoreDelta, setScoreDelta] = useState('5');

  const { data: analytics } = useQuery({
    queryKey: ['growthAnalyticsOverview'],
    queryFn: () => growthService.getAnalyticsOverview(),
  });

  const { data: ops } = useQuery({
    queryKey: ['growthOpsOverview'],
    queryFn: () => growthService.getOpsOverview(),
  });

  const addSignal = async () => {
    if (!trustUserId.trim()) {
      toast.error('Enter user ID');
      return;
    }
    try {
      await growthService.addTrustSignal({
        userId: trustUserId.trim(),
        type: trustType,
        scoreDelta: Number(scoreDelta),
      });
      toast.success('Trust signal recorded');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add trust signal');
    }
  };

  const funnel = analytics?.data?.funnel;
  const cohorts = analytics?.data?.cohorts || {};
  const opsData = ops?.data || {};

  const fieldBase = 'w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black placeholder:text-black/30';

  return (
    <BulletinLayout title="Platform Stats" subtitle="Control Panel" section="19">
      {/* Funnel stats */}
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="grid gap-6 sm:grid-cols-5">
          {[
            ['Views', funnel?.views || 0, 'bg-white'],
            ['Chats', funnel?.chats || 0, 'bg-white'],
            ['Orders', funnel?.orders || 0, 'bg-[#e0f2f7] dark:bg-sky-900/30'],
            ['View→Chat', `${Math.round((funnel?.viewToChatRate || 0) * 100)}%`, 'bg-[#fffacd] dark:bg-yellow-900/20'],
            ['Chat→Order', `${Math.round((funnel?.chatToOrderRate || 0) * 100)}%`, 'bg-[#f0e8f4] dark:bg-purple-900/20'],
          ].map(([label, val, color], idx) => (
            <BulletinCard 
              key={label as string} 
              rotation={(idx % 2 === 0 ? 0.8 : -0.8)} 
              bgColor={color as string}
              className="group"
            >
              <div className="text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">{label as string}</div>
              <div className="mt-2 text-3xl font-black tracking-tighter text-[var(--bulletin-text)] group-hover:text-[#ff6b6b] transition-colors">{val as any}</div>
            </BulletinCard>
          ))}
        </div>
      </BulletinSection>

      <BulletinSection bgColor="bg-[var(--bulletin-card)] border-t-4 border-black">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Cohort retention */}
          <div className="relative">
            <div className="absolute -top-3 left-10 h-6 w-32 bg-[#ffd700]/60 rotate-[-1deg] z-10" />
            <BulletinCard rotation={-0.3} className="!p-8 border-4 border-black">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)] mb-6">User Activity</div>
              <div className="space-y-3">
                {Object.entries(cohorts).map(([month, val]: any) => (
                  <div key={month} className="flex justify-between border-2 border-black/10 bg-black/5 dark:bg-white/5 px-4 py-3 text-[12px] font-black uppercase">
                    <span className="text-[var(--bulletin-text)]">{month}</span>
                    <span className="opacity-60 text-[var(--bulletin-text)]">Signups {val.signup} · Orders {val.order}</span>
                  </div>
                ))}
                {Object.keys(cohorts).length === 0 && (
                  <p className="text-[12px] font-bold opacity-30 text-center py-8">Waiting for Cohort Events...</p>
                )}
              </div>
            </BulletinCard>
          </div>

          {/* Trust workflow */}
          <div className="relative">
            <div className="absolute -top-3 right-10 h-6 w-6 rounded-full bg-red-600 border-2 border-black z-10" />
            <BulletinCard rotation={0.3} className="!p-8 border-4 border-black bg-[#fffacd] dark:bg-yellow-900/20">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-40 text-black dark:text-yellow-200 mb-6">Trust Control</div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest opacity-40 mb-2 text-black dark:text-yellow-200">Target User ID</label>
                  <input 
                    value={trustUserId} 
                    onChange={(e) => setTrustUserId(e.target.value)} 
                    placeholder="Enter ID..." 
                    className="w-full border-4 border-black bg-white dark:bg-black/20 p-3 text-[13px] font-black focus:outline-none" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest opacity-40 mb-2 text-black dark:text-yellow-200">Trust Reason</label>
                    <select 
                      value={trustType} 
                      onChange={(e) => setTrustType(e.target.value as any)} 
                      className="w-full border-4 border-black bg-white dark:bg-black/20 p-3 text-[12px] font-black focus:outline-none"
                    >
                      <option value="safe_meetup">Safe Meetup Verified</option>
                      <option value="identity_verified">Identity Documents OK</option>
                      <option value="scam_flag">⚠️ Suspected Fraud</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest opacity-40 mb-2 text-black dark:text-yellow-200">Score Change</label>
                    <input 
                      value={scoreDelta} 
                      onChange={(e) => setScoreDelta(e.target.value)} 
                      placeholder="e.g. 5" 
                      className="w-full border-4 border-black bg-white dark:bg-black/20 p-3 text-[12px] font-black focus:outline-none" 
                    />
                  </div>
                </div>
                <button 
                  onClick={addSignal} 
                  className="w-full border-4 border-black bg-black text-white py-4 text-[11px] font-black uppercase hover:bg-[#ff6b6b] transition-all shadow-[6px_6px_0_0_rgba(0,0,0,0.2)]"
                >
                  Save Trust Change
                </button>
              </div>
            </BulletinCard>
          </div>
        </div>
      </BulletinSection>

      {/* Ops overview */}
      <BulletinSection bgColor="bg-[var(--bulletin-bg)] border-t-4 border-black">
        <BulletinCard rotation={0} className="!p-8 border-4 border-black bg-[var(--bulletin-card)]">
          <div className="text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)] mb-8">System Summary</div>
          <div className="grid gap-4 sm:grid-cols-5">
            {[
              ['Moderation Queue', opsData.moderationQueue || 0],
              ['Open Orders', opsData.openOrders || 0],
              ['Failed Payments', opsData.failedPayments || 0],
              ['Disputes', opsData.disputes || 0],
              ['Pending Replies', opsData.pendingReviewReplies || 0],
            ].map(([label, val]) => (
              <div key={label as string} className="border-2 border-black/10 p-4 bg-black/5 dark:bg-white/5 flex flex-col items-center text-center">
                <span className="text-[11px] font-black uppercase tracking-tighter text-[var(--bulletin-text)]">{val as any}</span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)] mt-1">{label as string}</span>
              </div>
            ))}
          </div>

          <div className="grid gap-8 md:grid-cols-2 mt-12">
            {Array.isArray(opsData.retryJobs) && opsData.retryJobs.length > 0 && (
              <div className="border-4 border-black bg-[#faf8f5] dark:bg-black/20 p-6">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)] mb-4">Background Fixes</p>
                <div className="space-y-2">
                  {opsData.retryJobs.slice(0, 5).map((job: any) => (
                    <p key={job._id} className="text-[12px] font-bold text-[var(--bulletin-text)] flex justify-between border-b-2 border-black/5 pb-2">
                      <span className="uppercase">{job.type}</span>
                      <span className="opacity-50 text-[10px]">ATTEMPTS {job.attempts}/{job.maxAttempts}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(opsData.importAuditLogs) && opsData.importAuditLogs.length > 0 && (
              <div className="border-4 border-black bg-[#e0f2f7] dark:bg-sky-900/20 p-6">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-sky-900 dark:text-sky-200 mb-4">System Logs</p>
                <div className="space-y-2">
                  {opsData.importAuditLogs.slice(0, 5).map((log: any) => (
                    <p key={log._id} className="text-[12px] font-bold text-sky-900 dark:text-sky-200 flex justify-between border-b-2 border-black/10 pb-2">
                      <span className="uppercase">{log.action}</span>
                      <span className="opacity-50 text-[10px]">{log.status}</span>
                    </p>
                  ))}
                </div>
                <Link to="/admin" className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase underline decoration-2 underline-offset-4 text-sky-900 dark:text-sky-200 hover:opacity-70 transition-all">
                  Open System Control →
                </Link>
              </div>
            )}
          </div>
        </BulletinCard>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default AdminGrowthPage;