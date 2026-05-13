import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../services/product.service';
import chatService from '../services/chat.service';
import reviewService from '../services/review.service';
import savedItemService from '../services/savedItem.service';
import { LoadingSpinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
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
  'new': 'bg-[#fffacd] text-black',
  'like-new': 'bg-[#e0f2f7] text-black',
  'good': 'bg-[#fce4ec] text-black',
  'fair': 'bg-[#fff5e1] text-black',
  'poor': 'bg-[#f0e8f4] text-black',
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

  const [product, setProduct] = useState<ProductPopulated | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductPopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          text: `Check out ${product?.title} on CampusMarketplace`,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
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
    return <LoadingSpinner text="Loading product..." fullScreen />;
  }

  if (!product) {
    return (
      <BulletinLayout title="Product Not Found" subtitle="Error" section="XX">
        <BulletinSection bgColor="bg-[#faf8f5]">
          <div className="border border-black bg-[#fffacd] p-8 text-center">
            <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2">Missing</div>
            <div className="font-bold mb-4">This product may have been removed or doesn't exist.</div>
            <Link
              to="/products"
              className="inline-block border border-black bg-black px-4 py-2 text-[11px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black"
            >
              Browse Products
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
      subtitle="Product detail"
      section="03"
    >
      {/* Back button */}
      <div className="border-b border-black bg-[#faf8f5] p-4 md:p-6">
        <div className="mx-auto max-w-[1400px]">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-[12px] font-bold hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </div>

      <BulletinSection bgColor="bg-[#f5f9fa]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Images */}
          <div>
            {/* Main image - Polaroid style */}
            <div
              className="border border-black bg-white p-3 shadow-[6px_6px_0_0_rgba(0,0,0,1)]"
              style={{ transform: 'rotate(-0.5deg)' }}
            >
              <div className="relative aspect-[4/3] overflow-hidden border border-black/10 bg-gray-100">
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
                      className="absolute left-2 top-1/2 -translate-y-1/2 border border-black bg-white p-1.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 border border-black bg-white p-1.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
                {/* Featured badge */}
                {product.isFeatured && (
                  <div className="absolute top-3 left-3 border border-black bg-[#fffacd] px-2 py-1 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Featured
                  </div>
                )}
                {/* Status */}
                {product.status === 'sold' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl border border-white px-4 py-2">SOLD</span>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 border border-black bg-black/80 text-white text-[10px] px-2 py-1">
                  {currentImageIndex + 1}/{images.length}
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mt-4 scrollbar-hide">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`border flex-shrink-0 transition-all ${
                      index === currentImageIndex ? 'border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]' : 'border-black/30'
                    }`}
                    style={{ transform: `rotate(${(index % 3 - 1) * 0.8}deg)` }}
                  >
                    <div className="w-16 h-16 overflow-hidden">
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
          </div>

          {/* Right: Details */}
          <div>
            {/* Category */}
            <Link
              to={`/products?category=${category.slug}`}
              className="text-[10px] uppercase tracking-wider font-bold hover:underline"
            >
              {category.name}
            </Link>

            {/* Title */}
            <h1 className="text-2xl font-bold mt-2 mb-3">{product.title}</h1>

            {/* Price */}
            <div className="text-2xl font-bold mb-4 border-b border-black pb-4">
              GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </div>

            {/* Price intelligence */}
            {priceInsights && (
              <BulletinCard rotation={0.5} bgColor="bg-[#fefdfb]" className="mb-5">
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-3">Price intelligence</div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider opacity-40">Market range</div>
                    <div className="text-[12px] font-bold">
                      GHS {priceInsights.min.toLocaleString('en-GH')} - GHS {priceInsights.max.toLocaleString('en-GH')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider opacity-40">Average</div>
                    <div className="text-[12px] font-bold">GHS {priceInsights.average.toLocaleString('en-GH')}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider opacity-40">Deal</div>
                    <div className="text-[12px] font-bold">
                      {priceInsights.dealLabel === 'great_deal' ? 'Great deal' : priceInsights.dealLabel === 'premium' ? 'Premium pricing' : 'Fair market price'}
                    </div>
                  </div>
                </div>
              </BulletinCard>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`border border-black px-2 py-1 text-[10px] font-bold uppercase ${conditionStyles[product.condition]}`}>
                {conditionLabels[product.condition]}
              </span>
              {product.status === 'reserved' && (
                <span className="border border-black px-2 py-1 text-[10px] font-bold uppercase bg-[#fff5e1]">
                  Reserved
                </span>
              )}
            </div>

            {/* Key details */}
            <div className="space-y-3 mb-6 border-y border-black py-4">
              <div className="flex items-center gap-2 text-[12px]">
                <Truck className="h-4 w-4 opacity-60" />
                {deliveryLabels[product.deliveryOption]}
              </div>
              <div className="flex items-center gap-2 text-[12px]">
                <Eye className="h-4 w-4 opacity-60" />
                {product.views} views
              </div>
              <div className="flex items-center gap-2 text-[12px]">
                <Clock className="h-4 w-4 opacity-60" />
                Listed {new Date(product.createdAt).toLocaleDateString('en-GH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-[10px] uppercase tracking-wider font-bold mb-2 opacity-60">Description</h3>
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-[10px] uppercase tracking-wider font-bold mb-2 opacity-60">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/products?search=${encodeURIComponent(tag)}`}
                      className="flex items-center gap-1 border border-black bg-white px-2 py-1 text-[10px] font-bold shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {isOwner ? (
                <Link
                  to={`/products/${product._id}/edit`}
                  className="flex-1 border border-black bg-black px-4 py-2 text-[11px] font-bold uppercase text-white text-center transition-colors hover:bg-white hover:text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
                >
                  Edit Listing
                </Link>
              ) : (
                <>
                  <button
                    className="flex-1 border border-black bg-black px-4 py-2 text-[11px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={product.status !== 'active' || !user}
                    onClick={() => navigate(`/checkout/${product._id}`)}
                  >
                    <ShoppingCart className="inline-block h-4 w-4 mr-1" />
                    Buy Now
                  </button>
                  <button
                    className="flex-1 border border-black bg-white px-4 py-2 text-[11px] font-bold uppercase transition-colors hover:bg-[#f8f7f4] shadow-[3px_3px_0_0_rgba(0,0,0,1)] disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={product.status !== 'active' || contacting}
                    onClick={handleContactSeller}
                  >
                    <MessageCircle className="inline-block h-4 w-4 mr-1" />
                    {contacting ? 'Loading...' : 'Contact Seller'}
                  </button>
                  <button
                    onClick={handleToggleSaved}
                    disabled={saving}
                    className="border border-black bg-white px-3 py-2 text-[11px] font-bold uppercase transition-colors hover:bg-[#f8f7f4] shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                  >
                    <Heart className={`h-4 w-4 ${isSaved ? 'text-red-500 fill-red-500' : ''}`} />
                  </button>
                </>
              )}
              <button
                onClick={handleShare}
                className="border border-black bg-white px-3 py-2 text-[11px] font-bold uppercase transition-colors hover:bg-[#f8f7f4] shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                title="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>
              {!isOwner && user && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="border border-black bg-white px-3 py-2 text-[11px] font-bold uppercase transition-colors hover:bg-red-50 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                  title="Report"
                >
                  <Flag className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Seller info */}
            <BulletinCard rotation={-0.5} bgColor="bg-[#fefdfb]">
              <div className="text-[10px] uppercase tracking-wider font-bold opacity-60 mb-3">Seller</div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 border border-black bg-[#f8f7f4] flex items-center justify-center font-bold text-lg overflow-hidden">
                  {seller.avatar ? (
                    <img src={seller.avatar} alt={seller.name} className="h-full w-full object-cover" />
                  ) : (
                    seller.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>{seller.storeName || seller.brandName || seller.name}</span>
                    {seller.isVerified && (
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {seller.location && (
                    <div className="text-[11px] flex items-center gap-1 mt-0.5 opacity-60">
                      <MapPin className="h-3 w-3" />
                      {seller.location}
                    </div>
                  )}
                </div>
                <Link
                  to={`/products?seller=${seller._id}`}
                  className="border border-black bg-white px-2 py-1 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
                >
                  Listings
                </Link>
              </div>
              {sellerRating && (
                <div className="mt-3 pt-3 border-t border-black">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-[12px] font-bold">
                        {sellerRating.averageRating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-[11px] opacity-60">
                      ({sellerRating.totalReviews} review{sellerRating.totalReviews === 1 ? '' : 's'})
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-4 grid gap-3 border-t border-black pt-4 md:grid-cols-2">
                <div className="border border-black bg-[#fffacd] p-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Trust layer</div>
                  <div className="mt-2 text-[12px] font-bold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Buyer protection ready
                  </div>
                  <div className="mt-1 text-[11px] leading-relaxed opacity-70">
                    Payments verified before fulfillment. Disputes can be raised from your order timeline.
                  </div>
                </div>
                <div className="border border-black bg-[#e0f2f7] p-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Seller pace</div>
                  <div className="mt-2 text-[12px] font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Replies in ~{sellerResponseTime} mins
                  </div>
                  <div className="mt-1 text-[11px] leading-relaxed opacity-70">
                    Meet in a public campus spot, inspect the item first, keep chat inside the app.
                  </div>
                </div>
              </div>
            </BulletinCard>
          </div>
        </div>
      </BulletinSection>

      {/* Product reviews */}
      {reviews.length > 0 && (
        <BulletinSection title="Reviews" subtitle="Section 01" bgColor="bg-[#faf8f5]">
          <div className="space-y-4">
            {reviews.map((review, idx) => (
              <div
                key={review._id}
                className="border border-black bg-white p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                style={{ transform: `rotate(${(idx % 2) * 0.8}deg)` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-bold">{review.reviewer.name}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">
                      {new Date(review.createdAt).toLocaleDateString('en-GH')}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-black opacity-20'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-[12px] mt-3">{review.comment}</div>
                {review.reply && (
                  <div className="mt-3 border border-black bg-[#f8f7f4] p-3 ml-4 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">Seller reply</div>
                    <div className="text-[12px]">{review.reply}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </BulletinSection>
      )}

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <BulletinSection title="Similar Products" subtitle="Section 02" bgColor="bg-[#f5f9fa]">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                <div className="border border-black bg-white p-3 shadow-[6px_6px_0_0_rgba(0,0,0,0.1)]">
                  <div className="relative aspect-square overflow-hidden border border-black/10 bg-gray-100">
                    <img
                      src={getRelatedImage(rp)}
                      alt={rp.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 bg-[#ffd700]/30 opacity-60"
                         style={{ transform: 'translateX(-50%) rotate(-2deg)' }} />
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="truncate font-bold leading-tight">{rp.title}</div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-bold">GHS {rp.price}</span>
                      <span className="text-[10px] uppercase opacity-50">
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
        <BulletinSection title="Because you viewed this" subtitle="Section 03" bgColor="bg-[#faf8f3]">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                <div className="border border-black bg-white p-3 shadow-[6px_6px_0_0_rgba(0,0,0,0.1)]">
                  <div className="relative aspect-square overflow-hidden border border-black/10 bg-gray-100">
                    <img
                      src={getRelatedImage(rec)}
                      alt={rec.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 bg-[#ffd700]/30 opacity-60"
                         style={{ transform: 'translateX(-50%) rotate(-2deg)' }} />
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="truncate font-bold leading-tight">{rec.title}</div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-bold">GHS {rec.price}</span>
                      <span className="text-[10px] uppercase opacity-50">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="border border-black bg-[#fefdfb] shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4 border-b border-black pb-3">
              <div className="text-lg font-bold">Report Product</div>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
                className="border border-black bg-white p-1.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="text-[11px] opacity-60 mb-4">
              Please tell us why you're reporting this product.
            </div>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue..."
              className="w-full border border-black bg-white p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black resize-none h-24 mb-4"
            />
            <div className="flex gap-3">
              <button
                className="flex-1 border border-black bg-white px-4 py-2 text-[11px] font-bold uppercase transition-colors hover:bg-[#f8f7f4] shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
              >
                Cancel
              </button>
              <button
                className="flex-1 border border-black bg-black px-4 py-2 text-[11px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                onClick={handleReport}
                disabled={reporting}
              >
                {reporting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </BulletinLayout>
  );
};

export default ProductDetail;