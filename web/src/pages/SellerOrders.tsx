import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  BarChart2,
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

const TRACKING_PIPELINE: { status: string; label: string }[] = [
  { status: 'pending', label: 'Placed' },
  { status: 'paid', label: 'Paid' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'ready', label: 'Ready' },
  { status: 'completed', label: 'Done' },
];
const PIPELINE_ORDER = TRACKING_PIPELINE.map((s) => s.status);

const STATUS_TABS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'paid', label: 'New / Paid' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const NEXT_STATUS: Record<string, { status: string; label: string }> = {
  paid: { status: 'confirmed', label: 'Confirm Order' },
  confirmed: { status: 'ready', label: 'Mark Ready' },
  ready: { status: 'completed', label: 'Mark Complete' },
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[#fffacd] dark:bg-yellow-900/40 text-black dark:text-yellow-200',
  paid: 'bg-[#e0f2f7] dark:bg-sky-900/40 text-black dark:text-sky-200',
  confirmed: 'bg-[#f0e8f4] dark:bg-purple-900/40 text-black dark:text-purple-200',
  ready: 'bg-[#fff5e1] dark:bg-orange-900/40 text-black dark:text-orange-200',
  completed: 'bg-[#fffacd] dark:bg-green-900/40 text-black dark:text-green-200',
  cancelled: 'bg-[#fce4ec] dark:bg-red-900/40 text-black dark:text-red-200',
};

interface SellerStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

const SellerOrders: React.FC = () => {
  const [orders, setOrders] = useState<OrderPopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getMySales(statusFilter || undefined, page, 20);
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

  const fetchStats = async () => {
    try {
      const res = await orderService.getSellerStats();
      if (res.success) setStats(res.data.stats);
    } catch {
      // silent
    }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter, page]);
  useEffect(() => { fetchStats(); }, []);

  const handleTabChange = (status: OrderStatus | '') => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await orderService.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => o._id === orderId ? { ...o, status: newStatus as OrderStatus } : o)
        );
        toast.success(`Order ${newStatus}`);
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setUpdatingId(orderId);
    try {
      const res = await orderService.cancelOrder(orderId, 'Seller cancelled');
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => o._id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o)
        );
        toast.success('Order cancelled');
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <BulletinLayout title="Seller Orders" subtitle="Hub" section="15">
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div className="text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">
            {pagination ? `${pagination.total} incoming transaction${pagination.total !== 1 ? 's' : ''}` : 'Sales Activity'}
          </div>
          <Link
            to="/seller/analytics"
            className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-6 py-2 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all text-[var(--bulletin-text)]"
          >
            <BarChart2 className="inline-block h-4 w-4 mr-2" />
            Insights
          </Link>
        </div>

        {/* Stats mosaic */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 flex items-center gap-2 text-[var(--bulletin-text)]">
                <Package className="h-4 w-4" /> Total Sales
              </div>
              <div className="text-3xl font-black text-[var(--bulletin-text)]">{stats.totalOrders}</div>
            </div>
            <div className="border-2 border-[var(--bulletin-border)] bg-[#e8f4f8] dark:bg-sky-900/10 p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 flex items-center gap-2 text-sky-900 dark:text-sky-200">
                <Clock className="h-4 w-4" /> Pending
              </div>
              <div className="text-3xl font-black text-sky-900 dark:text-sky-200">{stats.pendingOrders}</div>
            </div>
            <div className="border-2 border-[var(--bulletin-border)] bg-[#f0e8f4] dark:bg-purple-900/10 p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 flex items-center gap-2 text-purple-900 dark:text-purple-200">
                <CheckCircle className="h-4 w-4" /> Fulfilled
              </div>
              <div className="text-3xl font-black text-purple-900 dark:text-purple-200">{stats.completedOrders}</div>
            </div>
            <div className="border-2 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/10 p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 flex items-center gap-2 text-yellow-900 dark:text-yellow-200">
                <TrendingUp className="h-4 w-4" /> Revenue
              </div>
              <div className="text-xl font-black text-yellow-900 dark:text-yellow-200">
                GHS {stats.totalRevenue.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}

        {/* Status tabs */}
        <div className="flex gap-0 border-b-2 border-[var(--bulletin-border)] mb-8 overflow-x-auto scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value as OrderStatus | '')}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-4 -mb-px transition-colors ${
                statusFilter === tab.value
                  ? 'border-[var(--bulletin-border)] text-[var(--bulletin-text)]'
                  : 'border-transparent opacity-40 hover:opacity-100 text-[var(--bulletin-text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner text="Fetching store orders..." />
          </div>
        ) : orders.length === 0 ? (
          <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-12 text-center shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
            <Package className="h-12 w-12 mx-auto opacity-20 mb-4 text-[var(--bulletin-text)]" />
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-[var(--bulletin-text)]">Empty Queue</div>
            <div className="text-2xl font-black uppercase tracking-tight text-[var(--bulletin-text)]">
              {statusFilter ? `No ${statusFilter} orders found` : 'No incoming orders yet'}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => {
              const item = order.items[0];
              const nextAction = NEXT_STATUS[order.status];
              const isUpdating = updatingId === order._id;
              const canSellerCancel = ['paid', 'confirmed'].includes(order.status);

              return (
                <div key={order._id} className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)]"
                     style={{ transform: `rotate(${(idx % 2) * 0.4 - 0.2}deg)` }}>
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] flex-shrink-0 overflow-hidden shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
                      {item?.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20 text-[var(--bulletin-text)]">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="text-lg font-black uppercase tracking-tight text-[var(--bulletin-text)] line-clamp-1">{item?.title || 'Unknown Product'}</div>
                          <div className="text-[10px] font-bold opacity-40 mt-1 text-[var(--bulletin-text)] uppercase tracking-widest">
                            ID: {order.orderNumber} &middot; BUYER: {order.buyer.name}
                          </div>
                        </div>
                        <div className="text-xl font-black text-[var(--bulletin-text)] whitespace-nowrap">
                          GHS {order.totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <span className={`border-2 border-[var(--bulletin-border)] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${STATUS_STYLES[order.status] || 'bg-[var(--bulletin-card)]'}`}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">&middot; {order.deliveryMethod}</span>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        {nextAction && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, nextAction.status)}
                            disabled={isUpdating}
                            className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-6 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-50 transition-all"
                          >
                            {isUpdating ? 'Updating...' : nextAction.label}
                          </button>
                        )}
                        {canSellerCancel && (
                          <button
                            onClick={() => handleCancelOrder(order._id)}
                            disabled={isUpdating}
                            className="border-2 border-[var(--bulletin-border)] bg-red-50 dark:bg-red-900/10 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-red-700 dark:text-red-200 shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-50 transition-all"
                          >
                            <XCircle className="inline-block h-4 w-4 mr-2" />
                            Cancel
                          </button>
                        )}
                        <Link
                          to={`/orders/${order._id}`}
                          className="ml-auto border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--bulletin-text)] shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                        >
                          Details
                          <ArrowUpRight className="inline-block h-3 w-3 ml-2" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {order.note && (
                    <div className="mt-4 pt-4 border-t-2 border-[var(--bulletin-border)] text-sm font-medium italic text-[var(--bulletin-text)] opacity-70">
                      <span className="font-black uppercase tracking-widest text-[10px] opacity-40 not-italic mr-2">Buyer Note:</span>
                      "{order.note}"
                    </div>
                  )}

                  {/* Mini tracking strip */}
                  {!['cancelled', 'disputed'].includes(order.status) && (
                    <div className="mt-4 pt-4 border-t-2 border-[var(--bulletin-border)]">
                      <div className="flex items-center gap-0">
                        {TRACKING_PIPELINE.map((step, idx) => {
                          const stepIdx = PIPELINE_ORDER.indexOf(order.status);
                          const isDone = idx < stepIdx;
                          const isCurrent = idx === stepIdx;
                          return (
                            <React.Fragment key={step.status}>
                              <div className="flex flex-col items-center">
                                <div className={`w-5 h-5 border-2 border-[var(--bulletin-border)] flex items-center justify-center ${
                                  isDone || isCurrent ? 'bg-[var(--bulletin-text)]' : 'bg-[var(--bulletin-card)]'
                                }`}>
                                  {isDone && <CheckCircle className={`h-3 w-3 ${isDone || isCurrent ? 'text-[var(--bulletin-bg)]' : ''}`} />}
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-tight mt-2 ${
                                  isDone || isCurrent ? 'text-[var(--bulletin-text)]' : 'opacity-20 text-[var(--bulletin-text)]'
                                }`}>
                                  {step.label}
                                </span>
                              </div>
                              {idx < TRACKING_PIPELINE.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-1 mb-5 ${idx < stepIdx ? 'bg-[var(--bulletin-text)]' : 'bg-[var(--bulletin-text)]/10'}`} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-4 text-[var(--bulletin-text)] text-right">
                    Ordered {new Date(order.createdAt).toLocaleDateString('en-GH', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                </div>
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

export default SellerOrders;