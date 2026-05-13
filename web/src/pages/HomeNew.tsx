import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Briefcase,
  Dumbbell,
  Home as HomeIcon,
  LifeBuoy,
  Package,
  PenTool,
  Shield,
  Shirt,
  Smartphone,
  TimerReset,
  Utensils,
  ShieldCheck,
  Zap,
  MessageCircle,
  TrendingUp,
  Users,
  Tag,
  CheckCircle,
  Clock,
  BadgeCheck,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProductGrid } from '../components/product';
import productService from '../services/product.service';
import categoryService, { CategoryWithCount } from '../services/category.service';
import { ProductPopulated } from '../types';

const iconMap: Record<string, React.ReactNode> = {
  'book-open': <BookOpen className="h-5 w-5" />,
  smartphone: <Smartphone className="h-5 w-5" />,
  utensils: <Utensils className="h-5 w-5" />,
  shirt: <Shirt className="h-5 w-5" />,
  briefcase: <Briefcase className="h-5 w-5" />,
  home: <HomeIcon className="h-5 w-5" />,
  'pen-tool': <PenTool className="h-5 w-5" />,
  dumbbell: <Dumbbell className="h-5 w-5" />,
  package: <Package className="h-5 w-5" />,
};

const STATS = [
  { value: 2400, label: 'Active listings', icon: <Tag className="h-5 w-5" />, trend: '+12%' },
  { value: 1800, label: 'Student sellers', icon: <Users className="h-5 w-5" />, trend: '+8%' },
  { value: 98, label: 'Success rate', icon: <CheckCircle className="h-5 w-5" />, suffix: '%', trend: '+2%' },
  { value: 0, label: 'Platform fee', icon: <BadgeCheck className="h-5 w-5" />, prefix: 'GHS ' },
];

const VIBES = [
  {
    label: 'Lecture Ready',
    title: 'Textbooks, tablets, desk gear',
    body: 'Build a semester setup with essentials students actually need every week.',
    category: 'books',
    image: '/curated/lecture-kit.jpg',
  },
  {
    label: 'Hostel Reset',
    title: 'Fans, mini fridges, room upgrades',
    body: 'Useful room pieces that move fast when campus life gets busy.',
    category: 'home',
    image: '/curated/hostel-reset.jpg',
  },
  {
    label: 'Off-Day Rotation',
    title: 'Fits, sneakers, accessories',
    body: 'A sharper storefront lane for fashion-led listings and weekend pickup.',
    category: 'fashion',
    image: '/curated/weekend-fit.jpg',
  },
];

