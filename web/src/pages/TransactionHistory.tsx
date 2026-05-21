import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import api from '../services/api';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';

const TransactionHistory: React.FC = () => {
  const { data: txData, isLoading } = useQuery({
    queryKey: ['myTransactions'],
    queryFn: async () => {
      const response = await api.get('/transactions/my');
      return response.data;
    },
  });

  const transactions = txData?.data?.transactions ?? [];

  const stats = {
    totalPaid: transactions
      .filter((t: any) => t.status === 'success')
      .reduce((sum: number, t: any) => sum + t.amount, 0),
    refunded: transactions
      .filter((t: any) => t.status === 'refunded')
      .reduce((sum: number, t: any) => sum + t.amount, 0),
    count: transactions.length
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed': 
        return 'bg-[#d4edda] text-green-800 border-green-200';
      case 'refunded': 
        return 'bg-[#fff3cd] text-amber-800 border-amber-200';
      case 'failed': 
        return 'bg-[#fce4ec] text-red-800 border-red-200';
      default: 
        return 'bg-[#fffacd] text-yellow-800 border-yellow-200';
    }
  };

  return (
    <BulletinLayout title="Transactions" subtitle="Purchase Ledger" section="20">
      {/* Summary Row */}
      <div className="border-b border-black dark:border-white/20 bg-[#1f1a14] py-10 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-[#fffdf8] p-6 border-4 border-[#ff6b6b] shadow-[8px_8px_0_0_#ff6b6b]">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
                <TrendingUp className="h-3 w-3" />
                Total Spent
              </div>
              <div className="text-4xl font-black text-black">GHS {stats.totalPaid.toFixed(2)}</div>
            </div>
            <div className="bg-[#fffdf8] p-6 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,0.2)]">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
                <Clock className="h-3 w-3" />
                Refunded
              </div>
              <div className="text-4xl font-black text-[#ff6b6b]">GHS {stats.refunded.toFixed(2)}</div>
            </div>
            <div className="bg-[#fffdf8] p-6 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,0.2)]">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
                <FileText className="h-3 w-3" />
                Total Receipts
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
              <h3 className="text-2xl font-black uppercase tracking-tighter">Transaction History</h3>
              <p className="text-[11px] font-bold opacity-40 uppercase tracking-widest mt-1">Receipts for your purchases and deposits</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-black/5 animate-pulse border-2 border-black/10" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="border-4 border-dashed border-black/10 p-20 text-center">
              <AlertCircle className="h-10 w-10 mx-auto opacity-20 mb-4" />
              <p className="text-[10px] font-black uppercase opacity-40">No transactions recorded yet</p>
              <p className="text-xs mt-2 opacity-60">Once you make a purchase, your receipt ledger will appear here.</p>
            </div>
          ) : (
            <div className="border-4 border-black bg-[var(--bulletin-card)] shadow-[12px_12px_0_0_var(--bulletin-shadow)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black text-white text-[10px] font-black uppercase tracking-widest">
                      <th className="px-6 py-4">Reference</th>
                      <th className="px-6 py-4">Associated Order</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/5">
                    {transactions.map((tx: any) => (
                      <tr key={tx._id} className="hover:bg-black/5 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="text-[11px] font-black uppercase tracking-tight text-[#ff6b6b]">
                            {tx.reference}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {tx.order ? (
                            <Link 
                              to={`/orders/${tx.order._id}`} 
                              className="text-xs font-black underline hover:text-[#ff6b6b]"
                            >
                              Order #{tx.order.orderNumber}
                            </Link>
                          ) : tx.orders && tx.orders.length > 0 ? (
                            <div className="space-y-1">
                              {tx.orders.map((o: any) => (
                                <Link 
                                  key={o._id}
                                  to={`/orders/${o._id}`} 
                                  className="block text-xs font-black underline hover:text-[#ff6b6b]"
                                >
                                  Order #{o.orderNumber}
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs opacity-40">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-[11px] font-bold">
                            {new Date(tx.paidAt || tx.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-[9px] opacity-40 uppercase font-bold mt-0.5">
                            {new Date(tx.paidAt || tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-[10px] font-black uppercase bg-[#1f1a14]/5 px-2 py-0.5 border border-black/10">
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-2 py-1 border-2 border-black text-[8px] font-black uppercase tracking-widest ${getStatusStyle(tx.status)}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="text-sm font-black">GHS {tx.amount.toFixed(2)}</div>
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
                 <h4 className="text-sm font-black uppercase">Escrow Protection & Ledger</h4>
                 <p className="text-xs opacity-60 mt-2 leading-relaxed max-w-2xl">
                   QUADS safeguards all financial transactions in secure escrow. Your funds are only released to the seller after order delivery and verification. For any concerns, you can raise a dispute directly from your Order detail page.
                 </p>
               </div>
             </div>
          </div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default TransactionHistory;
