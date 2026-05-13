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
  pending: 'bg-[#fffacd] text-black',
  paid: 'bg-[#e0f2f7] text-black',
  confirmed: 'bg-[#f0e8f4] text-black',
  ready: 'bg-[#fff5e1] text-black',
  completed: 'bg-[#fffacd] text-black',
  cancelled: 'bg-[#fce4ec] text-black',
  disputed: 'bg-[#fce4ec] text-black',
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
      <BulletinSection bgColor="bg-[#faf8f5]">
        {/* Status tabs */}
        <div className="flex gap-0 overflow-x-auto mb-6 border-b border-black scrollbar-hide">
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

        {/* Orders list */}
        {loading ? (
          <LoadingSpinner text="Loading orders..." />
        ) : orders.length === 0 ? (
          <div className="border border-black bg-[#fffacd] p-12 text-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <ShoppingBag className="h-12 w-12 mx-auto opacity-40 mb-4" />
            <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2">Empty</div>
            <div className="text-lg font-bold mb-4">
              {statusFilter
                ? `No ${statusFilter} orders`
                : 'No purchases yet'}
            </div>
            <Link
              to="/products"
              className="inline-block border border-black bg-black px-4 py-2 text-[10px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, idx) => {
              const item = order.items[0];
              return (
                <Link
                  key={order._id}
                  to={`/orders/${order._id}`}
                  className="block border border-black bg-white p-3 shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[5px_5px_0_0_rgba(0,0,0,1)]"
                  style={{ transform: `rotate(${(idx % 3 - 1) * 0.3}deg)` }}
                >
                  <div className="flex items-center gap-3">
                    {/* Product image */}
                    <div className="w-14 h-14 border border-black bg-[#f8f7f4] flex-shrink-0 overflow-hidden">
                      {item?.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-40">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[12px] font-bold line-clamp-1">
                            {item?.title || 'Unknown Product'}
                          </div>
                          <div className="text-[10px] opacity-60 mt-0.5">
                            #{order.orderNumber} &middot; {(order.seller as any).storeName || (order.seller as any).brandName || order.seller.name}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-30 flex-shrink-0 mt-0.5" />
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className={`border border-black px-1.5 py-0.5 text-[9px] font-bold uppercase ${statusStyles[order.status] || 'bg-white'}`}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                        <span className="text-[13px] font-bold">
                          GHS {order.totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="text-[10px] opacity-50 mt-1">
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
          <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-black">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border border-black bg-white px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] disabled:opacity-40 transition-all"
            >
              Previous
            </button>
            <span className="text-[10px] font-bold uppercase opacity-60">
              {page} / {pagination.pages}
            </span>
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

export default Orders;