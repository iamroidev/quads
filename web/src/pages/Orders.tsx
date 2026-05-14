import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import orderService from '../services/order.service';
import { LoadingSpinner } from '../components/ui';
import {
  OrderPopulated,
  OrderStatus,
  ORDER_STATUS_LABELS,
  PaginationInfo,
} from '../types';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

const STATUS_TABS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const statusStyles: Record<string, string> = {
  pending: 'bg-[#fffacd] dark:bg-yellow-900/40 text-black dark:text-yellow-200',
  paid: 'bg-[#e0f2f7] dark:bg-sky-900/40 text-black dark:text-sky-200',
  confirmed: 'bg-[#f0e8f4] dark:bg-purple-900/40 text-black dark:text-purple-200',
  ready: 'bg-[#fff5e1] dark:bg-orange-900/40 text-black dark:text-orange-200',
  completed: 'bg-[#fffacd] dark:bg-green-900/40 text-black dark:text-green-200',
  cancelled: 'bg-[#fce4ec] dark:bg-red-900/40 text-black dark:text-red-200',
  disputed: 'bg-[#fce4ec] dark:bg-red-900/40 text-black dark:text-red-200',
};

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderPopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getMyPurchases(
        statusFilter || undefined,
        page,
        20
      );
      if (res.success) {
        setOrders(res.data.orders);
        setPagination(res.pagination);
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, page]);

  const handleTabChange = (status: OrderStatus | '') => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <BulletinLayout title="My Orders" subtitle="Purchases" section="05">
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        {/* Status tabs */}
        <div className="flex gap-0 overflow-x-auto mb-6 border-b border-[var(--bulletin-border)] scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value as OrderStatus | '')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 -mb-px transition-colors ${
                statusFilter === tab.value
                  ? 'border-[var(--bulletin-border)] text-[var(--bulletin-text)]'
                  : 'border-transparent opacity-40 hover:opacity-100 text-[var(--bulletin-text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner text="Fetching your purchases..." />
          </div>
        ) : orders.length === 0 ? (
          <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-12 text-center shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
            <ShoppingBag className="h-12 w-12 mx-auto opacity-20 mb-4 text-[var(--bulletin-text)]" />
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-[var(--bulletin-text)]">Empty Inventory</div>
            <div className="text-2xl font-black uppercase tracking-tight mb-6 text-[var(--bulletin-text)]">
              {statusFilter
                ? `No ${statusFilter} orders found`
                : 'You haven\'t bought anything yet'}
            </div>
            <Link
              to="/products"
              className="inline-block border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-8 py-3 text-[10px] font-black uppercase text-[var(--bulletin-bg)] transition-all hover:bg-[#ff6b6b] hover:text-white shadow-[4px_4px_0_0_var(--bulletin-shadow)]"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => {
              const item = order.items[0];
              return (
                <Link
                  key={order._id}
                  to={`/orders/${order._id}`}
                  className="block border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-4 shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0_0_var(--bulletin-shadow)]"
                  style={{ transform: `rotate(${(idx % 3 - 1) * 0.3}deg)` }}
                >
                  <div className="flex items-center gap-4">
                    {/* Product image */}
                    <div className="w-16 h-16 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] flex-shrink-0 overflow-hidden shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
                      {item?.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20 text-[var(--bulletin-text)]">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-black uppercase tracking-tight text-[var(--bulletin-text)] line-clamp-1">
                            {item?.title || 'Unknown Product'}
                          </div>
                          <div className="text-[10px] font-bold opacity-40 mt-1 text-[var(--bulletin-text)]">
                            ID: {order.orderNumber} &middot; STORE: {(order.seller as any).storeName || (order.seller as any).brandName || order.seller.name}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 opacity-20 flex-shrink-0 mt-0.5 text-[var(--bulletin-text)]" />
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className={`border-2 border-[var(--bulletin-border)] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${statusStyles[order.status] || 'bg-[var(--bulletin-card)]'}`}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                        <span className="text-lg font-black text-[var(--bulletin-text)]">
                          GHS {order.totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-2 text-[var(--bulletin-text)]">
                        {new Date(order.createdAt).toLocaleDateString('en-GH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-6 mt-12 pt-8 border-t-2 border-[var(--bulletin-border)]">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-6 py-2 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-20 transition-all text-[var(--bulletin-text)]"
            >
              Prev
            </button>
            <span className="text-[11px] font-black uppercase tracking-tighter text-[var(--bulletin-text)]">
              {page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-6 py-2 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-20 transition-all text-[var(--bulletin-text)]"
            >
              Next
            </button>
          </div>
        )}
      </BulletinSection>
    </BulletinLayout>
  );
};

export default Orders;