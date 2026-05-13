import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import productService from '../services/product.service';
import categoryService, { CategoryWithCount } from '../services/category.service';
import api from '../services/api';
import { ProductPopulated } from '../types';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductPopulated[]>([]);
  const [recentProducts, setRecentProducts] = useState<ProductPopulated[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<ProductPopulated[]>([]);
  const [soldFeed, setSoldFeed] = useState<any[]>([]);
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
      productService.getSoldFeed(8),
      productService.getTopSellers(5),
      api.get('/products?limit=0').catch(() => ({ data: { pagination: { total: 0 } } })),
    ]).then(([catRes, featRes, recRes, trendRes, soldRes, sellersRes, countRes]) => {
      if (catRes.success) setCategories(catRes.data.categories || []);
      if (featRes.success) {
        setFeaturedProducts(featRes.data || []);
        setTotalProducts(prev => Math.max(prev, featRes.data?.length || 0));
      }
      if (recRes.success) {
        setRecentProducts(recRes.data || []);
        setTotalProducts(prev => Math.max(prev, recRes.data?.length || 0));
      }
      if (trendRes.success) setTrendingProducts(trendRes.data || []);
      if (soldRes.success) setSoldFeed(soldRes.data || []);
      if (sellersRes.success) {
        setTopSellers(sellersRes.data || []);
        setTotalSellers(sellersRes.data?.length || 0);
      }
      const total = countRes?.data?.pagination?.total;
      if (total) setTotalProducts(total);
      setLoading(false);
    });
  }, []);

  const allProducts = [...featuredProducts, ...recentProducts, ...trendingProducts]
    .filter((p, i, arr) => arr.findIndex(x => x._id === p._id) === i);

  const getImage = (p: ProductPopulated) => p.images[0]?.url || 'https://placehold.co/400x500/ddd/666?text=Item';

  const noticeData = [
    {
      bg: 'bg-[#fffacd]',
      rot: '-1.5deg',
      title: 'Welcome to',
      subtitle: 'UMaT Campus\nMarketplace',
      body: 'Buy, sell, and trade with thousands of students on campus. Textbooks, gadgets, fashion, food & more.',
      cta: { to: '/products', label: 'Browse →' },
      cta2: !isAuthenticated ? { to: '/register', label: 'Join free' } : undefined,
    },
    {
      bg: 'bg-[#e0f2f7]',
      rot: '1deg',
      title: 'Marketplace stats',
      items: [
        { label: 'Active listings', value: totalProducts || '...' },
        { label: 'Student sellers', value: totalSellers > 0 ? totalSellers : '...' },
        { label: 'Categories', value: categories.length || '...' },
        { label: 'Platform fee', value: 'GHS 0', accent: 'text-emerald-600' },
      ],
    },
    {
      bg: 'bg-[#fce4ec]',
      rot: '-0.5deg',
      title: 'Top sellers',
      sellers: topSellers,
      categories: categories,
    },
  ];

  const emptyProducts = allProducts.length === 0;

  return (
    <div className="relative min-h-screen bg-[#f8f7f4] font-mono text-[13px] leading-tight">
      {/* Sticky header */}
      <div className="sticky top-0 z-50 flex items-stretch border-b border-black bg-[#f8f7f4]">
        <div className="w-[40%] border-r border-black bg-[#fff5e1] px-3 py-2">
          <span className="block text-[10px] uppercase tracking-wider opacity-40">UMaT</span>
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap font-bold">Campus Market</span>
        </div>
        <div className="w-[35%] border-r border-black bg-[#e8f4f8] px-3 py-2">
          <span className="block text-[10px] uppercase tracking-wider opacity-40">Live</span>
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap font-bold">{totalProducts || allProducts.length || '0'} items</span>
        </div>
        <div className="w-[25%] bg-[#f0e8f4] px-3 py-2 flex items-center justify-end gap-1">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="text-[9px] font-bold uppercase tracking-wider underline hover:no-underline">Sign in</Link>
              <span className="text-black/20 mx-1">|</span>
              <Link to="/register" className="text-[9px] font-bold uppercase tracking-wider underline hover:no-underline">Join</Link>
            </>
          ) : (
            <Link to="/dashboard" className="text-[9px] font-bold uppercase tracking-wider underline hover:no-underline">Dashboard</Link>
          )}
        </div>
      </div>

      <div className="relative">
        {/* ── Notice row ── */}
        <div className="relative border-b border-black bg-white p-6 md:p-12">
          <div className="mx-auto max-w-[1400px]">
            <div className="grid gap-4 md:grid-cols-3">
              {noticeData.map((notice: any, idx) => (
                <div
                  key={idx}
                  className={`border border-black ${notice.bg} p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all hover:-translate-y-1`}
                  style={{ transform: `rotate(${notice.rot})` }}
                >
                  <div className="mb-2 text-[10px] uppercase tracking-wider opacity-60">{notice.title}</div>
                  {notice.subtitle && (
                    <div className="mb-3 text-xl font-bold leading-tight whitespace-pre-line">{notice.subtitle}</div>
                  )}
                  {notice.body && (
                    <div className="text-[12px] leading-relaxed opacity-70 mb-4">{notice.body}</div>
                  )}
                  {notice.cta && (
                    <div className="flex gap-2">
                      <Link to={notice.cta.to} className="border border-black bg-black px-4 py-2 text-[11px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black">
                        {notice.cta.label}
                      </Link>
                      {notice.cta2 && (
                        <Link to={notice.cta2.to} className="border border-black bg-white px-4 py-2 text-[11px] font-bold uppercase text-black transition-colors hover:bg-black hover:text-white">
                          {notice.cta2.label}
                        </Link>
                      )}
                    </div>
                  )}
                  {notice.items && (
                    <div className="space-y-2 mt-2">
                      {notice.items.map((item: any, i: number) => (
                        <div key={i} className={`flex justify-between ${i < notice.items.length - 1 ? 'border-b border-black/10 pb-1.5' : ''}`}>
                          <span className="opacity-70 text-[12px]">{item.label}</span>
                          <span className={`font-bold text-base ${item.accent || ''}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {notice.sellers && (
                    <div className="space-y-1.5 mt-2">
                      {notice.sellers.length > 0 ? notice.sellers.slice(0, 4).map((seller: any, i: number) => (
                        <div key={seller._id || i} className="flex items-center gap-2 border-b border-black/10 pb-1 last:border-b-0 last:pb-0">
                          <span className="text-[9px] font-bold opacity-40 w-4">#{i + 1}</span>
                          <span className="text-[12px] font-bold truncate flex-1">{seller.storeName || seller.name || 'Top seller'}</span>
                          <span className="text-[10px] opacity-50">{seller.salesCount || seller.productCount || 0} sold</span>
                        </div>
                      )) : (
                        notice.categories.slice(0, 4).map((cat: any) => (
                          <Link key={cat._id} to={`/products?category=${cat.slug}`}
                            className="block border-b border-black/10 pb-1 text-[12px] transition-colors hover:opacity-60">
                            {cat.icon && <span className="mr-2">{cat.icon}</span>}
                            {cat.name} <span className="opacity-50">({cat.productCount})</span>
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Category strips with tape ── */}
        <div className="border-b border-black bg-[#f5f9fa] p-6 md:p-12">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-8 flex items-end justify-between border-b border-black pb-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-40">Section 01</div>
                <div className="text-lg font-bold">Browse by category</div>
              </div>
              <Link to="/categories" className="text-[11px] underline hover:no-underline">View all →</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {(categories.length > 0 ? categories : [
                { _id: '1', name: 'Textbooks', icon: '📚', slug: 'textbooks', productCount: 0 },
                { _id: '2', name: 'Electronics', icon: '📱', slug: 'electronics', productCount: 0 },
                { _id: '3', name: 'Fashion', icon: '👕', slug: 'fashion', productCount: 0 },
                { _id: '4', name: 'Food & Drinks', icon: '🍔', slug: 'food', productCount: 0 },
                { _id: '5', name: 'Services', icon: '🛠️', slug: 'services', productCount: 0 },
                { _id: '6', name: 'Housing', icon: '🏠', slug: 'housing', productCount: 0 },
              ]).map((cat: any, idx: number) => (
                <Link key={cat._id} to={`/products?category=${cat.slug}`} className="group flex-shrink-0">
                  <div className="relative border border-black bg-[#fefdfb] px-6 py-8 shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:-translate-y-1"
                    style={{ width: '180px', transform: `rotate(${(idx % 2) * 2 - 1}deg)` }}>
                    {/* Tape */}
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 h-5 w-16 bg-[#ffd700]/30 opacity-60 rotate-1" />
                    <div className="text-center">
                      <div className="mb-3 text-3xl">{cat.icon || '📦'}</div>
                      <div className="font-bold leading-tight text-sm">{cat.name}</div>
                      <div className="mt-2 text-[10px] uppercase opacity-50">{cat.productCount} items</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Featured items as polaroid grid ── */}
        <div className="border-b border-black bg-[#faf8f5] p-6 md:p-12">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-8 flex items-end justify-between border-b border-black pb-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-40">Section 02</div>
                <div className="text-lg font-bold">Featured items</div>
              </div>
              <Link to="/products" className="text-[11px] underline hover:no-underline">View all →</Link>
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] animate-pulse border border-black bg-white" />
                ))}
              </div>
            ) : emptyProducts ? (
              <div className="border border-black bg-[#fffacd] p-10 text-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <div className="text-4xl mb-3">📦</div>
                <div className="text-[10px] uppercase tracking-wider opacity-60 mb-1">No listings yet</div>
                <div className="font-bold text-base">Be the first to list something!</div>
                {!isAuthenticated && (
                  <Link to="/register" className="mt-4 inline-block border border-black bg-black px-4 py-2 text-[11px] font-bold uppercase text-white hover:bg-white hover:text-black transition-colors">
                    Start selling →
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {allProducts.slice(0, 8).map((product, idx) => (
                  <Link key={product._id} to={`/products/${product._id}`}
                    className="group relative"
                    style={{ transform: `rotate(${(idx % 3 - 1) * 0.8}deg)`, transition: 'transform 0.25s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'rotate(0deg) translateY(-10px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = `rotate(${(idx % 3 - 1) * 0.8}deg)`; }}
                  >
                    <div className="border border-black bg-white p-3 shadow-[6px_6px_0_0_rgba(0,0,0,0.12)]">
                      <div className="relative aspect-square overflow-hidden border border-black/10 bg-gray-100">
                        <img src={getImage(product)} alt={product.title} className="h-full w-full object-cover" loading="lazy" />
                        <div className="absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 bg-[#ffd700]/30 rotate-[-2deg]" />
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="truncate font-bold leading-tight">{product.title}</div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-base font-bold">GHS {product.price}</span>
                          <span className="text-[10px] uppercase opacity-50">{typeof product.category === 'string' ? '' : (product.category as any)?.name}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Just listed (newspaper) ── */}
        <div className="border-b border-black bg-[#faf8f3] p-6 md:p-12">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-8 flex items-end justify-between border-b border-black pb-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-40">Section 03</div>
                <div className="text-lg font-bold">Just listed</div>
              </div>
              <Link to="/products?sort=recent" className="text-[11px] underline hover:no-underline">View all →</Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentProducts.slice(0, 6).map((product) => (
                <Link key={product._id} to={`/products/${product._id}`}
                  className="group flex gap-3 border border-black bg-[#fffef9] p-3 transition-all hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <div className="h-20 w-20 flex-shrink-0 border border-black/10 bg-gray-100 overflow-hidden">
                    <img src={getImage(product)} alt={product.title} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-bold leading-tight line-clamp-2">{product.title}</div>
                    <div className="text-[11px] opacity-50">{typeof product.category === 'string' ? '' : (product.category as any)?.name}</div>
                    <div className="font-bold">GHS {product.price}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Activity + Trending ── */}
        <div className="border-b border-black p-6 md:p-12" style={{ backgroundColor: '#fcfbf8' }}>
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-8 flex items-end justify-between border-b border-black pb-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-40">Section 04</div>
                <div className="text-lg font-bold">Activity</div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Sold feed */}
              <div>
                <div className="mb-4 text-[11px] font-bold uppercase tracking-wider opacity-60">Recent sales</div>
                <div className="space-y-2">
                  {soldFeed.length > 0 ? soldFeed.slice(0, 5).map((sale: any, i: number) => (
                    <div key={sale._id || i} className="flex items-center gap-3 border border-black bg-white p-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      <div className="h-10 w-10 border border-black/20 bg-gray-100 flex-shrink-0 overflow-hidden">
                        {sale.image && <img src={sale.image} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold truncate">{sale.title || 'Item sold'}</p>
                        <p className="text-[10px] opacity-50">GHS {sale.price || 0}</p>
                      </div>
                      <span className="text-[9px] font-bold uppercase text-emerald-600">Sold</span>
                    </div>
                  )) : trendingProducts.slice(0, 3).map((product, idx) => (
                    <Link key={product._id} to={`/products/${product._id}`}
                      className="flex items-center gap-3 border border-black bg-white p-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all">
                      <div className="h-10 w-10 border border-black/20 bg-gray-100 flex-shrink-0 overflow-hidden">
                        <img src={getImage(product)} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold truncate">{product.title}</p>
                        <p className="text-[10px] opacity-50">Trending #{idx + 1}</p>
                      </div>
                      <span className="font-bold">GHS {product.price}</span>
                    </Link>
                  ))}
                  {(soldFeed.length === 0 && trendingProducts.length === 0) && (
                    <div className="border border-black bg-[#fffacd] p-6 text-center">
                      <div className="text-[10px] uppercase tracking-wider opacity-60">No recent activity</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Trending */}
              <div>
                <div className="mb-4 text-[11px] font-bold uppercase tracking-wider opacity-60">Trending now</div>
                <div className="grid gap-3">
                  {trendingProducts.slice(0, 3).map((product, idx) => (
                    <Link key={product._id} to={`/products/${product._id}`}
                      className="group relative overflow-hidden border border-black bg-[#fdfcfa] transition-all hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)]"
                      style={{ transform: `skewY(${(idx - 1) * 0.3}deg)` }}>
                      <div className="flex items-stretch">
                        <div className="w-24 h-24 overflow-hidden border-r border-black bg-gray-100 flex-shrink-0">
                          <img src={getImage(product)} alt={product.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        </div>
                        <div className="p-3">
                          <div className="text-[9px] uppercase tracking-wider opacity-40 mb-1">Trending #{idx + 1}</div>
                          <div className="text-[12px] font-bold leading-tight line-clamp-1">{product.title}</div>
                          <div className="mt-1 text-base font-bold">GHS {product.price}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── How it works (guests only) ── */}
        {!isAuthenticated && (
          <div className="border-b border-black bg-[#fffef5] p-8 md:p-14">
            <div className="mx-auto max-w-[1400px]">
              <div className="mb-8 border-b border-black pb-2">
                <div className="text-[10px] uppercase tracking-wider opacity-40">Section 05</div>
                <div className="text-lg font-bold">How it works</div>
              </div>
              <div className="grid gap-8 md:grid-cols-3">
                {[
                  { step: '01', icon: '👤', title: 'Create account', body: 'Sign up as a buyer or seller in under 2 minutes. Use your student email.', color: 'bg-[#fffacd]' },
                  { step: '02', icon: '🔍', title: 'Browse or list', body: 'Discover items from fellow students or post your own with photos and price.', color: 'bg-[#e0f2f7]' },
                  { step: '03', icon: '🤝', title: 'Meet & transact', body: 'Arrange campus pickup. No shipping, no fees. Payment is protected.', color: 'bg-[#fce4ec]' },
                ].map((item, idx) => (
                  <div key={idx} className={`relative border border-black ${item.color} p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)]`}
                    style={{ transform: `rotate(${(idx - 1) * 0.8}deg)` }}>
                    <div className="absolute -top-2.5 left-3 h-5 w-16 bg-[#ffd700]/40 rotate-1" />
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-[10px] font-bold uppercase opacity-30">Step {item.step}</span>
                    </div>
                    <div className="font-bold text-base mb-1">{item.title}</div>
                    <div className="text-[12px] opacity-70 leading-relaxed">{item.body}</div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-10">
                <Link to="/register" className="inline-block border-2 border-black bg-black px-8 py-3 text-[12px] font-bold uppercase text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-colors">
                  Get started — it's free →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="border-t border-black bg-[#f8f7f4]">
          <div className="mx-auto max-w-[1400px] p-6 md:p-12">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <div className="mb-3 text-[10px] uppercase tracking-wider opacity-40">Marketplace</div>
                <div className="space-y-2 text-[12px]">
                  <Link to="/products" className="block hover:underline">Browse listings</Link>
                  <Link to="/categories" className="block hover:underline">Categories</Link>
                  {isAuthenticated ? <Link to="/sell" className="block hover:underline">Sell an item</Link> : <Link to="/register" className="block hover:underline">Start selling</Link>}
                </div>
              </div>
              <div>
                <div className="mb-3 text-[10px] uppercase tracking-wider opacity-40">Account</div>
                <div className="space-y-2 text-[12px]">
                  {isAuthenticated ? (
                    <><Link to="/dashboard" className="block hover:underline">Dashboard</Link><Link to="/orders" className="block hover:underline">Orders</Link><Link to="/profile" className="block hover:underline">Profile</Link></>
                  ) : (
                    <><Link to="/login" className="block hover:underline">Login</Link><Link to="/register" className="block hover:underline">Register</Link></>
                  )}
                </div>
              </div>
              <div>
                <div className="mb-3 text-[10px] uppercase tracking-wider opacity-40">Support</div>
                <div className="space-y-2 text-[12px]">
                  <span className="block opacity-60">Help center</span>
                  <span className="block opacity-60">Safety tips</span>
                  <span className="block opacity-60">Contact us</span>
                </div>
              </div>
              <div>
                <div className="mb-3 text-[10px] uppercase tracking-wider opacity-40">Info</div>
                <div className="border border-black bg-[#fffacd] p-2 text-[11px]">
                  <div className="font-bold">Campus only</div>
                  <div className="opacity-70">UMaT students & staff</div>
                </div>
              </div>
            </div>
            <div className="mt-8 border-t border-black pt-6 text-center">
              <div className="text-[10px] uppercase tracking-wider opacity-40">UMaT Campus Marketplace · 2026 · Made for students, by students</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;