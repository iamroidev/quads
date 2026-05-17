import React, { useState } from 'react';
import { TrendingUp, Ticket, Package, BadgePercent, Megaphone, Target, ArrowRight, Clock, Plus, Trash2 } from 'lucide-react';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';
import { useQuery } from '@tanstack/react-query';
import orderService from '../services/order.service';
import productService from '../services/product.service';
import growthService from '../services/growth.service';
import toast from 'react-hot-toast';
import QRCodeGenerator from '../components/seller/QRCodeGenerator';

const GrowthTools: React.FC = () => {
  // --- State for Coupons ---
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState('10');

  // --- State for Bundles ---
  const [newBundleName, setNewBundleName] = useState('');
  const [newBundleDiscount, setNewBundleDiscount] = useState('10');
  const [selectedBundleProductIds, setSelectedBundleProductIds] = useState<string[]>([]);

  // --- State for Campaigns ---
  const [campaignName, setCampaignName] = useState('');
  const [campaignStart, setCampaignStart] = useState('');
  const [campaignEnd, setCampaignEnd] = useState('');
  const [campaignCouponCode, setCampaignCouponCode] = useState('');
  const [campaignAB, setCampaignAB] = useState<'A' | 'B'>('A');

  // --- Data Fetching ---
  const { data: listingsData } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => productService.getMyListings({ limit: 50 } as any),
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

  const listings = (listingsData as any)?.data ?? [];
  const coupons = (couponsData as any)?.data?.coupons ?? [];
  const bundles = (bundlesData as any)?.data?.bundles ?? [];
  const campaigns = (campaignsData as any)?.data ?? [];

  // --- Handlers ---
  const createCoupon = async () => {
    if (!newCouponCode.trim() || Number(newCouponValue) <= 0) {
      toast.error('Enter valid coupon code and value');
      return;
    }
    try {
      const res = await orderService.createCoupon({
        code: newCouponCode.trim().toUpperCase(),
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

  const createBundle = async () => {
    const discount = Number(newBundleDiscount);
    if (!newBundleName.trim() || selectedBundleProductIds.length < 2) {
      toast.error('Select at least 2 products and a name');
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
        setSelectedBundleProductIds([]);
        refetchBundles();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create bundle');
    }
  };

  const createCampaign = async () => {
    if (!campaignName.trim() || !campaignStart || !campaignEnd) {
      toast.error('Set campaign name and dates');
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
        refetchCampaigns();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create campaign');
    }
  };

  return (
    <BulletinLayout title="Growth Toolkit" subtitle="Marketplace Optimization" section="09">
      <BulletinSection bgColor="bg-[#faf8f5] dark:bg-black/20">
        <div className="max-w-4xl mb-16">
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ff6b6b] mb-4">Strategic Tools</div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6">
            Scale Your <br />Campus Store.
          </h1>
          <p className="text-lg font-medium opacity-70 mb-12 max-w-xl leading-relaxed">
            Professional-grade tools designed to help student merchants reach more buyers, build loyalty, and maximize every listing.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          
          {/* Tool 1: Campaigns */}
          <div className="flex flex-col gap-8">
            <div className="border-4 border-black bg-white dark:bg-black/40 p-8 shadow-[8px_8px_0_0_#000] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Megaphone className="h-24 w-24 rotate-12" />
              </div>
              <div className="relative z-10">
                <div className="h-12 w-12 border-4 border-black bg-[#fffacd] flex items-center justify-center mb-6 shadow-[4px_4px_0_0_#000]">
                  <Target className="h-6 w-6 text-black" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-3">Featured Campaigns</h3>
                <p className="text-sm opacity-60 mb-8 leading-tight">Boost your listings to the top of the board for specific time slots.</p>
                
                <div className="grid gap-4 bg-black/5 dark:bg-white/5 p-6 border-2 border-black/10">
                  <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Campaign Name" className="w-full bg-white dark:bg-black border-2 border-black p-3 text-xs font-black uppercase" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase opacity-40">Starts</label>
                      <input type="datetime-local" value={campaignStart} onChange={(e) => setCampaignStart(e.target.value)} className="w-full bg-white dark:bg-black border-2 border-black p-2 text-[10px] font-black" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase opacity-40">Ends</label>
                      <input type="datetime-local" value={campaignEnd} onChange={(e) => setCampaignEnd(e.target.value)} className="w-full bg-white dark:bg-black border-2 border-black p-2 text-[10px] font-black" />
                    </div>
                  </div>
                  <button onClick={createCampaign} className="w-full bg-black text-white dark:bg-white dark:text-black py-3 text-[10px] font-black uppercase tracking-widest hover:translate-y-[-2px] transition-transform shadow-[4px_4px_0_0_#ff6b6b]">Schedule Campaign</button>
                </div>
              </div>
            </div>

            {campaigns.length > 0 && (
              <div className="border-4 border-black bg-white dark:bg-black/20 p-6 shadow-[4px_4px_0_0_#000]">
                 <div className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-4 flex items-center gap-2"><Clock size={12} /> Active & Scheduled</div>
                 <div className="space-y-3">
                   {campaigns.map((c: any) => (
                     <div key={c._id} className="border-2 border-black p-4 flex justify-between items-center bg-black/5">
                        <div>
                          <div className="text-xs font-black uppercase">{c.name}</div>
                          <div className="text-[9px] font-bold opacity-40 uppercase">{new Date(c.startsAt).toLocaleDateString()} - {new Date(c.endsAt).toLocaleDateString()}</div>
                        </div>
                        <div className="text-[10px] font-black bg-green-500/20 text-green-700 px-2 py-1 uppercase">Active</div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
          </div>

          {/* Tool 2: Coupons */}
          <div className="flex flex-col gap-8">
            <div className="border-4 border-black bg-[#fffacd] dark:bg-yellow-900/20 p-8 shadow-[8px_8px_0_0_#000] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Ticket className="h-24 w-24 rotate-12" />
              </div>
              <div className="relative z-10 text-black dark:text-white">
                <div className="h-12 w-12 border-4 border-black bg-white flex items-center justify-center mb-6 shadow-[4px_4px_0_0_#000]">
                  <BadgePercent className="h-6 w-6 text-black" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-3">Smart Coupons</h3>
                <p className="text-sm opacity-70 mb-8 leading-tight">Create unique codes for your loyal buyers or social media campaigns.</p>
                
                <div className="grid gap-4 bg-white/40 dark:bg-black/20 p-6 border-2 border-black/10">
                  <input value={newCouponCode} onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())} placeholder="COUPON_CODE" className="w-full bg-white dark:bg-black border-2 border-black p-3 text-xs font-black uppercase" />
                  <div className="grid grid-cols-2 gap-4">
                    <select value={newCouponType} onChange={(e) => setNewCouponType(e.target.value as any)} className="w-full bg-white dark:bg-black border-2 border-black p-3 text-[10px] font-black">
                      <option value="percentage">Percent (%)</option>
                      <option value="fixed">Fixed (GHS)</option>
                    </select>
                    <input type="number" value={newCouponValue} onChange={(e) => setNewCouponValue(e.target.value)} className="w-full bg-white dark:bg-black border-2 border-black p-3 text-xs font-black" />
                  </div>
                  <button onClick={createCoupon} className="w-full bg-black text-white py-3 text-[10px] font-black uppercase tracking-widest hover:translate-y-[-2px] transition-transform shadow-[4px_4px_0_0_#000]">Create Coupon</button>
                </div>
              </div>
            </div>

            {coupons.length > 0 && (
              <div className="border-4 border-black bg-[#fffacd] dark:bg-yellow-900/10 p-6 shadow-[4px_4px_0_0_#000]">
                 <div className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-4">Your Active Codes</div>
                 <div className="grid grid-cols-2 gap-3">
                   {coupons.map((c: any) => (
                     <div key={c._id} className="border-2 border-black p-3 bg-white dark:bg-black/40 flex justify-between items-center">
                        <div className="text-xs font-black">{c.code}</div>
                        <div className="text-[10px] font-black opacity-60">{c.type === 'percentage' ? `${c.value}%` : `GHS ${c.value}`}</div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
          </div>

          {/* Tool 3: Bundles */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="border-4 border-black bg-[#e0f2f7] dark:bg-sky-900/20 p-8 shadow-[8px_8px_0_0_#000] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Package className="h-24 w-24 rotate-12" />
              </div>
              <div className="relative z-10 text-black dark:text-white">
                <div className="h-12 w-12 border-4 border-black bg-white flex items-center justify-center mb-6 shadow-[4px_4px_0_0_#000]">
                  <TrendingUp className="h-6 w-6 text-black" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-3">Dynamic Bundles</h3>
                <p className="text-sm opacity-70 mb-8 leading-tight">Offer automatic discounts when buyers purchase related items together.</p>
                
                <div className="grid md:grid-cols-2 gap-8 bg-white/40 dark:bg-black/20 p-8 border-2 border-black/10">
                  <div className="space-y-4">
                    <input value={newBundleName} onChange={(e) => setNewBundleName(e.target.value)} placeholder="Bundle Name (e.g. Starter Pack)" className="w-full bg-white dark:bg-black border-2 border-black p-3 text-xs font-black uppercase" />
                    <input type="number" value={newBundleDiscount} onChange={(e) => setNewBundleDiscount(e.target.value)} placeholder="Bundle Discount %" className="w-full bg-white dark:bg-black border-2 border-black p-3 text-xs font-black" />
                    <button onClick={createBundle} className="w-full bg-black text-white py-4 text-[10px] font-black uppercase tracking-widest hover:translate-y-[-2px] transition-transform shadow-[4px_4px_0_0_#000]">Create Active Bundle</button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase opacity-40">Select Products (Min 2)</label>
                    <div className="h-48 overflow-y-auto border-2 border-black bg-white dark:bg-black p-4 space-y-2">
                      {listings.map((p: any) => (
                        <label key={p._id} className="flex items-center gap-3 p-2 hover:bg-black/5 cursor-pointer border border-transparent hover:border-black">
                          <input 
                            type="checkbox" 
                            checked={selectedBundleProductIds.includes(p._id)}
                            onChange={() => {
                              setSelectedBundleProductIds(prev => 
                                prev.includes(p._id) ? prev.filter(id => id !== p._id) : [...prev, p._id]
                              )
                            }}
                            className="h-4 w-4 accent-black" 
                          />
                          <div className="min-w-0">
                            <div className="text-[10px] font-black uppercase truncate">{p.title}</div>
                            <div className="text-[9px] opacity-40">GHS {p.price}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {bundles.length > 0 && (
              <div className="grid md:grid-cols-3 gap-6">
                 {bundles.map((b: any) => (
                   <div key={b._id} className="border-4 border-black bg-white dark:bg-black/20 p-6 shadow-[4px_4px_0_0_#000]">
                      <div className="text-lg font-black uppercase tracking-tight mb-1">{b.name}</div>
                      <div className="text-[10px] font-black text-[#ff6b6b] mb-4">{b.discountPercent}% BUNDLE DISCOUNT</div>
                      <div className="space-y-1">
                        <div className="text-[8px] font-black uppercase opacity-40">Includes:</div>
                        {b.productIds?.slice(0, 3).map((pid: string) => (
                          <div key={pid} className="text-[9px] font-bold opacity-60 truncate">Product ID: {pid.slice(-6)}</div>
                        ))}
                      </div>
                   </div>
                 ))}
              </div>
            )}
          </div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default GrowthTools;
