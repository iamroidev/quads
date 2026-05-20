import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Clock, ShoppingBag, MessageCircle } from 'lucide-react';
import api from '../services/api';
import { LoadingSpinner } from '../components/ui';
import { BulletinLayout } from '../components/layout/BulletinLayout';

interface StoreData {
  store: any;
  products: any[];
  reviews: any[];
}

export default function StorefrontPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.get(`/stores/${slug}`).then(res => {
      if (res.data.success) setData(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingSpinner fullScreen text="Loading store..." />;
  if (!data) return (
    <BulletinLayout>
      <div className="text-center py-20">
        <p className="text-2xl font-black uppercase text-[var(--bulletin-text)]">Store not found</p>
        <Link to="/products" className="mt-4 inline-block underline text-[var(--bulletin-text)] opacity-60">Browse products</Link>
      </div>
    </BulletinLayout>
  );

  const { store, products, reviews } = data;
  const owner = store.ownerId;

  return (
    <BulletinLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* Store header */}
        <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 md:p-10 shadow-[8px_8px_0_0_var(--bulletin-shadow)] mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 border-4 border-[var(--bulletin-border)] bg-[#ff6b6b] flex items-center justify-center text-white text-3xl font-black flex-shrink-0">
              {store.avatar ? <img src={store.avatar} className="w-full h-full object-cover" /> : store.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-[var(--bulletin-text)]">{store.name}</h1>
                {store.isVerified && <span className="text-[9px] font-black bg-[#fffacd] border-2 border-black px-2 py-0.5 uppercase tracking-widest">Verified</span>}
              </div>
              {store.bio && <p className="text-[13px] font-bold opacity-60 mt-2 text-[var(--bulletin-text)]">{store.bio}</p>}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 text-[11px] font-bold opacity-50 text-[var(--bulletin-text)]">
                {store.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{store.location}</span>}
                {owner?.responseTimeMinutes && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Responds in ~{owner.responseTimeMinutes}m</span>}
                <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" />{products.length} listings</span>
              </div>
              {/* Rating */}
              {store.rating?.average > 0 && (
                <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-black text-[var(--bulletin-text)]">{store.rating.average.toFixed(1)}</span>
                  <span className="text-[11px] font-bold opacity-40">({store.rating.total} reviews)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products grid */}
        <div className="mb-8">
          <h2 className="text-[11px] font-black uppercase tracking-[2px] text-[var(--bulletin-text)] opacity-50 mb-4">
            Listings ({products.length})
          </h2>
          {products.length === 0 ? (
            <p className="text-center text-[var(--bulletin-text)] opacity-40 py-12">No active listings</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p: any) => (
                <Link key={p._id} to={`/products/${p._id}`} className="group">
                  <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] overflow-hidden shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    <div className="aspect-square bg-[var(--bulletin-bg)] overflow-hidden">
                      <img src={p.images?.[0]?.url || 'https://placehold.co/300/ddd/666?text=Item'} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="p-3">
                      <p className="text-[11px] font-black uppercase tracking-tight text-[var(--bulletin-text)] truncate">{p.title}</p>
                      <p className="text-[13px] font-black text-[#ff6b6b] mt-1">GHS {p.price}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 text-[var(--bulletin-text)] mt-1">{p.condition}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[2px] text-[var(--bulletin-text)] opacity-50 mb-4">
              Recent Reviews
            </h2>
            <div className="space-y-4">
              {reviews.map((r: any) => (
                <div key={r._id} className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-4 shadow-[3px_3px_0_0_var(--bulletin-shadow)]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold opacity-40 text-[var(--bulletin-text)]">{r.reviewer?.name}</span>
                  </div>
                  <p className="text-[12px] text-[var(--bulletin-text)] leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BulletinLayout>
  );
}