const CURATED_PRODUCTS = [
  {
    id: 'curated-lecture-kit',
    title: 'Lecture Starter Kit',
    price: 420,
    category: 'Books & Study',
    condition: 'new',
    image: '/curated/optimized/lecture-kit-card.webp',
  },
  {
    id: 'curated-hostel-reset',
    title: 'Hostel Reset Bundle',
    price: 650,
    category: 'Home & Hostel',
    condition: 'like_new',
    image: '/curated/optimized/hostel-reset-card.webp',
  },
  {
    id: 'curated-weekend-fit',
    title: 'Weekend Fit Edit',
    price: 280,
    category: 'Fashion',
    condition: 'new',
    image: '/curated/optimized/weekend-fit-card.webp',
  },
  {
    id: 'curated-gadget-set',
    title: 'Gadget Desk Setup',
    price: 980,
    category: 'Electronics',
    condition: 'used',
    image: '/curated/optimized/gadget-setup-card.webp',
  },
];

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductPopulated[]>([]);
  const [recentProducts, setRecentProducts] = useState<ProductPopulated[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<ProductPopulated[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [heroOffset, setHeroOffset] = useState(0);
  const [liveCount, setLiveCount] = useState(2400);

  useEffect(() => {
    categoryService.getCategoriesWithCounts().then((res) => {
      if (res.success) setCategories(res.data.categories);
    }).catch(() => {});

    productService.getFeatured(8).then((res) => {
      if (res.success) setFeaturedProducts(res.data);
    }).catch(() => {}).finally(() => setLoadingFeatured(false));

    productService.getRecent(8).then((res) => {
      if (res.success) setRecentProducts(res.data);
    }).catch(() => {}).finally(() => setLoadingRecent(false));

    productService.getTrending(8).then((res) => {
      if (res.success) setTrendingProducts(res.data);
    }).catch(() => {}).finally(() => setLoadingTrending(false));
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHeroOffset(Math.min(y * 0.3, 100));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Live counter animation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getProductImage = (product: ProductPopulated) =>
    product.images.length > 0 ? product.images[0].url : null;

  const campusEditProducts = [...featuredProducts, ...trendingProducts, ...recentProducts]
    .filter((product, index, all) => all.findIndex((item) => item._id === product._id) === index)
    .slice(0, 8);

  const shopByVibeProducts = VIBES.map((vibe) => ({
    ...vibe,
    products: [...featuredProducts, ...recentProducts, ...trendingProducts]
      .filter((product) => {
        const categorySlug = typeof product.category === 'string' ? '' : product.category.slug?.toLowerCase?.() || '';
        const categoryName = typeof product.category === 'string' ? '' : product.category.name?.toLowerCase?.() || '';
        const title = product.title.toLowerCase();
        const tags = product.tags.join(' ').toLowerCase();
        const haystack = `${categorySlug} ${categoryName} ${title} ${tags}`;
        return haystack.includes(vibe.category);
      })
      .filter((product, index, all) => all.findIndex((item) => item._id === product._id) === index)
      .slice(0, 4),
  }));

  const getDisplayImage = (product: ProductPopulated | null, fallback?: string) => {
    if (product) {
      return getProductImage(product) ?? fallback ?? `https://placehold.co/600x750/e8ecef/6c7275?text=${encodeURIComponent(product.title.slice(0, 10))}`;
    }
    return fallback ?? 'https://placehold.co/600x750/e8ecef/6c7275?text=Campus';
  };

  const getTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <main className="bg-[#fafaf9]">

      {/* ════════════════════════════════════════════════
          HERO - SPLIT EDITORIAL LAYOUT
      ════════════════════════════════════════════════ */}
      <section className="relative min-h-[85vh] overflow-hidden bg-[#0a0a0a]">
        <div className="mx-auto grid max-w-[1800px] lg:grid-cols-2">
          {/* Left: Editorial Text */}
          <div className="relative z-10 flex flex-col justify-center px-6 py-20 lg:px-16 lg:py-32">
            <span className="mb-6 inline-flex w-fit items-center gap-2 border border-white/10 bg-white/5 px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.3em] text-white/50">
              <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
              UMaT Student Marketplace
            </span>

            <h1 className="font-serif text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-tight text-white">
              Buy. Sell.<br />
              <span className="text-white/30">Stay on campus.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-white/50">
              The only marketplace built for UMaT students. Textbooks, electronics, food, services — everything you need, from people you know.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:gap-3"
              >
                Browse listings
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 border border-white/20 px-6 py-3 text-sm font-semibold text-white/70 transition-colors hover:border-white/40 hover:text-white"
                >
                  Join free
                </Link>
              )}
            </div>
          </div>

          {/* Right: Image Collage */}
          <div className="relative h-[50vh] lg:h-auto">
            <div
              className="absolute inset-0 grid grid-cols-2 gap-2 p-6 lg:p-8"
              style={{ transform: `translateY(${heroOffset * 0.5}px)` }}
            >
              <div className="space-y-2">
                <div className="aspect-[3/4] overflow-hidden bg-white/5">
                  <img
                    src="/curated/lecture-kit.jpg"
                    alt="Campus life"
                    className="h-full w-full object-cover opacity-80"
                  />
                </div>
                <div className="aspect-square overflow-hidden bg-white/5">
                  <img
                    src="/curated/sneaker-drop.jpg"
                    alt="Campus life"
                    className="h-full w-full object-cover opacity-80"
                  />
                </div>
              </div>
              <div className="space-y-2 pt-12">
                <div className="aspect-square overflow-hidden bg-white/5">
                  <img
                    src="/curated/gadget-setup.jpg"
                    alt="Campus life"
                    className="h-full w-full object-cover opacity-80"
                  />
                </div>
                <div className="aspect-[3/4] overflow-hidden bg-white/5">
                  <img
                    src="/curated/hostel-reset.jpg"
                    alt="Campus life"
                    className="h-full w-full object-cover opacity-80"
                  />
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          STATS - DATA VISUALIZATION
      ════════════════════════════════════════════════ */}
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat, index) => (
              <div key={stat.label} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">{stat.icon}</span>
                  {stat.trend && (
                    <span className="text-xs font-semibold text-emerald-600">{stat.trend}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold tracking-tight text-stone-900">
                    {stat.prefix}{index === 0 ? liveCount.toLocaleString() : stat.value.toLocaleString()}{stat.suffix}
                  </div>
                  <div className="text-xs font-medium uppercase tracking-wider text-stone-400">
                    {stat.label}
                  </div>
                </div>
                {stat.label === 'Success rate' && (
                  <div className="h-1.5 w-full overflow-hidden bg-stone-100">
                    <div className="h-full bg-emerald-500" style={{ width: `${stat.value}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          SHOP BY VIBE - MAGAZINE GRID
      ════════════════════════════════════════════════ */}
      <section className="border-b border-stone-200 bg-stone-50 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Shop by vibe</p>
            <h2 className="mt-2 font-serif text-4xl font-bold tracking-tight text-stone-900 lg:text-5xl">
              Curated collections
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            {/* First item: Large horizontal banner */}
            {shopByVibeProducts[0] && (
              <Link
                to="/products"
                className="group relative isolate overflow-hidden bg-stone-900"
                style={{ minHeight: '500px' }}
              >
                <img
                  src={shopByVibeProducts[0].image}
                  alt={shopByVibeProducts[0].label}
                  className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative flex h-full flex-col justify-end p-8">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                    {shopByVibeProducts[0].label}
                  </p>
                  <h3 className="mt-3 font-serif text-3xl font-bold leading-tight text-white lg:text-4xl">
                    {shopByVibeProducts[0].title}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                    {shopByVibeProducts[0].body}
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-white">
                    Explore <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            )}

            {/* Second/third: Vertical stacked */}
            <div className="grid gap-4">
              {shopByVibeProducts.slice(1, 3).map((vibe) => (
                <Link
                  key={vibe.label}
                  to="/products"
                  className="group relative isolate overflow-hidden bg-stone-900"
                  style={{ minHeight: '240px' }}
                >
                  <img
                    src={vibe.image}
                    alt={vibe.label}
                    className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="relative flex h-full flex-col justify-end p-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                      {vibe.label}
                    </p>
                    <h3 className="mt-2 font-serif text-xl font-bold leading-tight text-white">
                      {vibe.title}
                    </h3>
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-white">
                      Explore <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          CAMPUS EDIT - HORIZONTAL SCROLL
      ════════════════════════════════════════════════ */}
      <section className="border-b border-stone-200 bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Campus edit</p>
              <h2 className="mt-2 font-serif text-4xl font-bold tracking-tight text-stone-900">
                Fresh listings
              </h2>
            </div>
            <Link
              to="/products"
              className="flex items-center gap-1 text-sm font-semibold text-stone-600 transition-colors hover:text-stone-900"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto pb-4 -mx-6 px-6 lg:mx-0 lg:px-0">
            <div className="flex gap-4 lg:grid lg:grid-cols-4">
              {campusEditProducts.slice(0, 8).map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="group flex-shrink-0 w-[280px] lg:w-auto"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
                    <img
                      src={getDisplayImage(product)}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {product.createdAt && (
                      <div className="absolute left-3 top-3 bg-black/80 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        {getTimeSince(product.createdAt)}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 space-y-1">
                    <h3 className="font-semibold text-stone-900 line-clamp-1">{product.title}</h3>
                    <p className="text-xs uppercase tracking-wider text-stone-400">
                      {typeof product.category === 'string' ? 'Category' : product.category.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-stone-900">
                        GHS {Number(product.price).toLocaleString('en-GH')}
                      </p>
                      {product.seller && (
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 overflow-hidden rounded-full bg-stone-200">
                            {product.seller.avatar && (
                              <img
                                src={product.seller.avatar}
                                alt={product.seller.name}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <span className="text-xs text-stone-500">{product.seller.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          CATEGORIES - VISUAL CARDS
      ════════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section className="border-b border-stone-200 bg-stone-50 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Browse</p>
              <h2 className="mt-2 font-serif text-4xl font-bold tracking-tight text-stone-900">
                All categories
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat._id}
                  to={`/products?category=${cat.slug}`}
                  className="group relative overflow-hidden bg-white p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center bg-stone-100 text-stone-600">
                      {iconMap[cat.icon] || <Package className="h-6 w-6" />}
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-stone-900">{cat.name}</h3>
                  {cat.productCount != null && (
                    <p className="mt-1 text-sm text-stone-500">{cat.productCount} items</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          FEATURED - EDITORIAL GRID
      ════════════════════════════════════════════════ */}
      {(loadingFeatured || featuredProducts.length > 0) && (
        <section className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Handpicked</p>
                <h2 className="mt-2 font-serif text-4xl font-bold tracking-tight text-stone-900">
                  Featured picks
                </h2>
              </div>
              <Link
                to="/products?sort=featured"
                className="flex items-center gap-1 text-sm font-semibold text-stone-600 transition-colors hover:text-stone-900"
              >
                See all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {loadingFeatured ? (
              <div className="grid gap-4 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-[3/4] animate-pulse bg-stone-100" />
                    <div className="h-4 w-3/4 animate-pulse bg-stone-100" />
                    <div className="h-4 w-1/2 animate-pulse bg-stone-100" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-4">
                {/* Hero product - 2x height */}
                {featuredProducts[0] && (
                  <Link
                    to={`/products/${featuredProducts[0]._id}`}
                    className="group relative lg:row-span-2"
                  >
                    <div className="relative aspect-[3/4] lg:aspect-auto lg:h-full overflow-hidden bg-stone-100">
                      <img
                        src={getDisplayImage(featuredProducts[0])}
                        alt={featuredProducts[0].title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute left-3 top-3 flex items-center gap-1.5 bg-amber-400 px-2 py-1 text-xs font-bold text-amber-900">
                        <Sparkles className="h-3 w-3" />
                        Featured
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <h3 className="font-semibold text-stone-900">{featuredProducts[0].title}</h3>
                      <p className="text-lg font-bold text-stone-900">
                        GHS {Number(featuredProducts[0].price).toLocaleString('en-GH')}
                      </p>
                    </div>
                  </Link>
                )}

                {/* Medium products */}
                {featuredProducts.slice(1, 7).map((product) => (
                  <Link
                    key={product._id}
                    to={`/products/${product._id}`}
                    className="group"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
                      <img
                        src={getDisplayImage(product)}
                        alt={product.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-3 space-y-1">
                      <h3 className="font-semibold text-stone-900 line-clamp-1">{product.title}</h3>
                      <p className="text-sm font-bold text-stone-900">
                        GHS {Number(product.price).toLocaleString('en-GH')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
};

export default HomePage;
