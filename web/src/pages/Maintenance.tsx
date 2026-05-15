import React from 'react';
import { Mail, MessageCircle, Twitter, AlertTriangle, ShieldAlert } from 'lucide-react';

const Maintenance: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#111] text-black dark:text-white font-sans selection:bg-[#ff6b6b] selection:text-white overflow-hidden relative flex flex-col items-center justify-center p-6">
      {/* Heavy Header Border */}
      <div className="h-4 bg-black w-full fixed top-0 z-[1001]" />
      
      {/* Decorative Background Elements */}
      <div className="absolute top-20 -left-20 w-64 h-64 border-8 border-black/5 rounded-full rotate-12 pointer-events-none" />
      <div className="absolute bottom-20 -right-20 w-80 h-80 border-8 border-black/5 rounded-full -rotate-12 pointer-events-none" />
      
      <div className="max-w-4xl w-full relative z-10">
        <div className="flex flex-col items-center text-center">
          
          {/* Main "CLOSED" Sign */}
          <div className="relative mb-12">
            <div className="border-8 border-black bg-[#ff6b6b] px-12 py-8 shadow-[20px_20px_0_0_#000] rotate-[-2deg] relative z-10">
               <div className="flex items-center justify-center gap-4 mb-2">
                 <ShieldAlert className="h-10 w-10 text-white" />
                 <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter text-white leading-none">
                   PAUSED
                 </h1>
               </div>
               <div className="border-t-4 border-white/30 pt-2 text-white/90 font-black text-xs uppercase tracking-[0.5em]">
                 Operations Temporarily Suspended
               </div>
            </div>
            {/* Tape decorations */}
            <div className="absolute -top-6 -left-6 h-12 w-32 bg-black/20 rotate-[-15deg] z-0" />
            <div className="absolute -bottom-6 -right-6 h-12 w-32 bg-black/20 rotate-[15deg] z-0" />
          </div>

          <div className="max-w-2xl">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 leading-tight">
              System Audit in Progress
            </h2>
            <p className="text-lg font-medium opacity-70 mb-12 leading-relaxed">
              We're performing a deep-level structural audit of the QUADS infrastructure. The marketplace is currently in read-only mode while we re-align our deployment protocols.
            </p>

            <div className="grid gap-6 md:grid-cols-2 mb-12">
               <div className="border-4 border-black bg-white dark:bg-black/40 p-6 shadow-[8px_8px_0_0_#000] text-left">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#ff6b6b] mb-2">Status</div>
                  <div className="text-lg font-black uppercase tracking-tight">Deployment Phase 2</div>
                  <p className="text-xs opacity-60 mt-2">Migrating databases and re-sealing security tokens.</p>
               </div>
               <div className="border-4 border-black bg-[#fffacd] dark:bg-yellow-900/20 p-6 shadow-[8px_8px_0_0_#000] text-left">
                  <div className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-2">ETA</div>
                  <div className="text-lg font-black uppercase tracking-tight">T-Minus 45 Minutes</div>
                  <p className="text-xs opacity-60 mt-2">Expected return by 23:45 UTC. Stay tuned.</p>
               </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-6">Connect with Hub Support</div>
              <div className="flex items-center gap-10">
                <a href="mailto:support@quadsmarket.tech" className="flex flex-col items-center gap-2 hover:text-[#ff6b6b] transition-all group">
                   <div className="p-4 border-4 border-black bg-white dark:bg-black shadow-[4px_4px_0_0_#000] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
                      <Mail className="h-6 w-6" />
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-widest">Email</span>
                </a>
                <a href="https://wa.me/233551500736" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 hover:text-[#25D366] transition-all group">
                   <div className="p-4 border-4 border-black bg-white dark:bg-black shadow-[4px_4px_0_0_#000] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
                      <MessageCircle className="h-6 w-6" />
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-widest">WhatsApp</span>
                </a>
                <a href="https://twitter.com/quadsmarket" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 hover:text-[#1DA1F2] transition-all group">
                   <div className="p-4 border-4 border-black bg-white dark:bg-black shadow-[4px_4px_0_0_#000] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
                      <Twitter className="h-6 w-6" />
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-widest">Updates</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer metadata */}
      <div className="fixed bottom-0 left-0 w-full p-8 flex justify-between items-end pointer-events-none opacity-20">
         <div className="text-[10px] font-black uppercase tracking-[0.5em]">/// QUADS-OPS-404 ///</div>
         <div className="text-[10px] font-black uppercase tracking-[0.5em]">EST. 2026</div>
      </div>

      {/* Bottom Heavy Border */}
      <div className="h-4 bg-black w-full fixed bottom-0 z-[1001]" />
    </div>
  );
};

export default Maintenance;
