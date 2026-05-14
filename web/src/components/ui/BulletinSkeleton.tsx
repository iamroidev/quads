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
  <div className="border border-black bg-white p-3 shadow-[6px_6px_0_0_rgba(0,0,0,0.05)]">
    <div className="relative aspect-square overflow-hidden border border-black/10 bg-gray-100 animate-pulse">
       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>
    <div className="mt-3 space-y-2">
      <div className="h-3 w-3/4 bg-gray-200 animate-pulse" />
      <div className="flex justify-between items-end">
        <div className="h-5 w-1/3 bg-gray-200 animate-pulse" />
        <div className="h-3 w-1/4 bg-gray-100 animate-pulse" />
      </div>
    </div>
  </div>
);

export const CategorySkeleton: React.FC = () => (
  <div className="flex-shrink-0 border-2 border-black bg-white px-10 py-10 shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] w-[220px]">
    <div className="flex flex-col items-center">
      <div className="h-12 w-12 bg-gray-100 rounded-full mb-4 animate-pulse" />
      <div className="h-3 w-3/4 bg-gray-200 mb-2 animate-pulse" />
      <div className="h-2 w-1/2 bg-gray-100 animate-pulse" />
    </div>
  </div>
);
