import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Package,
  Loader2,
} from 'lucide-react';
import paymentService from '../services/payment.service';
import { OrderPopulated, ORDER_STATUS_LABELS } from '../types';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

const PaymentVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [order, setOrder] = useState<OrderPopulated | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reference) {
      setVerifying(false);
      setError('No payment reference found');
      return;
    }

    const verify = async () => {
      setVerifying(true);
      try {
        const res = await paymentService.verifyPayment(reference);
        if (res.success && res.data.verified) {
          setVerified(true);
          setOrder(res.data.order);
        } else {
          setVerified(false);
          setError('Payment could not be verified. Please try again or contact support.');
        }
      } catch (err: any) {
        setVerified(false);
        setError(err.response?.data?.message || 'Payment verification failed');
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [reference]);

  if (verifying) {
    return (
      <BulletinLayout title="Verifying Payment" subtitle="Payment" section="12">
        <BulletinSection bgColor="bg-[#faf8f5]">
          <div className="border border-black bg-white p-12 text-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] max-w-lg mx-auto">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-6" />
            <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2">Please wait</div>
            <div className="text-lg font-bold mb-2">Verifying Payment</div>
            <div className="text-[12px] opacity-60">Confirming your payment with our processor...</div>
          </div>
        </BulletinSection>
      </BulletinLayout>
    );
  }

  if (error && !verified) {
    return (
      <BulletinLayout title="Payment Failed" subtitle="Payment" section="12">
        <BulletinSection bgColor="bg-[#faf8f5]">
          <div className="border border-black bg-[#fce4ec] p-12 text-center shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg mx-auto"
               style={{ transform: 'rotate(-0.5deg)' }}>
            <XCircle className="h-12 w-12 mx-auto mb-4 opacity-60" />
            <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2">Payment failed</div>
            <div className="text-lg font-bold mb-3">Something went wrong</div>
            <div className="text-[12px] opacity-70 mb-8">{error}</div>
            <div className="flex gap-3 justify-center">
              <Link
                to="/orders"
                className="border border-black bg-white px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
              >
                View Orders
              </Link>
              <Link
                to="/products"
                className="border border-black bg-black px-4 py-2 text-[10px] font-bold uppercase text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-all"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </BulletinSection>
      </BulletinLayout>
    );
  }

  return (
    <BulletinLayout title="Payment Successful" subtitle="Order confirmed" section="12">
      <BulletinSection bgColor="bg-[#f5f9fa]">
        {/* Success header */}
        <div className="border border-black bg-[#fffacd] p-8 text-center shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-lg mx-auto mb-8"
             style={{ transform: 'rotate(0.5deg)' }}>
          <CheckCircle className="h-12 w-12 mx-auto mb-4" />
          <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2">Order confirmed</div>
          <div className="text-2xl font-bold mb-2">Payment Successful</div>
          <div className="text-[12px] opacity-70">
            Your order has been placed and the seller has been notified.
          </div>
        </div>

        {/* Order details */}
        {order && (
          <BulletinCard rotation={-0.3} bgColor="bg-white" className="max-w-lg mx-auto mb-6">
            <div className="text-[10px] uppercase tracking-wider opacity-60 mb-4">Order Details</div>
            <div className="space-y-3 text-[12px]">
              <div className="flex justify-between">
                <span className="font-bold uppercase opacity-60 text-[10px]">Order #</span>
                <span className="font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold uppercase opacity-60 text-[10px]">Status</span>
                <span className="border border-black px-2 py-0.5 text-[9px] font-bold uppercase bg-[#fffacd]">
                  {ORDER_STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              {order.items[0] && (
                <div className="flex justify-between">
                  <span className="font-bold uppercase opacity-60 text-[10px]">Item</span>
                  <span className="font-bold truncate max-w-[200px]">{order.items[0].title}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-bold uppercase opacity-60 text-[10px]">Delivery</span>
                <span className="font-bold capitalize">{order.deliveryMethod}</span>
              </div>
              <div className="border-t border-black pt-3 flex justify-between font-bold text-base">
                <span>Total Paid</span>
                <span>GHS {order.totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </BulletinCard>
        )}

        {/* What's next */}
        <BulletinCard rotation={0.3} bgColor="bg-[#e0f2f7]" className="max-w-lg mx-auto mb-8">
          <div className="text-[10px] uppercase tracking-wider opacity-60 mb-4 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            What happens next
          </div>
          <ol className="space-y-3">
            {[
              'The seller will confirm your order',
              `You'll be notified when it's ready for ${order?.deliveryMethod === 'delivery' ? 'delivery' : 'pickup'}`,
              'Meet up or receive your item and mark as completed',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-[12px]">
                <span className="flex-shrink-0 w-5 h-5 border border-black text-[10px] font-black flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </BulletinCard>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          {order && (
            <Link
              to={`/orders/${order._id}`}
              className="border border-black bg-black px-4 py-2 text-[10px] font-bold uppercase text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-all"
            >
              <Package className="inline-block h-4 w-4 mr-1" />
              View Order
            </Link>
          )}
          <Link
            to="/orders"
            className="border border-black bg-white px-4 py-2 text-[10px] font-bold uppercase shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all"
          >
            My Orders
            <ArrowRight className="inline-block h-4 w-4 ml-1" />
          </Link>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default PaymentVerification;