import React, { useEffect, useState } from 'react';
import { Heart, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui';
import savedItemService from '../services/savedItem.service';
import { ProductPopulated, PaginationInfo } from '../types';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';
import { Link } from 'react-router-dom';
import { BulletinEmptyState } from '../components/ui/BulletinEmptyState';

const SavedItems: React.FC = () => {
  const [products, setProducts] = useState<ProductPopulated[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [priceChanges, setPriceChanges] = useState<Array<{
    productId: string;
    currentPrice: number;
    priceWhenSaved: number;
    changePercent: number;
  }>>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchSavedItems = async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await savedItemService.getSavedItemsWithPriceChanges(targetPage, 20);
      if (res.success) {
        setProducts(res.data.products);
        setPagination(res.pagination);
        setPriceChanges(res.priceChanges);
      }
    } catch {
      toast.error('Failed to load saved items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedItems(page);
  }, [page]);

  const handleSavedChange = (productId: string, saved: boolean) => {
    if (!saved) {
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    }
  };

  const getPriceChange = (productId: string) => {
    return priceChanges.find(change => change.productId === productId);
  };

  const getImage = (p: ProductPopulated) => p.images[0]?.url || 'https://placehold.co/400x500/ddd/666?text=Item';

  const formatPriceChange = (changePercent: number) => {
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(1)}%`;
  };

  if (loading && page === 1) {
    return <LoadingSpinner text="Loading saved items..." fullScreen />;
  }

  return (
    <BulletinLayout
      title="Saved Items"
      subtitle={pagination ? `${pagination.total} item${pagination.total !== 1 ? 's' : ''}` : 'Your wishlist'}
      section="03"
    >
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <BulletinEmptyState
            title="Wishlist Empty"
            message="You haven't saved any items yet. The manifest is clear of personal interests."
            icon={<Heart className="h-12 w-12 opacity-20" />}
            action={
              <Link
                to="/products"
                className="inline-block border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-8 py-3 text-[10px] font-black uppercase text-[var(--bulletin-bg)] transition-all hover:-translate-y-1 shadow-[4px_4px_0_0_var(--bulletin-shadow)]"
              >
                Browse products →
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product, idx) => {
                const priceChange = getPriceChange(product._id);
                const hasPriceChange = priceChange && Math.abs(priceChange.changePercent) > 5;
                
                return (
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
                    <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-4 shadow-[6px_6px_0_0_var(--bulletin-shadow)] group-hover:shadow-[10px_10px_0_0_var(--bulletin-shadow)] transition-all">
                      <div className="relative aspect-square overflow-hidden border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)]">
                        <img
                          src={getImage(product)}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                        {/* Tape effect */}
                        <div className="absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 bg-[#ffd700]/30 opacity-60"
                             style={{ transform: 'translateX(-50%) rotate(-2deg)' }} />
                        {/* Heart badge */}
                        <div className="absolute top-3 right-3 bg-red-50 dark:bg-red-900/30 border-2 border-[var(--bulletin-border)] p-2 shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
                          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                        </div>
                        {/* Price change badge */}
                        {hasPriceChange && (
                          <div className="absolute bottom-3 left-3 bg-[priceChange.changePercent>=0?'green-500':'red-500'] text-white text-[8px] font-black px-2 py-1 rounded">
                            {priceChange.changePercent >= 0 ? '▲' : '▼'} {Math.abs(priceChange.changePercent).toFixed(0)}%
                          </div>
                        )}
                      </div>
                      <div className="mt-4 space-y-1">
                        <div className="truncate font-black uppercase tracking-tight text-sm text-[var(--bulletin-text)]">{product.title}</div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-lg font-black text-[var(--bulletin-text)]">GHS {product.price}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">
                            {typeof product.category === 'string' ? '' : product.category.name}
                          </span>
                        </div>
                        {hasPriceChange && (
                          <div className="mt-2 text-[9px] font-black uppercase tracking-wider">
                            {priceChange.changePercent >= 0 ? (
                              <span className="text-green-500 flex items-center">
                                <TrendingUp className="h-3 w-3 mr-1" /> {formatPriceChange(priceChange.changePercent)}
                              </span>
                            ) : (
                              <span className="text-red-500 flex items-center">
                                <TrendingDown className="h-3 w-3 mr-1" /> {formatPriceChange(priceChange.changePercent)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center gap-4 mt-12 pt-8 border-t-2 border-[var(--bulletin-border)]">
                {page > 1 && (
                  <button
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={loading}
                    className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-[var(--bulletin-text)] hover:text-[var(--bulletin-bg)] disabled:opacity-20 shadow-[4px_4px_0_0_var(--bulletin-shadow)] text-[var(--bulletin-text)]"
                  >
                    Prev
                  </button>
                )}
                <span className="flex items-center px-6 py-2 text-[11px] font-black uppercase tracking-tighter text-[var(--bulletin-text)]">
                  {pagination.page} / {pagination.pages}
                </span>
                {page < pagination.pages && (
                  <button
                    onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
                    disabled={loading}
                    className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-[var(--bulletin-text)] hover:text-[var(--bulletin-bg)] disabled:opacity-20 shadow-[4px_4px_0_0_var(--bulletin-shadow)] text-[var(--bulletin-text)]"
                  >
                    Next
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </BulletinSection>
    </BulletinLayout>
  );
};

export default SavedItems;