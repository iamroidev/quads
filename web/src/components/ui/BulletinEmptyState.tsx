import React from 'react';
import { HelpCircle } from 'lucide-react';

interface BulletinEmptyStateProps {
  title: string;
  message: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const BulletinEmptyState: React.FC<BulletinEmptyStateProps> = ({
  title,
  message,
  action,
  icon = <HelpCircle className="h-12 w-12 opacity-20" />
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 border-4 border-dashed border-black/10 dark:border-white/5 bg-black/2 hover:bg-black/5 transition-colors relative overflow-hidden group">
      {/* Background "Scrawl" Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center select-none font-black text-[20vw] leading-none uppercase -rotate-12">
        EMPTY
      </div>

      <div className="relative z-10 text-center">
        <div className="mb-6 flex justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
          {icon}
        </div>
        
        <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--bulletin-text)] mb-2">
          {title}
        </h3>
        
        <p className="text-[12px] font-bold opacity-40 uppercase tracking-widest max-w-sm mx-auto mb-8 leading-relaxed">
          {message}
        </p>

        {action && (
          <div className="inline-block transform hover:-translate-y-1 transition-transform">
            {action}
          </div>
        )}
      </div>

      {/* Decorative "Tacks" */}
      <div className="absolute top-4 left-4 h-3 w-3 bg-[#ff6b6b] border-2 border-black rotate-45" />
      <div className="absolute bottom-4 right-4 h-3 w-3 bg-[#ff6b6b] border-2 border-black -rotate-12" />
    </div>
  );
};
