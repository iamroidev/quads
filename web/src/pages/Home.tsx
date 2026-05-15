import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import productService from '../services/product.service';
import categoryService, { CategoryWithCount } from '../services/category.service';
import api from '../services/api';
import { ProductPopulated } from '../types';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';
import { ProductCardSkeleton, CategorySkeleton, CollectionSkeleton } from '../components/ui/BulletinSkeleton';
import ProductCard from '../components/product/ProductCard';
import { Package, Smartphone, Truck, Shield, TrendingUp } from 'lucide-react';
// ... existing PulseFeed import

// ... inside component
  return (
    <BulletinLayout
      hideHero={true}
      hideBreadcrumbs={true}
    >
      {/* Role shortcut banner */}
      {isAuthenticated && isSeller && (
        <div className="border-b-4 border-[var(--bulletin-border)] bg-[#f0e8f4] dark:bg-purple-900/40 px-6 py-4">
          <div className="mx-auto max-w-[1400px] flex justify-between items-center">
            <span className="text-[12px] font-black uppercase tracking-widest text-[var(--bulletin-text)]">You are in marketplace view</span>
            <Link to="/dashboard" className="text-[12px] font-black uppercase underline decoration-2 underline-offset-4 text-[var(--bulletin-text)] hover:opacity-70 transition-opacity">Return to Seller Hub →</Link>
          </div>
        </div>
      )}

      {/* ── The Bulletin Board Hero ── */}
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]" className="pt-4 md:pt-12 overflow-hidden">
        {/* ... Hero Content (lines 84-174) ... */}
      </BulletinSection>

      {/* ── Just Listed (Restored with Skeletons) ── */}
      <BulletinSection title="Just Pinned" subtitle="New" bgColor="bg-[#f0e8f4] dark:bg-purple-900/10">
        {loading ? (
          <div className="grid gap-6 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map(i => <ProductCardSkeleton key={i} />)}
          </div>
        ) : recentProducts.length > 0 ? (
          <div className="grid gap-6 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {recentProducts.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-10 opacity-30 uppercase font-black tracking-widest">No listings found</div>
        )}
        {!loading && recentProducts.length > 0 && (
           <div className="mt-12 text-center">
             <Link to="/products" className="bg-black text-white px-8 py-3 text-[11px] font-black uppercase tracking-widest shadow-[6px_6px_0_0_#ff6b6b]">See Full Board</Link>
          </div>
        )}
      </BulletinSection>

      {/* ── Campus Pulse ── */}
      <BulletinSection 
        title="Campus Pulse" 
        subtitle="Discovery" 
        bgColor="bg-[var(--bulletin-bg)] border-t-4 border-[var(--bulletin-border)]"
      >
        <PulseFeed />
      </BulletinSection>

      {/* ── Featured Showcase ── */}
      {!loading && featuredProducts.length > 0 ? (
        <BulletinSection title="Campus Spotlight" subtitle="Featured" bgColor="bg-white dark:bg-[#111]">
          <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product, idx) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          <div className="mt-12 text-center">
             <Link to="/products?featured=true" className="text-[11px] font-black uppercase underline tracking-widest hover:text-[#ff6b6b]">View all featured items →</Link>
          </div>
        </BulletinSection>
      ) : loading && (
        <BulletinSection title="Campus Spotlight" subtitle="Featured" bgColor="bg-white dark:bg-[#111]">
          <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
          </div>
        </BulletinSection>
      )}

      {/* ── Category strip ── */}
      <BulletinSection title="Explore Departments" subtitle="Browse" bgColor="bg-[var(--bulletin-bg)] border-t-4 border-[var(--bulletin-border)]">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {loading ? (
            <>
              <CategorySkeleton />
              <CategorySkeleton />
              <CategorySkeleton />
              <CategorySkeleton />
              <CategorySkeleton />
              <CategorySkeleton />
            </>
          ) : categories.map((cat: any, idx: number) => (
            <Link key={cat._id} to={`/products?category=${cat._id}`} className="group">
              <div className="h-full border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 shadow-[6px_6px_0_0_var(--bulletin-shadow)] transition-all hover:shadow-[10px_10px_0_0_#ff6b6b] hover:-translate-y-1 relative overflow-hidden"
                style={{ transform: `rotate(${(idx % 2 === 0 ? 0.5 : -0.5)}deg)` }}>
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#ff6b6b]" />
                <div className="text-center">
                  <div className="mb-4 text-4xl group-hover:scale-110 transition-transform">{cat.icon || '📦'}</div>
                  <div className="text-[12px] font-black uppercase tracking-widest text-[var(--bulletin-text)] mb-1">{cat.name}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">{cat.productCount || 0} items</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </BulletinSection>

      {/* ── Top Sellers ── */}
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        {/* ... existing Spotlight Grid (lines 186-240) ... */}
      </BulletinSection>

      {/* ── How it works ── */}
      <BulletinSection title="How it works" subtitle="Process" bgColor="bg-[var(--bulletin-bg)]">
        {/* ... existing How it works (lines 320-371) ... */}
      </BulletinSection>

    </BulletinLayout>
  );
};

export default HomePage;