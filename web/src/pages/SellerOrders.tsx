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
  paid: 'bg-[#e0f2f7] text-black',
  confirmed: 'bg-[#f0e8f4] text-black',
  ready: 'bg-[#fff5e1] text-black',
  completed: 'bg-[#fffacd] text-black',
  cancelled: 'bg-[#fce4ec] text-black',
  pending: 'bg-[#f0e8f4] text-black',
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
    <BulletinLayout title="Seller Orders" subtitle="Dashboard" section="15">
      <BulletinSection bgColor="bg-[#faf8f5]">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div className="text-[10px] uppercase tracking-wider opacity-60">
            {pagination ? `${pagination.total} order${pagination.total !== 1 ? 's' : ''}` : ''}
          </div>
          <Link
            to="/seller/analytics"
            className="border border-black bg-white px-3 py-1.5 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
          >
            <BarChart2 className="inline-block h-3.5 w-3.5 mr-1" />
            Analytics
          </Link>
        </div>

        {/* Stats mosaic */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <BulletinCard rotation={-0.3} bgColor="bg-white">
              <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" /> Total
              </div>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </BulletinCard>
            <BulletinCard rotation={0.3} bgColor="bg-white">
              <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Pending
              </div>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            </BulletinCard>
            <BulletinCard rotation={-0.3} bgColor="bg-white">
              <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2 flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" /> Completed
              </div>
              <div className="text-2xl font-bold">{stats.completedOrders}</div>
            </BulletinCard>
            <BulletinCard rotation={0.3} bgColor="bg-white">
              <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Revenue
              </div>
              <div className="text-xl font-bold">
                GHS {stats.totalRevenue.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
              </div>
            </BulletinCard>
          </div>
        )}

        {/* Status tabs */}
        <div className="flex gap-0 border-b border-black mb-6 overflow-x-auto scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value as OrderStatus | '')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border-b-2 -mb-px transition-colors ${
                statusFilter === tab.value
                  ? 'border-black text-black'
                  : 'border-transparent opacity-40 hover:opacity-70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <LoadingSpinner text="Loading orders..." />
        ) : orders.length === 0 ? (
          <div className="border border-black bg-[#fffacd] p-12 text-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <Package className="h-12 w-12 mx-auto opacity-40 mb-4" />
            <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2">Empty</div>
            <div className="font-bold">
              {statusFilter ? `No ${statusFilter} orders` : 'No incoming orders yet'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const item = order.items[0];
              const nextAction = NEXT_STATUS[order.status];
              const isUpdating = updatingId === order._id;
              const canSellerCancel = ['paid', 'confirmed'].includes(order.status);

              return (
                <div key={order._id} className="border border-black bg-white p-4 shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
                     style={{ transform: `rotate(${Math.random() * 0.4 - 0.2}deg)` }}>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 border border-black bg-[#f8f7f4] flex-shrink-0 overflow-hidden">
                      {item?.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-40">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="text-[12px] font-bold truncate">{item?.title || 'Unknown'}</div>
                          <div className="text-[10px] opacity-60 mt-0.5">
                            #{order.orderNumber} &middot; {order.buyer.name}
                          </div>
                        </div>
                        <div className="text-base font-bold whitespace-nowrap">
                          GHS {order.totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className={`border border-black px-1.5 py-0.5 text-[9px] font-bold uppercase ${STATUS_STYLES[order.status] || 'bg-white'}`}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                        <span className="text-[10px] opacity-50 capitalize">{order.deliveryMethod}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {nextAction && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, nextAction.status)}
                            disabled={isUpdating}
                            className="border border-black bg-black px-3 py-1.5 text-[9px] font-bold uppercase text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black disabled:opacity-50 transition-all"
                          >
                            {isUpdating ? '...' : nextAction.label}
                          </button>
                        )}
                        {canSellerCancel && (
                          <button
                            onClick={() => handleCancelOrder(order._id)}
                            disabled={isUpdating}
                            className="border border-black bg-[#fce4ec] px-3 py-1.5 text-[9px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:opacity-50 transition-all"
                          >
                            <XCircle className="inline-block h-3 w-3 mr-0.5" />
                            Cancel
                          </button>
                        )}
                        <Link
                          to={`/orders/${order._id}`}
                          className="ml-auto border border-black bg-white px-2 py-1 text-[8px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
                        >
                          Details
                          <ArrowUpRight className="inline-block h-3 w-3 ml-0.5" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {order.note && (
                    <div className="mt-3 pt-3 border-t border-black text-[11px]">
                      <span className="font-bold uppercase text-[10px] opacity-60">Note: </span>
                      {order.note}
                    </div>
                  )}

                  {/* Mini tracking strip */}
                  {!['cancelled', 'disputed'].includes(order.status) && (
                    <div className="mt-3 pt-3 border-t border-black">
                      <div className="flex items-center gap-0">
                        {TRACKING_PIPELINE.map((step, idx) => {
                          const stepIdx = PIPELINE_ORDER.indexOf(order.status);
                          const isDone = idx < stepIdx;
                          const isCurrent = idx === stepIdx;
                          return (
                            <React.Fragment key={step.status}>
                              <div className="flex flex-col items-center">
                                <div className={`w-4 h-4 border border-black flex items-center justify-center ${
                                  isDone || isCurrent ? 'bg-black' : 'bg-white'
                                }`}>
                                  {isDone && <CheckCircle className="h-2.5 w-2.5 text-white" />}
                                </div>
                                <span className={`text-[7px] font-bold uppercase mt-0.5 ${
                                  isDone || isCurrent ? '' : 'opacity-30'
                                }`}>
                                  {step.label}
                                </span>
                              </div>
                              {idx < TRACKING_PIPELINE.length - 1 && (
                                <div className={`flex-1 h-px mx-0.5 mb-3.5 ${idx < stepIdx ? 'bg-black' : 'bg-black/20'}`} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] opacity-40 mt-2">
                    {new Date(order.createdAt).toLocaleDateString('en-GH', {
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
          <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-black">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border border-black bg-white px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] disabled:opacity-40 transition-all"
            >
              Previous
            </button>
            <span className="text-[10px] font-bold uppercase opacity-60">{page} / {pagination.pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="border border-black bg-white px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] disabled:opacity-40 transition-all"
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