import React from 'react';
import { Scissors } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Initializing System...',
  fullScreen = false,
}) => {
  const content = (
    <div className="relative flex flex-col items-center justify-center gap-6">
      {/* The "Stamp" */}
      <div className="relative border-4 border-black bg-white p-8 shadow-[8px_8px_0_0_#ff6b6b] animate-bounce">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-20 bg-[#ffd700]/60 rotate-[-2deg]" />
        <div className="flex items-center gap-4">
          <div className="bg-black text-white px-3 py-1 font-black text-2xl uppercase tracking-tighter">Q</div>
          <div className="h-2 w-12 bg-black animate-pulse" />
        </div>
      </div>
      
      {/* The Text */}
      <div className="text-center">
        <p className="text-[12px] font-black uppercase tracking-[0.3em] text-black dark:text-white animate-pulse">
          {text}
        </p>
        <div className="mt-2 flex justify-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#ff6b6b] animate-bounce [animation-delay:-0.3s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-[#ff6b6b] animate-bounce [animation-delay:-0.15s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-[#ff6b6b] animate-bounce" />
        </div>
      </div>

      {/* Decorative Scissor Icon */}
      <Scissors className="absolute -bottom-16 opacity-10 h-10 w-10 rotate-90" />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--bulletin-bg)] z-[9999]">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20 w-full">
      {content}
    </div>
  );
};

export default LoadingSpinner;
