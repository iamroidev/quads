import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Eye, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProductPopulated } from '../../types';
import { useAuth } from '../../context/AuthContext';
import savedItemService from '../../services/savedItem.service';

interface ProductCardProps {
  product: ProductPopulated;
  onSavedChange?: (productId: string, saved: boolean) => void;
}

const conditionLabel: Record<string, string> = {
  'new': 'New',
  'like-new': 'Like New',
  'good': 'Good',
  'fair': 'Fair',
  'poor': 'Poor',
};

/** Deterministic pseudo-random from string seed */
const seededRandom = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) / 2147483647;
};

/** Generate a "pinned" social-proof message based on product data */
const getSocialProof = (product: ProductPopulated): string | null => {
  const rand = seededRandom(product._id);
  const views = product.views || 0;

  // Only show for products with some activity
  if (views < 3) return null;

  if (rand < 0.33) {
    const count = Math.max(2, Math.min(12, Math.floor(views * 0.3) + 1));
    return `${count} Students viewed this in the last hour`;
  } else if (rand < 0.66) {
    const count = Math.max(1, Math.min(8, Math.floor(views * 0.15) + 1));
    return `${count} People have this in their Saved items`;
  } else {
    const count = Math.max(3, Math.min(20, Math.floor(views * 0.5) + 2));
    return `${count} Students checked this out today`;
  }
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onSavedChange }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const sellerName = typeof product.seller === 'string' ? 'Seller' : (product.seller.storeName || product.seller.brandName || product.seller.name);
  const sellerVerified = typeof product.seller === 'string' ? false : product.seller.isVerified;

  /** Optimize Cloudinary URLs with f_auto,q_auto */
  const optimizeCloudinaryUrl = (url: string) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    if (url.includes('f_auto,q_auto')) return url;
    return url.replace('/upload/', '/upload/f_auto,q_auto/');
  };

  const placeholderImage = `https://placehold.co/400x300/f3f5f7/9ba3a7?text=${encodeURIComponent(product.title.slice(0, 15))}`;
  const rawImage = product.images.length > 0 ? product.images[0].url : placeholderImage;
  const mainImage = optimizeCloudinaryUrl(rawImage);

  const [isSaved, setIsSaved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const isOwner = user?._id === (typeof product.seller === 'string' ? product.seller : product.seller._id);

  const socialProof = getSocialProof(product);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const isLastOne = product.stock === 1 && product.status === 'active';

  React.useEffect(() => {
    if (!isAuthenticated || isOwner) return;
    savedItemService
      .isSaved(product._id)
      .then((res) => { if (res.success) setIsSaved(res.data.isSaved); })
      .catch(() => {});
  }, [isAuthenticated, isOwner, product._id]);

  const handleToggleSaved = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to save items');
      navigate('/login');
      return;
    }
    setSaving(true);
    try {
      const res = await savedItemService.toggleSavedItem(product._id);
      if (res.success) {
        setIsSaved(res.data.saved);
        onSavedChange?.(product._id, res.data.saved);
        toast.success(res.data.saved ? 'Saved to wishlist' : 'Removed from wishlist');
      }
    } catch {
      toast.error('Failed to update saved items');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Link to={`/products/${product._id}`} className="group block">
      {/* ── Image ── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-earth-100">
        <img
          src={mainImage}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />

        {/* Quick View — slides up from bottom on hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-earth-900/90 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0">
          Quick View
        </div>

        {/* Save button — fades in on hover */}
        {!isOwner && (
          <button
            onClick={handleToggleSaved}
            disabled={saving}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-earth-50"
            title={isSaved ? 'Remove from saved' : 'Save item'}
          >
            <Heart className={`h-3.5 w-3.5 transition-colors ${isSaved ? 'fill-earth-900 text-earth-900' : 'text-earth-500'}`} />
          </button>
        )}

        {/* Featured badge */}
        {product.isFeatured && (
          <div className="absolute left-3 top-3 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-earth-900 shadow-sm">
            Featured
          </div>
        )}

        {/* ── SVG SOLD Stamp Overlay ── */}
        {product.status === 'sold' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <svg width="140" height="140" viewBox="0 0 140 140" className="transform rotate-[-12deg]">
              <circle cx="70" cy="70" r="60" fill="none" stroke="#dc2626" strokeWidth="4" strokeDasharray="8 4" />
              <circle cx="70" cy="70" r="52" fill="none" stroke="#dc2626" strokeWidth="2" />
              <text
                x="70"
                y="78"
                textAnchor="middle"
                fill="#dc2626"
                fontSize="32"
                fontWeight="900"
                fontFamily="Arial, sans-serif"
                letterSpacing="2"
              >
                SOLD
              </text>
            </svg>
          </div>
        )}

        {/* ── SVG VERIFIED Stamp (small, corner) ── */}
        {sellerVerified && product.status !== 'sold' && (
          <div className="absolute left-3 bottom-3">
            <svg width="64" height="28" viewBox="0 0 64 28" className="transform rotate-[-3deg] opacity-90">
              <rect x="1" y="1" width="62" height="26" rx="2" fill="#1f2937" stroke="#374151" strokeWidth="1" />
              <text x="32" y="18" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="800" fontFamily="monospace" letterSpacing="1">
                VERIFIED
              </text>
            </svg>
          </div>
        )}

        {/* Reserved badge */}
        {product.status === 'reserved' && (
          <div className={`absolute ${product.isFeatured ? 'top-10' : 'top-3'} left-3 bg-orange-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white`}>
            Reserved
          </div>
        )}

        {/* ── LAST ONE red stamp ── */}
        {isLastOne && (
          <div className="absolute right-3 bottom-3">
            <svg width="72" height="32" viewBox="0 0 72 32" className="transform rotate-[4deg] drop-shadow-md">
              <rect x="1" y="1" width="70" height="30" rx="2" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
              <text x="36" y="21" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="1.5">
                LAST ONE
              </text>
            </svg>
          </div>
        )}

        {/* Image count */}
        {product.images.length > 1 && (
          <div className="absolute bottom-10 right-3 bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">
            1/{product.images.length}
          </div>
        )}
      </div>

      {/* ── Info ── */}
      <div className="pt-3">
        <h3 className="line-clamp-1 text-sm font-medium text-earth-700 transition-colors group-hover:text-earth-900">
          {product.title}
        </h3>

        {/* ── Price with crossed-out original ── */}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-earth-900">
              GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </span>
            {hasDiscount && (
              <span className="relative text-xs text-red-600 font-bold">
                <span className="relative z-10">GHS {product.originalPrice!.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                {/* Red marker strikethrough */}
                <span className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-red-600 rotate-[-3deg]" />
                <span className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-red-600 rotate-[2deg] opacity-60" />
              </span>
            )}
          </div>
          <span className="text-xs text-earth-400">
            {conditionLabel[product.condition] || product.condition}
          </span>
        </div>

        {/* ── Social proof / Pinned counter ── */}
        {socialProof && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <Eye className="h-3 w-3 text-earth-400" />
            <span className="text-[10px] text-earth-500 font-medium">{socialProof}</span>
          </div>
        )}

        {/* Seller + verified */}
        <div className="mt-1 flex items-center gap-1">
          <span className="truncate text-xs text-earth-400">{sellerName}</span>
          {sellerVerified && (
            <svg className="h-3 w-3 flex-shrink-0 text-moss-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* ── Campus proximity hint ── */}
        {product.pickupLocation && user?.residenceHall && product.pickupLocation === user.residenceHall && (
          <div className="mt-1.5 flex items-center gap-1">
            <Bookmark className="h-3 w-3 text-[#ff6b6b]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff6b6b]">
              In your hostel
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
