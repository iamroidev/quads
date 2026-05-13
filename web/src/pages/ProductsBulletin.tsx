import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { X } from 'lucide-react';
import productService from '../services/product.service';
import categoryService from '../services/category.service';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';
import { ProductPopulated, Category, PaginationInfo, ProductCondition } from '../types';

const ProductsBulletin: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<ProductPopulated[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const category = searchParams.get('category') || '';
  const condition = searchParams.get('condition') || '';
  const sort = searchParams.get('sort') || '';
  const search = searchParams.get('search') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = parseInt(searchParams.get('page') || '1');

  // Valid ProductCondition values
  const VALID_CONDITIONS: ProductCondition[] = ['new', 'good', 'fair'] as const;

  useEffect(() => {
    categoryService.getCategories().then((res) => {
      if (res.success) setCategories(res.data.categories);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    
    // Type-safe condition validation
    const validCondition = VALID_CONDITIONS.includes(condition as ProductCondition)
      ? (condition as ProductCondition)
      : undefined;

    productService
      .getProducts({
        category,
        condition: validCondition,
        sort,
        search,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        page,
        limit: 24,
      })
      .then((res) => {
        if (res.success) {
          setProducts(res.data);
          setPagination(res.pagination || null);
        }
      })
      .finally(() => setLoading(false));
  }, [category, condition, sort, search, minPrice, maxPrice, page]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const activeFilters = [
    category && { key: 'category', label: categories.find(c => c.slug === category)?.name || category },
    condition && { key: 'condition', label: condition },
    minPrice && { key: 'minPrice', label: `Min: GHS ${minPrice}` },
    maxPrice && { key: 'maxPrice', label: `Max: GHS ${maxPrice}` },
  ].filter(Boolean);

  const getImage = (p: ProductPopulated) => p.images[0]?.url || 'https://placehold.co/400x500/ddd/666?text=Item';

  return (
    <BulletinLayout title="Browse listings" subtitle="Marketplace" section="02">
      
      {/* Filters section */}
      <BulletinSection bgColor="bg-white">
        <div className="grid gap-4 md:grid-cols-4">
          {/* Category filter */}
          <div>
            <label className="mb-2 block text-[10px] uppercase tracking-wider opacity-60">Category</label>
            <select
              value={category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Condition filter */}
          <div>
            <label className="mb-2 block text-[10px] uppercase tracking-wider opacity-60">Condition</label>
            <select
              value={condition}
              onChange={(e) => updateFilter('condition', e.target.value)}
              className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">All conditions</option>
              <option value="new">Brand New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="mb-2 block text-[10px] uppercase tracking-wider opacity-60">Sort by</label>
            <select
              value={sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">Newest first</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="popular">Most viewed</option>
            </select>
          </div>

          {/* Clear filters */}
          <div className="flex items-end">
            {activeFilters.length > 0 && (
              <button
                onClick={clearFilters}
                className="w-full border border-black bg-black p-2 text-[12px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeFilters.map((filter: any) => (
              <button
                key={filter.key}
                onClick={() => updateFilter(filter.key, '')}
                className="flex items-center gap-2 border border-black bg-[#fffacd] px-3 py-1 text-[11px] font-bold transition-colors hover:bg-[#fff5b8]"
              >
                {filter.label}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
      </BulletinSection>

      {/* Products grid */}
      <BulletinSection 
        bgColor="bg-[#faf8f5]"
        subtitle={`Found ${pagination?.total || 0} items`}
      >
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse border border-black bg-white" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="border border-black bg-[#fffacd] p-8 text-center">
            <div className="text-base font-bold">No items found</div>
            <div className="mt-2 text-[12px] opacity-70">Try adjusting your filters</div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product, idx) => (
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

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => updateFilter('page', String(i + 1))}
                    className={`border border-black px-4 py-2 text-[12px] font-bold transition-colors ${
                      pagination.page === i + 1
                        ? 'bg-black text-white'
                        : 'bg-white hover:bg-[#f8f7f4]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </BulletinSection>
    </BulletinLayout>
  );
};

export default ProductsBulletin;