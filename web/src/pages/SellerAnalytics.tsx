import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Clock,
  CheckCircle,
  BarChart2,
  ArrowRight,
  Package,
} from 'lucide-react';
import orderService from '../services/order.service';
import productService from '../services/product.service';
import growthService from '../services/growth.service';
import toast from 'react-hot-toast';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

const labelBase = 'text-[9px] font-bold uppercase tracking-[0.28em] opacity-40';

const statusColor: Record<string, string> = {
  pending: 'bg-[#f0e8f4] dark:bg-purple-900/30 text-black dark:text-purple-200 border-black dark:border-white/40',
  paid: 'bg-[#e0f2f7] dark:bg-sky-900/30 text-black dark:text-sky-200 border-black dark:border-white/40',
  confirmed: 'bg-[#f0e8f4] dark:bg-purple-900/30 text-black dark:text-purple-200 border-black dark:border-white/40',
  ready: 'bg-[#fff5e1] dark:bg-orange-900/30 text-black dark:text-orange-200 border-black dark:border-white/40',
  completed: 'bg-[#fffacd] dark:bg-yellow-900/30 text-black dark:text-yellow-200 border-black dark:border-white/40',
  cancelled: 'bg-[#fce4ec] dark:bg-red-900/30 text-black dark:text-red-200 border-black dark:border-white/40',
  disputed: 'bg-[#fce4ec] dark:bg-red-900/30 text-black dark:text-red-200 border-black dark:border-white/40',
};

