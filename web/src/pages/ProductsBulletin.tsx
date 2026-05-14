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
    <BulletinLayout title="Manifest" subtitle="QUADS" section="02">
      
      {/* Filters section */}
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="grid gap-6 md:grid-cols-4 items-end">
          {/* Category filter */}
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-[var(--bulletin-text)]">Department</label>
            <select
              value={category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full border-4 border-black bg-[var(--bulletin-card)] p-3 text-[13px] font-black focus:outline-none focus:ring-0 text-[var(--bulletin-text)]"
            >
              <option value="">All Departments</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Condition filter */}
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-[var(--bulletin-text)]">Integrity</label>
            <select
              value={condition}
              onChange={(e) => updateFilter('condition', e.target.value)}
              className="w-full border-4 border-black bg-[var(--bulletin-card)] p-3 text-[13px] font-black focus:outline-none focus:ring-0 text-[var(--bulletin-text)]"
            >
              <option value="">Any Condition</option>
              <option value="new">Pristine (New)</option>
              <option value="like_new">Excellent (Like New)</option>
              <option value="good">Operational (Good)</option>
              <option value="fair">Functional (Fair)</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-[var(--bulletin-text)]">Priority</label>
            <select
              value={sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="w-full border-4 border-black bg-[var(--bulletin-card)] p-3 text-[13px] font-black focus:outline-none focus:ring-0 text-[var(--bulletin-text)]"
            >
              <option value="">Fresh Posts</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="popular">High Traffic</option>
            </select>
          </div>

          {/* Clear filters */}
          <div>
            <button
              onClick={clearFilters}
              disabled={activeFilters.length === 0}
              className="w-full border-4 border-black bg-black p-3.5 text-[11px] font-black uppercase text-white shadow-[6px_6px_0_0_rgba(0,0,0,0.2)] hover:bg-[#ff6b6b] transition-all disabled:opacity-20 disabled:translate-y-0"
            >
              Clear Manifest
            </button>
          </div>
        </div>

        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3">
            {activeFilters.map((filter: any) => (
              <button
                key={filter.key}
                onClick={() => updateFilter(filter.key, '')}
                className="flex items-center gap-3 border-4 border-black bg-[#fffacd] dark:bg-yellow-900/40 px-4 py-1.5 text-[11px] font-black uppercase text-black dark:text-yellow-200 hover:bg-[#ffd700] transition-colors"
              >
                {filter.label}
                <X className="h-4 w-4" />
              </button>
            ))}
          </div>
        )}
      </BulletinSection>

      {/* Products grid */}
      <BulletinSection 
        bgColor="bg-[var(--bulletin-bg)]"
        subtitle={`Audit Found ${pagination?.total || 0} Entities`}
      >
        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse border-4 border-black bg-[var(--bulletin-card)]/50" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="border-4 border-black bg-[#fffacd] dark:bg-yellow-900/10 p-16 text-center shadow-[12px_12px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(-0.5deg)' }}>
            <div className="text-xl font-black uppercase text-[var(--bulletin-text)]">No Assets Found</div>
            <div className="mt-2 text-[12px] font-bold opacity-40 uppercase tracking-widest text-[var(--bulletin-text)]">The Board is currently empty for this query</div>
          </div>
        ) : (
          <>
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product, idx) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="group relative block"
                  style={{ 
                    transform: `rotate(${(idx % 3 - 1) * 1.5}deg)`,
                  }}
                >
                  <div className="border-4 border-black bg-[var(--bulletin-card)] p-4 shadow-[8px_8px_0_0_var(--bulletin-shadow)] group-hover:shadow-[12px_12px_0_0_var(--bulletin-shadow)] group-hover:-translate-y-2 transition-all">
                    {/* Tape Effect */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-24 bg-[#ffd700]/60 rotate-[-1deg] z-10 opacity-60 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative aspect-square overflow-hidden border-4 border-black bg-black/5">
                      <img
                        src={getImage(product)}
                        alt={product.title}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                    </div>
                    
                    <div className="mt-5 space-y-2">
                      <div className="truncate text-lg font-black uppercase tracking-tight text-[var(--bulletin-text)] leading-none">{product.title}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black text-[var(--bulletin-text)]">GHS {product.price}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40 border-2 border-black/10 px-2 py-0.5 text-[var(--bulletin-text)]">
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
              <div className="mt-16 flex justify-center gap-3">
                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => updateFilter('page', String(i + 1))}
                    className={`border-4 border-black px-6 py-3 text-[14px] font-black transition-all ${
                      pagination.page === i + 1
                        ? 'bg-black text-white shadow-[6px_6px_0_0_rgba(0,0,0,0.2)] -translate-y-1'
                        : 'bg-[var(--bulletin-card)] text-[var(--bulletin-text)] hover:bg-[#fffacd] hover:text-black'
                    }`}
                  >
                    {String(i + 1).padStart(2, '0')}
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