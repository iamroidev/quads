import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import productService from '../services/product.service';
import categoryService, { CategoryWithCount } from '../services/category.service';
import { ProductPopulated } from '../types';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductPopulated[]>([]);
  const [recentProducts, setRecentProducts] = useState<ProductPopulated[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<ProductPopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState(0);

  useEffect(() => {
    Promise.all([
      categoryService.getCategoriesWithCounts(),
      productService.getFeatured(12),
      productService.getRecent(12),
      productService.getTrending(12),
    ]).then(([catRes, featRes, recRes, trendRes]) => {
      if (catRes.success) setCategories(catRes.data.categories);
      if (featRes.success) setFeaturedProducts(featRes.data);
      if (recRes.success) setRecentProducts(recRes.data);
      if (trendRes.success) setTrendingProducts(trendRes.data);
      setLoading(false);
    });
  }, []);

  const allProducts = [...featuredProducts, ...recentProducts, ...trendingProducts]
    .filter((p, i, arr) => arr.findIndex(x => x._id === p._id) === i);

  const getImage = (p: ProductPopulated) => p.images[0]?.url || 'https://placehold.co/400x500/ddd/666?text=Item';

  return (
    <div className="relative min-h-screen bg-[#f8f7f4] font-mono text-[13px] leading-tight">
      
      {/* Fragmented header strip */}
      <div className="sticky top-0 z-50 flex items-stretch border-b border-black bg-[#f8f7f4]">
        <div className="flex-1 border-r border-black bg-[#fff5e1] px-3 py-2">
          <span className="block text-[10px] uppercase tracking-wider opacity-40">UMaT</span>
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap font-bold">Campus Market</span>
        </div>
        <div className="flex-1 border-r border-black bg-[#e8f4f8] px-3 py-2">
          <span className="block text-[10px] uppercase tracking-wider opacity-40">Live</span>
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap font-bold">{allProducts.length} items</span>
        </div>
        <div className="flex-1 bg-[#f0e8f4] px-3 py-2">
          <span className="block text-[10px] uppercase tracking-wider opacity-40">Status</span>
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap font-bold">Open</span>
        </div>
      </div>

      {/* Layered bulletin board structure */}
      <div className="relative">
        
        {/* Layer 0: Pinned notices (diagonal) */}
        <div className="relative border-b border-black bg-white p-6 md:p-12">
          <div className="mx-auto max-w-[1400px]">
            <div className="grid gap-4 md:grid-cols-3">
              
              {/* Notice 1 - rotated */}
              <div 
                className="border border-black bg-[#fffacd] p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1"
                style={{ transform: 'rotate(-1.5deg)' }}
              >
                <div className="mb-2 text-[10px] uppercase tracking-wider opacity-60">Pinned</div>
                <div className="mb-3 text-base font-bold leading-tight">
                  Buy & sell without leaving campus
                </div>
                <div className="text-[11px] leading-relaxed opacity-70">
                  Textbooks, gadgets, food, services. Everything from students, for students.
                </div>
                <Link 
                  to="/products" 
                  className="mt-4 inline-block border border-black bg-black px-3 py-1.5 text-[11px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black"
                >
                  Browse →
                </Link>
              </div>

              {/* Notice 2 */}
              <div 
                className="border border-black bg-[#e0f2f7] p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1"
                style={{ transform: 'rotate(1deg)' }}
              >
                <div className="mb-2 text-[10px] uppercase tracking-wider opacity-60">Stats</div>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-black/10 pb-1">
                    <span className="opacity-70">Active listings</span>
                    <span className="font-bold">2,400+</span>
                  </div>
                  <div className="flex justify-between border-b border-black/10 pb-1">
                    <span className="opacity-70">Student sellers</span>
                    <span className="font-bold">1,800+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Platform fee</span>
                    <span className="font-bold">GHS 0</span>
                  </div>
                </div>
              </div>

              {/* Notice 3 */}
              <div 
                className="border border-black bg-[#fce4ec] p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1"
                style={{ transform: 'rotate(-0.5deg)' }}
              >
                <div className="mb-2 text-[10px] uppercase tracking-wider opacity-60">Quick access</div>
                <div className="space-y-2">
                  {categories.slice(0, 4).map(cat => (
                    <Link
                      key={cat._id}
                      to={`/products?category=${cat.slug}`}
                      className="block border-b border-black/10 pb-1 transition-colors hover:opacity-60"
                    >
                      {cat.name} ({cat.productCount})
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layer 1: Product grid as scattered polaroids */}
        <div className="border-b border-black bg-[#faf8f5] p-6 md:p-12">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-8 flex items-end justify-between border-b border-black pb-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-40">Section 01</div>
                <div className="text-lg font-bold">Featured items</div>
              </div>
              <Link to="/products" className="text-[11px] underline hover:no-underline">
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] animate-pulse border border-black bg-white" />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {allProducts.slice(0, 8).map((product, idx) => (
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
                    {/* Polaroid frame */}
                    <div className="border border-black bg-white p-3 shadow-[6px_6px_0_0_rgba(0,0,0,0.1)]">
                      <div className="relative aspect-square overflow-hidden border border-black/10 bg-gray-100">
                        <img
                          src={getImage(product)}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                        {/* Tape effect */}
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
          </div>
        </div>

        {/* Layer 2: Category strips (horizontal scroll like street signs) */}
        <div className="border-b border-black bg-[#f5f9fa] p-6 md:p-12">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-8 flex items-end justify-between border-b border-black pb-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-40">Section 02</div>
                <div className="text-lg font-bold">Browse by category</div>
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map((cat, idx) => (
                <Link
                  key={cat._id}
                  to={`/products?category=${cat.slug}`}
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
                        {cat.productCount} items
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Layer 3: Recent activity feed (newspaper column style) */}
        <div className="border-b border-black bg-[#faf8f3] p-6 md:p-12">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-8 flex items-end justify-between border-b border-black pb-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-40">Section 03</div>
                <div className="text-lg font-bold">Just listed</div>
              </div>
              <Link to="/products?sort=recent" className="text-[11px] underline hover:no-underline">
                View all →
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentProducts.slice(0, 6).map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="group flex gap-3 border border-black bg-[#fffef9] p-3 transition-all hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                >
                  <div className="h-20 w-20 flex-shrink-0 border border-black/10 bg-gray-100">
                    <img
                      src={getImage(product)}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-bold leading-tight line-clamp-2">{product.title}</div>
                    <div className="text-[11px] opacity-50">
                      {typeof product.category === 'string' ? '' : product.category.name}
                    </div>
                    <div className="font-bold">GHS {product.price}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Layer 4: Trending (diagonal layout) */}
        <div className="bg-[#fcfbf8] p-6 md:p-12">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-8 flex items-end justify-between border-b border-black pb-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-40">Section 04</div>
                <div className="text-lg font-bold">Trending now</div>
              </div>
            </div>

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
          </div>
        </div>

        {/* Footer strip */}
        <div className="border-t border-black bg-[#f8f7f4] p-6">
          <div className="mx-auto max-w-[1400px] text-center">
            <div className="text-[10px] uppercase tracking-wider opacity-40">
              UMaT Campus Marketplace · 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
