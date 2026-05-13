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
    <BulletinLayout title="Growth & Ops Suite" subtitle="Admin" section="19">
      {/* Funnel stats */}
      <BulletinSection bgColor="bg-[#faf8f5]">
        <div className="grid gap-4 sm:grid-cols-5">
          {[
            ['Views', funnel?.views || 0],
            ['Chats', funnel?.chats || 0],
            ['Orders', funnel?.orders || 0],
            ['View→Chat', `${Math.round((funnel?.viewToChatRate || 0) * 100)}%`],
            ['Chat→Order', `${Math.round((funnel?.chatToOrderRate || 0) * 100)}%`],
          ].map(([label, val]) => (
            <BulletinCard key={label as string} rotation={Math.random() * 0.8 - 0.4} bgColor="bg-white">
              <div className="text-[10px] uppercase tracking-wider opacity-50">{label as string}</div>
              <div className="mt-1 text-2xl font-bold">{val as any}</div>
            </BulletinCard>
          ))}
        </div>
      </BulletinSection>

      <BulletinSection bgColor="bg-[#f5f9fa]">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Cohort retention */}
          <BulletinCard rotation={-0.3} bgColor="bg-white">
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-50">Cohort retention proxy</div>
            <div className="mt-4 space-y-2">
              {Object.entries(cohorts).map(([month, val]: any) => (
                <div key={month} className="flex justify-between border border-black bg-white px-3 py-2 text-[11px]">
                  <span className="font-bold">{month}</span>
                  <span className="opacity-60">Signups {val.signup} · Orders {val.order}</span>
                </div>
              ))}
              {Object.keys(cohorts).length === 0 && <p className="text-[11px] opacity-40">No cohort events yet.</p>}
            </div>
          </BulletinCard>

          {/* Trust workflow */}
          <BulletinCard rotation={0.3} bgColor="bg-[#e0f2f7]">
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-50">Trust workflow</div>
            <div className="mt-4 space-y-2">
              <input value={trustUserId} onChange={(e) => setTrustUserId(e.target.value)} placeholder="User ID" className={fieldBase} />
              <div className="grid grid-cols-2 gap-2">
                <select value={trustType} onChange={(e) => setTrustType(e.target.value as any)} className={fieldBase}>
                  <option value="safe_meetup">Safe meetup</option>
                  <option value="identity_verified">Identity verified</option>
                  <option value="scam_flag">Scam flag</option>
                </select>
                <input value={scoreDelta} onChange={(e) => setScoreDelta(e.target.value)} placeholder="Score delta" className={fieldBase} />
              </div>
              <button onClick={addSignal} className="w-full border border-black bg-black py-2 text-[10px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black">Add trust signal</button>
            </div>
          </BulletinCard>
        </div>
      </BulletinSection>

      {/* Ops overview */}
      <BulletinSection bgColor="bg-[#faf8f3]">
        <BulletinCard rotation={0} bgColor="bg-white">
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-50">Ops overview</div>
          <div className="mt-4 grid gap-2 sm:grid-cols-5">
            {[
              ['Moderation Queue', opsData.moderationQueue || 0],
              ['Open Orders', opsData.openOrders || 0],
              ['Failed Payments', opsData.failedPayments || 0],
              ['Disputes', opsData.disputes || 0],
              ['Pending Replies', opsData.pendingReviewReplies || 0],
            ].map(([label, val]) => (
              <div key={label as string} className="border border-black px-3 py-2 text-[11px] flex justify-between">
                <span className="opacity-60 uppercase tracking-wider font-bold">{label as string}</span>
                <span className="font-bold">{val as any}</span>
              </div>
            ))}
          </div>

          {Array.isArray(opsData.retryJobs) && opsData.retryJobs.length > 0 && (
            <div className="mt-4 border border-black bg-[#f8f7f4] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2">Recent retry jobs</p>
              <div className="space-y-1">
                {opsData.retryJobs.slice(0, 5).map((job: any) => (
                  <p key={job._id} className="text-[11px]">
                    <span className="font-bold uppercase">{job.type}</span> · {job.status} · attempts {job.attempts}/{job.maxAttempts}
                  </p>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(opsData.importAuditLogs) && opsData.importAuditLogs.length > 0 && (
            <div className="mt-4 border border-black bg-[#f8f7f4] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2">Recent audit logs</p>
              <div className="space-y-1">
                {opsData.importAuditLogs.slice(0, 5).map((log: any) => (
                  <p key={log._id} className="text-[11px]">
                    <span className="font-bold uppercase">{log.action}</span> · {log.scope} · {log.status}
                  </p>
                ))}
              </div>
              <Link to="/admin" className="mt-3 inline-block text-[10px] font-bold uppercase underline hover:no-underline opacity-60 hover:opacity-100">Open full ops console</Link>
            </div>
          )}
        </BulletinCard>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default AdminGrowthPage;