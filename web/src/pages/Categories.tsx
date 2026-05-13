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
        <BulletinSection bgColor="bg-[#faf8f5]">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square animate-pulse border border-black bg-white" />
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
      <BulletinSection bgColor="bg-[#faf8f5]">
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((cat, idx) => (
            <Link
              key={cat._id}
              to={`/products?category=${cat.slug}`}
              className="group flex-shrink-0"
            >
              <div 
                className="border border-black bg-[#fefdfb] px-6 py-8 shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:-translate-y-1"
                style={{ 
                  width: '180px',
                  transform: `rotate(${(idx % 2) * 2 - 1}deg)`
                }}
              >
                <div className="text-center">
                  <div className="mb-3 text-3xl">{cat.icon || '📦'}</div>
                  <div className="font-bold leading-tight">{cat.name}</div>
                  <div className="mt-2 text-[10px] uppercase opacity-50">
                    {cat.productCount} items
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </BulletinSection>

      {/* Browse all CTA */}
      <BulletinSection bgColor="bg-black">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">
              Can't find what you're looking for?
            </div>
            <div className="text-xl font-bold text-white">
              Browse all products
            </div>
          </div>
          <button
            onClick={() => navigate('/products')}
            className="flex-shrink-0 border border-white bg-white px-6 py-3 text-[11px] font-bold uppercase text-black transition-colors hover:bg-black hover:text-white"
          >
            View all listings →
          </button>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default Categories;
