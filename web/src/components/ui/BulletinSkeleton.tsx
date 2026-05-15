import React from 'react';

interface BulletinSkeletonProps {
  className?: string;
  type?: 'card' | 'line' | 'circle' | 'rect';
}

export const BulletinSkeleton: React.FC<BulletinSkeletonProps> = ({ 
  className = '', 
  type = 'rect' 
}) => {
  const baseClass = "bg-gray-200 animate-pulse border-2 border-black/10";
  
  if (type === 'card') {
    return (
      <div className={`border-2 border-black bg-white p-4 shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] ${className}`}>
        <div className="aspect-square bg-gray-100 mb-4 animate-pulse border border-black/5" />
        <div className="h-3 w-3/4 bg-gray-200 mb-2 animate-pulse" />
        <div className="h-4 w-1/2 bg-gray-200 animate-pulse" />
      </div>
    );
  }

  if (type === 'circle') {
    return <div className={`${baseClass} rounded-full ${className}`} />;
  }

  return <div className={`${baseClass} ${className}`} />;
};

export const ProductCardSkeleton: React.FC = () => (
  <div className="border-2 border-black dark:border-white/20 bg-white dark:bg-black/40 p-3 shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] dark:shadow-none" style={{ transform: 'rotate(-0.5deg)' }}>
    <div className="relative aspect-square overflow-hidden border border-black/10 bg-gray-100 dark:bg-white/5 animate-pulse">
       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>
    <div className="mt-3 space-y-2">
      <div className="h-3 w-3/4 bg-gray-200 dark:bg-white/10 animate-pulse" />
      <div className="flex justify-between items-end">
        <div className="h-5 w-1/3 bg-gray-200 dark:bg-white/10 animate-pulse" />
        <div className="h-3 w-1/4 bg-gray-100 dark:bg-white/5 animate-pulse" />
      </div>
    </div>
  </div>
);

export const CategorySkeleton: React.FC = () => (
  <div className="border-4 border-black dark:border-white/20 bg-white dark:bg-black/40 p-6 shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] dark:shadow-none" style={{ transform: 'rotate(0.5deg)' }}>
    <div className="flex flex-col items-center">
      <div className="h-12 w-12 bg-gray-100 dark:bg-white/5 rounded-full mb-4 animate-pulse" />
      <div className="h-3 w-3/4 bg-gray-200 dark:bg-white/10 mb-2 animate-pulse" />
      <div className="h-2 w-1/2 bg-gray-100 dark:bg-white/5 animate-pulse" />
    </div>
  </div>
);

export const CollectionSkeleton: React.FC = () => (
  <div className="border-4 border-black dark:border-white/20 bg-white dark:bg-black/40 p-8 shadow-[12px_12px_0_0_rgba(0,0,0,0.1)] dark:shadow-none mb-12">
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-1 border-r-2 border-black/5 dark:border-white/5 pr-6">
        <div className="h-4 w-1/4 bg-gray-200 dark:bg-white/10 mb-4 animate-pulse" />
        <div className="h-8 w-3/4 bg-gray-200 dark:bg-white/10 mb-6 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-100 dark:bg-white/5 animate-pulse" />
          <div className="h-3 w-5/6 bg-gray-100 dark:bg-white/5 animate-pulse" />
        </div>
      </div>
      <div className="md:col-span-2">
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map(n => (
            <div key={n} className="flex-shrink-0 w-44 border-2 border-black/5 bg-gray-50 dark:bg-white/5 p-2">
              <div className="aspect-square bg-gray-200 dark:bg-white/10 mb-2 animate-pulse" />
              <div className="h-3 w-3/4 bg-gray-200 dark:bg-white/10 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
