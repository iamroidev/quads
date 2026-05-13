import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, X } from 'lucide-react';
import productService from '../services/product.service';
import categoryService from '../services/category.service';
import { LoadingSpinner } from '../components/ui';
import { ProductPopulated, Category, PaginationInfo, ProductCondition, DeliveryOption } from '../types';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';

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

  const hasActiveFilters = category || condition || minPrice || maxPrice || deliveryOption;

  return (
    <BulletinLayout 
      title={search ? `Results for "${search}"` : 'Browse Products'}
      subtitle={pagination ? `${pagination.total} item${pagination.total !== 1 ? 's' : ''}` : 'Products'}
      section="02"
    >
      <BulletinSection bgColor="bg-[#faf8f5]">
        <div className="mb-6 flex items-center justify-between border-b border-black pb-3">
          <div className="text-[10px] uppercase tracking-wider opacity-40">
            {pagination ? `${pagination.total} results` : 'Loading...'}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 border border-black bg-white px-3 py-1.5 text-[11px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] md:hidden"
          >
            <Filter className="h-3 w-3" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center bg-black text-[9px] text-white">
                !
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters - Desktop */}
          <div className={`${showFilters ? 'fixed inset-0 z-50 bg-[#f8f7f4] p-6 overflow-auto' : 'hidden'} md:block md:static md:w-64 md:flex-shrink-0`}>
            <div className="flex items-center justify-between mb-4 border-b border-black pb-3 md:hidden">
              <div className="text-base font-bold">Filters</div>
              <button onClick={() => setShowFilters(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Category filter */}
            <div className="mb-6 border border-black bg-white p-3 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
              <div className="mb-3 text-[10px] uppercase tracking-wider opacity-60">Category</div>
              <div className="space-y-1">
                <button
                  onClick={() => updateFilter('category', '')}
                  className={`w-full text-left px-2 py-1.5 text-[12px] transition-colors ${
                    !category ? 'bg-black text-white font-bold' : 'hover:bg-[#f8f7f4]'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => updateFilter('category', cat.slug)}
                    className={`w-full text-left px-2 py-1.5 text-[12px] transition-colors ${
                      category === cat.slug
                        ? 'bg-black text-white font-bold'
                        : 'hover:bg-[#f8f7f4]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition filter */}
            <div className="mb-6 border border-black bg-white p-3 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
              <div className="mb-3 text-[10px] uppercase tracking-wider opacity-60">Condition</div>
              <select
                value={condition}
                onChange={(e) => updateFilter('condition', e.target.value)}
                className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black"
              >
                {conditionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Price range */}
            <div className="mb-6 border border-black bg-white p-3 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
              <div className="mb-3 text-[10px] uppercase tracking-wider opacity-60">Price Range (GHS)</div>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => updateFilter('minPrice', e.target.value)}
                  className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black"
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => updateFilter('maxPrice', e.target.value)}
                  className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black"
                  min="0"
                />
              </div>
            </div>

            {/* Delivery option */}
            <div className="mb-6 border border-black bg-white p-3 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
              <div className="mb-3 text-[10px] uppercase tracking-wider opacity-60">Delivery</div>
              <select
                value={deliveryOption}
                onChange={(e) => updateFilter('delivery', e.target.value)}
                className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black"
              >
                {deliveryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full border border-black bg-white px-3 py-2 text-[11px] font-bold uppercase transition-colors hover:bg-black hover:text-white"
              >
                Clear All Filters
              </button>
            )}

            {/* Close on mobile */}
            <button
              onClick={() => setShowFilters(false)}
              className="w-full mt-4 border border-black bg-black px-3 py-2 text-[11px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black md:hidden"
            >
              Apply Filters
            </button>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-black">
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 border border-black bg-white px-2 py-1 text-[10px] font-bold uppercase transition-colors hover:bg-black hover:text-white"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider opacity-60">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="border border-black bg-[#fefdfb] px-3 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products */}
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] animate-pulse border border-black bg-white" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="border border-black bg-[#fffacd] p-8 text-center">
                <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2">No results</div>
                <div className="font-bold">
                  {search
                    ? `No products found for "${search}"`
                    : 'No products available yet. Be the first to list!'}
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product, idx) => {
                    const getImage = (p: ProductPopulated) => p.images[0]?.url || 'https://placehold.co/400x500/ddd/666?text=Item';
                    return (
                      <Link
                        key={product._id}
                        to={`/products/${product._id}`}
                        className="group relative"
                        style={{ 
                          transform: `rotate(${(idx % 3 - 1) * 0.5}deg)`,
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'rotate(0deg) translateY(-8px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = `rotate(${(idx % 3 - 1) * 0.5}deg)`;
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
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {page > 1 && (
                      <button
                        onClick={() => updateFilter('page', String(page - 1))}
                        className="border border-black bg-white px-4 py-2 text-[11px] font-bold uppercase transition-colors hover:bg-black hover:text-white"
                      >
                        Previous
                      </button>
                    )}
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNum: number;
                      if (pagination.pages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => updateFilter('page', String(pageNum))}
                          className={`border px-4 py-2 text-[11px] font-bold uppercase transition-colors ${
                            pageNum === page
                              ? 'bg-black text-white border-black'
                              : 'bg-white border-black hover:bg-black hover:text-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {page < pagination.pages && (
                      <button
                        onClick={() => updateFilter('page', String(page + 1))}
                        className="border border-black bg-white px-4 py-2 text-[11px] font-bold uppercase transition-colors hover:bg-black hover:text-white"
                      >
                        Next
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
