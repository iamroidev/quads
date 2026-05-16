import React from 'react';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';
import PulseFeed from '../components/feed/PulseFeed';
import { Activity } from 'lucide-react';

const PulsePage: React.FC = () => {
  return (
    <BulletinLayout title="Campus Pulse" subtitle="Real-time Activity" section="04">
      <BulletinSection bgColor="bg-[#faf8f5] dark:bg-black/20">
        <div className="max-w-4xl mb-12">
          <div className="flex items-center gap-3 mb-4">
             <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
             <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ff6b6b]">Live Feed</div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6">
            The Board <br />Is Moving.
          </h1>
          <p className="text-lg font-medium opacity-70 max-w-xl leading-relaxed">
            Real-time insights into trending items, hyper-local hostel drops, and the most active student merchants on campus.
          </p>
        </div>

        <PulseFeed />

        <div className="mt-20 p-12 border-4 border-black bg-[#fffacd] dark:bg-yellow-900/20 shadow-[8px_8px_0_0_#000]">
           <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                 <div className="h-16 w-16 border-4 border-black bg-white flex items-center justify-center shadow-[4px_4px_0_0_#000]">
                    <Activity className="h-8 w-8 text-black" />
                 </div>
                 <div>
                    <div className="text-xl font-black uppercase">Adaptive Feed</div>
                    <p className="text-sm font-bold opacity-60">Pulse learns from campus trends to show you relevant gear first.</p>
                 </div>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest opacity-30">
                 /// CALIBRATING NODE: TARKWA-HQ ///
              </div>
           </div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default PulsePage;
