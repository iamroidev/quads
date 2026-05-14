import React from 'react';

interface BulletinMarqueeProps {
  messages: string[];
  speed?: number;
  className?: string;
}

export const BulletinMarquee: React.FC<BulletinMarqueeProps> = ({ 
  messages, 
  speed = 40,
  className = '' 
}) => {
  if (!messages || messages.length === 0) return null;

  return (
    <div className={`relative flex overflow-x-hidden border-b-2 border-black bg-[#ff6b6b] py-1.5 text-white ${className}`}>
      <div className="flex animate-marquee whitespace-nowrap items-center" style={{ animationDuration: `${speed}s` }}>
        {messages.map((msg, i) => (
          <React.Fragment key={i}>
            <span className="mx-8 text-[10px] font-black uppercase tracking-[0.25em]">
              {msg}
            </span>
            <span className="text-[12px] opacity-40">///</span>
          </React.Fragment>
        ))}
        {/* Duplicate for seamless loop */}
        {messages.map((msg, i) => (
          <React.Fragment key={`loop-${i}`}>
            <span className="mx-8 text-[10px] font-black uppercase tracking-[0.25em]">
              {msg}
            </span>
            <span className="text-[12px] opacity-40">///</span>
          </React.Fragment>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}} />
    </div>
  );
};
