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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import productService from '../services/product.service';
import categoryService, { CategoryWithCount } from '../services/category.service';
import { ProductPopulated } from '../types';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recentProducts, setRecentProducts] = useState<ProductPopulated[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<ProductPopulated[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);

  useEffect(() => {
    productService.getRecent(8)
      .then((res) => { if (res.success) setRecentProducts(res.data); })
      .catch(() => {})
      .finally(() => setLoadingRecent(false));

    productService.getTrending(8)
      .then((res) => { if (res.success) setTrendingProducts(res.data); })
      .catch(() => {})
      .finally(() => setLoadingTrending(false));

    categoryService.getCategoriesWithCounts()
      .then((res) => { if (res.success) setCategories(res.data.categories.slice(0, 8)); })
      .catch(() => {});
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const isSeller = user?.role === 'seller' || user?.role === 'admin';

  const getImage = (p: ProductPopulated) => p.images[0]?.url || 'https://placehold.co/400x500/ddd/666?text=Item';

  /* ── Quick actions: role-aware ── */
  const quickActions = isSeller
    ? [
        { to: '/my-listings', icon: <ShoppingBag className="h-5 w-5" />, label: 'My listings', bg: 'bg-[#fffacd]' },
        { to: '/seller/orders', icon: <Package className="h-5 w-5" />, label: 'Seller orders', bg: 'bg-[#e0f2f7]' },
        { to: '/seller/analytics', icon: <BarChart2 className="h-5 w-5" />, label: 'Analytics', bg: 'bg-[#fce4ec]' },
        { to: '/messages', icon: <Bell className="h-5 w-5" />, label: 'Messages', bg: 'bg-[#f0e8f4]' },
      ]
    : [
        { to: '/products', icon: <Grid2x2 className="h-5 w-5" />, label: 'Browse all', bg: 'bg-[#fffacd]' },
        { to: '/saved', icon: <Heart className="h-5 w-5" />, label: 'Saved items', bg: 'bg-[#e0f2f7]' },
        { to: '/orders', icon: <Package className="h-5 w-5" />, label: 'My orders', bg: 'bg-[#fce4ec]' },
        { to: '/messages', icon: <Bell className="h-5 w-5" />, label: 'Messages', bg: 'bg-[#f0e8f4]' },
      ];

  return (
    <BulletinLayout 
      title={`${greeting}, ${firstName}`}
      subtitle="Dashboard"
      section="01"
    >
      {/* Quick action notices — role-aware */}
      <BulletinSection bgColor="bg-[#faf8f5]" title="Quick actions" subtitle="Section 01">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map(({ to, icon, label, bg }, idx) => (
            <Link
              key={to}
              to={to}
              className="group"
              style={{ transform: `rotate(${(idx % 2) * 2 - 1}deg)` }}
            >
              <div className={`border border-black ${bg} p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:-translate-y-1`}>
                <div className="mb-3">{icon}</div>
                <div className="font-bold leading-tight">{label}</div>
              </div>
            </Link>
          ))}
        </div>
      </BulletinSection>

      {/* Categories */}
      {categories.length > 0 && (
        <BulletinSection bgColor="bg-[#f5f9fa]" title="Browse by category" subtitle="Section 02">
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((cat, idx) => (
              <Link
                key={cat._id}
                to={`/products?category=${cat._id}`}
                className="group flex-shrink-0"
              >
                <div 
                  className="border border-black bg-[#fefdfb] px-6 py-8 shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:-translate-y-1"
                  style={{ 
                    width: '180px',
                    transform: `rotate(${(idx % 2) * 2 - 1}deg)`
                  }}
                >
                  <div className="text-center">
                    <div className="mb-3 text-3xl">{cat.icon || '📦'}</div>
                    <div className="font-bold leading-tight">{cat.name}</div>
                    <div className="mt-2 text-[10px] uppercase opacity-50">
                      {cat.productCount ?? 0} items
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </BulletinSection>
      )}

      {/* New arrivals */}
      <BulletinSection 
        bgColor="bg-[#faf8f3]" 
        title="Just listed" 
        subtitle="Section 03"
        action={<Link to="/products?sort=" className="text-[11px] underline hover:no-underline">View all →</Link>}
      >
        {loadingRecent ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse border border-black bg-white" />
            ))}
          </div>
        ) : recentProducts.length === 0 ? (
          <div className="border border-black bg-[#fffacd] p-8 text-center">
            <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2">No listings yet</div>
            <div className="font-bold">Check back soon for new items</div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recentProducts.map((product, idx) => (
              <Link
                key={product._id}
                to={`/products/${product._id}`}
                className="group relative"
                style={{ 
                  transform: `rotate(${(idx % 3 - 1) * 0.8}deg)`,
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'rotate(0deg) translateY(-8px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = `rotate(${(idx % 3 - 1) * 0.8}deg)`;
                }}
              >
                <div className="border border-black bg-white p-3 shadow-[6px_6px_0_0_rgba(0,0,0,0.1)]">
                  <div className="relative aspect-square overflow-hidden border border-black/10 bg-gray-100">
                    <img
                      src={getImage(product)}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 bg-[#ffd700]/30 opacity-60" 
                         style={{ transform: 'translateX(-50%) rotate(-2deg)' }} />
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="truncate font-bold leading-tight">{product.title}</div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-bold">GHS {product.price}</span>
                      <span className="text-[10px] uppercase opacity-50">
                        {typeof product.category === 'string' ? '' : product.category.name}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </BulletinSection>

      {/* Trending */}
      <BulletinSection 
        bgColor="bg-[#fcfbf8]" 
        title="Trending now" 
        subtitle="Section 04"
        action={<Link to="/products?sort=popular" className="text-[11px] underline hover:no-underline">View all →</Link>}
      >
        {loadingTrending ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse border border-black bg-white" />
            ))}
          </div>
        ) : trendingProducts.length === 0 ? (
          <div className="border border-black bg-[#fffacd] p-8 text-center">
            <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2">No trending items</div>
            <div className="font-bold">Check back later</div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {trendingProducts.slice(0, 3).map((product, idx) => (
              <Link
                key={product._id}
                to={`/products/${product._id}`}
                className="group relative overflow-hidden border border-black bg-[#fdfcfa] transition-all hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
                style={{ transform: `skewY(${(idx - 1) * 0.5}deg)` }}
              >
                <div className="aspect-[4/3] overflow-hidden border-b border-black bg-gray-100">
                  <img
                    src={getImage(product)}
                    alt={product.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="mb-2 text-[10px] uppercase tracking-wider opacity-40">
                    Trending #{idx + 1}
                  </div>
                  <div className="mb-2 font-bold leading-tight">{product.title}</div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold">GHS {product.price}</span>
                    <span className="text-[10px] uppercase opacity-50">
                      {typeof product.category === 'string' ? '' : product.category.name}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </BulletinSection>

      {/* CTA for buyers to become sellers */}
      {user?.role === 'buyer' && (
        <BulletinSection bgColor="bg-black">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">
                Got something to sell?
              </div>
              <div className="text-xl font-bold text-white">
                Upgrade to a seller account
              </div>
              <div className="text-[12px] text-white/50 mt-1">
                List your items and reach thousands of students.
              </div>
            </div>
            <Link
              to="/profile"
              className="flex-shrink-0 border border-white bg-white px-6 py-3 text-[11px] font-bold uppercase text-black transition-colors hover:bg-black hover:text-white"
            >
              Learn more →
            </Link>
          </div>
        </BulletinSection>
      )}

      {/* Seller quick links */}
      {isSeller && (
        <BulletinSection bgColor="bg-black">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">
                Seller hub
              </div>
              <div className="text-xl font-bold text-white">
                Manage your sales
              </div>
              <div className="text-[12px] text-white/50 mt-1">
                Track orders, view analytics, and grow your store.
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                to="/sell"
                className="flex-shrink-0 border border-white bg-white px-6 py-3 text-[11px] font-bold uppercase text-black transition-colors hover:bg-black hover:text-white"
              >
                + New listing
              </Link>
              <Link
                to="/seller/analytics"
                className="flex-shrink-0 border border-white/40 px-6 py-3 text-[11px] font-bold uppercase text-white/70 transition-colors hover:border-white hover:text-white"
              >
                Analytics →
              </Link>
            </div>
          </div>
        </BulletinSection>
      )}
    </BulletinLayout>
  );
};

export default Dashboard;