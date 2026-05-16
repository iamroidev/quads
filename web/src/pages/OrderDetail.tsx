import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Truck,
  User as UserIcon,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  CreditCard,
  MessageCircle,
  Star,
  Circle,
  Clock,
  DollarSign,
  ThumbsUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import orderService from '../services/order.service';
import chatService from '../services/chat.service';
import reviewService from '../services/review.service';
import api from '../services/api';
import { LoadingSpinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import {
  OrderPopulated,
  ORDER_STATUS_LABELS,
  OrderStatus,
  ReviewPopulated,
} from '../types';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

interface TrackingStep {
  status: OrderStatus;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

const TRACKING_STEPS: TrackingStep[] = [
  {
    status: 'pending',
    label: 'Order placed',
    desc: 'Your order has been received and is awaiting payment.',
    icon: <Package className="h-4 w-4" />,
  },
  {
    status: 'paid',
    label: 'Payment confirmed',
    desc: 'Payment has been verified. Waiting for seller to confirm.',
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    status: 'confirmed',
    label: 'Order confirmed',
    desc: 'The seller has confirmed your order and is preparing it.',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  {
    status: 'ready',
    label: 'Ready for pickup / dispatch',
    desc: 'Your item is packed and ready. Coordinate with the seller.',
    icon: <Truck className="h-4 w-4" />,
  },
  {
    status: 'completed',
    label: 'Completed',
    desc: 'Order successfully fulfilled.',
    icon: <ThumbsUp className="h-4 w-4" />,
  },
];

const statusOrder: OrderStatus[] = ['pending', 'paid', 'confirmed', 'ready', 'completed'];

const statusStyles: Record<string, string> = {
  pending: 'bg-[#fffacd] dark:bg-yellow-900/40 text-black dark:text-yellow-200',
  paid: 'bg-[#e0f2f7] dark:bg-sky-900/40 text-black dark:text-sky-200',
  confirmed: 'bg-[#f0e8f4] dark:bg-purple-900/40 text-black dark:text-purple-200',
  ready: 'bg-[#fff5e1] dark:bg-orange-900/40 text-black dark:text-orange-200',
  completed: 'bg-[#fffacd] dark:bg-green-900/40 text-black dark:text-green-200',
  cancelled: 'bg-[#fce4ec] dark:bg-red-900/40 text-black dark:text-red-200',
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState<OrderPopulated | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [contacting, setContacting] = useState(false);
  const [orderReview, setOrderReview] = useState<ReviewPopulated | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await orderService.getOrder(id);
        if (res.success) setOrder(res.data.order);
      } catch (err: any) {
        if (err.response?.status === 404) navigate('/orders', { replace: true });
        toast.error('Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, navigate]);

  useEffect(() => {
    if (!id || !order || !user || order.status !== 'completed') return;
    reviewService.getOrderReview(id).then((res) => {
      if (res.success) setOrderReview(res.data.review);
    }).catch(() => {});
  }, [id, order, user]);

  const handleCancel = async () => {
    if (!id) return;
    setCancelling(true);
    try {
      const res = await orderService.cancelOrder(id, cancelReason || undefined);
      if (res.success) {
        setOrder(res.data.order);
        toast.success('Order cancelled');
        setShowCancelModal(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleContactSeller = async () => {
    if (!order || !user) return;
    setContacting(true);
    try {
      const productId = typeof order.items[0]?.product === 'object'
        ? order.items[0].product._id
        : order.items[0]?.product;
      const res = await chatService.getOrCreateConversation(order.seller._id, productId);
      if (res.success) navigate(`/messages/${res.data.conversation._id}`);
    } catch {
      toast.error('Failed to start conversation');
    } finally {
      setContacting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!id) return;
    if (!reviewComment.trim()) { toast.error('Please add a comment'); return; }
    setSubmittingReview(true);
    try {
      const res = await reviewService.createReview({ orderId: id, rating: reviewRating, comment: reviewComment.trim() });
      if (res.success && res.data.review) {
        setOrderReview(res.data.review);
        toast.success('Review submitted');
        setShowReviewModal(false);
        setReviewComment('');
        setReviewRating(5);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading order..." fullScreen />;

  if (!order) {
    return (
      <BulletinLayout title="Order Not Found" subtitle="Error" section="XX">
        <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
          <div className="border-4 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/10 p-12 text-center shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-black dark:text-yellow-200">Missing Link</div>
            <div className="text-xl font-black uppercase tracking-tight mb-6 text-black dark:text-yellow-200">This order could not be found.</div>
            <Link
              to="/orders"
              className="inline-block border-2 border-black dark:border-yellow-200 bg-black dark:bg-yellow-200 px-8 py-3 text-[10px] font-black uppercase text-white dark:text-black transition-all hover:bg-white hover:text-black"
            >
              Back to Orders
            </Link>
          </div>
        </BulletinSection>
      </BulletinLayout>
    );
  }

  const isBuyer = user && order.buyer._id === user._id;
  const isSeller = user && order.seller._id === user._id;
  const canCancel =
    (isBuyer && ['pending', 'paid'].includes(order.status)) ||
    (isSeller && ['paid', 'confirmed'].includes(order.status));
  const canLeaveReview = Boolean(isBuyer && order.status === 'completed' && !orderReview);
  const currentStepIndex = order.status === 'cancelled' ? -1 : statusOrder.indexOf(order.status);
  const item = order.items[0];

  return (
    <BulletinLayout
      title={`Order #${order.orderNumber}`}
      subtitle="Order Details"
      section="06"
    >
      {/* Back button */}
      <div className="border-b-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-4 md:p-6">
        <div className="mx-auto max-w-[1400px]">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:underline text-[var(--bulletin-text)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Orders
          </button>
        </div>
      </div>

      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 border-b-2 border-[var(--bulletin-border)] pb-6">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1 text-[var(--bulletin-text)]">Order Number</div>
            <div className="text-2xl font-black text-[var(--bulletin-text)]">#{order.orderNumber}</div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1 text-[var(--bulletin-text)]">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-GH', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </div>
          </div>
          <span className={`border-2 border-[var(--bulletin-border)] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest ${statusStyles[order.status] || 'bg-[var(--bulletin-card)]'}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        {/* Delivery tracking timeline */}
        {order.status !== 'cancelled' && order.status !== 'disputed' && (
          <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-8 shadow-[8px_8px_0_0_var(--bulletin-shadow)] mb-8">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-8 text-[var(--bulletin-text)]">
              Order Status
            </div>
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-[var(--bulletin-border)]/20" />

              <div className="space-y-0">
                {TRACKING_STEPS.map((step, index) => {
                  const stepIndex = statusOrder.indexOf(step.status);
                  const isDone = stepIndex < currentStepIndex;
                  const isCurrent = stepIndex === currentStepIndex;
                  const isFuture = stepIndex > currentStepIndex;

                  return (
                    <div key={step.status} className="flex gap-6 pb-10 last:pb-0">
                      {/* Dot */}
                      <div className={`relative z-10 flex-shrink-0 w-8 h-8 flex items-center justify-center border-2 border-[var(--bulletin-border)] ${
                        isDone || isCurrent
                          ? 'bg-[var(--bulletin-text)] text-[var(--bulletin-bg)]'
                          : 'bg-[var(--bulletin-card)] text-[var(--bulletin-text)] opacity-40'
                      }`}>
                        {isDone ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : isCurrent ? (
                          step.icon
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 pt-0.5 ${isFuture ? 'opacity-40' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className={`text-sm font-black uppercase tracking-tight text-[var(--bulletin-text)] ${
                            isCurrent ? '' : isDone ? '' : 'opacity-60'
                          }`}>
                            {step.label}
                          </div>
                          {isCurrent && (
                            <span className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-3 py-0.5 text-[8px] font-black uppercase tracking-widest">
                              Current Activity
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] opacity-60 mt-1 text-[var(--bulletin-text)] font-medium leading-relaxed">{step.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Cancelled notice */}
        {order.status === 'cancelled' && (
          <div className="border-4 border-[var(--bulletin-border)] bg-red-50 dark:bg-red-900/10 p-6 mb-8 flex items-start gap-4 shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
            <XCircle className="h-6 w-6 flex-shrink-0 mt-0.5 text-red-600" />
            <div>
              <div className="text-lg font-black uppercase tracking-tight text-red-600">Order Cancelled</div>
              {order.cancelReason && (
                <div className="text-sm mt-2 font-medium italic text-red-600/80">Reason: "{order.cancelReason}"</div>
              )}
            </div>
          </div>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Item */}
          <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(-0.3deg)' }}>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2 text-[var(--bulletin-text)]">
              <Package className="h-4 w-4" /> Purchased Item
            </div>
            <div className="flex gap-4">
              <div className="w-20 h-20 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] flex-shrink-0 overflow-hidden shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
                {item?.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20 text-[var(--bulletin-text)]">
                    <Package className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm font-black uppercase tracking-tight text-[var(--bulletin-text)]">{item?.title}</div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1 text-[var(--bulletin-text)]">Quantity: {item?.quantity || 1}</div>
                <div className="text-xl font-black mt-2 text-[var(--bulletin-text)]">
                  GHS {item?.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(0.3deg)' }}>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2 text-[var(--bulletin-text)]">
              <Truck className="h-4 w-4" /> Delivery Info
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--bulletin-border)]/10 pb-2">
                <span className="opacity-40 text-[9px] font-black uppercase tracking-widest text-[var(--bulletin-text)]">Method</span>
                <span className="font-black uppercase tracking-tight text-[var(--bulletin-text)] text-sm">{order.deliveryMethod}</span>
              </div>
              {order.deliveryAddress && (
                <div className="flex justify-between items-start pt-1">
                  <span className="opacity-40 text-[9px] font-black uppercase tracking-widest text-[var(--bulletin-text)] mt-1">Destination</span>
                  <span className="font-black uppercase tracking-tight text-[var(--bulletin-text)] text-right text-sm leading-tight max-w-[200px]">{order.deliveryAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(-0.3deg)' }}>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2 text-[var(--bulletin-text)]">
              <CreditCard className="h-4 w-4" /> Payment Summary
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="opacity-40 font-bold uppercase tracking-widest text-[9px] text-[var(--bulletin-text)]">Subtotal</span>
                <span className="font-black text-[var(--bulletin-text)]">
                  GHS {(item?.price * (item?.quantity || 1)).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-40 font-bold uppercase tracking-widest text-[9px] text-[var(--bulletin-text)]">Delivery Fee</span>
                <span className="font-black text-[var(--bulletin-text)]">
                  {order.deliveryFee > 0 ? `GHS ${order.deliveryFee.toFixed(2)}` : 'FREE'}
                </span>
              </div>
              <div className="border-t-2 border-[var(--bulletin-border)] pt-3" />
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--bulletin-text)]">Grand Total</span>
                <span className="text-2xl font-black text-[var(--bulletin-text)]">
                  GHS {order.totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {order.payment && (
                <div className="flex justify-between pt-2">
                  <span className="opacity-40 font-bold uppercase tracking-widest text-[9px] text-[var(--bulletin-text)]">Payment Status</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border border-current ${
                    order.payment.status === 'success' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10' :
                    order.payment.status === 'failed' ? 'text-red-600 bg-red-50 dark:bg-red-900/10' : 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10'
                  }`}>
                    {order.payment.status === 'success' ? 'Secured' :
                     order.payment.status === 'failed' ? 'Failed' : 'Pending Verification'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Seller / Buyer */}
          <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(0.3deg)' }}>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2 text-[var(--bulletin-text)]">
              <UserIcon className="h-4 w-4" /> {isBuyer ? 'Seller Info' : 'Buyer Info'}
            </div>
            {isBuyer ? (
              <div className="space-y-3">
                <div className="text-lg font-black uppercase tracking-tight text-[var(--bulletin-text)]">
                  {order.seller.name}
                  {order.seller.isVerified && (
                    <span className="ml-3 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-sky-500 text-white rounded-full">Verified</span>
                  )}
                </div>
                {order.seller.phone && (
                  <div className="flex items-center gap-3 text-sm font-bold text-[var(--bulletin-text)]">
                    <Phone className="h-4 w-4 opacity-40" />
                    {order.seller.phone}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-lg font-black uppercase tracking-tight text-[var(--bulletin-text)]">{order.buyer.name}</div>
                {order.buyer.phone && (
                  <div className="flex items-center gap-3 text-sm font-bold text-[var(--bulletin-text)]">
                    <Phone className="h-4 w-4 opacity-40" />
                    {order.buyer.phone}
                  </div>
                )}
                {order.buyer.email && (
                  <div className="flex items-center gap-3 text-sm font-bold text-[var(--bulletin-text)]">
                    <Mail className="h-4 w-4 opacity-40" />
                    <span className="truncate">{order.buyer.email}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Note */}
        {order.note && (
          <div className="border-2 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/10 p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)] mb-6">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-black dark:text-yellow-200">Note</div>
            <div className="text-sm font-medium italic text-black dark:text-yellow-200">"{order.note}"</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mt-8">
          <button
            onClick={handleContactSeller}
            disabled={contacting}
            className="flex-1 sm:flex-none border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-8 py-3 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-40 text-[var(--bulletin-text)]"
          >
            <MessageCircle className="inline-block h-4 w-4 mr-2" />
            {isBuyer ? 'Message Seller' : 'Message Buyer'}
          </button>
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex-1 sm:flex-none border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-8 py-3 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all text-red-600"
            >
              <XCircle className="inline-block h-4 w-4 mr-2" />
              Cancel Order
            </button>
          )}
          {canLeaveReview && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex-1 sm:flex-none border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-8 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:bg-[#ff6b6b] hover:text-white transition-all"
            >
              <Star className="inline-block h-4 w-4 mr-2" />
              Write Review
            </button>
          )}
        </div>

        {/* Review display */}
        {orderReview && (
          <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-8 shadow-[8px_8px_0_0_var(--bulletin-shadow)] mt-10" style={{ transform: 'rotate(-0.5deg)' }}>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 text-[var(--bulletin-text)]">Feedback Provided</div>
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${star <= orderReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--bulletin-border)] opacity-20'}`}
                />
              ))}
            </div>
            <div className="text-sm font-medium leading-relaxed text-[var(--bulletin-text)] italic">"{orderReview.comment}"</div>
            {orderReview.reply && (
              <div className="mt-6 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-6 ml-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-[var(--bulletin-text)]">Seller's Response</div>
                <div className="text-sm font-medium text-[var(--bulletin-text)] leading-relaxed">{orderReview.reply}</div>
              </div>
            )}
          </div>
        )}

        {/* Cancel modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="border-4 border-black dark:border-[var(--bulletin-border)] bg-[var(--bulletin-card)] shadow-[16px_16px_0_0_var(--bulletin-shadow)] max-w-lg w-full p-10 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-8 border-b-2 border-black dark:border-[var(--bulletin-border)] pb-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">Confirm</div>
                  <div className="text-2xl font-black uppercase tracking-tight mt-1 text-[var(--bulletin-text)]">Cancel Order</div>
                </div>
                <button
                  onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                  className="border-2 border-black dark:border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-2 shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:shadow-none transition-all text-[var(--bulletin-text)]"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <div className="text-sm font-bold text-[var(--bulletin-text)] opacity-60 mb-6 italic leading-relaxed">Please provide a reason for terminating this transaction. This action is recorded and cannot be reversed.</div>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                className="w-full h-28 resize-none border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] mb-8 text-[var(--bulletin-text)]"
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                  className="flex-1 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] py-4 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all text-[var(--bulletin-text)]"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 border-2 border-[var(--bulletin-border)] bg-red-600 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_rgba(220,38,38,0.5)] hover:shadow-none disabled:opacity-50 transition-all"
                >
                  {cancelling ? 'Processing...' : 'Terminate Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="border-4 border-black dark:border-[var(--bulletin-border)] bg-[var(--bulletin-card)] shadow-[16px_16px_0_0_var(--bulletin-shadow)] max-w-lg w-full p-10 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-8 border-b-2 border-black dark:border-[var(--bulletin-border)] pb-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-40 text-[var(--bulletin-text)]">Review</div>
                  <div className="text-2xl font-black uppercase tracking-tight mt-1 text-[var(--bulletin-text)]">Rate Order</div>
                </div>
                <button
                  onClick={() => { setShowReviewModal(false); setReviewComment(''); setReviewRating(5); }}
                  className="border-2 border-black dark:border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-2 shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:shadow-none transition-all text-[var(--bulletin-text)]"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <div className="mb-6">
                <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-3 text-[var(--bulletin-text)]">Your Rating</div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setReviewRating(star)} className="p-2 border-2 border-[var(--bulletin-border)]/10 hover:border-[#ff6b6b] transition-all">
                      <Star className={`h-8 w-8 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--bulletin-text)] opacity-10'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with the UMaT community..."
                className="w-full h-32 resize-none border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] mb-8 text-[var(--bulletin-text)]"
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => { setShowReviewModal(false); setReviewComment(''); setReviewRating(5); }}
                  className="flex-1 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] py-4 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all text-[var(--bulletin-text)]"
                >
                  Discard
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="flex-1 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] py-4 text-[10px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:bg-[#ff6b6b] hover:text-white transition-all disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </div>
          </div>
        )}

      </BulletinSection>
    </BulletinLayout>
  );
};

export default OrderDetail;