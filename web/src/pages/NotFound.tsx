import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';

const NotFoundPage: React.FC = () => {
  return (
    <BulletinLayout title="Page Not Found" subtitle="Error 404" section="XX">
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="relative overflow-hidden border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-12 shadow-[12px_12px_0_0_var(--bulletin-shadow)] max-w-2xl mx-auto my-12"
          style={{ transform: 'rotate(-0.5deg)' }}>
          
          {/* Watermark 404 */}
          <div className="absolute -right-8 -bottom-8 select-none text-[15rem] font-black leading-none opacity-[0.05] rotate-[-15deg] text-[var(--bulletin-text)] pointer-events-none">
            404
          </div>

          <div className="relative z-10 text-center">
            <div className="inline-block border-2 border-black bg-[#ff6b6b] text-black dark:text-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]"
              style={{ transform: 'rotate(-2deg)' }}>
              CRITICAL ERROR
            </div>
            
            <div className="text-[12rem] leading-none font-bold opacity-[0.07] mb-4 select-none text-[var(--bulletin-text)]">
              ?
            </div>
            
            <h2 className="text-4xl font-black uppercase mb-4 -mt-16 text-[var(--bulletin-text)] tracking-tighter">
              Missing Notice
            </h2>
            
            <p className="text-[12px] font-bold leading-relaxed opacity-70 mb-10 max-w-sm mx-auto text-[var(--bulletin-text)]">
              The requested resource has vanished from the bulletin board or never existed in the first place. 
              Please check the URL or return to safety.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/"
                className="w-full sm:w-auto border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-8 py-4 text-[12px] font-black uppercase text-[var(--bulletin-bg)] shadow-[6px_6px_0_0_var(--bulletin-shadow)] transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0_0_var(--bulletin-shadow)]"
              >
                Return to Base
              </Link>
              <button
                onClick={() => window.history.back()}
                className="w-full sm:w-auto border-4 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/40 text-black dark:text-yellow-200 px-8 py-4 text-[12px] font-black uppercase shadow-[6px_6px_0_0_var(--bulletin-shadow)] transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0_0_var(--bulletin-shadow)]"
              >
                Go Back
              </button>
            </div>
          </div>

          {/* Decorative tape */}
          <div className="absolute -top-3 left-10 h-6 w-24 bg-[#ffd700]/40 rotate-[-3deg]" />
          <div className="absolute -bottom-3 right-20 h-6 w-20 bg-[#ffd700]/30 rotate-[2deg]" />
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default NotFoundPage;