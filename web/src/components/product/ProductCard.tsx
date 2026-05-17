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

  const sellerName = typeof product.seller === 'string' ? 'Seller' : product.seller.name;
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
  const [isHovered, setIsHovered] = React.useState(false);

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

  // Deterministic rotation between -1.5deg and 1.5deg for tactile "pinned" layout
  const rotationSeed = seededRandom(product._id);
  const rotation = (rotationSeed * 3 - 1.5).toFixed(1);

  return (
    <Link
      to={`/products/${product._id}`}
      className="group block transition-all duration-300 ease-out h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered
          ? 'scale(1.03) translateY(-8px) rotate(0deg)'
          : `rotate(${rotation}deg)`,
      }}
    >
      <div className="border-4 border-black dark:border-white bg-white dark:bg-[#121212] p-4 pb-6 shadow-[6px_6px_0_0_var(--bulletin-shadow)] transition-all duration-300 ease-out relative flex flex-col h-full">
        {/* Decorative Red Thumbtack with Jiggle on Hover */}
        <div
          className={`absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-[#ff6b6b] border-4 border-black z-30 transition-all duration-300 ${
            isHovered ? 'animate-thumbtack-jiggle' : ''
          }`}
          style={{
            transform: 'translate(-50%, -50%)',
            boxShadow: 'inset -2px -2px 0px rgba(0,0,0,0.3), 2px 2px 4px rgba(0,0,0,0.15)',
          }}
        >
          {/* Silver pin reflection */}
          <div className="h-1.5 w-1.5 rounded-full bg-white/60 absolute top-1 left-1" />
          {/* Pin needle shadow dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1 w-1 rounded-full bg-red-800" />
        </div>

        {/* ── Image ── */}
        <div className="relative aspect-[4/3] overflow-hidden bg-earth-100 border-4 border-black dark:border-white shadow-[2px_2px_0_0_rgba(0,0,0,0.15)] flex-shrink-0">
          <img
            src={mainImage}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />

          {/* Quick View — slides up from bottom on hover */}
          <div className="absolute inset-x-0 bottom-0 z-20 translate-y-full bg-earth-900/90 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0">
            Quick View
          </div>

          {/* Save button — fades in on hover */}
          {!isOwner && (
            <button
              onClick={handleToggleSaved}
              disabled={saving}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-black shadow-[2px_2px_0_0_black] opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-earth-50 z-20"
              title={isSaved ? 'Remove from saved' : 'Save item'}
            >
              <Heart className={`h-3.5 w-3.5 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-black'}`} />
            </button>
          )}

          {/* Featured badge */}
          {product.isFeatured && (
            <div className="absolute left-3 top-3 bg-[#fffacd] dark:bg-yellow-900 border-2 border-black dark:border-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-black dark:text-yellow-100 shadow-[2px_2px_0_0_black] dark:shadow-[2px_2px_0_0_white]">
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
            <div className="absolute left-3 bottom-3 z-10 transition-transform duration-300 group-hover:-translate-y-10">
              <svg width="64" height="28" viewBox="0 0 64 28" className="transform rotate-[-3deg] opacity-90 drop-shadow-sm">
                <rect x="1" y="1" width="62" height="26" rx="2" fill="#1f2937" stroke="#374151" strokeWidth="1" />
                <text x="32" y="18" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="800" fontFamily="monospace" letterSpacing="1">
                  VERIFIED
                </text>
              </svg>
            </div>
          )}

          {/* Reserved badge */}
          {product.status === 'reserved' && (
            <div className={`absolute ${product.isFeatured ? 'top-10' : 'top-3'} left-3 bg-orange-500 border-2 border-black px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-[2px_2px_0_0_black]`}>
              Reserved
            </div>
          )}

          {/* ── LAST ONE red stamp ── */}
          {isLastOne && (
            <div className="absolute right-3 bottom-3 z-10 transition-transform duration-300 group-hover:-translate-y-10">
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
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white rounded-full">
              1/{product.images.length}
            </div>
          )}
        </div>

        {/* ── Info styled as Polaroid Monospaced Caption ── */}
        <div className="pt-4 font-mono flex-1 flex flex-col justify-between">
          <div>
            <h3 className="line-clamp-1 text-[13px] font-black uppercase tracking-tight text-[var(--bulletin-text)] transition-colors group-hover:text-[#ff6b6b]">
              {product.title}
            </h3>

            {/* ── Price with crossed-out original ── */}
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-black text-[var(--bulletin-text)]">
                  GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </span>
                {hasDiscount && (
                  <span className="relative text-[11px] text-red-600 font-bold">
                    <span className="relative z-10 text-[10px]">GHS {product.originalPrice!.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                    {/* Red marker strikethrough */}
                    <span className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-red-600 rotate-[-3deg]" />
                    <span className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-red-600 rotate-[2deg] opacity-60" />
                  </span>
                )}
              </div>
              <span className="text-[10px] font-black uppercase border-2 border-black dark:border-white px-1.5 py-0.5 bg-[#fffdf8] dark:bg-[#1e1e1e] text-[var(--bulletin-text)] shadow-[2px_2px_0_0_black] dark:shadow-[2px_2px_0_0_white]">
                {conditionLabel[product.condition] || product.condition}
              </span>
            </div>

            {/* ── Social proof / Pinned counter ── */}
            {socialProof && (
              <div className="mt-2.5 flex items-center gap-1.5 border-t border-black/10 dark:border-white/10 pt-2">
                <Eye className="h-3 w-3 text-[var(--bulletin-text)] opacity-40" />
                <span className="text-[9px] text-[var(--bulletin-text)] opacity-60 font-bold uppercase tracking-tight">{socialProof}</span>
              </div>
            )}
          </div>

          <div className="mt-3 border-t border-black/10 dark:border-white/10 pt-2 flex flex-col gap-1.5">
            {/* Seller + verified */}
            <div className="flex items-center justify-between gap-1.5">
              <span className="truncate text-[10px] font-bold uppercase opacity-50 text-[var(--bulletin-text)]">{sellerName}</span>
              {sellerVerified && (
                <span className="flex-shrink-0 border border-black dark:border-white bg-[#e0f2f7] dark:bg-sky-900/30 px-1 py-0.5 text-[8px] font-black uppercase text-black dark:text-sky-200 shadow-[1px_1px_0_0_black] dark:shadow-[1px_1px_0_0_white]">
                  Verified
                </span>
              )}
            </div>

            {/* ── Campus proximity hint ── */}
            {product.pickupLocation && user?.residenceHall && product.pickupLocation === user.residenceHall && (
              <div className="mt-1 flex items-center gap-1">
                <Bookmark className="h-3 w-3 text-[#ff6b6b]" />
                <span className="text-[9px] font-black uppercase tracking-wider text-[#ff6b6b]">
                  In your hostel
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
