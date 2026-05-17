import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import productService from '../services/product.service';
import categoryService, { CategoryWithCount } from '../services/category.service';
import api from '../services/api';
import { ProductPopulated } from '../types';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';
import { ProductCardSkeleton, CategorySkeleton, CategoryIcon } from '../components/ui';
import ProductCard from '../components/product/ProductCard';
import { Package, Smartphone, Truck, Shield, TrendingUp } from 'lucide-react';
import PulseFeed from '../components/feed/PulseFeed';

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductPopulated[]>([]);
  const [recentProducts, setRecentProducts] = useState<ProductPopulated[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<ProductPopulated[]>([]);
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalSellers, setTotalSellers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      categoryService.getCategoriesWithCounts(),
      productService.getFeatured(12),
      productService.getRecent(12),
      productService.getTrending(12),
      productService.getTopSellers(5),
      api.get('/products?limit=0').catch(() => ({ data: { pagination: { total: 0 } } })),
    ]).then(([catRes, featRes, recRes, trendRes, sellersRes, countRes]) => {
      if (catRes.success) setCategories(catRes.data.categories || []);
      if (featRes.success) setFeaturedProducts(featRes.data || []);
      if (recRes.success) setRecentProducts(recRes.data || []);
      if (trendRes.success) setTrendingProducts(trendRes.data || []);
      if (sellersRes.success) {
        setTopSellers(sellersRes.data || []);
        setTotalSellers(sellersRes.data?.length || 0);
      }
      const total = countRes?.data?.pagination?.total;
      if (total) setTotalProducts(total);
      setLoading(false);
    });
  }, []);

  const getImage = (p: ProductPopulated) => p.images[0]?.url || 'https://placehold.co/400x500/ddd/666?text=Item';

  const isSeller = user?.roles?.includes('seller') || user?.roles?.includes('admin');

  return (
    <BulletinLayout
      hideHero={true}
      hideBreadcrumbs={true}
    >
      {/* Role shortcut banner */}
      {isAuthenticated && isSeller && (
        <div className="border-b-4 border-[var(--bulletin-border)] bg-[#f0e8f4] dark:bg-purple-900/40 px-6 py-4">
          <div className="mx-auto max-w-[1400px] flex justify-between items-center">
            <span className="text-[12px] font-black uppercase tracking-widest text-[var(--bulletin-text)]">You are in marketplace view</span>
            <Link to="/dashboard" className="text-[12px] font-black uppercase underline decoration-2 underline-offset-4 text-[var(--bulletin-text)] hover:opacity-70 transition-opacity">Return to My Shop →</Link>
          </div>
        </div>
      )}

      {/* ── Marketplace Hero ── */}
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]" className="pt-4 md:pt-12 overflow-hidden">
        <div className="min-h-auto lg:min-h-[700px] w-full relative">
          <div className="absolute inset-0 border-4 border-[var(--bulletin-border)] bg-[#1a1a1a] dark:bg-[#0a0a0a] shadow-[16px_16px_0_0_var(--bulletin-shadow)]" />
          
          <div className="relative z-20 flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-0 p-4 md:p-8 lg:p-12">
            <div 
              className="w-full lg:w-auto lg:max-w-2xl border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 md:p-10 lg:p-16 shadow-[8px_8px_0_0_var(--bulletin-shadow)] lg:shadow-[12px_12px_0_0_var(--bulletin-shadow)] transition-transform hover:scale-[1.01] lg:ml-8 lg:mt-8"
              style={{ transform: 'rotate(-1.5deg)' }}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-8 w-40 bg-[#ffd700]/60 rotate-[2deg] shadow-sm z-30" />
              <div className="mb-4 md:mb-6 inline-block border-2 border-[#ff6b6b] px-3 md:px-4 py-1.5 text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] text-[#ff6b6b]">
                Verified Network
              </div>
              <p className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none mb-4 md:mb-10 text-[var(--bulletin-text)]">
                BROWSE VERIFIED <br/>CAMPUS ITEMS
              </p>
              <p className="text-sm md:text-lg lg:text-xl font-bold leading-relaxed opacity-70 text-[var(--bulletin-text)] mb-4 md:mb-10 max-w-xl">
                Buy, sell, and trade with verified UMaT students. From textbooks to electronics, we've built the most trusted network for your hostel life.
              </p>
              <div className="flex flex-wrap gap-3 md:gap-4">
                <Link to="/products" className="border-4 border-black bg-black text-white px-6 md:px-8 py-3 md:py-4 text-[11px] md:text-[14px] font-black uppercase tracking-widest hover:-translate-y-1 shadow-[6px_6px_0_0_#ff6b6b] transition-all">
                  Browse Items →
                </Link>
              </div>
            </div>

            {!isAuthenticated && (
              <div 
                className="w-full lg:w-auto lg:absolute lg:left-[50%] lg:top-12 border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-notice-bg)] p-6 md:p-8 shadow-[8px_8px_0_0_var(--bulletin-shadow)] lg:max-w-[280px]"
                style={{ transform: 'rotate(3deg)' }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-[#ff6b6b] border-2 border-[var(--bulletin-border)] shadow-inner z-10 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white/60" />
                </div>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[var(--bulletin-notice-text)] mb-3">New here?</h3>
                <p className="text-[11px] md:text-[13px] font-bold opacity-80 text-[var(--bulletin-notice-text)] mb-4 md:mb-6 leading-tight">
                  Connect with the market. <br/>Use your student email <br/>to start trading.
                </p>
                <Link to="/register" className="inline-block w-full border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-4 py-3 text-[10px] md:text-[11px] font-black uppercase text-center hover:bg-[#ff6b6b] hover:text-white transition-all">
                  Initialize Access →
                </Link>
              </div>
            )}
          </div>

          <div className="relative lg:absolute lg:top-20 lg:right-20 flex flex-col sm:flex-row lg:flex-col gap-4 lg:gap-8 z-10 px-4 md:px-8 pb-8 lg:pb-0 lg:max-w-[280px]">
            <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-4 md:p-6 shadow-[4px_4px_0_0_#ff6b6b] md:shadow-[8px_8px_0_0_#ff6b6b] lg:ml-auto w-full sm:w-1/3 lg:w-full" style={{ transform: 'rotate(1.2deg)' }}>
              <div className="text-2xl md:text-4xl font-black text-[#ff6b6b] mb-1">0%</div>
              <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60 dark:opacity-85 text-[var(--bulletin-text)]">Trading Fees</div>
              <div className="text-[10px] md:text-[12px] font-bold text-[var(--bulletin-text)] mt-1">Free for every student.</div>
            </div>
            <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-metric1-bg)] p-4 md:p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)] md:shadow-[8px_8px_0_0_var(--bulletin-shadow)] w-full sm:w-1/3 lg:w-full" style={{ transform: 'rotate(-2.5deg)' }}>
              <div className="text-2xl md:text-4xl font-black text-[var(--bulletin-metric1-text)] mb-1">{totalProducts || '...'}</div>
              <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60 dark:opacity-85 text-[var(--bulletin-metric1-text)]">Items</div>
              <div className="text-[10px] md:text-[12px] font-bold text-[var(--bulletin-metric1-text)] mt-1">Live campus inventory.</div>
            </div>
            <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-metric2-bg)] p-4 md:p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)] md:shadow-[8px_8px_0_0_var(--bulletin-shadow)] w-full sm:w-1/3 lg:w-full" style={{ transform: 'rotate(0.5deg)' }}>
              <div className="text-2xl md:text-4xl font-black text-[var(--bulletin-metric2-text)] mb-1">{totalSellers || '...'}</div>
              <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60 dark:opacity-85 text-[var(--bulletin-metric2-text)]">Sellers</div>
              <div className="text-[10px] md:text-[12px] font-bold text-[var(--bulletin-metric2-text)] mt-1">Verified UMaT students.</div>
            </div>
          </div>
        </div>
      </BulletinSection>

      {/* ── New Items (Restored with Skeletons) ── */}
      <BulletinSection title="Just Posted" subtitle="New" bgColor="bg-[#f0e8f4] dark:bg-purple-900/10">
        {loading ? (
          <div className="grid gap-6 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map(i => <ProductCardSkeleton key={i} />)}
          </div>
        ) : recentProducts.length > 0 ? (
          <div className="grid gap-6 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {recentProducts.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-10 opacity-30 dark:opacity-60 uppercase font-black tracking-widest">No items found</div>
        )}
        {!loading && recentProducts.length > 0 && (
           <div className="mt-12 text-center">
             <Link to="/products" className="bg-black text-white px-8 py-3 text-[11px] font-black uppercase tracking-widest shadow-[6px_6px_0_0_#ff6b6b]">See All Items</Link>
          </div>
        )}
      </BulletinSection>

      {/* ── Campus Pulse ── */}
      <BulletinSection 
        title="Recent Activity" 
        subtitle="Discovery" 
        bgColor="bg-[var(--bulletin-bg)] border-t-4 border-[var(--bulletin-border)]"
      >
        <PulseFeed />
      </BulletinSection>

      {/* ── Featured Showcase ── */}
      {!loading && featuredProducts.length > 0 ? (
        <BulletinSection title="Campus Spotlight" subtitle="Featured" bgColor="bg-white dark:bg-[#111]">
          <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product, idx) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          <div className="mt-12 text-center">
             <Link to="/products?featured=true" className="text-[11px] font-black uppercase underline tracking-widest hover:text-[#ff6b6b]">View all featured items →</Link>
          </div>
        </BulletinSection>
      ) : loading && (
        <BulletinSection title="Campus Spotlight" subtitle="Featured" bgColor="bg-white dark:bg-[#111]">
          <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
          </div>
        </BulletinSection>
      )}

      {/* ── Category strip ── */}
      <BulletinSection title="Explore Categories" subtitle="Browse" bgColor="bg-[var(--bulletin-bg)] border-t-4 border-[var(--bulletin-border)]">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {loading ? (
            <>
              <CategorySkeleton />
              <CategorySkeleton />
              <CategorySkeleton />
              <CategorySkeleton />
              <CategorySkeleton />
              <CategorySkeleton />
            </>
          ) : categories.map((cat: any, idx: number) => (
            <Link key={cat._id} to={`/products?category=${cat._id}`} className="group">
              <div className="h-full border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 shadow-[6px_6px_0_0_var(--bulletin-shadow)] transition-all hover:shadow-[10px_10px_0_0_#ff6b6b] hover:-translate-y-1 relative overflow-hidden"
                style={{ transform: `rotate(${(idx % 2 === 0 ? 0.5 : -0.5)}deg)` }}>
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#ff6b6b]" />
                <div className="text-center">
                  <div className="mb-4 flex justify-center group-hover:scale-110 transition-transform text-[var(--bulletin-text)]">
                    <CategoryIcon name={cat.icon} className="h-10 w-10" />
                  </div>
                  <div className="text-[12px] font-black uppercase tracking-widest text-[var(--bulletin-text)] mb-1">{cat.name}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">{cat.productCount || 0} items</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </BulletinSection>

      {/* ── Top Sellers ── */}
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 border-4 border-[var(--bulletin-border)] bg-[#fce4ec] dark:bg-[#201015] p-8 shadow-[8px_8px_0_0_var(--bulletin-shadow)] relative overflow-hidden" style={{ transform: 'rotate(-0.5deg)' }}>
            <div className="mb-8 border-b-2 border-black/10 pb-4">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-black dark:text-[#f9d0db]">Trust Network</div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-[#f9d0db]">Top Sellers</h2>
            </div>
            <div className="space-y-4">
              {topSellers.length > 0 ? topSellers.slice(0, 4).map((s: any, j: number) => (
                <div key={j} className="flex items-center gap-4 border-2 border-black/10 dark:border-[#ff6b6b]/20 bg-white/40 dark:bg-black/40 p-3 hover:translate-x-1 transition-transform">
                  <div className="h-10 w-10 border-2 border-black dark:border-[#ff6b6b] bg-white dark:bg-[#111] flex items-center justify-center font-black text-[14px] text-black dark:text-[#ff6b6b]">{s.name[0]}</div>
                  <div>
                    <div className="text-[12px] font-black uppercase tracking-tight text-black dark:text-[#f9d0db]">{s.name}</div>
                    <div className="text-[9px] opacity-60 uppercase font-black tracking-widest text-black dark:text-[#f9d0db] mt-0.5">{s.listingCount} items</div>
                  </div>
                </div>
              )) : (
                <div className="text-[11px] font-black opacity-30 uppercase tracking-widest mt-10">Finding top sellers...</div>
              )}
            </div>
            <Link to="/sellers" className="mt-8 inline-block text-[10px] font-black uppercase tracking-[0.2em] text-[#ff6b6b] hover:underline">Full directory →</Link>
          </div>

          <div className="lg:col-span-8 border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] dark:bg-[#111] p-10 shadow-[8px_8px_0_0_var(--bulletin-shadow)] relative flex flex-col md:flex-row items-center gap-10" style={{ transform: 'rotate(0.3deg)' }}>
            <div className="flex-1">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff6b6b] mb-6">Partner Opportunity</div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[var(--bulletin-text)] leading-none mb-6">Your Shop.<br />Your Rules.</h2>
              <p className="text-[15px] font-bold opacity-60 dark:opacity-80 text-[var(--bulletin-text)] max-w-sm mb-8">Ready to turn your extra items into cash? Sell something in under 2 minutes and reach the entire campus.</p>
              {!isAuthenticated ? (
                <Link to="/register" className="inline-block border-4 border-[#ff6b6b] bg-transparent px-8 py-4 text-[13px] font-black uppercase tracking-widest text-[#ff6b6b] shadow-[6px_6px_0_0_#ff6b6b] hover:-translate-y-1 transition-all">
                  Start Selling Now →
                </Link>
              ) : !isSeller ? (
                <Link to="/seller/onboarding" className="inline-block border-4 border-[#ff6b6b] bg-transparent px-8 py-4 text-[13px] font-black uppercase tracking-widest text-[#ff6b6b] shadow-[6px_6px_0_0_#ff6b6b] hover:-translate-y-1 transition-all">
                  Start Selling Now →
                </Link>
              ) : (
                <Link to="/sell" className="inline-block border-4 border-[#ff6b6b] bg-transparent px-8 py-4 text-[13px] font-black uppercase tracking-widest text-[#ff6b6b] shadow-[6px_6px_0_0_#ff6b6b] hover:-translate-y-1 transition-all">
                  + Sell Item
                </Link>
              )}
            </div>
            <div className="hidden md:block w-1/3">
              <div className="aspect-square border-4 border-[var(--bulletin-border)] rotate-[-6deg] bg-[#fffacd] dark:bg-yellow-900/20 flex flex-col items-center justify-center p-6 text-center">
                <Smartphone className="h-12 w-12 mb-4 opacity-20" />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 text-black dark:text-white">Mobile Optimized</div>
              </div>
            </div>
          </div>
        </div>
      </BulletinSection>

      {/* ── How it works ── */}
      <BulletinSection title="How it works" subtitle="Process" bgColor="bg-[var(--bulletin-bg)]">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-10 shadow-[12px_12px_0_0_var(--bulletin-shadow)] relative" style={{ transform: 'rotate(0.5deg)' }}>
            <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-[#ff6b6b]">STEP 01</div>
            <div className="h-20 w-20 border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] flex items-center justify-center mb-8 shadow-[6px_6px_0_0_var(--bulletin-shadow)] text-[var(--bulletin-text)] relative">
              <Smartphone className="h-10 w-10" />
            </div>
            <div className="text-3xl font-black uppercase tracking-tighter mb-4 text-[var(--bulletin-text)]">Discover</div>
            <p className="text-[14px] font-bold opacity-70 dark:opacity-90 dark:text-white leading-relaxed text-[var(--bulletin-text)]">
              Browse through items from other students. Filter by category, condition, or campus location.
            </p>
          </div>

          <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-10 shadow-[12px_12px_0_0_var(--bulletin-shadow)] relative" style={{ transform: 'rotate(-1deg)' }}>
            <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-[#ff6b6b]">STEP 02</div>
            <div className="h-20 w-20 border-4 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/40 flex items-center justify-center mb-8 shadow-[6px_6px_0_0_var(--bulletin-shadow)] text-black dark:text-yellow-200 relative">
              <Shield className="h-10 w-10" />
            </div>
            <div className="text-3xl font-black uppercase tracking-tighter mb-4 text-[var(--bulletin-text)]">Secure Payment</div>
            <p className="text-[14px] font-bold opacity-70 dark:opacity-90 dark:text-white leading-relaxed text-[var(--bulletin-text)]">
              Pay securely through the platform. Funds are held in escrow until you confirm you've received the item exactly as described.
            </p>
          </div>

          <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-10 shadow-[12px_12px_0_0_var(--bulletin-shadow)] relative" style={{ transform: 'rotate(0.5deg)' }}>
            <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-[#ff6b6b]">STEP 03</div>
            <div className="h-20 w-20 border-4 border-[var(--bulletin-border)] bg-[#e0f2f7] dark:bg-sky-900/40 flex items-center justify-center mb-8 shadow-[6px_6px_0_0_var(--bulletin-shadow)] text-black dark:text-sky-200 relative">
              <Truck className="h-10 w-10" />
            </div>
            <div className="text-3xl font-black uppercase tracking-tighter mb-4 text-[var(--bulletin-text)]">Get Item</div>
            <p className="text-[14px] font-bold opacity-70 dark:opacity-90 dark:text-white leading-relaxed text-[var(--bulletin-text)]">
              Meet up at a designated campus safety zone or opt for delivery straight to your hostel.
            </p>
          </div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default HomePage;