const SellerAnalyticsPage: React.FC = () => {
  const [_tab] = useState<'overview' | 'orders'>('overview');
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState('10');
  const [newBundleName, setNewBundleName] = useState('');
  const [newBundleDiscount, setNewBundleDiscount] = useState('10');
  const [selectedBundleProductIds, setSelectedBundleProductIds] = useState<string[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [campaignStart, setCampaignStart] = useState('');
  const [campaignEnd, setCampaignEnd] = useState('');
  const [campaignCouponCode, setCampaignCouponCode] = useState('');
  const [campaignAB, setCampaignAB] = useState<'A' | 'B'>('A');

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['sellerStats'],
    queryFn: () => orderService.getSellerStats(),
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['mySales', undefined, 1, 10],
    queryFn: () => orderService.getMySales(undefined, 1, 10),
  });

  const { data: listingsData } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => productService.getMyListings({ limit: 30 } as any),
  });

  const { data: couponsData, refetch: refetchCoupons } = useQuery({
    queryKey: ['sellerCoupons'],
    queryFn: () => orderService.getSellerCoupons(),
  });

  const { data: bundlesData, refetch: refetchBundles } = useQuery({
    queryKey: ['sellerBundles'],
    queryFn: () => orderService.getSellerBundles(),
  });

  const { data: campaignsData, refetch: refetchCampaigns } = useQuery({
    queryKey: ['sellerCampaigns'],
    queryFn: () => growthService.listCampaigns(),
  });

  const stats = statsData?.data?.stats;
  const orders = salesData?.data?.orders ?? [];
  const listings = (listingsData as any)?.data ?? [];
  const coupons = (couponsData as any)?.data?.coupons ?? [];
  const bundles = (bundlesData as any)?.data?.bundles ?? [];
  const campaigns = (campaignsData as any)?.data ?? [];

  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalOrders = stats?.totalOrders ?? 0;
  const pendingOrders = stats?.pendingOrders ?? 0;
  const completedOrders = stats?.completedOrders ?? 0;
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  const createCoupon = async () => {
    if (!newCouponCode.trim() || Number(newCouponValue) <= 0) {
      toast.error('Enter valid coupon code and value');
      return;
    }
    try {
      const res = await orderService.createCoupon({
        code: newCouponCode.trim(),
        type: newCouponType,
        value: Number(newCouponValue),
      });
      if (res.success) {
        toast.success('Coupon created');
        setNewCouponCode('');
        refetchCoupons();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const toggleBundleProduct = (id: string) => {
    setSelectedBundleProductIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const createBundle = async () => {
    const discount = Number(newBundleDiscount);
    if (!newBundleName.trim()) {
      toast.error('Enter bundle name');
      return;
    }
    if (selectedBundleProductIds.length < 2) {
      toast.error('Select at least 2 products');
      return;
    }
    if (!Number.isFinite(discount) || discount <= 0 || discount >= 100) {
      toast.error('Discount must be between 1 and 99');
      return;
    }

    try {
      const res = await orderService.createBundle({
        name: newBundleName.trim(),
        productIds: selectedBundleProductIds,
        discountPercent: discount,
      });
      if (res.success) {
        toast.success('Bundle created');
        setNewBundleName('');
        setNewBundleDiscount('10');
        setSelectedBundleProductIds([]);
        refetchBundles();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create bundle');
    }
  };

  const createCampaign = async () => {
    if (!campaignName.trim() || !campaignStart || !campaignEnd) {
      toast.error('Set campaign name, start and end dates');
      return;
    }

    try {
      const res = await growthService.createCampaign({
        name: campaignName.trim(),
        startsAt: campaignStart,
        endsAt: campaignEnd,
        couponCode: campaignCouponCode.trim(),
        featuredBoost: true,
        abSlot: campaignAB,
        targetType: 'all',
      });
      if (res.success) {
        toast.success('Campaign scheduled');
        setCampaignName('');
        setCampaignCouponCode('');
        refetchCampaigns();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create campaign');
    }
  };

  const STAT_CARDS = [
    {
      label: 'Money Made',
      value: `GHS ${totalRevenue.toFixed(2)}`,
      icon: <DollarSign className="h-5 w-5" />,
      sub: 'Lifetime earnings',
    },
    {
      label: 'Total Sales',
      value: totalOrders,
      icon: <ShoppingBag className="h-5 w-5" />,
      sub: 'All time',
    },
    {
      label: 'Pending',
      value: pendingOrders,
      icon: <Clock className="h-5 w-5" />,
      sub: 'Awaiting action',
    },
    {
      label: 'Completed',
      value: completedOrders,
      icon: <CheckCircle className="h-5 w-5" />,
      sub: `${completionRate}% success rate`,
    },
  ];

  return (
    <BulletinLayout title="My Stats" subtitle="Selling" section="16">
      {/* Stat banner */}
      <div className="border-b border-[var(--bulletin-border)] bg-[#111] dark:bg-[#1a1a1a]">
        <div className="mx-auto max-w-[1400px] px-6 py-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-[#ff6b6b] mb-2">
                How you're doing
              </p>
              <h2 className="text-2xl font-bold text-white">Overview</h2>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/seller/orders"
                className="border border-white/30 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-white hover:text-white"
              >
                All orders →
              </Link>
              <Link
                to="/sell"
                className="bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-black transition-colors hover:bg-[#f0f0f0]"
              >
                + Add Item
              </Link>
            </div>
          </div>

          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-black/60 px-5 py-5 animate-pulse border border-white/10">
                  <div className="h-3 w-16 bg-white/10 mb-3" />
                  <div className="h-7 w-24 bg-white/10" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px border border-white/10">
              {STAT_CARDS.map((s) => (
                <div key={s.label} className="bg-black/80 px-5 py-5">
                  <div className="flex items-center gap-2 text-white/60 mb-1">
                    {s.icon}
                    <span className="text-[9px] font-bold uppercase tracking-[0.22em]">{s.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-[10px] text-white/40 mt-1">{s.sub}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="grid lg:grid-cols-[1fr_320px] gap-10">
          {/* Left — recent orders */}
          <div>
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className={labelBase}>Recent Sales</p>
                <div className="mt-1 text-lg font-bold">Recent orders</div>
              </div>
              <Link
                to="/seller/orders"
                className="text-[10px] font-bold uppercase tracking-[0.14em] underline hover:no-underline"
              >
                View all →
              </Link>
            </div>

            {salesLoading ? (
              <div className="border border-[var(--bulletin-border)] divide-y divide-[var(--bulletin-border)]/20">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-4 flex items-center justify-between animate-pulse">
                    <div className="space-y-1.5">
                      <div className="h-3 w-32 bg-[var(--bulletin-bg)]/40" />
                      <div className="h-2.5 w-20 bg-[var(--bulletin-bg)]/40" />
                    </div>
                    <div className="h-3 w-16 bg-[var(--bulletin-bg)]/40" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="border border-[var(--bulletin-border)] px-8 py-16 text-center bg-[var(--bulletin-card)]">
                <BarChart2 className="h-10 w-10 opacity-20 mx-auto mb-4" />
                <p className="text-sm font-bold uppercase opacity-60">No sales yet</p>
                <p className="text-xs mt-1 opacity-40">
                  Orders will show up here once someone buys your item.
                </p>
              </div>
            ) : (
              <div className="border border-[var(--bulletin-border)] divide-y divide-[var(--bulletin-border)]/20 bg-[var(--bulletin-card)]">
                {orders.map((order: any) => (
                  <Link
                    key={order._id}
                    to={`/orders/${order._id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-[var(--bulletin-bg)] transition-colors group"
                  >
                    <div>
                      <p className="text-[12px] font-bold">
                        {order.items?.[0]?.title ?? 'Order'}
                        {order.items?.length > 1 && (
                          <span className="opacity-40 font-normal"> +{order.items.length - 1} more</span>
                        )}
                      </p>
                      <p className="text-[10px] opacity-40 mt-0.5">
                        {order.orderNumber} &middot; {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`border border-[var(--bulletin-border)] px-1.5 py-0.5 text-[9px] font-bold uppercase ${statusColor[order.status] ?? 'bg-[var(--bulletin-card)]'}`}>
                        {order.status}
                      </span>
                      <span className="text-sm font-bold">
                        GHS {order.totalAmount?.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right — listings sidebar */}
          <div>
            <div className="mb-6">
              <p className={labelBase}>Your items</p>
              <div className="mt-1 text-lg font-bold">Items for sale</div>
            </div>

            {listings.length === 0 ? (
              <BulletinCard rotation={0.5} bgColor="bg-[#fffacd] dark:bg-yellow-900/20">
                <p className="text-[12px]">Nothing for sale yet.</p>
                <Link
                  to="/sell"
                  className="mt-3 inline-flex items-center gap-1.5 border border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-3 py-1.5 text-[9px] font-bold uppercase text-[var(--bulletin-bg)] transition-colors hover:bg-[var(--bulletin-card)] hover:text-[var(--bulletin-text)]"
                >
                  <Package className="h-3 w-3" />
                  Add first item
                </Link>
              </BulletinCard>
            ) : (
              <div className="space-y-2">
                {listings.map((p: any) => (
                  <div
                    key={p._id}
                    className="flex items-center gap-3 border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-3 shadow-[2px_2px_0_0_var(--bulletin-shadow)]"
                  >
                    {p.images?.[0]?.url ? (
                      <img
                        src={p.images[0].url}
                        alt={p.title}
                        className="h-12 w-12 object-cover border border-[var(--bulletin-border)] flex-shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 border border-[var(--bulletin-border)] bg-purple-100 dark:bg-purple-900/30 flex-shrink-0 flex items-center justify-center">
                        <Package className="h-5 w-5 opacity-40" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold truncate">{p.title}</p>
                      <p className="text-[10px] opacity-50">GHS {p.price?.toFixed(2)}</p>
                    </div>
                    <span className={`flex-shrink-0 border border-[var(--bulletin-border)] px-1.5 py-0.5 text-[8px] font-bold uppercase ${p.isAvailable ? 'bg-[#fffacd] dark:bg-yellow-900/30' : 'bg-[#fce4ec] dark:bg-red-900/30'}`}>
                      {p.isAvailable ? 'live' : 'sold'}
                    </span>
                  </div>
                ))}
                <Link
                  to="/my-listings"
                  className="flex items-center justify-center gap-2 border border-[var(--bulletin-border)] py-3 text-[10px] font-bold uppercase hover:bg-[var(--bulletin-card)] transition-colors"
                >
                  See all items →
                </Link>
              </div>
            )}

            {/* Completion rate card */}
            <BulletinCard rotation={-0.3} bgColor="bg-[var(--bulletin-card)]" className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 opacity-40" />
                <p className={labelBase}>Success rate</p>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-bold">{completionRate}%</span>
                <span className="text-[11px] opacity-50 mb-1">of sales finished</span>
              </div>
              <div className="h-2 bg-[#f0e8f4] dark:bg-purple-900/30 border border-[var(--bulletin-border)]">
                <div
                  className="h-full bg-[var(--bulletin-text)] transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </BulletinCard>

          </div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default SellerAnalyticsPage;