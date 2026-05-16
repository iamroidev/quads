import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import categoryService, { CategoryWithCount } from '../services/category.service';
import { LoadingSpinner, CategoryIcon } from '../components/ui';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';

const Categories: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getCategoriesWithCounts();
        if (res.success) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const totalProducts = categories.reduce((sum, cat) => sum + cat.productCount, 0);

  if (loading) {
    return (
      <BulletinLayout title="Categories" subtitle="Browse" section="02">
        <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square animate-pulse border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)]" />
            ))}
          </div>
        </BulletinSection>
      </BulletinLayout>
    );
  }

  return (
    <BulletinLayout 
      title="All Categories" 
      subtitle={`${totalProducts} listings across ${categories.length} categories`}
      section="02"
    >
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide p-4">
          {categories.map((cat, idx) => (
            <Link
              key={cat._id}
              to={`/products?category=${cat.slug}`}
              className="group flex-shrink-0"
            >
              <div 
                className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-8 py-10 shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all hover:shadow-[8px_8px_0_0_var(--bulletin-shadow)] hover:-translate-y-1"
                style={{ 
                  width: 'fit-content',
                  minWidth: '280px',
                  transform: `rotate(${(idx % 2) * 2 - 1}deg)`
                }}
              >
                <div className="text-center">
                  <div className="mb-6 flex justify-center text-[var(--bulletin-text)] group-hover:scale-110 transition-transform">
                    <CategoryIcon name={cat.icon} className="h-12 w-12" />
                  </div>
                  <div className="font-black uppercase tracking-tight text-lg text-[var(--bulletin-text)] truncate">{cat.name}</div>
                  <div className="mt-3 text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">
                    {cat.productCount} Items Available
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </BulletinSection>

      {/* Browse all CTA */}
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="py-12">
          <div 
            className="border-4 border-black bg-[#ff6b6b] p-8 md:p-12 shadow-[12px_12px_0_0_#000] relative overflow-hidden group"
            style={{ transform: 'rotate(-0.5deg)' }}
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-black/5 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 transition-transform group-hover:scale-125" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl text-center md:text-left">
                <div className="inline-block border-2 border-black bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                  Discovery Hub
                </div>
                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black leading-none mb-4">
                  Unrestricted <br />Inventory Access
                </h2>
                <p className="text-[14px] font-bold text-black/70 max-w-md">
                  Can't find the specific department you're looking for? Traverse the complete board to find hidden gems across all sectors.
                </p>
              </div>
              
              <button
                onClick={() => navigate('/products')}
                className="w-full md:w-auto border-4 border-black bg-black text-white px-10 py-5 text-[14px] font-black uppercase tracking-widest transition-all hover:-translate-y-1 hover:shadow-[0_10px_0_0_rgba(0,0,0,0.2)] active:translate-y-0 active:shadow-none shadow-[8px_8px_0_0_rgba(0,0,0,0.3)]"
              >
                View Full Board →
              </button>
            </div>
          </div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default Categories;
