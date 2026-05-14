import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import categoryService, { CategoryWithCount } from '../services/category.service';
import { LoadingSpinner } from '../components/ui';
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
                  <div className="mb-4 text-4xl whitespace-nowrap">{cat.icon || '📦'}</div>
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
      <BulletinSection bgColor="bg-[var(--bulletin-text)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 py-8 px-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] opacity-40 mb-2">
              Discovery Hub
            </div>
            <div className="text-2xl font-black uppercase tracking-tighter text-[var(--bulletin-bg)]">
              Browse the Full Inventory
            </div>
          </div>
          <button
            onClick={() => navigate('/products')}
            className="w-full sm:w-auto border-2 border-[var(--bulletin-bg)] bg-[var(--bulletin-bg)] px-8 py-4 text-[11px] font-black uppercase text-[var(--bulletin-text)] transition-all hover:bg-[var(--bulletin-text)] hover:text-[var(--bulletin-bg)] shadow-[4px_4px_0_0_rgba(255,255,255,0.1)] active:translate-y-1 active:shadow-none"
          >
            View all listings →
          </button>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default Categories;
