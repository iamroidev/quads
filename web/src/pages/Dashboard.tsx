import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Heart,
  Package,
  PenSquare,
  ShoppingBag,
  Clock,
  Grid2x2,
  BarChart2,
  X,
  Repeat,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import productService from '../services/product.service';
import authService, { UserStats } from '../services/auth.service';
import categoryService, { CategoryWithCount } from '../services/category.service';
import { ProductPopulated } from '../types';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';
import { ProductCardSkeleton, CategorySkeleton, CollectionSkeleton } from '../components/ui/BulletinSkeleton';

const Dashboard: React.FC = () => {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();

  const [recentProducts, setRecentProducts] = useState<ProductPopulated[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<ProductPopulated[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [myListings, setMyListings] = useState<ProductPopulated[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingMyListings, setLoadingMyListings] = useState(true);
  const [viewMode, setViewMode] = useState<'seller' | 'buyer'>('buyer');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const isSeller = user?.role === 'seller' || user?.role === 'admin';

  useEffect(() => {
    if (isSeller) {
      setViewMode('seller');
    }
  }, [isSeller]);

  const [collections, setCollections] = useState<any[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);

  useEffect(() => {
    // Discovery data
    productService.getRecent(8)
      .then((res) => { if (res.success) setRecentProducts(res.data); })
      .catch(() => { })
      .finally(() => setLoadingRecent(false));

    productService.getTrending(8)
      .then((res) => { if (res.success) setTrendingProducts(res.data); })
      .catch(() => { })
      .finally(() => setLoadingTrending(false));

    productService.getCollections(6)
      .then((res: any) => { if (res.success) setCollections(res.data); })
      .catch(() => { })
      .finally(() => setLoadingCollections(false));

    categoryService.getCategoriesWithCounts()
      .then((res) => { if (res.success) setCategories(res.data.categories.slice(0, 8)); })
      .catch(() => { });

    // Seller data
    if (isSeller) {
      setLoadingStats(true);
      authService.getUserStats()
        .then(setStats)
        .catch(console.error)
        .finally(() => setLoadingStats(false));

      productService.getMyListings({ limit: 10 } as any)
        .then((res) => { if (res.success) setMyListings(res.data); })
        .catch(() => { })
        .finally(() => setLoadingMyListings(false));
    }
  }, [isSeller]);

  const handleBecomeSeller = async () => {
    try {
      await switchRole('seller');
      setShowUpgradeModal(false);
      navigate('/seller/onboarding');
    } catch (err) {
      console.error('Failed to switch to seller', err);
    }
  };

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const getImage = (p: ProductPopulated) => p.images[0]?.url || 'https://placehold.co/400x500/ddd/666?text=Item';

  /* ── Seller View ── */
  if (isSeller && viewMode === 'seller') {
    return (
      <BulletinLayout title={`Store Hub: ${user?.name}`} subtitle="Seller Dashboard" section="01">
        {/* Seller Navigation */}
        <div className="border-b border-black dark:border-white/20 bg-black px-6 py-3 flex justify-between items-center">
          <div className="flex gap-4">
            <Link to="/sell" className="text-[10px] font-black uppercase text-white hover:text-[#fffacd]">+ New Listing</Link>
            <Link to="/seller/orders" className="text-[10px] font-black uppercase text-white/60 hover:text-white">Orders</Link>
            <Link to="/seller/analytics" className="text-[10px] font-black uppercase text-white/60 hover:text-white">Analytics</Link>
          </div>
        </div>

        {/* Store Stats */}
        <BulletinSection bgColor="bg-[#faf8f5] dark:bg-black/20" title="Performance" subtitle="Real-time">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-black dark:border-white/20 bg-[var(--bulletin-card)] p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
              <div className="text-[10px] uppercase font-bold opacity-40 dark:opacity-70 mb-1">Active Listings</div>
              <div className="text-3xl font-black">{loadingStats ? '...' : (stats?.activeListings ?? 0)}</div>
            </div>
            <div className="border border-black dark:border-white/20 bg-[#fffacd] dark:bg-yellow-900/20 p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
              <div className="text-[10px] uppercase font-bold opacity-40 dark:opacity-70 mb-1">Rating</div>
              <div className="text-3xl font-black">{loadingStats ? '...' : (stats?.rating ? `${stats.rating}/5` : 'N/A')}</div>
            </div>
            <div className="border border-black dark:border-white/20 bg-[#e0f2f7] dark:bg-sky-900/20 p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
              <div className="text-[10px] uppercase font-bold opacity-40 dark:opacity-70 mb-1">Open Orders</div>
              <div className="text-3xl font-black">{loadingStats ? '...' : (stats?.totalOrders ?? 0)}</div>
            </div>
            <Link to="/seller/analytics" className="border border-black dark:border-white/20 bg-[#fce4ec] dark:bg-pink-900/20 p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 transition-transform">
              <div className="text-[10px] uppercase font-bold opacity-40 dark:opacity-70 mb-1">Total Sales</div>
              <div className="text-3xl font-black">{loadingStats ? '...' : (stats?.totalSales ?? 0)}</div>
            </Link>
          </div>
        </BulletinSection>

        {/* My Listings */}
        <BulletinSection bgColor="bg-white dark:bg-black/40" title="My Listings" subtitle="Management" action={<Link to="/my-listings" className="text-[11px] underline">Manage all →</Link>}>
          {loadingMyListings ? (
            <div className="flex gap-4 overflow-hidden">
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </div>
          ) : myListings.length === 0 ? (
            <div className="border-2 border-dashed border-black dark:border-white/10 p-12 text-center">
              <div className="text-[10px] uppercase font-bold opacity-40 dark:opacity-70 mb-2">No active listings</div>
              <Link to="/sell" className="inline-block border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black px-6 py-3 text-[11px] font-bold uppercase">Create your first listing</Link>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
              {myListings.map((product, idx) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}/edit`}
                  className="group flex-shrink-0"
                  style={{ transform: `rotate(${(idx % 2) * 1 - 0.5}deg)` }}
                >
                  <div className="border border-black dark:border-white/20 bg-[var(--bulletin-card)] p-3 shadow-[4px_4px_0_0_var(--bulletin-shadow),-2px_2px_0_0_#ff6b6b] w-48">
                    <div className="aspect-square border border-black/10 overflow-hidden mb-3">
                      <img src={getImage(product)} alt={product.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-[11px] font-bold truncate uppercase">{product.title}</div>
                    <div className="text-base font-black mt-1">GHS {product.price}</div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 border border-black ${product.status === 'active' ? 'bg-[#fffacd] dark:bg-yellow-900/40 text-black dark:text-yellow-100' : 'bg-[#fce4ec] dark:bg-pink-900/40 text-black dark:text-pink-100'}`}>
                        {product.status === 'active' ? 'Live' : product.status}
                      </span>
                      <PenSquare className="h-3 w-3 opacity-30" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </BulletinSection>

        {/* Growth Toolkit shortcut */}
        <BulletinSection bgColor="bg-[#f0e8f4] dark:bg-purple-900/10" title="Growth Toolkit" subtitle="Promotions">
          <div className="grid gap-4 md:grid-cols-3">
            <Link to="/seller/analytics" className="border border-black dark:border-white/20 bg-[var(--bulletin-card)] p-5 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all">
              <div className="font-bold text-sm mb-1 uppercase tracking-tighter italic underline">Campaigns</div>
              <p className="text-[10px] opacity-60 dark:opacity-80 leading-tight">Schedule featured listing boosts to reach more students.</p>
            </Link>
            <Link to="/seller/analytics" className="border border-black dark:border-white/20 bg-[var(--bulletin-card)] p-5 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all">
              <div className="font-bold text-sm mb-1 uppercase tracking-tighter italic underline">Coupons</div>
              <p className="text-[10px] opacity-60 dark:opacity-80 leading-tight">Create discount codes for your loyal buyers.</p>
            </Link>
            <Link to="/seller/analytics" className="border border-black dark:border-white/20 bg-[var(--bulletin-card)] p-5 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all">
              <div className="font-bold text-sm mb-1 uppercase tracking-tighter italic underline">Bundles</div>
              <p className="text-[10px] opacity-60 dark:opacity-80 leading-tight">Offer price drops when buyers purchase multiple items.</p>
            </Link>
          </div>
        </BulletinSection>
      </BulletinLayout>
    );
  }

  /* ── Buyer View (Discovery) ── */
  return (
    <BulletinLayout
      title={`${greeting}, ${firstName}`}
      subtitle={isSeller ? "Marketplace View" : "Dashboard"}
      section="01"
    >
      {/* Switch back to seller if applicable */}
      {isSeller && (
        <div className="bg-[#fffacd] dark:bg-yellow-900/20 border-b border-black dark:border-white/20 px-6 py-2 flex justify-between items-center">
          <p className="text-[10px] font-bold uppercase tracking-wider">You are in Buyer Mode</p>
          <button
            onClick={() => setViewMode('seller')}
            className="text-[10px] font-black uppercase underline decoration-2 underline-offset-4"
          >
            Back to Seller Hub →
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <BulletinSection bgColor="bg-[#faf8f5] dark:bg-black/20" title="Discovery" subtitle="Quick Links">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/products" className="group" style={{ transform: 'rotate(-1deg)' }}>
            <div className="border border-black dark:border-white/20 bg-[#fffacd] dark:bg-yellow-900/20 p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 transition-all">
              <Grid2x2 className="mb-3 h-5 w-5" />
              <div className="font-black uppercase tracking-tight">Browse All</div>
            </div>
          </Link>
          <Link to="/saved" className="group" style={{ transform: 'rotate(1deg)' }}>
            <div className="border border-black dark:border-white/20 bg-[#e0f2f7] dark:bg-sky-900/20 p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 transition-all">
              <Heart className="mb-3 h-5 w-5" />
              <div className="font-black uppercase tracking-tight">Saved Items</div>
            </div>
          </Link>
          <Link to="/orders" className="group" style={{ transform: 'rotate(-0.5deg)' }}>
            <div className="border border-black dark:border-white/20 bg-[#fce4ec] dark:bg-pink-900/20 p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 transition-all">
              <Package className="mb-3 h-5 w-5" />
              <div className="font-black uppercase tracking-tight">My Purchases</div>
            </div>
          </Link>
          <Link to="/messages" className="group" style={{ transform: 'rotate(0.5deg)' }}>
            <div className="border border-black dark:border-white/20 bg-[#f0e8f4] dark:bg-purple-900/20 p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:-translate-y-1 transition-all">
              <Bell className="mb-3 h-5 w-5" />
              <div className="font-black uppercase tracking-tight">Chat Center</div>
            </div>
          </Link>
        </div>
      </BulletinSection>

      {/* Categories */}
      {categories.length > 0 && (
        <BulletinSection title="Market categories" subtitle="Section 02">
          <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide">
            {categories.map((cat, idx) => (
              <Link key={cat._id} to={`/products?category=${cat._id}`} className="group flex-shrink-0">
                <div className="relative border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-12 py-12 shadow-[8px_8px_0_0_var(--bulletin-shadow)] transition-all hover:shadow-[12px_12px_0_0_var(--bulletin-shadow)] hover:-translate-y-2 w-max min-w-[220px]"
                  style={{ transform: `rotate(${(idx % 2) * 1.5 - 0.75}deg)` }}>
                  {/* Tape accent in #ff6b6b */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-8 w-20 bg-[#ff6b6b]/70 rotate-[-1deg] z-10" />
                  <div className="text-center relative z-0">
                    <div className="mb-6 text-5xl font-black uppercase tracking-tighter whitespace-nowrap group-hover:scale-110 transition-transform">{cat.icon || '📦'}</div>
                    <div className="font-black leading-tight text-[14px] uppercase tracking-widest text-[var(--bulletin-text)]">{cat.name}</div>
                    <div className="mt-3 text-[11px] uppercase font-black opacity-40 text-[var(--bulletin-text)]">{cat.productCount ?? 0} items</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </BulletinSection>
      )}

      {/* Just Listed (Recent) */}
      <BulletinSection title="Just listed" subtitle="Section 03" action={<Link to="/products" className="text-[11px] underline">View all →</Link>}>
        {loadingRecent ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </div>
        ) : recentProducts.length === 0 ? (
          <div className="py-12 border-4 border-dashed border-black/10 text-center opacity-40">
             <div className="text-3xl mb-2">🔭</div>
             <div className="text-[10px] font-black uppercase tracking-widest">No listings found in the system.</div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recentProducts.map((product, idx) => (
              <Link key={product._id} to={`/products/${product._id}`} className="group relative" style={{ transform: `rotate(${(idx % 3 - 1) * 0.8}deg)`, transition: 'transform 0.2s' }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.transform = 'rotate(0deg) translateY(-8px)'; }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.transform = `rotate(${(idx % 3 - 1) * 0.8}deg)`; }}
              >
                <div className="border border-black dark:border-white/20 bg-[var(--bulletin-card)] p-3 shadow-[6px_6px_0_0_var(--bulletin-shadow),-3px_3px_0_0_#ff6b6b]">
                  <div className="relative aspect-square overflow-hidden border border-black/10 bg-gray-100">
                    <img src={getImage(product)} alt={product.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="truncate font-black leading-tight uppercase text-[11px] tracking-tight">{product.title}</div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-black">GHS {product.price}</span>
                      <span className="text-[9px] uppercase font-bold opacity-30">{typeof product.category === 'string' ? '' : product.category.name}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </BulletinSection>

      {/* Trending (High Engagement) */}
      {!loadingTrending && trendingProducts.length > 0 && (
        <BulletinSection title="Campus Trends" subtitle="Section 04" bgColor="bg-[#fffacd] dark:bg-yellow-900/10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trendingProducts.map((product, idx) => (
              <Link key={product._id} to={`/products/${product._id}`} className="group relative" style={{ transform: `rotate(${(idx % 3 - 1) * -0.6}deg)`, transition: 'transform 0.2s' }}>
                <div className="border border-black dark:border-white/20 bg-[var(--bulletin-card)] p-3 shadow-[6px_6px_0_0_var(--bulletin-shadow),-3px_3px_0_0_#ffd700]">
                  <div className="relative aspect-square overflow-hidden border border-black/10 bg-gray-100">
                    <img src={getImage(product)} alt={product.title} className="h-full w-full object-cover" />
                    <div className="absolute top-2 right-2 bg-black text-white text-[8px] font-black px-2 py-0.5 rounded-sm animate-pulse">HOT</div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="truncate font-black leading-tight uppercase text-[11px] tracking-tight">{product.title}</div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-black">GHS {product.price}</span>
                      <span className="text-[9px] uppercase font-bold opacity-30">Trending Now</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </BulletinSection>
      )}

      {/* AI Collections */}
      {loadingCollections ? (
        <BulletinSection title="Curating for you..." subtitle="Section 05">
           <CollectionSkeleton />
           <CollectionSkeleton />
        </BulletinSection>
      ) : collections.length > 0 ? (
        <React.Fragment>
          {collections.map((collection, cIdx) => (
            <BulletinSection 
              key={collection.slug} 
              title={collection.title} 
              subtitle={`Collection 0${cIdx + 5}`}
              bgColor={cIdx % 2 === 0 ? 'bg-[#f0e8f4] dark:bg-purple-900/10' : 'bg-[#e0f2f7] dark:bg-sky-900/10'}
              action={<Link to={`/collections/${collection.slug}`} className="text-[11px] underline font-bold">Explore {collection.listingCount} items →</Link>}
            >
              <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
                <div className="md:col-span-1">
                    <div className="p-6 border-4 border-black dark:border-white/20 bg-white dark:bg-black/40 h-full flex flex-col justify-center">
                      <p className="text-[13px] font-bold opacity-70 italic leading-relaxed text-[var(--bulletin-text)] mb-4">
                          "{collection.description}"
                      </p>
                      <div className="mt-auto pt-4 border-t border-black/5 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-black">AI</div>
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-40">AI-Powered Curation</span>
                      </div>
                    </div>
                </div>
                
                <div className="md:col-span-2">
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                      {collection.hero && (
                        <Link to={`/products/${collection.hero.productId}`} className="flex-shrink-0 group">
                            <div className="relative border-2 border-black dark:border-white/20 bg-white dark:bg-black/40 p-2 shadow-[6px_6px_0_0_var(--bulletin-shadow)] transition-all hover:-translate-y-1 w-44">
                              <div className="aspect-square bg-gray-100 mb-2 overflow-hidden">
                                  <img src={collection.hero.image || 'https://placehold.co/200'} alt={collection.hero.title} className="w-full h-full object-cover" />
                              </div>
                              <div className="text-[10px] font-black truncate uppercase mb-1">{collection.hero.title}</div>
                              <div className="text-sm font-black">GHS {collection.hero.price}</div>
                            </div>
                        </Link>
                      )}
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="flex-shrink-0 w-44 border-2 border-dashed border-black/10 bg-black/5 flex items-center justify-center p-4 text-center">
                            <div className="text-[9px] font-black uppercase tracking-widest opacity-20">Space for Listing #{n}</div>
                        </div>
                      ))}
                    </div>
                </div>
              </div>
            </BulletinSection>
          ))}
        </React.Fragment>
      ) : (
        <React.Fragment>
          {/* Ghost Collections for Empty State */}
          <BulletinSection title="New Student Essentials" subtitle="Freshers Starter Packs" bgColor="bg-[#fffacd] dark:bg-yellow-900/10">
             <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1 p-6 border-4 border-dashed border-black/20 bg-white/50 dark:bg-white/5 flex flex-col justify-center">
                   <p className="text-[12px] font-bold opacity-30 dark:opacity-80 dark:text-white italic leading-relaxed">"Curating mattresses, buckets, and room essentials for the new intake. Stock arriving from graduating seniors soon."</p>
                </div>
                <div className="md:col-span-2 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                   {[1, 2, 3, 4].map(n => (
                     <div key={n} className="flex-shrink-0 w-44 border-4 border-dashed border-black/5 bg-black/[0.02] flex items-center justify-center aspect-[3/4]">
                        <div className="text-[8px] font-black uppercase tracking-[0.3em] opacity-10 rotate-[-90deg]">Reserved for Starter Gear</div>
                     </div>
                   ))}
                </div>
             </div>
          </BulletinSection>

          <BulletinSection title="Graduating Sales" subtitle="End-of-Study Clear Out" bgColor="bg-[#f0e8f4] dark:bg-purple-900/10">
             <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1 p-6 border-4 border-dashed border-black/20 bg-white/50 dark:bg-white/5 flex flex-col justify-center">
                   <p className="text-[12px] font-bold opacity-30 dark:opacity-80 dark:text-white italic leading-relaxed">"High-quality items from our finishing students. Pre-auditing electronics and appliances for this section."</p>
                </div>
                <div className="md:col-span-2 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                   {[1, 2, 3, 4].map(n => (
                     <div key={n} className="flex-shrink-0 w-44 border-4 border-dashed border-black/5 bg-black/[0.02] flex items-center justify-center aspect-[3/4]">
                        <div className="text-[8px] font-black uppercase tracking-[0.3em] opacity-10 rotate-[-90deg]">Pending Senior Listing</div>
                     </div>
                   ))}
                </div>
             </div>
          </BulletinSection>

          <BulletinSection title="Engineering & Tech" subtitle="Professional Tools" bgColor="bg-[#e0f2f7] dark:bg-sky-900/10">
             <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1 p-6 border-4 border-dashed border-black/20 bg-white/50 dark:bg-white/5 flex flex-col justify-center">
                   <p className="text-[12px] font-bold opacity-30 dark:opacity-80 dark:text-white italic leading-relaxed">"Calipers, drawing boards, and tech gear. Professional equipment for the technical creative."</p>
                </div>
                <div className="md:col-span-2 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                   {[1, 2, 3, 4].map(n => (
                     <div key={n} className="flex-shrink-0 w-44 border-4 border-dashed border-black/5 bg-black/[0.02] flex items-center justify-center aspect-[3/4]">
                        <div className="text-[8px] font-black uppercase tracking-[0.3em] opacity-10 rotate-[-90deg]">Reserved for Technical Gear</div>
                     </div>
                   ))}
                </div>
             </div>
          </BulletinSection>
        </React.Fragment>
      )}

      {/* Upgrade CTA for buyers */}
      {user?.role === 'buyer' && (
        <BulletinSection bgColor="bg-[#111] dark:bg-[#111]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-4 border-l-4 border-[#ff6b6b] pl-8">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#ff6b6b] mb-2 font-black">Passive income?</div>
              <div className="text-2xl font-black text-white uppercase tracking-tighter">Upgrade to Seller Hub</div>
              <div className="text-[12px] text-white/50 mt-1 font-mono">List items and reach the whole UMaT community.</div>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="flex-shrink-0 border-2 border-[#ff6b6b] bg-transparent px-8 py-3 text-[11px] font-black uppercase text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-all shadow-[4px_4px_0_0_#ff6b6b]"
            >
              Learn more →
            </button>
          </div>
        </BulletinSection>
      )}

      {/* Upgrade How-It-Works Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 top-0 left-0 w-full h-full z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#fffdf8] dark:bg-[#222] border-4 border-black dark:border-white/40 w-full max-w-lg shadow-[16px_16px_0_0_var(--bulletin-shadow)] relative p-8 md:p-12 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-6 right-6 p-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-2 border-black dark:border-white/40"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="mb-10">
              <div className="inline-block bg-[#ff6b6b] border-2 border-black dark:border-white/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white mb-4">Onboarding</div>
              <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">How It Works</h2>
              <p className="text-sm opacity-60 mt-4 font-medium italic">Three steps to start your campus business.</p>
            </div>

            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 border-4 border-black dark:border-white/40 bg-[#fffacd] dark:bg-yellow-900/40 flex items-center justify-center font-black text-xl">1</div>
                <div>
                  <h4 className="font-black uppercase tracking-tight text-lg">Perspective Switch</h4>
                  <p className="text-sm opacity-60">We toggle your account to Seller Mode, giving you access to the Store Hub and Analytics.</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 border-4 border-black dark:border-white/40 bg-[#e0f2f7] dark:bg-sky-900/40 flex items-center justify-center font-black text-xl">2</div>
                <div>
                  <h4 className="font-black uppercase tracking-tight text-lg">Identity Setup</h4>
                  <p className="text-sm opacity-60">Add your Store Name, Brand, and contact details. This builds trust with UMaT buyers.</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 border-4 border-black dark:border-white/40 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-xl">3</div>
                <div>
                  <h4 className="font-black uppercase tracking-tight text-lg">Instant Listing</h4>
                  <p className="text-sm opacity-60">Snap photos, set your price, and list. Your items go live to thousands of students immediately.</p>
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 border-4 border-black dark:border-white/40 bg-white dark:bg-black py-4 text-xs font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
              >
                Maybe Later
              </button>
              <button
                onClick={handleBecomeSeller}
                className="flex-1 border-4 border-black dark:border-white/40 bg-black dark:bg-white text-white dark:text-black py-4 text-xs font-black uppercase tracking-widest hover:bg-[#ff6b6b] transition-all shadow-[4px_4px_0_0_rgba(255,107,107,1)]"
              >
                Become a Seller →
              </button>
            </div>
          </div>
        </div>
      )}
    </BulletinLayout>
  );
};

export default Dashboard;