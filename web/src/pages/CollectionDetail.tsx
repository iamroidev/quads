import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import productService from '../services/product.service';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

const CollectionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    productService
      .getCollectionBySlug(slug, 24)
      .then((res) => {
        if (res.success) {
          setCollection(res.data);
        } else {
          setError('Collection not found');
        }
      })
      .catch(() => setError('Collection not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <BulletinLayout title="Loading..." subtitle="Collection" section="13">
        <BulletinSection bgColor="bg-[#faf8f5]">
          <div className="h-8 w-48 animate-pulse border border-black bg-white" />
          <div className="mt-3 h-5 w-72 animate-pulse border border-black bg-white" />
        </BulletinSection>
      </BulletinLayout>
    );
  }

  if (error || !collection) {
    return (
      <BulletinLayout title="Collection Not Found" subtitle="Collection" section="13">
        <BulletinSection bgColor="bg-[#faf8f5]">
          <div className="border border-black bg-[#fffacd] p-8 text-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2">Missing</div>
            <div className="text-lg font-bold mb-4">Collection not found</div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 border border-black bg-black px-4 py-2 text-[10px] font-bold uppercase text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back home
            </Link>
          </div>
        </BulletinSection>
      </BulletinLayout>
    );
  }

  return (
    <BulletinLayout title={collection.title} subtitle="Collection" section="13">
      <BulletinSection bgColor="bg-[#faf8f5]">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Link>
          <h1 className="mt-4 text-2xl font-bold">{collection.title}</h1>
          <p className="mt-2 text-[12px] opacity-70 max-w-2xl">{collection.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase">
            <span className="opacity-60">{collection.listingCount} active listings</span>
            <span className="w-1 h-1 bg-black/30" />
            <span className="opacity-60">Avg GHS {Number(collection.avgPrice || 0).toLocaleString('en-GH')}</span>
            <span className="w-1 h-1 bg-black/30" />
            <Link
              to={`/products?category=${collection.categorySlug}`}
              className="inline-flex items-center gap-1 border border-black bg-white px-2 py-0.5 text-[9px] font-bold uppercase shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
            >
              Browse category <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Products */}
        {(!collection.products || collection.products.length === 0) ? (
          <div className="border border-black bg-[#fffacd] p-8 text-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2">Empty</div>
            <div className="font-bold">No listings in this collection yet</div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {collection.products.map((product: any, idx: number) => {
              const getImage = (p: any) => p.images?.[0]?.url || 'https://placehold.co/400x500/ddd/666?text=Item';
              return (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="group"
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
                      <div className="text-base font-bold">GHS {product.price}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </BulletinSection>
    </BulletinLayout>
  );
};

export default CollectionDetailPage;