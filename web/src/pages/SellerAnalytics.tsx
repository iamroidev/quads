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
  pending: 'bg-[#f0e8f4] text-black border-black',
  paid: 'bg-[#e0f2f7] text-black border-black',
  confirmed: 'bg-[#f0e8f4] text-black border-black',
  ready: 'bg-[#fff5e1] text-black border-black',
  completed: 'bg-[#fffacd] text-black border-black',
  cancelled: 'bg-[#fce4ec] text-black border-black',
  disputed: 'bg-[#fce4ec] text-black border-black',
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
      label: 'Total Revenue',
      value: `GHS ${totalRevenue.toFixed(2)}`,
      icon: <DollarSign className="h-5 w-5" />,
      sub: 'Lifetime earnings',
    },
    {
      label: 'Total Orders',
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
      sub: `${completionRate}% completion rate`,
    },
  ];

  return (
    <BulletinLayout title="Analytics" subtitle="Seller" section="16">
      {/* Stat banner */}
      <div className="border-b border-black bg-black">
        <div className="mx-auto max-w-[1400px] px-6 py-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/20 mb-2">
                Seller Performance
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
                + New listing
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
                  <div className="flex items-center gap-2 text-white/30 mb-1">
                    {s.icon}
                    <span className="text-[9px] font-bold uppercase tracking-[0.22em]">{s.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-[10px] text-white/25 mt-1">{s.sub}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BulletinSection bgColor="bg-[#faf8f5]">
        <div className="grid lg:grid-cols-[1fr_320px] gap-10">
          {/* Left — recent orders */}
          <div>
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className={labelBase}>Activity</p>
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
              <div className="border border-black divide-y divide-black/20">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-4 flex items-center justify-between animate-pulse">
                    <div className="space-y-1.5">
                      <div className="h-3 w-32 bg-black/10" />
                      <div className="h-2.5 w-20 bg-black/10" />
                    </div>
                    <div className="h-3 w-16 bg-black/10" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="border border-black px-8 py-16 text-center bg-white">
                <BarChart2 className="h-10 w-10 opacity-20 mx-auto mb-4" />
                <p className="text-sm font-bold uppercase opacity-60">No orders yet</p>
                <p className="text-xs mt-1 opacity-40">
                  Orders will appear here once buyers purchase your listings.
                </p>
              </div>
            ) : (
              <div className="border border-black divide-y divide-black/20 bg-white">
                {orders.map((order: any) => (
                  <Link
                    key={order._id}
                    to={`/orders/${order._id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-[#f8f7f4] transition-colors group"
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
                      <span className={`border border-black px-1.5 py-0.5 text-[9px] font-bold uppercase ${statusColor[order.status] ?? 'bg-white'}`}>
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
              <p className={labelBase}>Your listings</p>
              <div className="mt-1 text-lg font-bold">Active products</div>
            </div>

            {listings.length === 0 ? (
              <BulletinCard rotation={0.5} bgColor="bg-[#fffacd]">
                <p className="text-[12px]">No listings yet.</p>
                <Link
                  to="/sell"
                  className="mt-3 inline-flex items-center gap-1.5 border border-black bg-black px-3 py-1.5 text-[9px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black"
                >
                  <Package className="h-3 w-3" />
                  Create first
                </Link>
              </BulletinCard>
            ) : (
              <div className="space-y-2">
                {listings.map((p: any) => (
                  <div
                    key={p._id}
                    className="flex items-center gap-3 border border-black bg-white p-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                  >
                    {p.images?.[0]?.url ? (
                      <img
                        src={p.images[0].url}
                        alt={p.title}
                        className="h-12 w-12 object-cover border border-black flex-shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 border border-black bg-[#f0e8f4] flex-shrink-0 flex items-center justify-center">
                        <Package className="h-5 w-5 opacity-40" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold truncate">{p.title}</p>
                      <p className="text-[10px] opacity-50">GHS {p.price?.toFixed(2)}</p>
                    </div>
                    <span className={`flex-shrink-0 border border-black px-1.5 py-0.5 text-[8px] font-bold uppercase ${p.isAvailable ? 'bg-[#fffacd]' : 'bg-[#fce4ec]'}`}>
                      {p.isAvailable ? 'live' : 'sold'}
                    </span>
                  </div>
                ))}
                <Link
                  to="/my-listings"
                  className="flex items-center justify-center gap-2 border border-black py-3 text-[10px] font-bold uppercase hover:bg-white transition-colors"
                >
                  View all listings →
                </Link>
              </div>
            )}

            {/* Completion rate card */}
            <BulletinCard rotation={-0.3} bgColor="bg-white" className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 opacity-40" />
                <p className={labelBase}>Completion rate</p>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-bold">{completionRate}%</span>
                <span className="text-[11px] opacity-50 mb-1">of orders fulfilled</span>
              </div>
              <div className="h-2 bg-[#f0e8f4] border border-black">
                <div
                  className="h-full bg-black transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </BulletinCard>

            {/* Campaign scheduler */}
            <BulletinCard rotation={0.3} bgColor="bg-[#e0f2f7]" className="mt-6">
              <p className={labelBase}>Growth toolkit</p>
              <div className="mt-2 text-base font-bold">Campaign scheduler</div>
              <div className="grid gap-2 mt-3">
                <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Campaign name" className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black" />
                <input type="datetime-local" value={campaignStart} onChange={(e) => setCampaignStart(e.target.value)} className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black" />
                <input type="datetime-local" value={campaignEnd} onChange={(e) => setCampaignEnd(e.target.value)} className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black" />
                <input value={campaignCouponCode} onChange={(e) => setCampaignCouponCode(e.target.value)} placeholder="Coupon code (optional)" className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black" />
                <select value={campaignAB} onChange={(e) => setCampaignAB(e.target.value as 'A' | 'B')} className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black">
                  <option value="A">A slot</option>
                  <option value="B">B slot</option>
                </select>
              </div>
              <button onClick={createCampaign} className="mt-3 w-full border border-black bg-black py-2 text-[10px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black">Create Campaign</button>
              {campaigns.length > 0 && (
                <div className="mt-3 space-y-2">
                  {campaigns.slice(0, 4).map((c: any) => (
                    <div key={c._id} className="border border-black bg-white px-3 py-2 text-[11px]">
                      <p className="font-bold">{c.name}</p>
                      <p className="opacity-50">{new Date(c.startsAt).toLocaleDateString()} - {new Date(c.endsAt).toLocaleDateString()} · Slot {c.abSlot || '-'}</p>
                    </div>
                  ))}
                </div>
              )}
            </BulletinCard>

            {/* Coupons */}
            <BulletinCard rotation={-0.3} bgColor="bg-[#fce4ec]" className="mt-6">
              <p className={labelBase}>Growth toolkit</p>
              <div className="mt-2 text-base font-bold">Coupons</div>
              <div className="space-y-2 mt-3">
                <input
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as 'percentage' | 'fixed')}
                    className="border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="percentage">Percent</option>
                    <option value="fixed">Fixed (GHS)</option>
                  </select>
                  <input
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(e.target.value)}
                    placeholder="Value"
                    className="border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
              <button onClick={createCoupon} className="mt-3 w-full border border-black bg-black py-2 text-[10px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black">Create Coupon</button>
              <div className="mt-4 space-y-2">
                {coupons.slice(0, 4).map((coupon: any) => (
                  <div key={coupon._id} className="flex justify-between border border-black bg-white px-3 py-2 text-[11px]">
                    <span className="font-bold">{coupon.code}</span>
                    <span className="opacity-60">{coupon.type === 'percentage' ? `${coupon.value}%` : `GHS ${coupon.value}`}</span>
                  </div>
                ))}
                {coupons.length === 0 && <p className="text-[11px] opacity-40">No coupons yet.</p>}
              </div>
            </BulletinCard>

            {/* Bundles */}
            <BulletinCard rotation={0.3} bgColor="bg-[#fffacd]" className="mt-6">
              <p className={labelBase}>Growth toolkit</p>
              <div className="mt-2 text-base font-bold">Bundles</div>
              <div className="space-y-2 mt-3">
                <input
                  value={newBundleName}
                  onChange={(e) => setNewBundleName(e.target.value)}
                  placeholder="Bundle name"
                  className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  value={newBundleDiscount}
                  onChange={(e) => setNewBundleDiscount(e.target.value)}
                  placeholder="Discount %"
                  className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black"
                />
                <div className="max-h-36 overflow-auto border border-black bg-white p-2 space-y-1">
                  {listings.slice(0, 10).map((p: any) => (
                    <label key={p._id} className="flex items-center gap-2 text-[11px]">
                      <input
                        type="checkbox"
                        checked={selectedBundleProductIds.includes(p._id)}
                        onChange={() => toggleBundleProduct(p._id)}
                      />
                      <span className="truncate">{p.title}</span>
                    </label>
                  ))}
                  {listings.length === 0 && <p className="text-[11px] opacity-40">Create listings first.</p>}
                </div>
              </div>
              <button onClick={createBundle} className="mt-3 w-full border border-black bg-black py-2 text-[10px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black">Create Bundle</button>
              {bundles.length === 0 ? (
                <p className="text-[11px] opacity-40 mt-3">No bundles yet.</p>
              ) : (
                <div className="space-y-2 mt-3">
                  {bundles.slice(0, 4).map((bundle: any) => (
                    <div key={bundle._id} className="border border-black bg-white px-3 py-2 text-[11px]">
                      <p className="font-bold">{bundle.name}</p>
                      <p className="opacity-60 mt-1">{bundle.discountPercent}% off • {bundle.productIds?.length || 0} items</p>
                    </div>
                  ))}
                </div>
              )}
            </BulletinCard>
          </div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default SellerAnalyticsPage;