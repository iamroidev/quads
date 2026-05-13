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
  AlertTriangle,
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
  pending: 'bg-[#fffacd] text-black',
  paid: 'bg-[#e0f2f7] text-black',
  confirmed: 'bg-[#f0e8f4] text-black',
  ready: 'bg-[#fff5e1] text-black',
  completed: 'bg-[#fffacd] text-black',
  cancelled: 'bg-[#fce4ec] text-black',
  disputed: 'bg-[#fce4ec] text-black',
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

  // Dispute state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('item_not_received');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

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

  const handleRaiseDispute = async () => {
    if (!id || !disputeDescription.trim()) { toast.error('Please describe the issue'); return; }
    setSubmittingDispute(true);
    try {
      const evidence = disputeEvidence
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      await api.post('/disputes', {
        orderId: id,
        reason: disputeReason,
        description: disputeDescription.trim(),
        evidence,
      });
      toast.success('Dispute raised. Our team will review it shortly.');
      setShowDisputeModal(false);
      setDisputeDescription('');
      setDisputeEvidence('');
      // Refresh order to reflect new disputed status
      const res = await orderService.getOrder(id);
      if (res.success) setOrder(res.data.order);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to raise dispute');
    } finally {
      setSubmittingDispute(false);
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
        <BulletinSection bgColor="bg-[#faf8f5]">
          <div className="border border-black bg-[#fffacd] p-8 text-center">
            <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2">Missing</div>
            <div className="font-bold mb-4">This order could not be found.</div>
            <Link
              to="/orders"
              className="inline-block border border-black bg-black px-4 py-2 text-[11px] font-bold uppercase text-white transition-colors hover:bg-white hover:text-black"
            >
              View Orders
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
  const canRaiseDispute = Boolean(
    isBuyer &&
      ['paid', 'confirmed', 'ready', 'completed'].includes(order.status) &&
      order.status !== 'disputed'
  );
  const currentStepIndex = order.status === 'cancelled' ? -1 : statusOrder.indexOf(order.status);
  const item = order.items[0];

  return (
    <BulletinLayout
      title={`Order #${order.orderNumber}`}
      subtitle="Order detail"
      section="06"
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
        {/* Header */}
        <div className="flex items-start justify-between mb-6 border-b border-black pb-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider opacity-60 mb-1">Order</div>
            <div className="text-lg font-bold">#{order.orderNumber}</div>
            <div className="text-[11px] opacity-60 mt-1">
              {new Date(order.createdAt).toLocaleDateString('en-GH', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </div>
          </div>
          <span className={`border border-black px-2 py-1 text-[10px] font-bold uppercase ${statusStyles[order.status] || 'bg-white'}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        {/* Delivery tracking timeline */}
        {order.status !== 'cancelled' && order.status !== 'disputed' && (
          <BulletinCard rotation={0.5} bgColor="bg-[#fefdfb]" className="mb-6">
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-6">
              Delivery tracking
            </div>
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-3.5 top-4 bottom-4 w-px bg-black/20" />

              <div className="space-y-0">
                {TRACKING_STEPS.map((step, index) => {
                  const stepIndex = statusOrder.indexOf(step.status);
                  const isDone = stepIndex < currentStepIndex;
                  const isCurrent = stepIndex === currentStepIndex;
                  const isFuture = stepIndex > currentStepIndex;

                  return (
                    <div key={step.status} className="flex gap-4 pb-6 last:pb-0">
                      {/* Dot */}
                      <div className={`relative z-10 flex-shrink-0 w-7 h-7 flex items-center justify-center border border-black ${
                        isDone
                          ? 'bg-black text-white'
                          : isCurrent
                          ? 'bg-black text-white'
                          : 'bg-white text-black opacity-40'
                      }`}>
                        {isDone ? (
                          <CheckCircle className="h-3.5 w-3.5" />
                        ) : isCurrent ? (
                          step.icon
                        ) : (
                          <Circle className="h-3.5 w-3.5" />
                        )}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 pt-0.5 ${isFuture ? 'opacity-40' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className={`text-[12px] font-bold ${
                            isCurrent ? '' : isDone ? '' : 'opacity-60'
                          }`}>
                            {step.label}
                          </div>
                          {isCurrent && (
                            <span className="border border-black bg-black text-white px-2 py-0.5 text-[8px] font-bold uppercase">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] opacity-60 mt-0.5">{step.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </BulletinCard>
        )}

        {/* Cancelled notice */}
        {order.status === 'cancelled' && (
          <div className="border border-black bg-[#fce4ec] p-4 mb-6 flex items-start gap-3 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
            <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[12px] font-bold">Order cancelled</div>
              {order.cancelReason && (
                <div className="text-[12px] mt-1">Reason: {order.cancelReason}</div>
              )}
            </div>
          </div>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Item */}
          <BulletinCard rotation={-0.3} bgColor="bg-white">
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-4 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" /> Item
            </div>
            <div className="flex gap-3">
              <div className="w-14 h-14 border border-black bg-[#f8f7f4] flex-shrink-0 overflow-hidden">
                {item?.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-40">
                    <Package className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div>
                <div className="text-[12px] font-bold">{item?.title}</div>
                <div className="text-[11px] opacity-60 mt-0.5">Qty: {item?.quantity || 1}</div>
                <div className="text-[13px] font-bold mt-1">
                  GHS {item?.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </BulletinCard>

          {/* Delivery */}
          <BulletinCard rotation={0.3} bgColor="bg-white">
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-4 flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" /> Delivery
            </div>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="opacity-60 text-[10px] uppercase tracking-wider">Method</span>
                <span className="font-bold capitalize">{order.deliveryMethod}</span>
              </div>
              {order.deliveryAddress && (
                <div className="flex justify-between">
                  <span className="opacity-60 text-[10px] uppercase tracking-wider">Address</span>
                  <span className="font-bold">{order.deliveryAddress}</span>
                </div>
              )}
            </div>
          </BulletinCard>

          {/* Payment */}
          <BulletinCard rotation={-0.3} bgColor="bg-white">
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-4 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> Payment
            </div>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="opacity-60 text-[10px] uppercase tracking-wider">Item</span>
                <span className="font-bold">
                  GHS {(item?.price * (item?.quantity || 1)).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60 text-[10px] uppercase tracking-wider">Delivery</span>
                <span className={order.deliveryFee > 0 ? 'font-bold' : 'font-bold'}>
                  {order.deliveryFee > 0 ? `GHS ${order.deliveryFee.toFixed(2)}` : 'Free'}
                </span>
              </div>
              <div className="border-t border-black/20" />
              <div className="flex justify-between font-bold">
                <span className="text-[10px] uppercase tracking-wider">Total</span>
                <span>
                  GHS {order.totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {order.payment && (
                <div className="flex justify-between">
                  <span className="opacity-60 text-[10px] uppercase tracking-wider">Status</span>
                  <span className={`font-bold ${
                    order.payment.status === 'success' ? 'text-green-700' :
                    order.payment.status === 'failed' ? 'text-red-700' : 'text-yellow-700'
                  }`}>
                    {order.payment.status === 'success' ? 'Paid' :
                     order.payment.status === 'failed' ? 'Failed' : 'Pending'}
                  </span>
                </div>
              )}
            </div>
          </BulletinCard>

          {/* Seller / Buyer */}
          <BulletinCard rotation={0.3} bgColor="bg-white">
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-4 flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5" /> {isBuyer ? 'Seller' : 'Buyer'}
            </div>
            {isBuyer ? (
              <div className="space-y-2 text-[12px]">
                <div className="font-bold">
                  {(order.seller as any).storeName || (order.seller as any).brandName || order.seller.name}
                  {order.seller.isVerified && (
                    <span className="text-[10px] ml-2 opacity-60">Verified</span>
                  )}
                </div>
                {order.seller.phone && (
                  <div className="flex items-center gap-1.5 text-[11px] opacity-70">
                    <Phone className="h-3.5 w-3.5" />
                    {order.seller.phone}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-[12px]">
                <div className="font-bold">{order.buyer.name}</div>
                {order.buyer.phone && (
                  <div className="flex items-center gap-1.5 text-[11px] opacity-70">
                    <Phone className="h-3.5 w-3.5" />
                    {order.buyer.phone}
                  </div>
                )}
                {order.buyer.email && (
                  <div className="flex items-center gap-1.5 text-[11px] opacity-70">
                    <Mail className="h-3.5 w-3.5" />
                    {order.buyer.email}
                  </div>
                )}
              </div>
            )}
          </BulletinCard>
        </div>

        {/* Note */}
        {order.note && (
          <BulletinCard rotation={0} bgColor="bg-[#fffacd]" className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">Note</div>
            <div className="text-[12px]">{order.note}</div>
          </BulletinCard>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={handleContactSeller}
            disabled={contacting}
            className="border border-black bg-white px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all disabled:opacity-40"
          >
            <MessageCircle className="inline-block h-4 w-4 mr-1" />
            {isBuyer ? 'Message Seller' : 'Message Buyer'}
          </button>
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="border border-black bg-white px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
            >
              <XCircle className="inline-block h-4 w-4 mr-1" />
              Cancel Order
            </button>
          )}
          {canLeaveReview && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="border border-black bg-black px-4 py-2 text-[10px] font-bold uppercase text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-all"
            >
              <Star className="inline-block h-4 w-4 mr-1" />
              Leave Review
            </button>
          )}
          {canRaiseDispute && (
            <button
              onClick={() => setShowDisputeModal(true)}
              className="border border-black bg-[#fce4ec] px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
            >
              <AlertTriangle className="inline-block h-4 w-4 mr-1" />
              Raise Dispute
            </button>
          )}
        </div>

        {/* Review card */}
        {orderReview && (
          <BulletinCard rotation={-0.5} bgColor="bg-white" className="mt-6">
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-3">Your Review</div>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${star <= orderReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-black opacity-20'}`}
                />
              ))}
            </div>
            <div className="text-[12px]">{orderReview.comment}</div>
            {orderReview.reply && (
              <div className="mt-3 border border-black bg-[#f8f7f4] p-3 ml-4 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">Seller reply</div>
                <div className="text-[12px]">{orderReview.reply}</div>
              </div>
            )}
          </BulletinCard>
        )}

        {/* Cancel modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="border border-black bg-[#fefdfb] shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4 border-b border-black pb-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-60">Confirm</div>
                  <div className="text-lg font-bold mt-1">Cancel Order</div>
                </div>
                <button
                  onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                  className="border border-black bg-white p-1.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
              <div className="text-[12px] mb-4">This action cannot be undone.</div>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (optional)..."
                className="w-full h-20 resize-none border border-black bg-white p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                  className="flex-1 border border-black bg-white px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 border border-black bg-black px-4 py-2 text-[10px] font-bold uppercase text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black disabled:opacity-50 transition-all"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="border border-black bg-[#fefdfb] shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4 border-b border-black pb-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-60">Review</div>
                  <div className="text-lg font-bold mt-1">Leave a Review</div>
                </div>
                <button
                  onClick={() => { setShowReviewModal(false); setReviewComment(''); setReviewRating(5); }}
                  className="border border-black bg-white p-1.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
              <div className="text-[12px] opacity-60 mb-5">Share your experience with this order.</div>
              <div className="mb-4">
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-2">Rating</div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setReviewRating(star)} className="p-1">
                      <Star className={`h-6 w-6 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-black opacity-20'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Write your review..."
                className="w-full h-28 resize-none border border-black bg-white p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowReviewModal(false); setReviewComment(''); setReviewRating(5); }}
                  className="flex-1 border border-black bg-white px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="flex-1 border border-black bg-black px-4 py-2 text-[10px] font-bold uppercase text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black disabled:opacity-50 transition-all"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dispute modal */}
        {showDisputeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="border border-black bg-[#fefdfb] shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4 border-b border-black pb-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-60">Dispute</div>
                  <div className="text-lg font-bold mt-1">Raise a Dispute</div>
                </div>
                <button
                  onClick={() => { setShowDisputeModal(false); setDisputeDescription(''); setDisputeEvidence(''); }}
                  className="border border-black bg-white p-1.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
              <div className="text-[12px] opacity-60 mb-5">
                Describe your issue. Our moderation team will review within 24–48 hours.
              </div>
              <div className="mb-4">
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-2">Reason</div>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {[
                    ['item_not_received', 'Item not received'],
                    ['item_not_as_described', 'Item not as described'],
                    ['wrong_item', 'Wrong item sent'],
                    ['damaged_item', 'Item arrived damaged'],
                    ['seller_unresponsive', 'Seller unresponsive'],
                    ['fraud', 'Fraud / scam'],
                    ['other', 'Other'],
                  ].map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="mb-5">
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-2">Description</div>
                <textarea
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  placeholder="Describe what happened in detail..."
                  className="w-full h-28 resize-none border border-black bg-white p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black"
                />
                <div className="text-[10px] opacity-40 mt-1">{disputeDescription.length}/2000</div>
              </div>
              <div className="mb-5">
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-2">Evidence links</div>
                <input
                  value={disputeEvidence}
                  onChange={(e) => setDisputeEvidence(e.target.value)}
                  placeholder="Paste screenshot/photo links separated by commas"
                  className="w-full border border-black bg-white p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDisputeModal(false); setDisputeDescription(''); setDisputeEvidence(''); }}
                  className="flex-1 border border-black bg-white px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRaiseDispute}
                  disabled={submittingDispute || disputeDescription.trim().length < 10}
                  className="flex-1 border border-black bg-[#fce4ec] px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] disabled:opacity-50 transition-all"
                >
                  {submittingDispute ? 'Submitting...' : 'Submit Dispute'}
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