import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Clock, ShoppingBag, MessageCircle, Flag, X } from 'lucide-react';
import api from '../services/api';
import { LoadingSpinner } from '../components/ui';
import { BulletinLayout } from '../components/layout/BulletinLayout';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface StoreData {
  store: any;
  products: any[];
  reviews: any[];
}

export default function StorefrontPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  // Reporting states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('inappropriate_behavior');
  const [reportDescription, setReportDescription] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.get(`/stores/${slug}`).then(res => {
      if (res.data.success) setData(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  const handleReportUser = async () => {
    if (!reportDescription.trim()) {
      toast.error('Please describe the reason for your report.');
      return;
    }
    if (!data?.store?.ownerId?._id) return;
    setReporting(true);
    try {
      await api.post('/reports', {
        reportedUser: data.store.ownerId._id,
        reason: reportReason,
        description: reportDescription,
      });
      toast.success('Seller reported. Our team will investigate.');
      setShowReportModal(false);
      setReportDescription('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to report seller.');
    } finally {
      setReporting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading store..." />;
  if (!data) return (
    <BulletinLayout>
      <div className="text-center py-20">
        <p className="text-2xl font-black uppercase text-[var(--bulletin-text)]">Store not found</p>
        <Link to="/products" className="mt-4 inline-block underline text-[var(--bulletin-text)] opacity-60">Browse products</Link>
      </div>
    </BulletinLayout>
  );

  const { store, products, reviews } = data;
  const owner = store.ownerId;

  return (
    <BulletinLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* Store header */}
        <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 md:p-10 shadow-[8px_8px_0_0_var(--bulletin-shadow)] mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 border-4 border-[var(--bulletin-border)] bg-[#ff6b6b] flex items-center justify-center text-white text-3xl font-black flex-shrink-0">
              {store.avatar ? <img src={store.avatar} className="w-full h-full object-cover" /> : store.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-[var(--bulletin-text)]">{store.name}</h1>
                {store.isVerified && <span className="text-[9px] font-black bg-[#fffacd] border-2 border-black px-2 py-0.5 uppercase tracking-widest">Verified</span>}
              </div>
              {store.bio && <p className="text-[13px] font-bold opacity-60 mt-2 text-[var(--bulletin-text)]">{store.bio}</p>}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 text-[11px] font-bold opacity-50 text-[var(--bulletin-text)]">
                {store.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{store.location}</span>}
                {owner?.responseTimeMinutes && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Responds in ~{owner.responseTimeMinutes}m</span>}
                <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" />{products.length} listings</span>
              </div>
              {/* Rating */}
              {store.rating?.average > 0 && (
                <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-black text-[var(--bulletin-text)]">{store.rating.average.toFixed(1)}</span>
                  <span className="text-[11px] font-bold opacity-40">({store.rating.total} reviews)</span>
                </div>
              )}
            </div>
            {user && owner && user._id !== owner._id && (
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto self-center md:self-start md:mt-2">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="border-2 border-red-600 bg-[var(--bulletin-card)] px-6 py-2.5 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all hover:bg-red-50 dark:hover:bg-red-900/10 hover:translate-y-1 hover:shadow-none text-red-600 text-center flex items-center justify-center gap-2"
                >
                  <Flag className="h-4 w-4" /> Report Seller
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Products grid */}
        <div className="mb-8">
          <h2 className="text-[11px] font-black uppercase tracking-[2px] text-[var(--bulletin-text)] opacity-50 mb-4">
            Listings ({products.length})
          </h2>
          {products.length === 0 ? (
            <p className="text-center text-[var(--bulletin-text)] opacity-40 py-12">No active listings</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p: any) => (
                <Link key={p._id} to={`/products/${p._id}`} className="group">
                  <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] overflow-hidden shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    <div className="aspect-square bg-[var(--bulletin-bg)] overflow-hidden">
                      <img src={p.images?.[0]?.url || 'https://placehold.co/300/ddd/666?text=Item'} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="p-3">
                      <p className="text-[11px] font-black uppercase tracking-tight text-[var(--bulletin-text)] truncate">{p.title}</p>
                      <p className="text-[13px] font-black text-[#ff6b6b] mt-1">GHS {p.price}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 text-[var(--bulletin-text)] mt-1">{p.condition}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[2px] text-[var(--bulletin-text)] opacity-50 mb-4">
              Recent Reviews
            </h2>
            <div className="space-y-4">
              {reviews.map((r: any) => (
                <div key={r._id} className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-4 shadow-[3px_3px_0_0_var(--bulletin-shadow)]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold opacity-40 text-[var(--bulletin-text)]">{r.reviewer?.name}</span>
                  </div>
                  <p className="text-[12px] text-[var(--bulletin-text)] leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Report Seller Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-lg border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 md:p-8 shadow-[12px_12px_0_0_var(--bulletin-shadow)]"
            style={{ transform: 'rotate(-0.5deg)' }}
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">Trust & Safety</div>
                <div className="text-2xl font-black uppercase tracking-tight mt-1 text-[var(--bulletin-text)]">Report Seller</div>
              </div>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportDescription('');
                }}
                className="border-2 border-black dark:border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-2 shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:shadow-none transition-all text-[var(--bulletin-text)]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="text-sm font-bold text-[var(--bulletin-text)] opacity-60 mb-6 italic leading-relaxed">
              Help us maintain a safe campus marketplace. Your report will be reviewed by administrators.
            </div>

            <div className="mb-6">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[var(--bulletin-text)] opacity-70 mb-2">
                Reason for report
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-3 text-xs font-black uppercase tracking-wider text-[var(--bulletin-text)] focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]"
              >
                <option value="inappropriate_behavior">Inappropriate Behavior</option>
                <option value="scam">Scam / Fraud</option>
                <option value="spam">Spam / Advertising</option>
                <option value="harassment">Harassment / Abuse</option>
              </select>
            </div>

            <div className="mb-8">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[var(--bulletin-text)] opacity-70 mb-2">
                Provide details
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Please describe exactly what happened..."
                className="w-full border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] resize-none h-32 text-[var(--bulletin-text)]"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                className="flex-1 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] py-4 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all text-[var(--bulletin-text)]"
                onClick={() => {
                  setShowReportModal(false);
                  setReportDescription('');
                }}
              >
                Discard
              </button>
              <button
                className="flex-1 border-2 border-[var(--bulletin-border)] bg-black dark:bg-white py-4 text-[10px] font-black uppercase tracking-widest text-white dark:text-black shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:bg-[#ff6b6b] hover:text-white transition-all"
                onClick={handleReportUser}
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
}
