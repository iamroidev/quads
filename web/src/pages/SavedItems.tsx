import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui';
import savedItemService from '../services/savedItem.service';
import { ProductPopulated, PaginationInfo } from '../types';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';
import { Link } from 'react-router-dom';

const SavedItems: React.FC = () => {
  const [products, setProducts] = useState<ProductPopulated[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchSavedItems = async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await savedItemService.getSavedItems(targetPage, 20);
      if (res.success) {
        setProducts(res.data.products);
        setPagination(res.pagination);
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

  const getImage = (p: ProductPopulated) => p.images[0]?.url || 'https://placehold.co/400x500/ddd/666?text=Item';

  if (loading && page === 1) {
    return <LoadingSpinner text="Loading saved items..." fullScreen />;
  }

  return (
    <BulletinLayout
      title="Saved Items"
      subtitle={pagination ? `${pagination.total} item${pagination.total !== 1 ? 's' : ''}` : 'Your wishlist'}
      section="03"
    >
      <BulletinSection bgColor="bg-[#faf8f5]">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse border border-black bg-white" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="border border-black bg-[#fffacd] p-8 text-center">
            <div className="mb-3">
              <Heart className="h-12 w-12 mx-auto opacity-30" />
            </div>
            <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2">No saved items</div>
            <div className="font-bold mb-4">You haven't saved any items yet</div>
            <Link
              to="/products"
              className="inline-block border border-black bg-black px-4 py-2 text-[11px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black"
            >
              Browse products →
            </Link>
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
                      {/* Heart badge */}
                      <div className="absolute top-2 right-2 bg-[#fce4ec] border border-black p-1.5">
                        <Heart className="h-3 w-3 fill-black" />
                      </div>
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
              <div className="flex justify-center gap-2 mt-8">
                {page > 1 && (
                  <button
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={loading}
                    className="border border-black bg-white px-4 py-2 text-[11px] font-bold uppercase transition-colors hover:bg-black hover:text-white disabled:opacity-40"
                  >
                    Previous
                  </button>
                )}
                <span className="flex items-center px-4 py-2 text-[11px] font-bold uppercase opacity-60">
                  {pagination.page} / {pagination.pages}
                </span>
                {page < pagination.pages && (
                  <button
                    onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
                    disabled={loading}
                    className="border border-black bg-white px-4 py-2 text-[11px] font-bold uppercase transition-colors hover:bg-black hover:text-white disabled:opacity-40"
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
