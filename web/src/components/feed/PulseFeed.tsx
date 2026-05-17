import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, TrendingUp, MapPin, Sparkles, ArrowRight, Activity as ActivityIcon, ShoppingBag, CheckCircle, Ticket } from 'lucide-react';
import feedService, { PulseFeedResponse } from '../../services/feed.service';
import { ProductCardSkeleton } from '../ui/BulletinSkeleton';
import { useAuth } from '../../context/AuthContext';

const PulseFeed: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [feed, setFeed] = useState<PulseFeedResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    feedService.getPulseFeed()
      .then(res => {
        if (res.success) setFeed(res.data);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="py-12 text-center max-w-2xl mx-auto">
        <div className="border-4 border-black bg-[#fffacd] dark:bg-yellow-950/20 p-8 shadow-[8px_8px_0_0_black] rotate-[-0.5deg]">
          <div className="h-16 w-16 bg-white border-4 border-black flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0_0_black] rotate-[3deg]">
            <ActivityIcon size={32} className="text-black animate-pulse" />
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">Unauthenticated Access</div>
          <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-black dark:text-yellow-200">Unlock the Campus Pulse Feed</h3>
          <p className="text-sm font-bold opacity-60 max-w-md mx-auto mb-8 leading-relaxed text-black dark:text-yellow-200/80">
            Log in to see live board transactions, custom notifications, and hyper-local deals trending in your specific residence hall.
          </p>
          <Link
            to="/login"
            className="inline-block border-4 border-black bg-black hover:bg-[#ff6b6b] px-8 py-3 text-[11px] font-black uppercase tracking-widest text-white hover:text-black transition-all shadow-[4px_4px_0_0_#ff6b6b] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
          >
            Sign In to Unlock
          </Link>
        </div>
      </div>
    );
  }

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

  const ActivityLog = ({ activities }: { activities: any[] }) => {
    if (!activities || activities.length === 0) return null;

    return (
      <div className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 border-2 border-black bg-[#ff6b6b] shadow-[3px_3px_0_0_black]">
            <ActivityIcon size={18} className="text-black" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 leading-none mb-1">System Events</div>
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Live Board Activity</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.slice(0, 6).map((act, idx) => {
            let icon = <ActivityIcon size={14} />;
            let color = "bg-gray-100";
            let message = "";

            switch(act.type) {
              case 'listing_created':
                icon = <ShoppingBag size={14} />;
                color = "bg-[#e0f2f7]";
                message = `${act.metadata.userName} just pinned ${act.metadata.productTitle}`;
                break;
              case 'order_fulfilled':
                icon = <CheckCircle size={14} />;
                color = "bg-[#d4edda]";
                message = `${act.metadata.userName} fulfilled order for ${act.metadata.productTitle}`;
                break;
              case 'coupon_created':
                icon = <Ticket size={14} />;
                color = "bg-[#fff3cd]";
                message = `${act.metadata.userName} dropped a new coupon: ${act.metadata.location}`;
                break;
              default:
                message = `${act.metadata.userName} performed an action`;
            }

            return (
              <div 
                key={act._id || idx} 
                className="flex items-center gap-4 p-4 border-2 border-black bg-white shadow-[4px_4px_0_0_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                <div className={`flex-shrink-0 h-10 w-10 border-2 border-black ${color} flex items-center justify-center`}>
                  {icon}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-black leading-tight line-clamp-2">
                    {message}
                  </div>
                  <div className="text-[9px] font-black uppercase opacity-30 mt-1">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {act.metadata.location || 'Campus'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
       {/* 0. Live Log Section */}
       <ActivityLog activities={feed.activities} />

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
