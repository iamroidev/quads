import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Eye,
  Tag,
  Truck,
  MessageCircle,
  Share2,
  Flag,
  Star,
  Heart,
  ShoppingCart,
  Shield,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  BadgePercent,
} from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../services/product.service';
import chatService from '../services/chat.service';
import reviewService from '../services/review.service';
import growthService from '../services/growth.service';
import savedItemService from '../services/savedItem.service';
import orderService from '../services/order.service';
import { LoadingSpinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ProductPopulated, ReviewPopulated, SellerRating } from '../types';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

const conditionLabels: Record<string, string> = {
  'new': 'Brand New',
  'like-new': 'Like New',
  'good': 'Good',
  'fair': 'Fair',
  'poor': 'Poor',
};

const conditionStyles: Record<string, string> = {
  'new': 'bg-[#fffacd] dark:bg-yellow-900/40 text-black dark:text-yellow-200',
  'like-new': 'bg-[#e0f2f7] dark:bg-sky-900/40 text-black dark:text-sky-200',
  'good': 'bg-[#fce4ec] dark:bg-red-900/40 text-black dark:text-red-200',
  'fair': 'bg-[#fff5e1] dark:bg-orange-900/40 text-black dark:text-orange-200',
  'poor': 'bg-[#f0e8f4] dark:bg-purple-900/40 text-black dark:text-purple-200',
};

