import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, X } from 'lucide-react';
import productService from '../services/product.service';
import categoryService from '../services/category.service';
import { LoadingSpinner } from '../components/ui';
import { ProductPopulated, Category, PaginationInfo, ProductCondition, DeliveryOption } from '../types';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';
import { ProductCardSkeleton } from '../components/ui/BulletinSkeleton';

const conditionOptions = [
  { value: '', label: 'All Conditions' },
  { value: 'new', label: 'Brand New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const sortOptions = [
  { value: '', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Viewed' },
  { value: 'oldest', label: 'Oldest First' },
];

const deliveryOptions = [
  { value: '', label: 'All Delivery' },
  { value: 'pickup', label: 'Campus Pickup' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'both', label: 'Pickup or Delivery' },
];

const proximityOptions = [
  { value: '', label: 'Entire Campus' },
  { value: 'Chamber of Mines Hall', label: 'Chamber of Mines' },
  { value: 'Gold Refinery Hall', label: 'Gold Refinery' },
  { value: 'KT Hall', label: 'K.T. Hall' },
  { value: 'Recognition Hostel', label: 'Recognition' },
  { value: 'Osborn Hostel', label: 'Osborn' },
  { value: 'Tandoh Hostel', label: 'Tandoh' },
  { value: 'Good Shepherd Hostel', label: 'Good Shepherd' },
  { value: 'Agrich Hostel', label: 'Agrich' },
  { value: 'Kiviz Executive Lodge', label: 'Kiviz Lodge' },
  { value: 'Platinum Hostel', label: 'Platinum' },
  { value: 'Global Hostel', label: 'Global' },
  { value: 'Hill View Hostel', label: 'Hill View' },
  { value: 'AdeJoe Hostel', label: 'AdeJoe' },
  { value: 'Off-campus', label: 'Off-campus' },
  { value: 'Other', label: 'Other' },
];

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<ProductPopulated[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Read filters from URL
  const category = searchParams.get('category') || '';
  const condition = searchParams.get('condition') || '';
  const sort = searchParams.get('sort') || '';
  const search = searchParams.get('search') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const deliveryOption = searchParams.get('delivery') || '';
  const pickupLocation = searchParams.get('pickupLocation') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Fetch categories
  useEffect(() => {
    categoryService.getCategories().then((res) => {
      if (res.success) setCategories(res.data.categories);
    });
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await productService.getProducts({
          category: category || undefined,
          condition: (condition as ProductCondition) || undefined,
          sort: sort || undefined,
          search: search || undefined,
          minPrice: minPrice ? parseFloat(minPrice) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          deliveryOption: (deliveryOption as DeliveryOption) || undefined,
          pickupLocation: pickupLocation || undefined,
          page,
          limit: 20,
        });
        if (res.success) {
          setProducts(res.data);
          setPagination(res.pagination);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, condition, sort, search, minPrice, maxPrice, deliveryOption, page]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 when filters change
    if (key !== 'page') {
      params.delete('page');
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = category || condition || minPrice || maxPrice || deliveryOption || pickupLocation;

  return (
    <BulletinLayout 
      title={search ? `Results: "${search}"` : 'Product Catalog'}
      subtitle={pagination ? `${pagination.total} Items Available` : 'Syncing...'}
      section="02"
    >
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-black pb-8">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-[var(--bulletin-text)] mb-2">Campus Inventory</h2>
            <p className="text-[14px] font-bold text-[var(--bulletin-text)] opacity-60">Browse active listings for books, electronics, and essentials.</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-3 border-4 border-black bg-[var(--bulletin-card)] px-8 py-4 text-[12px] font-black uppercase tracking-widest shadow-[8px_8px_0_0_var(--bulletin-shadow)] transition-all md:hidden text-[var(--bulletin-text)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
          >
            <Filter className="h-5 w-5" />
            Filter Results
            {hasActiveFilters && (
              <span className="ml-2 flex h-6 w-6 items-center justify-center bg-[#ff6b6b] text-[10px] text-white border-2 border-black">
                !
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar filters - Desktop */}
          <div className={`${showFilters ? 'fixed inset-0 z-[2000] bg-[var(--bulletin-bg)] p-8 overflow-auto' : 'hidden'} md:block md:static md:w-80 md:flex-shrink-0`}>
            <div className="flex items-center justify-between mb-10 border-b-4 border-black pb-6 md:hidden">
              <div className="text-2xl font-black uppercase tracking-tight text-[var(--bulletin-text)]">Preferences</div>
              <button onClick={() => setShowFilters(false)} className="h-10 w-10 border-4 border-black bg-white flex items-center justify-center text-xl font-black">✕</button>
            </div>

            <div className="space-y-12">
              {/* Category filter */}
              <div className="relative group">
                <div className="absolute -top-3 left-6 h-6 w-24 bg-[#ffd700]/60 rotate-[-1deg] z-10" />
                <div className="border-4 border-black bg-[var(--bulletin-card)] p-6 shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
                  <div className="mb-6 text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">Categories</div>
                  <div className="space-y-2">
                    <button
                      onClick={() => updateFilter('category', '')}
                      className={`w-full text-left px-4 py-3 text-[12px] transition-all font-black uppercase tracking-tighter border-2 ${
                        !category 
                          ? 'bg-black text-white border-black' 
                          : 'bg-transparent text-[var(--bulletin-text)] border-transparent hover:border-black/20'
                      }`}
                    >
                      Full Catalog
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => updateFilter('category', cat.slug)}
                        className={`w-full text-left px-4 py-3 text-[12px] transition-all font-black uppercase tracking-tighter border-2 ${
                          category === cat.slug
                            ? 'bg-black text-white border-black'
                            : 'bg-transparent text-[var(--bulletin-text)] border-transparent hover:border-black/20'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Condition filter */}
              <div className="border-4 border-black bg-[var(--bulletin-card)] p-6 shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
                <div className="mb-6 text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">Item Condition</div>
                <select
                  value={condition}
                  onChange={(e) => updateFilter('condition', e.target.value)}
                  className="w-full border-4 border-black bg-[var(--bulletin-bg)] p-4 text-[13px] font-black uppercase focus:outline-none text-[var(--bulletin-text)]"
                >
                  {conditionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Price range */}
              <div className="border-4 border-black bg-[var(--bulletin-card)] p-6 shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
                <div className="mb-6 text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">Price Range (GHS)</div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Floor"
                    value={minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    className="w-full border-4 border-black bg-[var(--bulletin-bg)] p-4 text-[13px] font-black focus:outline-none placeholder:opacity-20 text-[var(--bulletin-text)]"
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="Ceiling"
                    value={maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    className="w-full border-4 border-black bg-[var(--bulletin-bg)] p-4 text-[13px] font-black focus:outline-none placeholder:opacity-20 text-[var(--bulletin-text)]"
                    min="0"
                  />
                </div>
              </div>

              {/* Delivery option */}
              <div className="border-4 border-black bg-[var(--bulletin-card)] p-6 shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
                <div className="mb-6 text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">Delivery & Pickup</div>
                <select
                  value={deliveryOption}
                  onChange={(e) => updateFilter('delivery', e.target.value)}
                  className="w-full border-4 border-black bg-[var(--bulletin-bg)] p-4 text-[13px] font-black uppercase focus:outline-none text-[var(--bulletin-text)]"
                >
                  {deliveryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Campus Proximity */}
              <div className="border-4 border-black bg-[var(--bulletin-card)] p-6 shadow-[8px_8px_0_0_var(--bulletin-shadow)] relative overflow-hidden group">
                <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-100 transition-opacity">
                  <Filter className="h-4 w-4" />
                </div>
                <div className="mb-6 text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">Pickup Locations</div>
                <select
                  value={pickupLocation}
                  onChange={(e) => updateFilter('pickupLocation', e.target.value)}
                  className="w-full border-4 border-black bg-[var(--bulletin-bg)] p-4 text-[13px] font-black uppercase focus:outline-none text-[var(--bulletin-text)]"
                >
                  {proximityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="mt-4 text-[9px] font-bold opacity-40 uppercase leading-tight">
                  Discover resources within specific residence zones for zero-latency retrieval.
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full border-4 border-black bg-[#ff6b6b] px-6 py-5 text-[12px] font-black uppercase text-white shadow-[8px_8px_0_0_var(--bulletin-shadow)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6 pb-8 border-b-4 border-black">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-[var(--bulletin-text)]">Sort by:</span>
                <select
                  value={sort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="border-4 border-black bg-[var(--bulletin-card)] px-6 py-3 text-[12px] font-black uppercase focus:outline-none text-[var(--bulletin-text)]"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-[var(--bulletin-text)] self-center mr-2">Active:</span>
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 border-2 border-black bg-[#fffacd] dark:bg-yellow-900/40 px-3 py-1 text-[10px] font-black uppercase text-black dark:text-yellow-200"
                  >
                    Reset <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Products */}
            {loading ? (
              <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
                 {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="border-8 border-black bg-[#fffacd] dark:bg-yellow-900/10 p-20 text-center shadow-[16px_16px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(-0.5deg)' }}>
                <div className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40 mb-6 text-black dark:text-yellow-200">System Empty</div>
                <h3 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-yellow-200 leading-none">
                  {search
                    ? `No matches for "${search}"`
                    : 'No items found.'}
                </h3>
                <p className="mt-6 text-[14px] font-bold opacity-60 text-black dark:text-yellow-200">Adjust your criteria or post a new listing.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-x-12 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product, idx) => {
                    const getImage = (p: ProductPopulated) => p.images[0]?.url || 'https://placehold.co/400x500/ddd/666?text=Item';
                    return (
                      <Link
                        key={product._id}
                        to={`/products/${product._id}`}
                        className="group relative block"
                        style={{ 
                          transform: `rotate(${(idx % 3 - 1) * 1.5}deg)`,
                        }}
                      >
                        {/* Tape effect */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-8 w-32 bg-[#ffd700]/40 rotate-[-2deg] z-10 opacity-60 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="border-4 border-black bg-[var(--bulletin-card)] p-5 shadow-[12px_12px_0_0_var(--bulletin-shadow),-4px_4px_0_0_#ff6b6b] group-hover:shadow-[20px_20px_0_0_var(--bulletin-shadow),-8px_8px_0_0_#ff6b6b] group-hover:-translate-y-3 transition-all">
                          <div className="relative aspect-[4/5] overflow-hidden border-4 border-black bg-black/5">
                            <img
                              src={getImage(product)}
                              alt={product.title}
                              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                          </div>
                          
                          <div className="mt-6 space-y-3">
                            <div className="text-lg font-black uppercase tracking-tight text-[var(--bulletin-text)] leading-none line-clamp-2 min-h-[2.4em]">{product.title}</div>
                            <div className="flex items-end justify-between border-t-2 border-black/5 pt-4">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase opacity-40 text-[var(--bulletin-text)]">Price</span>
                                <span className="text-2xl font-black text-[var(--bulletin-text)] tracking-tighter">GHS {product.price.toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black uppercase opacity-40 text-[var(--bulletin-text)]">Category</span>
                                <span className="text-[11px] font-black uppercase tracking-tighter text-[var(--bulletin-text)]">
                                  {typeof product.category === 'string' ? '' : product.category.name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex justify-center flex-wrap gap-4 mt-24 pt-12 border-t-4 border-black">
                    {page > 1 && (
                      <button
                        onClick={() => updateFilter('page', String(page - 1))}
                        className="border-4 border-black bg-black text-white px-8 py-3 text-[12px] font-black uppercase tracking-widest transition-all hover:bg-[#ff6b6b] shadow-[6px_6px_0_0_rgba(0,0,0,0.2)]"
                      >
                        ← Previous
                      </button>
                    )}
                    
                    <div className="flex gap-2">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        let pageNum: number;
                        if (pagination.pages <= 5) pageNum = i + 1;
                        else if (page <= 3) pageNum = i + 1;
                        else if (page >= pagination.pages - 2) pageNum = pagination.pages - 4 + i;
                        else pageNum = page - 2 + i;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => updateFilter('page', String(pageNum))}
                            className={`h-12 w-12 border-4 border-black text-[14px] font-black transition-all ${
                              pageNum === page
                                ? 'bg-black text-white shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] -translate-y-1'
                                : 'bg-[var(--bulletin-card)] text-[var(--bulletin-text)] hover:bg-[#fffacd] hover:text-black'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    {page < pagination.pages && (
                      <button
                        onClick={() => updateFilter('page', String(page + 1))}
                        className="border-4 border-black bg-black text-white px-8 py-3 text-[12px] font-black uppercase tracking-widest transition-all hover:bg-[#ff6b6b] shadow-[6px_6px_0_0_rgba(0,0,0,0.2)]"
                      >
                        Proceed →
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default Products;
