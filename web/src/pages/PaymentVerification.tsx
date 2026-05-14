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
        <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
          <div className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-12 text-center shadow-[4px_4px_0_0_var(--bulletin-shadow)] max-w-lg mx-auto">
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
        <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
          <div className="border border-[var(--bulletin-border)] bg-[#fce4ec] dark:bg-red-900/20 p-12 text-center shadow-[8px_8px_0_0_var(--bulletin-shadow)] max-w-lg mx-auto"
               style={{ transform: 'rotate(-0.5deg)' }}>
            <XCircle className="h-12 w-12 mx-auto mb-4 opacity-60" />
            <div className="text-[10px] uppercase tracking-wider opacity-60 mb-2">Payment failed</div>
            <div className="text-lg font-bold mb-3">Something went wrong</div>
            <div className="text-[12px] opacity-70 mb-8">{error}</div>
            <div className="flex gap-3 justify-center">
              <Link
                to="/orders"
                className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:shadow-[3px_3px_0_0_var(--bulletin-shadow)] transition-all"
              >
                View Orders
              </Link>
              <Link
                to="/products"
                className="border border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-4 py-2 text-[10px] font-bold uppercase text-[var(--bulletin-bg)] shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:bg-[var(--bulletin-card)] hover:text-[var(--bulletin-text)] transition-all"
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
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        {/* Success header */}
        <div className="relative border-2 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/20 p-10 text-center shadow-[12px_12px_0_0_var(--bulletin-shadow)] max-w-lg mx-auto mb-12 overflow-hidden"
             style={{ transform: 'rotate(0.5deg)' }}>
          {/* Success Stamp */}
          <div className="absolute -top-4 -right-4 border-2 border-emerald-600 text-emerald-600 px-4 py-2 text-[20px] font-black uppercase tracking-tighter opacity-20 rotate-[20deg] select-none pointer-events-none">
            PAID IN FULL
          </div>

          <CheckCircle className="h-16 w-16 mx-auto mb-6 text-emerald-600" />
          <div className="inline-block border border-[var(--bulletin-border)] bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-2 py-0.5 text-[10px] font-black uppercase mb-4">
            Auth Token: {reference?.slice(0, 8)}
          </div>
          <div className="text-3xl font-black uppercase mb-3 tracking-tighter">Transaction Verified</div>
          <p className="text-[13px] opacity-70 leading-relaxed font-mono">
            Your payment was successfully processed. The merchant has been issued a fulfillment notice.
          </p>
        </div>

        {/* Order details */}
        {order && (
          <div className="max-w-lg mx-auto mb-8 relative">
            <div className="absolute -top-3 left-6 bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] text-[9px] font-black px-2 py-0.5 z-10">
              LEDGER ENTRY
            </div>
            <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
              <div className="space-y-4 text-[12px]">
                <div className="flex justify-between items-center">
                  <span className="font-black uppercase opacity-40 text-[10px] tracking-widest">Serial Number</span>
                  <span className="font-black font-mono">#{order.orderNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-black uppercase opacity-40 text-[10px] tracking-widest">State</span>
                  <span className="border-2 border-[var(--bulletin-border)] px-3 py-1 text-[10px] font-black uppercase bg-[#fffacd] dark:bg-yellow-900/30 shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                {order.items[0] && (
                  <div className="flex justify-between items-center">
                    <span className="font-black uppercase opacity-40 text-[10px] tracking-widest">Description</span>
                    <span className="font-black uppercase truncate max-w-[200px]">{order.items[0].title}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-black uppercase opacity-40 text-[10px] tracking-widest">Logistics</span>
                  <span className="font-black uppercase">{order.deliveryMethod}</span>
                </div>
                <div className="border-t-2 border-dashed border-[var(--bulletin-border)] pt-4 flex justify-between items-baseline">
                  <span className="font-black uppercase text-sm">Settlement</span>
                  <span className="font-black text-2xl tracking-tighter">GHS {order.totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* What's next */}
        <div className="max-w-lg mx-auto mb-12">
          <div className="text-[11px] font-black uppercase tracking-widest opacity-40 mb-6 flex items-center gap-3">
            <div className="h-[2px] flex-1 bg-[var(--bulletin-border)]/20"></div>
            Next Protocols
            <div className="h-[2px] flex-1 bg-[var(--bulletin-border)]/20"></div>
          </div>
          <div className="grid gap-4">
            {[
              { label: 'Validation', desc: 'Seller confirms item availability' },
              { label: 'Execution', desc: `Item released for ${order?.deliveryMethod === 'delivery' ? 'courier' : 'campus pickup'}` },
              { label: 'Settlement', desc: 'Confirm receipt to release funds' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4 bg-[var(--bulletin-card)] border border-[var(--bulletin-border)] p-4 shadow-[3px_3px_0_0_var(--bulletin-shadow)]">
                <div className="flex-shrink-0 w-8 h-8 border-2 border-[var(--bulletin-border)] text-[12px] font-black flex items-center justify-center bg-[#e0f2f7] dark:bg-sky-900/30">
                  0{i + 1}
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-tight">{step.label}</div>
                  <div className="text-[12px] opacity-60 font-mono leading-none mt-1">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          {order && (
            <Link
              to={`/orders/${order._id}`}
              className="border border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-4 py-2 text-[10px] font-bold uppercase text-[var(--bulletin-bg)] shadow-[3px_3px_0_0_var(--bulletin-shadow)] hover:bg-[var(--bulletin-card)] hover:text-[var(--bulletin-text)] transition-all"
            >
              <Package className="inline-block h-4 w-4 mr-1" />
              View Order
            </Link>
          )}
          <Link
            to="/orders"
            className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-2 text-[10px] font-bold uppercase shadow-[3px_3px_0_0_var(--bulletin-shadow)] hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all"
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