const deliveryLabels: Record<string, string> = {
  'pickup': 'Campus Pickup Only',
  'delivery': 'Delivery Available',
  'both': 'Pickup or Delivery',
};

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<ProductPopulated | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductPopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sellerCoupons, setSellerCoupons] = useState<any[]>([]);
  const [productBundles, setProductBundles] = useState<any[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [reviews, setReviews] = useState<ReviewPopulated[]>([]);
  const [sellerRating, setSellerRating] = useState<SellerRating | null>(null);
  const [recommendations, setRecommendations] = useState<ProductPopulated[]>([]);
  const [priceInsights, setPriceInsights] = useState<{
    min: number;
    max: number;
    average: number;
    median: number;
    sampleSize: number;
    dealLabel: 'great_deal' | 'fair_price' | 'premium';
  } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await productService.getProduct(id);
        if (res.success) {
          setProduct(res.data.product);
          // Analytics: Track view
          growthService.captureEvent(user?._id, 'product_viewed', {
            productId: id,
            category: res.data.product.category?.name,
            price: res.data.product.price
          });
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          navigate('/not-found', { replace: true });
        }
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  useEffect(() => {
    if (!product) return;

    const storageKey = 'recentViewedProducts';
    const maxItems = 12;

    try {
      const raw = localStorage.getItem(storageKey);
      const existing: ProductPopulated[] = raw ? JSON.parse(raw) : [];
      const withoutCurrent = existing.filter((item) => item._id !== product._id);
      const updated = [product, ...withoutCurrent].slice(0, maxItems);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // Ignore localStorage issues
    }
  }, [product]);

  // Fetch related products
  useEffect(() => {
    if (!id) return;
    productService.getRelated(id, 6).then((res) => {
      if (res.success) setRelatedProducts(res.data);
    });

    productService.getRecommendations({ productId: id, limit: 6 }).then((res) => {
      if (res.success) setRecommendations(res.data);
    }).catch(() => {});

    productService.getPriceInsights(id).then((res) => {
      if (res.success) setPriceInsights(res.data);
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id || !product) return;

    const fetchReviews = async () => {
      try {
        const [productReviewsRes, sellerRatingRes] = await Promise.all([
          reviewService.getProductReviews(id, 1, 10),
          reviewService.getSellerRating(product.seller._id),
        ]);

        if (productReviewsRes.success) {
          setReviews(productReviewsRes.data.reviews);
        }
        if (sellerRatingRes.success) {
          setSellerRating(sellerRatingRes.data.rating);
        }
      } catch {
        // Non-blocking
      }
    };

    fetchReviews();
  }, [id, product]);

  useEffect(() => {
    if (!id || !user || !product) return;
    if (user._id === product.seller._id) return;

    savedItemService
      .isSaved(id)
      .then((res) => {
        if (res.success) setIsSaved(res.data.isSaved);
      })
      .catch(() => {});
  }, [id, user, product]);

  const handleContactSeller = async () => {
    if (!user) {
      toast.error('Please log in to contact the seller');
      navigate('/login');
      return;
    }
    if (!product) return;

    setContacting(true);
    try {
      const res = await chatService.getOrCreateConversation(
        product.seller._id,
        product._id
      );
      if (res.success) {
        await growthService.captureEvent(user._id, 'chat_initiated', {
          productId: product._id,
          sellerId: product.seller._id,
        });
        navigate(`/messages/${res.data.conversation._id}`);
      }
    } catch {
      toast.error('Failed to start conversation');
    } finally {
      setContacting(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    setReporting(true);
    try {
      await productService.flagProduct(id!, reportReason);
      toast.success('Product reported. Our team will review it.');
      setShowReportModal(false);
      setReportReason('');
    } catch {
      toast.error('Failed to report product');
    } finally {
      setReporting(false);
    }
  };

  const handleShare = async () => {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const shareUrl = `${apiBase}/products/${product?._id}/share`;
    
    // Analytics: Track share
    growthService.captureEvent(user?._id, 'product_shared', {
      productId: product?._id,
      platform: !!navigator.share ? 'system' : 'clipboard'
    });

    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          text: `Check out ${product?.title} on QUADS`,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleToggleSaved = async () => {
    if (!user) {
      toast.error('Please log in to save items');
      navigate('/login');
      return;
    }
    if (!product || user._id === product.seller._id) return;

    setSaving(true);
    try {
      const res = await savedItemService.toggleSavedItem(product._id);
      if (res.success) {
        setIsSaved(res.data.saved);
        toast.success(res.data.saved ? 'Saved to wishlist' : 'Removed from wishlist');
      }
    } catch {
      toast.error('Failed to update saved items');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading product detail..." fullScreen />;
  }

  if (!product) {
    return (
      <BulletinLayout title="Item Not Found" subtitle="Error" section="XX">
        <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
          <div className="border-4 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/10 p-12 text-center shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-black dark:text-yellow-200">Item Not Found</div>
            <div className="text-xl font-black uppercase tracking-tight mb-8 text-black dark:text-yellow-200">This item might have been removed or it doesn't exist anymore.</div>
            <Link
              to="/products"
              className="inline-block border-2 border-black dark:border-yellow-200 bg-black dark:bg-yellow-200 px-8 py-3 text-[10px] font-black uppercase text-white dark:text-black transition-all hover:bg-white hover:text-black"
            >
              Browse All Items
            </Link>
          </div>
        </BulletinSection>
      </BulletinLayout>
    );
  }

  const seller = product.seller;
  const category = product.category;
  const isOwner = user && seller._id === user._id;
  const placeholderImage = `https://placehold.co/600x400/e2e8f0/64748b?text=${encodeURIComponent(product.title.slice(0, 20))}`;
  const images = product.images.length > 0 ? product.images : [{ url: placeholderImage, publicId: '' }];
  const sellerResponseTime = 15;

  const getRelatedImage = (p: ProductPopulated) => p.images[0]?.url || 'https://placehold.co/400x500/ddd/666?text=Item';

  return (
      <BulletinLayout
      title={product.title}
      subtitle="Item Details"
      section="03"
    >
      <Helmet>
        <title>{product.title} | QUADS Marketplace</title>
        <meta name="description" content={product.description.slice(0, 160)} />
        <meta property="og:title" content={product.title} />
        <meta property="og:description" content={product.description.slice(0, 160)} />
        <meta property="og:image" content={product.images[0]?.url || ''} />
        <meta property="og:type" content="product" />
        <meta property="product:price:amount" content={product.price.toString()} />
        <meta property="product:price:currency" content="GHS" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--bulletin-text)] shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Images */}
          <div>
            {/* Main image - Polaroid style */}
            <div
              className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-4 shadow-[8px_8px_0_0_var(--bulletin-shadow)]"
              style={{ transform: 'rotate(-0.5deg)' }}
            >
              <div className="relative aspect-[4/3] overflow-hidden border-2 border-[var(--bulletin-border)]/10 bg-[var(--bulletin-bg)]">
                <img
                  src={images[currentImageIndex].url}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
                {/* Tape effect */}
                <div className="absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 bg-[#ffd700]/30 opacity-60"
                     style={{ transform: 'translateX(-50%) rotate(-2deg)' }} />
                {/* Nav arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-2 shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all text-[var(--bulletin-text)]"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-2 shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all text-[var(--bulletin-text)]"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
                {/* Featured badge */}
                {product.isFeatured && (
                  <div className="absolute top-4 left-4 border-2 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900 px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] flex items-center gap-2 text-black dark:text-yellow-200">
                    <Star className="h-4 w-4 fill-current" />
                    Top Pick
                  </div>
                )}
                {/* Status */}
                {product.status === 'sold' && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-white font-black text-4xl border-4 border-white px-8 py-4 rotate-[-12deg] tracking-widest shadow-[8px_8px_0_0_rgba(0,0,0,0.3)]">SOLD</span>
                  </div>
                )}
                <div className="absolute bottom-4 right-4 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] text-[10px] font-black px-3 py-1 tracking-widest">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 mt-8 scrollbar-hide">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`border-2 flex-shrink-0 transition-all ${
                      index === currentImageIndex ? 'border-[var(--bulletin-border)] shadow-[4px_4px_0_0_var(--bulletin-shadow)] scale-105' : 'border-[var(--bulletin-border)]/30 opacity-60 hover:opacity-100'
                    }`}
                    style={{ transform: `rotate(${(index % 3 - 1) * 0.8}deg)` }}
                  >
                    <div className="w-20 h-20 overflow-hidden bg-[var(--bulletin-bg)]">
                      <img
                        src={img.url}
                        alt={`${product.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Product reviews - Moved beneath image */}
            <div className="mt-12 pt-12 border-t-2 border-[var(--bulletin-border)]/10">
              <div className="flex items-center justify-between mb-8">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-[var(--bulletin-text)]">Reviews</div>
                {reviews.length > 0 && (
                   <div className="flex items-center gap-2">
                     <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                     <span className="text-sm font-black text-[var(--bulletin-text)]">{sellerRating?.averageRating.toFixed(1) || '0.0'}</span>
                   </div>
                )}
              </div>
              
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review, idx) => (
                    <div
                      key={review._id}
                      className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)]"
                      style={{ transform: `rotate(${(idx % 2) * 0.5}deg)` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-black uppercase tracking-tight text-[var(--bulletin-text)]">{review.reviewer.name}</div>
                          <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-0.5 text-[var(--bulletin-text)]">
                            {new Date(review.createdAt).toLocaleDateString('en-GH')}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--bulletin-border)] opacity-20'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-sm font-medium leading-relaxed mt-4 italic text-[var(--bulletin-text)]">"{review.comment}"</div>
                      {review.reply && (
                        <div className="mt-4 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-4 ml-4 shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
                          <div className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1 text-[var(--bulletin-text)]">Seller Response</div>
                          <div className="text-[12px] font-medium text-[var(--bulletin-text)] leading-relaxed">{review.reply}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-4 border-dashed border-[var(--bulletin-border)]/20 p-12 text-center relative overflow-hidden group">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] select-none pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                    <Sparkles className="h-40 w-40" />
                  </div>
                  <div className="relative z-10">
                    <div className="h-16 w-16 bg-[var(--bulletin-card)] border-2 border-[var(--bulletin-border)] flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)] rotate-[-3deg]">
                       <Star className="h-8 w-8 text-[var(--bulletin-border)] opacity-20" />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)] mb-2">No Reviews Yet</div>
                    <div className="text-sm font-black uppercase tracking-tight text-[var(--bulletin-text)]">No feedback yet.</div>
                    <p className="mt-2 text-[11px] font-bold opacity-40 max-w-[200px] mx-auto text-[var(--bulletin-text)]">Be the first to review this seller after you buy from them.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex flex-col">
            {/* Category */}
            <Link
              to={`/products?category=${category.slug}`}
              className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:underline transition-opacity text-[var(--bulletin-text)]"
            >
              {category.name} Items
            </Link>

            {/* Title */}
            <h1 className="text-3xl font-black uppercase tracking-tight mt-2 mb-4 text-[var(--bulletin-text)]">{product.title}</h1>

            {/* Price */}
            <div className="text-4xl font-black mb-8 border-b-4 border-[var(--bulletin-border)] pb-6 text-[var(--bulletin-text)]">
              GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </div>

            {/* Price intelligence */}
            {priceInsights && (
              <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)] mb-8" style={{ transform: 'rotate(0.5deg)' }}>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 text-[var(--bulletin-text)]">Price Guide</div>
                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">Range</div>
                    <div className="text-[13px] font-black text-[var(--bulletin-text)] mt-1">
                      {priceInsights.min.toLocaleString('en-GH')} - {priceInsights.max.toLocaleString('en-GH')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">Average</div>
                    <div className="text-[13px] font-black text-[var(--bulletin-text)] mt-1">{priceInsights.average.toLocaleString('en-GH')}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">Deal</div>
                    <div className="text-[13px] font-black text-[var(--bulletin-text)] mt-1">
                      {priceInsights.dealLabel === 'great_deal' ? 'Good Deal' : priceInsights.dealLabel === 'premium' ? 'High Price' : 'Market Price'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-3 mb-6">
              <span className={`border-2 border-[var(--bulletin-border)] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest ${conditionStyles[product.condition]}`}>
                {conditionLabels[product.condition]}
              </span>
              {product.status === 'reserved' && (
                <span className="border-2 border-[var(--bulletin-border)] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest bg-[#fff5e1] dark:bg-orange-900/40 text-black dark:text-orange-200">
                  Awaiting Transaction
                </span>
              )}
            </div>

            {/* Key details */}
            <div className="space-y-4 mb-8 border-y-2 border-[var(--bulletin-border)] py-6">
              <div className="flex items-center gap-3 text-sm font-black uppercase tracking-tight text-[var(--bulletin-text)]">
                <Truck className="h-5 w-5 opacity-40" />
                {deliveryLabels[product.deliveryOption]}
              </div>
              <div className="flex items-center gap-3 text-sm font-black uppercase tracking-tight text-[var(--bulletin-text)]">
                <Eye className="h-5 w-5 opacity-40" />
                {product.views.toLocaleString()} Community Views
              </div>
              <div className="flex items-center gap-3 text-sm font-black uppercase tracking-tight text-[var(--bulletin-text)]">
                <Clock className="h-5 w-5 opacity-40" />
                Listed on {new Date(product.createdAt).toLocaleDateString('en-GH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-40 text-[var(--bulletin-text)]">Item Description</h3>
              <p className="text-[14px] leading-relaxed font-medium text-[var(--bulletin-text)] opacity-80 whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="mb-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-40 text-[var(--bulletin-text)]">Search Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/products?search=${encodeURIComponent(tag)}`}
                      className="flex items-center gap-2 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-3 py-1.5 text-[10px] font-black uppercase tracking-tight shadow-[3px_3px_0_0_var(--bulletin-shadow)] hover:translate-y-1 hover:shadow-none transition-all text-[var(--bulletin-text)]"
                    >
                      <Tag className="h-3 w-3 opacity-40" />
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Discovery: Available Coupons */}
            {sellerCoupons.length > 0 && (
              <div className="mb-10 p-6 border-4 border-black bg-[#fffacd] dark:bg-yellow-900/20 shadow-[8px_8px_0_0_#000] rotate-[-0.5deg]">
                <div className="flex items-center gap-2 mb-4">
                  <BadgePercent className="h-5 w-5 text-[#ff6b6b]" />
                  <h3 className="text-[12px] font-black uppercase tracking-[0.2em]">Shop Promos</h3>
                </div>
                <div className="grid gap-3">
                  {sellerCoupons.map((coupon) => (
                    <div key={coupon._id} className="flex items-center justify-between border-2 border-dashed border-black/30 p-3 bg-white/40 dark:bg-black/40">
                      <div>
                        <div className="text-[14px] font-black">{coupon.type === 'percentage' ? `${coupon.value}% OFF` : `GHS ${coupon.value} OFF`}</div>
                        <div className="text-[9px] font-bold opacity-60 uppercase">Min Order: GHS {coupon.minOrderAmount}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="bg-black text-white px-3 py-1 text-[12px] font-mono font-bold select-all cursor-copy">{coupon.code}</div>
                        <div className="text-[8px] font-black mt-1 opacity-40">CLICK TO COPY</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] font-bold mt-4 opacity-50 italic">* Apply code at checkout to redeem.</p>
              </div>
            )}
            <div className="flex flex-wrap gap-4 mt-auto">
              {isOwner ? (
                <Link
                  to={`/products/${product._id}/edit`}
                  className="flex-1 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-8 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] text-center shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:translate-y-1 hover:shadow-none transition-all"
                >
                  Edit Item
                </Link>
              ) : (
                <>
                  <button
                    className="flex-1 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-8 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] transition-all hover:bg-[#ff6b6b] hover:text-white shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:translate-y-1 hover:shadow-none disabled:opacity-20"
                    disabled={product.status !== 'active'}
                    onClick={() => {
                      growthService.captureEvent(user?._id, 'buy_now_initiated', { productId: product._id, price: product.price });
                      addItem(product);
                      navigate('/cart');
                    }}
                  >
                    Buy Now
                  </button>
                  <button
                    className="flex-1 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-8 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-text)] transition-all hover:bg-[#fffacd] hover:text-black shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:translate-y-1 hover:shadow-none disabled:opacity-20"
                    disabled={product.status !== 'active'}
                    onClick={() => {
                      growthService.captureEvent(user?._id, 'add_to_cart', { productId: product._id });
                      addItem(product);
                    }}
                  >
                    <ShoppingCart className="inline-block h-5 w-5 mr-2" />
                    Add to Cart
                  </button>
                  <button
                    className="flex-1 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-8 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-text)] transition-all hover:bg-[var(--bulletin-text)] hover:text-[var(--bulletin-bg)] shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:translate-y-1 hover:shadow-none disabled:opacity-20"
                    disabled={product.status !== 'active' || contacting}
                    onClick={handleContactSeller}
                  >
                    <MessageCircle className="inline-block h-5 w-5 mr-2" />
                    {contacting ? '...' : 'Chat with Seller'}
                  </button>
                  <button
                    onClick={handleToggleSaved}
                    disabled={saving}
                    className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-5 py-4 text-[11px] font-black uppercase transition-all hover:bg-red-50 dark:hover:bg-red-900/10 shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-y-1 hover:shadow-none text-[var(--bulletin-text)]"
                  >
                    <Heart className={`h-5 w-5 ${isSaved ? 'text-red-500 fill-red-500' : ''}`} />
                  </button>
                </>
              )}
              <button
                onClick={handleShare}
                className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-5 py-4 text-[11px] font-black uppercase transition-all hover:bg-[var(--bulletin-bg)] shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-y-1 hover:shadow-none text-[var(--bulletin-text)]"
                title="Share"
              >
                <Share2 className="h-5 w-5" />
              </button>
              {!isOwner && user && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-5 py-4 text-[11px] font-black uppercase transition-all hover:bg-red-50 dark:hover:bg-red-900/10 shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-y-1 hover:shadow-none text-red-600"
                  title="Report"
                >
                  <Flag className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </BulletinSection>

      {/* Seller info */}
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-8 shadow-[12px_12px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(-0.5deg)' }}>
          <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6 text-[var(--bulletin-text)]">About the Seller</div>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-24 w-24 border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] flex items-center justify-center font-black text-3xl overflow-hidden shadow-[6px_6px_0_0_var(--bulletin-shadow)] text-[var(--bulletin-text)]">
              {seller.avatar ? (
                <img src={seller.avatar} alt={seller.name} className="h-full w-full object-cover" />
              ) : (
                seller.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 text-2xl font-black uppercase tracking-tight text-[var(--bulletin-text)]">
                <span>{seller.storeName || seller.brandName || seller.name}</span>
                {seller.isVerified && (
                  <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-sky-500 text-white rounded-full">Verified</span>
                )}
              </div>
              {seller.location && (
                <div className="text-sm font-bold flex items-center justify-center md:justify-start gap-2 mt-2 opacity-60 text-[var(--bulletin-text)]">
                  <MapPin className="h-4 w-4" />
                  {seller.location}
                </div>
              )}
              {sellerRating && (
                <div className="mt-4 flex items-center justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-black text-[var(--bulletin-text)]">
                      {sellerRating.averageRating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">
                    {sellerRating.totalReviews} Reviews
                  </span>
                </div>
              )}
            </div>
            <Link
              to={`/products?seller=${seller._id}`}
              className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-8 py-3 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all hover:translate-y-1 hover:shadow-none text-[var(--bulletin-text)]"
            >
              See All Items
            </Link>
          </div>

          <div className="mt-10 grid gap-6 border-t-2 border-[var(--bulletin-border)] pt-8 md:grid-cols-2">
            <div className="border-2 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/10 p-6 shadow-[6px_6px_0_0_var(--bulletin-shadow)]">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-40 text-black dark:text-yellow-200">Safety</div>
              <div className="mt-3 text-sm font-black uppercase tracking-tight flex items-center gap-3 text-black dark:text-yellow-200">
                <Shield className="h-5 w-5" />
                Secure Payment Active
              </div>
              <p className="mt-2 text-[12px] font-medium text-black/70 dark:text-yellow-200/70 leading-relaxed">
                Payments are held securely until transaction fulfillment is confirmed by both parties.
              </p>
            </div>
            <div className="border-2 border-[var(--bulletin-border)] bg-[#e0f2f7] dark:bg-sky-900/10 p-6 shadow-[6px_6px_0_0_var(--bulletin-shadow)]">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-40 text-black dark:text-sky-200">Reply Time</div>
              <div className="mt-3 text-sm font-black uppercase tracking-tight flex items-center gap-3 text-black dark:text-sky-200">
                <MessageCircle className="h-5 w-5" />
                Usually replies in ~{sellerResponseTime} mins
              </div>
              <p className="mt-2 text-[12px] font-medium text-black/70 dark:text-sky-200/70 leading-relaxed">
                The seller is highly active. Coordinate pickup in safe places on campus.
              </p>
            </div>
          </div>
        </div>
      </BulletinSection>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <BulletinSection title="You May Also Like" subtitle="Similar Products" bgColor="bg-[var(--bulletin-bg)]">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((rp, idx) => (
              <Link
                key={rp._id}
                to={`/products/${rp._id}`}
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
                <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-4 shadow-[8px_8px_0_0_var(--bulletin-shadow)] group-hover:shadow-[12px_12px_0_0_var(--bulletin-shadow)] transition-all">
                  <div className="relative aspect-square overflow-hidden border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)]">
                    <img
                      src={getRelatedImage(rp)}
                      alt={rp.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 bg-[#ffd700]/30 opacity-60"
                         style={{ transform: 'translateX(-50%) rotate(-2deg)' }} />
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="truncate font-black uppercase tracking-tight text-sm text-[var(--bulletin-text)]">{rp.title}</div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-black text-[var(--bulletin-text)]">GHS {rp.price}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">
                        {typeof rp.category === 'string' ? '' : rp.category.name}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </BulletinSection>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <BulletinSection title="Recommended for you" subtitle="For You" bgColor="bg-[var(--bulletin-bg)]">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec, idx) => (
              <Link
                key={rec._id}
                to={`/products/${rec._id}`}
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
                <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-4 shadow-[8px_8px_0_0_var(--bulletin-shadow)] group-hover:shadow-[12px_12px_0_0_var(--bulletin-shadow)] transition-all">
                  <div className="relative aspect-square overflow-hidden border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)]">
                    <img
                      src={getRelatedImage(rec)}
                      alt={rec.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 bg-[#ffd700]/30 opacity-60"
                         style={{ transform: 'translateX(-50%) rotate(-2deg)' }} />
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="truncate font-black uppercase tracking-tight text-sm text-[var(--bulletin-text)]">{rec.title}</div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-black text-[var(--bulletin-text)]">GHS {rec.price}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">
                        {typeof rec.category === 'string' ? '' : rec.category.name}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </BulletinSection>
      )}

      {/* Report modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="border-4 border-black dark:border-[var(--bulletin-border)] bg-[var(--bulletin-card)] shadow-[16px_16px_0_0_var(--bulletin-shadow)] max-w-lg w-full p-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8 border-b-2 border-black dark:border-[var(--bulletin-border)] pb-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">Integrity Report</div>
                <div className="text-2xl font-black uppercase tracking-tight mt-1 text-[var(--bulletin-text)]">Flag Product</div>
              </div>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
                className="border-2 border-black dark:border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-2 shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:shadow-none transition-all text-[var(--bulletin-text)]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="text-sm font-bold text-[var(--bulletin-text)] opacity-60 mb-6 italic leading-relaxed">
              Help us maintain a safe marketplace. Please describe the violation in detail.
            </div>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Violation description..."
              className="w-full border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] resize-none h-32 mb-8 text-[var(--bulletin-text)]"
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                className="flex-1 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] py-4 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all text-[var(--bulletin-text)]"
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
              >
                Discard
              </button>
              <button
                className="flex-1 border-2 border-[var(--bulletin-border)] bg-black dark:bg-white py-4 text-[10px] font-black uppercase tracking-widest text-white dark:text-black shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:bg-[#ff6b6b] hover:text-white transition-all"
                onClick={handleReport}
                disabled={reporting}
              >
                {reporting ? 'Processing...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </BulletinLayout>
  );
};

export default ProductDetail;