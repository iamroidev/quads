import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, TrendingUp, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import feedService, { PulseFeedResponse } from '../../services/feed.service';
import { ProductCardSkeleton } from '../ui/BulletinSkeleton';

const PulseFeed: React.FC = () => {
  const [feed, setFeed] = useState<PulseFeedResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feedService.getPulseFeed()
      .then(res => {
        if (res.success) setFeed(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-12 py-8">
        {[1, 2].map(i => (
          <div key={i} className="space-y-6">
            <div className="h-8 w-48 bg-black/5 animate-pulse rounded" />
            <div className="flex gap-6 overflow-hidden">
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!feed || feed.pulse.length === 0) return null;

  const FeedSection = ({ 
    title, 
    subtitle, 
    items, 
    icon: Icon,
    color = "bg-[#fce4ec]"
  }: { 
    title: string; 
    subtitle: string; 
    items: any[]; 
    icon: any;
    color?: string;
  }) => {
    if (items.length === 0) return null;
    
    return (
      <div className="mb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 border-2 border-black ${color} shadow-[2px_2px_0_0_black]`}>
                <Icon size={14} className="text-black" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">{subtitle}</span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{title}</h2>
          </div>
          <Link to="/products" className="text-[11px] font-black uppercase underline decoration-2 underline-offset-4 hover:opacity-60 transition-opacity">
            See All →
          </Link>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {items.map((product, idx) => (
            <Link 
              key={product._id} 
              to={`/products/${product._id}`} 
              className="flex-shrink-0 w-[260px] group"
            >
              <div className="border-4 border-black bg-white p-4 shadow-[6px_6px_0_0_black] transition-all group-hover:-translate-y-2 group-hover:shadow-[10px_10px_0_0_#ff6b6b]"
                style={{ transform: `rotate(${(idx % 2 === 0 ? 0.8 : -0.8)}deg)` }}>
                <div className="aspect-[4/5] border-4 border-black bg-[#f5f5f5] overflow-hidden mb-4 relative">
                  <img 
                    src={product.images?.[0]?.url || 'https://placehold.co/400x500'} 
                    alt={product.title} 
                    className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" 
                  />
                  {/* Floating Tape */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#ffd700]/40 rotate-[-2deg]" />
                  
                  {/* Social Proof Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-sm p-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Eye size={10} className="text-[#ff6b6b]" />
                      <span className="text-[9px] font-black text-white uppercase">{product.views || 0}</span>
                    </div>
                    <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">
                      {product.pickupLocation?.split(' ')[0] || 'Campus'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-[9px] font-black uppercase tracking-widest opacity-40 truncate">
                    {product.seller?.name || 'Student'}
                  </div>
                  <div className="text-sm font-black uppercase tracking-tight leading-tight line-clamp-1">
                    {product.title}
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl font-black tracking-tighter">GHS {product.price}</span>
                    <div className="h-6 w-6 border-2 border-black flex items-center justify-center bg-white group-hover:bg-[#ff6b6b] transition-colors">
                      <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="py-12">
       {/* 1. Near You Section */}
       <FeedSection 
         title="Hot In Your Hall" 
         subtitle="Hyper-Local" 
         items={feed.sections.nearYou} 
         icon={MapPin}
         color="bg-[#e0f2f7]"
       />

      {/* 2. Trending Section */}
      <FeedSection 
        title="Most Pinned Today" 
        subtitle="Trending" 
        items={feed.sections.trending} 
        icon={TrendingUp}
        color="bg-[#fffacd]"
      />

      {/* 3. New Arrivals */}
      <FeedSection 
        title="Just Dropped" 
        subtitle="Fresh" 
        items={feed.sections.newArrivals} 
        icon={Sparkles}
        color="bg-[#f0e8f4]"
      />
    </div>
  );
};

export default PulseFeed;
