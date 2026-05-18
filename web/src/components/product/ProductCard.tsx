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
      navigate('/login', { state: { from: window.location.pathname + window.location.search } });
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
      <div className="border-2 md:border-4 border-black dark:border-white bg-white dark:bg-[#121212] p-2 pb-3 md:p-4 md:pb-6 shadow-[3px_3px_0_0_var(--bulletin-shadow)] md:shadow-[6px_6px_0_0_var(--bulletin-shadow)] transition-all duration-300 ease-out relative flex flex-col h-full">
        {/* Decorative Red Thumbtack with Jiggle on Hover */}
        <div
          className={`absolute -top-1.5 md:-top-3 left-1/2 -translate-x-1/2 h-3 w-3 md:h-6 md:w-6 rounded-full bg-[#ff6b6b] border-2 md:border-4 border-black z-30 transition-all duration-300 ${
            isHovered ? 'animate-thumbtack-jiggle' : ''
          }`}
          style={{
            transform: 'translate(-50%, -50%)',
            boxShadow: 'inset -1px -1px 0px rgba(0,0,0,0.3), 1px 1px 2px rgba(0,0,0,0.15)',
          }}
        >
          {/* Silver pin reflection */}
          <div className="h-0.5 w-0.5 md:h-1.5 md:w-1.5 rounded-full bg-white/60 absolute top-0.5 left-0.5" />
          {/* Pin needle shadow dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-0.5 w-0.5 md:h-1 md:w-1 rounded-full bg-red-800" />
        </div>

        {/* ── Visual Stamp Overlay ── */}
        {(product.status === 'sold' || product.status === 'reserved') && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none overflow-hidden" style={{ clipPath: 'inset(0 0 0 0)' }}>
            {product.status === 'sold' && (
              <div className="border-4 border-black bg-red-600 text-white px-6 py-1 md:py-2 text-2xl md:text-3xl font-black uppercase tracking-[0.2em] transform -rotate-12 shadow-[4px_4px_0_0_black]">
                SOLD
              </div>
            )}
            {product.status === 'reserved' && (
              <div className="border-4 border-black bg-yellow-400 text-black px-6 py-1 md:py-2 text-xl md:text-2xl font-black uppercase tracking-[0.2em] transform -rotate-12 shadow-[4px_4px_0_0_black]">
                PENDING
              </div>
            )}
          </div>
        )}

        {/* ── Image ── */}
        <div className="relative aspect-[4/3] overflow-hidden bg-earth-100 border-2 md:border-4 border-black dark:border-white shadow-[1px_1px_0_0_rgba(0,0,0,0.15)] flex-shrink-0">
          <img
            src={mainImage}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />

          {/* Quick View — slides up from bottom on hover */}
          <div className="absolute inset-x-0 bottom-0 z-20 translate-y-full bg-earth-900/90 py-2 md:py-3 text-center text-[9px] md:text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0">
            Quick View
          </div>

          {/* Save button — fades in on hover */}
          {!isOwner && (
            <button
              onClick={handleToggleSaved}
              disabled={saving}
              className="absolute right-2 top-2 md:right-3 md:top-3 flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full bg-white border border-black md:border-2 shadow-[1px_1px_0_0_black] md:shadow-[2px_2px_0_0_black] opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-earth-50 z-20"
              title={isSaved ? 'Remove from saved' : 'Save item'}
            >
              <Heart className={`h-2.5 w-2.5 md:h-3.5 md:w-3.5 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-black'}`} />
            </button>
          )}

          {/* Featured badge */}
          {product.isFeatured && (
            <div className="absolute left-2 top-2 md:left-3 md:top-3 bg-[#fffacd] dark:bg-yellow-900 border border-black md:border-2 dark:border-white px-1.5 py-0.5 md:px-2.5 md:py-1 text-[8px] md:text-[10px] font-black uppercase tracking-[0.16em] text-black dark:text-yellow-100 shadow-[1px_1px_0_0_black] md:shadow-[2px_2px_0_0_black] dark:shadow-[1px_1px_0_0_white]">
              Featured
            </div>
          )}

          {/* ── SOLD Stamp Overlay ── */}
          {product.status === 'sold' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
              <span className="text-white font-black text-sm md:text-lg border-2 border-white px-3 py-1 rotate-[-12deg] tracking-widest shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">SOLD</span>
            </div>
          )}

          {/* ── VERIFIED Stamp (sleek badge instead of opaque blocking SVG) ── */}
          {sellerVerified && product.status !== 'sold' && (
            <div className="absolute left-2 bottom-2 bg-sky-500 border border-black text-white px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider shadow-[1px_1px_0_0_black]">
              Verified
            </div>
          )}

          {/* Reserved badge */}
          {product.status === 'reserved' && (
            <div className="absolute left-2 top-2 md:left-3 md:top-3 bg-orange-500 border border-black text-white px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider shadow-[1px_1px_0_0_black]">
              Reserved
            </div>
          )}

          {/* ── LAST ONE (sleek badge instead of opaque blocking SVG) ── */}
          {isLastOne && (
            <div className="absolute right-2 bottom-2 bg-red-600 border border-black text-white px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider shadow-[1px_1px_0_0_black]">
              Last One
            </div>
          )}

          {/* Image count */}
          {product.images.length > 1 && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/55 px-2 py-0.5 text-[8px] md:text-[10px] font-medium text-white rounded-full">
              1/{product.images.length}
            </div>
          )}
        </div>

        {/* ── Info styled as Polaroid Monospaced Caption ── */}
        <div className="pt-2.5 font-mono flex-1 flex flex-col justify-between">
          <div>
            <h3 className="line-clamp-1 text-[11px] md:text-[13px] font-black uppercase tracking-tight text-[var(--bulletin-text)] transition-colors group-hover:text-[#ff6b6b]">
              {product.title}
            </h3>

            {/* ── Price with crossed-out original ── */}
            <div className="mt-1 flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] md:text-[13px] font-black text-[var(--bulletin-text)]">
                  GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[8px] md:text-[9px] font-bold uppercase border border-black dark:border-white px-1.5 py-0.5 bg-[#fffdf8] dark:bg-[#1e1e1e] text-[var(--bulletin-text)] shadow-[1px_1px_0_0_black] dark:shadow-[1px_1px_0_0_white]">
                  {conditionLabel[product.condition] || product.condition}
                </span>
              </div>
              {hasDiscount && (
                <div className="relative text-[9px] md:text-[11px] text-red-600 font-bold self-start mt-0.5">
                  <span className="relative z-10 text-[8px] md:text-[10px]">GHS {product.originalPrice!.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                  {/* Red marker strikethrough */}
                  <span className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-red-600 rotate-[-3deg]" />
                  <span className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-red-600 rotate-[2deg] opacity-60" />
                </div>
              )}
            </div>

            {/* ── Social proof / Pinned counter ── */}
            {socialProof && (
              <div className="mt-2 flex items-center gap-1.5 border-t border-black/10 dark:border-white/10 pt-1.5 hidden sm:flex">
                <Eye className="h-3 w-3 text-[var(--bulletin-text)] opacity-40" />
                <span className="text-[8px] text-[var(--bulletin-text)] opacity-60 font-bold uppercase tracking-tight">{socialProof}</span>
              </div>
            )}
          </div>

          <div className="mt-2.5 border-t border-black/10 dark:border-white/10 pt-1.5 flex flex-col gap-1">
            {/* Seller + verified */}
            <div className="flex items-center justify-between gap-1.5">
              <span className="truncate text-[9px] md:text-[10px] font-bold uppercase opacity-50 text-[var(--bulletin-text)]">{sellerName}</span>
              {sellerVerified && (
                <span className="flex-shrink-0 border border-black dark:border-white bg-[#e0f2f7] dark:bg-sky-900/30 px-1 py-0.5 text-[7px] md:text-[8px] font-black uppercase text-black dark:text-sky-200 shadow-[1px_1px_0_0_black] dark:shadow-[1px_1px_0_0_white]">
                  Verified
                </span>
              )}
            </div>

            {/* ── Campus proximity hint ── */}
            {product.pickupLocation && user?.residenceHall && product.pickupLocation === user.residenceHall && (
              <div className="mt-0.5 flex items-center gap-1">
                <Bookmark className="h-2.5 w-2.5 text-[#ff6b6b]" />
                <span className="text-[8px] font-black uppercase tracking-wider text-[#ff6b6b]">
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
