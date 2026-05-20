import { useState } from 'react';
import { Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface ReviewModalProps {
  orderId: string;
  productId: string;
  productTitle: string;
  sellerId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function ReviewModal({ orderId, productId, productTitle, sellerId, onClose, onSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error('Please select a rating.'); return; }
    if (comment.trim().length < 5) { toast.error('Please write at least a short review.'); return; }

    setSubmitting(true);
    try {
      await api.post('/reviews', {
        order: orderId,
        product: productId,
        seller: sellerId,
        rating,
        comment: comment.trim(),
      });
      toast.success('Review submitted!');
      onSubmitted();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[var(--bulletin-card)] border-4 border-[var(--bulletin-border)] shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[var(--bulletin-border)]">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[2px] text-[#ff6b6b]">Leave a Review</p>
            <p className="text-[14px] font-black uppercase tracking-tight text-[var(--bulletin-text)]">{productTitle}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:opacity-60">
            <X className="h-5 w-5 text-[var(--bulletin-text)]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Stars */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-[var(--bulletin-text)] opacity-50 mb-3">
              Your Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      n <= (hover || rating)
                        ? 'fill-[#ff6b6b] text-[#ff6b6b]'
                        : 'text-[var(--bulletin-border)] opacity-30'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-[11px] font-bold mt-2 text-[var(--bulletin-text)] opacity-60">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-[var(--bulletin-text)] opacity-50 mb-3">
              Your Review
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="How was your experience with this product and seller?"
              className="w-full border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] px-4 py-3 text-[13px] font-bold text-[var(--bulletin-text)] placeholder:opacity-25 focus:outline-none resize-none shadow-[4px_4px_0_0_var(--bulletin-shadow)]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-text)] hover:bg-[var(--bulletin-bg)] transition-all shadow-[4px_4px_0_0_var(--bulletin-shadow)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="flex-[2] border-4 border-[#ff6b6b] bg-[#ff6b6b] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:opacity-30 transition-all hover:bg-[#c0392b]"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
