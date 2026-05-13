import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Search,
  XCircle,
  Shield,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

interface Dispute {
  _id: string;
  order: { _id: string; orderNumber: string; totalAmount: number; status: string };
  raisedBy: { _id: string; name: string; email: string };
  against: { _id: string; name: string; email: string };
  reason: string;
  description: string;
  evidence?: string[];
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  adminNote?: string;
  resolvedAt?: string;
  createdAt: string;
}

const REASON_LABELS: Record<string, string> = {
  item_not_received: 'Item not received',
  item_not_as_described: 'Item not as described',
  wrong_item: 'Wrong item sent',
  damaged_item: 'Item arrived damaged',
  seller_unresponsive: 'Seller unresponsive',
  fraud: 'Fraud / scam',
  other: 'Other',
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-[#fce4ec] text-black border-black',
  under_review: 'bg-[#fffacd] text-black border-black',
  resolved: 'bg-[#e0f2f7] text-black border-black',
  closed: 'bg-[#f0e8f4] text-black border-black',
};

const labelBase = 'text-[9px] font-bold uppercase tracking-[0.28em] opacity-40';

const DisputeCenterPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['myDisputes'],
    queryFn: async () => {
      const res = await api.get('/disputes/my');
      return res.data;
    },
  });

  const disputes: Dispute[] = data?.data?.disputes ?? [];
  const filtered = disputes.filter(
    (d) =>
      d.order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      REASON_LABELS[d.reason]?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <BulletinLayout title="Dispute Center" subtitle="Account" section="20">
      <BulletinSection bgColor="bg-[#faf8f5]">
        {/* Search */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order number or reason..."
              className="w-full pl-9 pr-4 py-2.5 border-0 border-b border-black bg-transparent text-[12px] font-bold focus:outline-none focus:ring-0 focus:border-black placeholder:text-black/30"
            />
          </div>
          <Link
            to="/orders"
            className="border border-black bg-white px-3 py-2.5 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
          >
            My Orders →
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-black bg-white p-5 animate-pulse">
                <div className="h-3 w-32 bg-black/10 mb-2" />
                <div className="h-2.5 w-64 bg-black/10" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-black bg-[#fffacd] px-8 py-20 text-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <Shield className="h-12 w-12 mx-auto opacity-40 mb-4" />
            <p className="text-sm font-bold uppercase tracking-wider opacity-60">
              {search ? 'No matching disputes' : 'No disputes'}
            </p>
            <p className="text-xs mt-1 opacity-50">
              {search
                ? 'Try a different search term.'
                : 'You have no open or past disputes. Disputes can be raised from an order detail page.'}
            </p>
          </div>
        ) : (
          <div className="border border-black divide-y divide-black/20 bg-white">
            {filtered.map((dispute) => (
              <div key={dispute._id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={labelBase}>Order #{dispute.order.orderNumber}</p>
                      <span className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${STATUS_STYLES[dispute.status]}`}>
                        {dispute.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[12px] font-bold">
                      {REASON_LABELS[dispute.reason] ?? dispute.reason}
                    </p>
                    <p className="text-[11px] opacity-60 mt-1 line-clamp-2">{dispute.description}</p>

                    {dispute.adminNote && (
                      <div className="mt-3 border-l-2 border-black pl-3">
                        <p className={`${labelBase} mb-0.5`}>Admin note</p>
                        <p className="text-[11px] opacity-70">{dispute.adminNote}</p>
                      </div>
                    )}

                    {dispute.evidence && dispute.evidence.length > 0 && (
                      <div className="mt-3">
                        <p className={`${labelBase} mb-2`}>Evidence</p>
                        <div className="flex flex-wrap gap-2">
                          {dispute.evidence.map((item, index) => (
                            <a
                              key={`${dispute._id}-${index}`}
                              href={item}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 border border-black px-2 py-1 text-[9px] font-bold uppercase hover:bg-[#f0e8f4] transition-colors"
                            >
                              View file →
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold">
                      GHS {dispute.order.totalAmount?.toFixed(2)}
                    </p>
                    <p className="text-[10px] opacity-40 mt-0.5">
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </p>
                    <Link
                      to={`/orders/${dispute.order._id}`}
                      className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase underline hover:no-underline opacity-60 hover:opacity-100 transition-opacity"
                    >
                      View order →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </BulletinSection>
    </BulletinLayout>
  );
};

export default DisputeCenterPage;