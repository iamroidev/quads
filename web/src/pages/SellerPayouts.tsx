import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowUpRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import adminService from '../services/admin.service';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

const SellerPayouts: React.FC = () => {
  const { data: payoutsData, isLoading } = useQuery({
    queryKey: ['sellerPayouts'],
    queryFn: () => adminService.getSellerPayouts({ limit: 50 }),
  });

  const payouts = payoutsData?.data?.payouts ?? [];
  
  const stats = {
    totalPaid: payouts.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + p.amount, 0),
    pending: payouts.filter((p: any) => p.status === 'pending' || p.status === 'processing').reduce((sum: number, p: any) => sum + p.amount, 0),
    count: payouts.length
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-[#d4edda] text-green-800 border-green-200';
      case 'processing': return 'bg-[#e0f2f7] text-sky-800 border-sky-200';
      case 'failed': return 'bg-[#fce4ec] text-red-800 border-red-200';
      default: return 'bg-[#fffacd] text-yellow-800 border-yellow-200';
    }
  };

  return (
    <BulletinLayout title="Earnings" subtitle="Payout Registry" section="19">
      {/* Overview stats */}
      <div className="border-b border-black dark:border-white/20 bg-black py-10 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-[#fffdf8] p-6 border-4 border-[#ff6b6b] shadow-[8px_8px_0_0_#ff6b6b]">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
                <TrendingUp className="h-3 w-3" />
                Lifetime Revenue
              </div>
              <div className="text-4xl font-black text-black">GHS {stats.totalPaid.toFixed(2)}</div>
            </div>
            <div className="bg-[#fffdf8] p-6 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,0.2)]">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
                <Clock className="h-3 w-3" />
                Awaiting Clearing
              </div>
              <div className="text-4xl font-black text-black">GHS {stats.pending.toFixed(2)}</div>
            </div>
            <div className="bg-[#fffdf8] p-6 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,0.2)]">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
                <CreditCard className="h-3 w-3" />
                Settlements
              </div>
              <div className="text-4xl font-black text-black">{stats.count}</div>
            </div>
          </div>
        </div>
      </div>

      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">Transaction Ledger</h3>
              <p className="text-[11px] font-bold opacity-40 uppercase tracking-widest mt-1">Automatic disbursement history</p>
            </div>
            <div className="bg-[#fffacd] px-3 py-1 border-2 border-black text-[9px] font-black uppercase">
              Schedule: Every 15 mins
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-black/5 animate-pulse border-2 border-black/10" />
              ))}
            </div>
          ) : payouts.length === 0 ? (
            <div className="border-4 border-dashed border-black/10 p-20 text-center">
              <AlertCircle className="h-10 w-10 mx-auto opacity-20 mb-4" />
              <p className="text-[10px] font-black uppercase opacity-40">No payouts recorded yet</p>
              <p className="text-xs mt-2 opacity-60">Earnings from your sales will appear here automatically.</p>
            </div>
          ) : (
            <div className="border-4 border-black bg-[var(--bulletin-card)] shadow-[12px_12px_0_0_var(--bulletin-shadow)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black text-white text-[10px] font-black uppercase tracking-widest">
                      <th className="px-6 py-4">Reference</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/5">
                    {payouts.map((payout: any) => (
                      <tr key={payout._id} className="hover:bg-black/5 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="text-[11px] font-black uppercase tracking-tight">#{payout._id.slice(-8)}</div>
                          <div className="text-[9px] opacity-40 uppercase font-bold mt-0.5">Order #{payout.order?.orderNumber || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-[11px] font-bold">{new Date(payout.createdAt).toLocaleDateString()}</div>
                          <div className="text-[9px] opacity-40 uppercase font-bold mt-0.5">{new Date(payout.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-2 py-1 border-2 border-black text-[8px] font-black uppercase tracking-widest ${getStatusStyle(payout.status)}`}>
                            {payout.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="text-sm font-black">GHS {payout.amount.toFixed(2)}</div>
                          {payout.commission > 0 && (
                            <div className="text-[9px] text-[#ff6b6b] font-bold mt-0.5">-{payout.commission.toFixed(2)} Fee</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="mt-12 p-8 border-4 border-black bg-[#faf8f5] dark:bg-black/20">
             <div className="flex gap-4 items-start">
               <div className="bg-[#ff6b6b] p-3 border-2 border-black">
                 <ArrowUpRight className="h-5 w-5 text-white" />
               </div>
               <div>
                 <h4 className="text-sm font-black uppercase">About Settlements</h4>
                 <p className="text-xs opacity-60 mt-2 leading-relaxed max-w-2xl">
                   QUADS uses an automated settlement engine. Funds are typically held for a short clearing period to ensure buyer satisfaction. Once cleared, they are automatically disbursed to your chosen <strong>{user?.sellerOnboarding?.payoutProvider || 'account'}</strong>.
                 </p>
               </div>
             </div>
          </div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default SellerPayouts;
