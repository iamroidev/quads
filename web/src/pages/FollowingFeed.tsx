import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Users } from 'lucide-react';
import api from '../services/api';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';
import { ProductPopulated } from '../types';
import { useAuth } from '../context/AuthContext';

const FollowingFeed: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<ProductPopulated[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    api.get('/feed/pulse')
      .then((res) => {
        if (res.data?.success && res.data?.data?.sections?.fromFollowing) {
          setProducts(res.data.data.sections.fromFollowing);
        }
      })
      .catch((err) => console.error('Failed to fetch following feed:', err))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const getImage = (p: ProductPopulated) => p.images[0]?.url || 'https://placehold.co/400x500/ddd/666?text=Item';

  return (
    <BulletinLayout title="Following Feed" subtitle="Updates from your network" section="05">
      <BulletinSection bgColor="bg-[#faf8f5] dark:bg-black/20">
        <div className="max-w-4xl mb-12">
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ff6b6b] mb-4">Network Activity</div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-6 text-black dark:text-white">
            Sellers You <br />Follow.
          </h1>
          <p className="text-sm font-medium opacity-70 max-w-md leading-relaxed text-black dark:text-white/80">
            Real-time feed showing fresh listings and drop updates from student merchants you follow around campus.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse border-4 border-black bg-white/20 dark:bg-black/20" />
            ))}
          </div>
        ) : !isAuthenticated ? (
          <div className="border-4 border-black bg-white dark:bg-black/40 p-12 text-center shadow-[8px_8px_0_0_#000]">
            <div className="h-16 w-16 border-4 border-black bg-[#fffacd] flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0_0_#000]">
              <Users size={24} className="text-black animate-bounce" />
            </div>
            <h3 className="text-xl font-black uppercase mb-2 text-black dark:text-white">Join the Community</h3>
            <p className="text-xs opacity-60 mb-6 max-w-sm mx-auto text-black dark:text-white">Log in or create a student account to follow sellers and build your personalized campus feed.</p>
            <Link to="/login" className="inline-block bg-black text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:translate-y-[-2px] transition-transform shadow-[4px_4px_0_0_#ff6b6b]">Log In</Link>
          </div>
        ) : products.length === 0 ? (
          <div className="border-4 border-black bg-[#fffacd] dark:bg-yellow-950/10 p-16 text-center shadow-[8px_8px_0_0_#000] rotate-[-0.5deg]">
            <div className="h-16 w-16 border-4 border-black bg-white dark:bg-black flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0_0_#000]">
              <Heart size={24} className="text-[#ff6b6b]" fill="#ff6b6b" />
            </div>
            <h3 className="text-xl font-black uppercase mb-2 text-black dark:text-white">Your Feed is Quiet</h3>
            <p className="text-xs opacity-60 mb-8 max-w-sm mx-auto text-black dark:text-white">You aren't following any sellers yet, or the sellers you follow haven't listed any new products recently.</p>
            <Link to="/sellers" className="inline-block bg-black text-white py-3.5 px-8 text-[10px] font-black uppercase tracking-widest hover:translate-y-[-2px] transition-transform shadow-[4px_4px_0_0_#000]">Find Campus Sellers</Link>
          </div>
        ) : (
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 text-black dark:text-white">
            {products.map((product, idx) => (
              <Link
                key={product._id}
                to={`/products/${product._id}`}
                className="group relative block"
                style={{ transform: `rotate(${(idx % 3 - 1) * 1.5}deg)` }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-24 bg-[#ffd700]/60 rotate-[-1deg] z-10 opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="border-4 border-black bg-white dark:bg-black/40 p-4 shadow-[8px_8px_0_0_#000] group-hover:shadow-[12px_12px_0_0_#000] group-hover:-translate-y-2 transition-all">
                  <div className="relative aspect-square overflow-hidden border-4 border-black bg-black/5">
                    <img src={getImage(product)} alt={product.title} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  </div>
                  <div className="mt-5 space-y-2">
                    <div className="truncate text-sm font-black uppercase tracking-tight leading-none">{product.title}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-md font-black">GHS {product.price}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-40 border-2 border-black/10 px-2 py-0.5">
                        By {(product.seller as any)?.name || 'Seller'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </BulletinSection>
    </BulletinLayout>
  );
};

export default FollowingFeed;