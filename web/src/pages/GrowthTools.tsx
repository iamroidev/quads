import React from 'react';
import { TrendingUp, Ticket, Package, Sparkles, Megaphone, Target, ArrowRight } from 'lucide-react';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';
import { Link } from 'react-router-dom';

const GrowthTools: React.FC = () => {
  return (
    <BulletinLayout title="Growth Toolkit" subtitle="Marketplace Optimization" section="09">
      <BulletinSection bgColor="bg-[#faf8f5] dark:bg-black/20">
        <div className="max-w-4xl">
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ff6b6b] mb-4">Strategic Tools</div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6">
            Scale Your <br />Campus Store.
          </h1>
          <p className="text-lg font-medium opacity-70 mb-12 max-w-xl leading-relaxed">
            Professional-grade tools designed to help student merchants reach more buyers, build loyalty, and maximize every listing.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Tool 1: Campaigns */}
          <div className="border-4 border-black bg-white dark:bg-black/40 p-8 shadow-[8px_8px_0_0_#000] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Megaphone className="h-24 w-24 rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="h-12 w-12 border-4 border-black bg-[#fffacd] flex items-center justify-center mb-6 shadow-[4px_4px_0_0_#000]">
                <Target className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-3">Campaigns</h3>
              <p className="text-sm opacity-60 mb-8 leading-tight">
                Boost your listings to the top of the board. Target specific departments or years for maximum impact.
              </p>
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#ff6b6b] border-b-2 border-[#ff6b6b] pb-1 cursor-not-allowed opacity-50">
                Coming Soon <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Tool 2: Coupons */}
          <div className="border-4 border-black bg-[#fffacd] dark:bg-yellow-900/20 p-8 shadow-[8px_8px_0_0_#000] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Ticket className="h-24 w-24 rotate-12" />
            </div>
            <div className="relative z-10 text-black dark:text-white">
              <div className="h-12 w-12 border-4 border-black bg-white flex items-center justify-center mb-6 shadow-[4px_4px_0_0_#000]">
                <Sparkles className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-3">Smart Coupons</h3>
              <p className="text-sm opacity-70 mb-8 leading-tight">
                Generate unique discount codes for your social media followers or recurring buyers. Track redemption rates in real-time.
              </p>
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black border-b-2 border-black pb-1 cursor-not-allowed opacity-50">
                In Development <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Tool 3: Bundles */}
          <div className="border-4 border-black bg-[#e0f2f7] dark:bg-sky-900/20 p-8 shadow-[8px_8px_0_0_#000] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Package className="h-24 w-24 rotate-12" />
            </div>
            <div className="relative z-10 text-black dark:text-white">
              <div className="h-12 w-12 border-4 border-black bg-white flex items-center justify-center mb-6 shadow-[4px_4px_0_0_#000]">
                <TrendingUp className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-3">Dynamic Bundles</h3>
              <p className="text-sm opacity-70 mb-8 leading-tight">
                Automatically offer discounts when buyers purchase related items together. Perfect for "hostel starter packs."
              </p>
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black border-b-2 border-black pb-1 cursor-not-allowed opacity-50">
                Scheduled <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder for more tools */}
        <div className="mt-20 p-12 border-4 border-dashed border-black/10 text-center">
           <div className="text-[10px] font-black uppercase tracking-[0.5em] opacity-20">Growth Node Expanding</div>
           <div className="text-lg font-bold opacity-20 italic">"More merchant optimization tools are currently being audited."</div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default GrowthTools;
