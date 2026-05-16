import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Truck,
  Package,
  CreditCard,
  Smartphone,
  Building2,
  Shield,
  X,
  CheckCircle,
  Pin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../services/product.service';
import orderService from '../services/order.service';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ProductPopulated, PaymentMethod, PAYMENT_METHODS } from '../types';
import { LoadingSpinner } from '../components/ui';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';
import paymentService from '../services/payment.service';

interface CheckoutFormState {
  deliveryMethod: 'pickup' | 'delivery';
  pickupLocation: string;
  deliveryAddress: string;
  note: string;
  paymentMethod: PaymentMethod;
  termsAccepted: boolean;
  couponCode: string;
}

const Checkout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: cartItems, clearCart, totalPrice: cartTotalPrice } = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCartCheckout, setIsCartCheckout] = useState(false);
  const [form, setForm] = useState<CheckoutFormState>({
    deliveryMethod: 'pickup',
    pickupLocation: '',
    deliveryAddress: '',
    note: '',
    paymentMethod: 'momo_mtn',
    termsAccepted: false,
    couponCode: '',
  });
  const [couponData, setCouponData] = useState<{ code: string; discount: number } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (id) {
          // Direct checkout for single item
          setIsCartCheckout(false);
          const res = await productService.getProduct(id) as any;
          if (res.success) {
            setProducts([{
              ...res.data.product,
              quantity: 1
            }]);
            setForm((prev) => ({ ...prev, pickupLocation: res.data.product.pickupLocation }));
          }
        } else {
          // Cart checkout
          if (cartItems.length === 0) {
            toast.error('Your cart is empty');
            navigate('/products');
            return;
          }
          setIsCartCheckout(true);
          setProducts(cartItems);
          // Default pickup location from first item
          setForm((prev) => ({ ...prev, pickupLocation: cartItems[0].pickupLocation || '' }));
        }
      } catch (err: any) {
        toast.error('Failed to load checkout details');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate, cartItems]);

  const handleSubmit = async () => {
    if (products.length === 0 || !user) {
      toast.error('Please log in to continue');
      return;
    }

    if (!form.termsAccepted) {
      toast.error('Please agree to the Terms and Conditions');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the orders
      const res = await orderService.createOrder({
        items: products.map(p => ({ productId: p._id || p.productId, quantity: p.quantity })),
        deliveryMethod: form.deliveryMethod,
        couponCode: couponData ? couponData.code : undefined,
        pickupLocation: form.deliveryMethod === 'pickup' ? form.pickupLocation : undefined,
        deliveryAddress: form.deliveryMethod === 'delivery' ? form.deliveryAddress : undefined,
        note: form.note || undefined,
      });

        if (res.success) {
          const orders = (res.data as any).orders || [res.data.order];
          const orderIds = orders.map((o: any) => o._id);
          
          if (form.paymentMethod === 'cash_on_delivery') {
            toast.success('Order placed! Please meet the seller to complete the transaction.');
            if (isCartCheckout) clearCart();
            navigate(`/orders/${orderIds[0]}`);
            return;
          }

          // 2. Initiate payment
          toast.loading('Initiating secure payment...', { id: 'payment-init' });
        
        const callbackUrl = `${window.location.origin}/payment/verify`;
        const payRes = await paymentService.initiatePayment(
          orderIds,
          form.paymentMethod,
          callbackUrl
        );

        if (payRes.success && payRes.data.authorizationUrl) {
          toast.success('Opening payment page...', { id: 'payment-init' });
          if (isCartCheckout) clearCart();
          // Redirect to Paystack
          window.location.href = payRes.data.authorizationUrl;
        } else {
          toast.error('Failed to connect to payment system', { id: 'payment-init' });
          navigate(`/orders/${orderIds[0]}`);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order', { id: 'payment-init' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading checkout..." fullScreen />;

  if (products.length === 0) return null;

  const subtotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

  return (
    <BulletinLayout title="Checkout" subtitle="Finalize Purchase" section="11">
      <div className="border-b border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-4 md:p-6">
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

      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Left: Form */}
          <div>
            {/* Product Summary */}
            <div className="relative mb-8">
              <div className="absolute -top-3 left-4 bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] text-[9px] font-black px-2 py-0.5 z-10 rotate-[-1deg]">
                {products.length > 1 ? 'YOUR ITEMS' : 'YOUR ITEM'}
              </div>
              <div className="border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-5 shadow-[4px_4px_0_0_var(--bulletin-shadow)] space-y-4">
                {products.map((p, idx) => (
                  <div key={p._id || p.productId} className={`flex gap-4 ${idx !== 0 ? 'pt-4 border-t border-black/5' : ''}`}>
                    <div className="w-16 h-16 border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] flex-shrink-0 overflow-hidden shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
                      <img 
                        src={p.images?.[0]?.url || p.image || 'https://placehold.co/400x400/e2e8f0/64748b?text=Item'} 
                        alt={p.title} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] uppercase tracking-wider opacity-40 mb-0.5">
                        {p.sellerName || 'Product'}
                      </div>
                      <div className="text-xs font-black uppercase leading-tight line-clamp-1">{p.title}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] font-bold opacity-60">QTY: {p.quantity}</span>
                        <span className="text-sm font-black tracking-tighter">
                          GHS {(p.price * p.quantity).toLocaleString('en-GH')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Method */}
            <BulletinCard rotation={0.3} bgColor="bg-[var(--bulletin-card)]" className="mb-6">
              <div className="text-[10px] uppercase tracking-wider opacity-60 mb-4">
                <Truck className="inline-block h-3.5 w-3.5 mr-1" />
                Delivery
              </div>
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setForm((f) => ({ ...f, deliveryMethod: 'pickup' }))}
                  className={`flex-1 border border-[var(--bulletin-border)] p-3 text-[11px] font-bold uppercase transition-colors ${
                    form.deliveryMethod === 'pickup' ? 'bg-[var(--bulletin-text)] text-[var(--bulletin-bg)]' : 'bg-[var(--bulletin-card)] hover:bg-[var(--bulletin-bg)]'
                  }`}
                >
                  <MapPin className="inline-block h-4 w-4 mr-1" />
                  Campus Pickup
                </button>
                <button
                  onClick={() => setForm((f) => ({ ...f, deliveryMethod: 'delivery' }))}
                  className={`flex-1 border border-[var(--bulletin-border)] p-3 text-[11px] font-bold uppercase transition-colors ${
                    form.deliveryMethod === 'delivery' ? 'bg-[var(--bulletin-text)] text-[var(--bulletin-bg)]' : 'bg-[var(--bulletin-card)] hover:bg-[var(--bulletin-bg)]'
                  }`}
                >
                  <Truck className="inline-block h-4 w-4 mr-1" />
                  Delivery
                </button>
              </div>

              {form.deliveryMethod === 'pickup' ? (
                <input
                  type="text"
                  value={form.pickupLocation}
                  onChange={(e) => setForm((f) => ({ ...f, pickupLocation: e.target.value }))}
                  placeholder="Pickup location on campus"
                  className="w-full border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)]"
                />
              ) : (
                <textarea
                  value={form.deliveryAddress}
                  onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
                  placeholder="Enter your delivery address"
                  rows={2}
                  className="w-full border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-2 text-[16px] font-bold focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] resize-none"
                />
              )}
            </BulletinCard>

            {/* Note */}
            <BulletinCard rotation={-0.3} bgColor="bg-[var(--bulletin-card)]" className="mb-6">
              <div className="text-[10px] uppercase tracking-wider opacity-60 mb-3">Note to seller</div>
              <textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Optional — e.g. I'll be there at 2pm..."
                rows={2}
                className="w-full border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-2 text-[16px] font-bold focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] resize-none"
              />
            </BulletinCard>

            {/* Payment Method */}
            <BulletinCard rotation={0.3} bgColor="bg-[var(--bulletin-card)]" className="mb-6">
              <div className="text-[10px] uppercase tracking-wider opacity-60 mb-4">
                <CreditCard className="inline-block h-3.5 w-3.5 mr-1" />
                Payment
              </div>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.value}
                    onClick={() => setForm((f) => ({ ...f, paymentMethod: pm.value }))}
                    className={`w-full flex items-center gap-3 border border-[var(--bulletin-border)] p-3 text-[12px] font-bold transition-colors ${
                      form.paymentMethod === pm.value ? 'bg-[var(--bulletin-text)] text-[var(--bulletin-bg)]' : 'bg-[var(--bulletin-card)] hover:bg-[var(--bulletin-bg)]'
                    }`}
                  >
                    <span>{pm.icon}</span>
                    <span className="flex-1 text-left">{pm.label}</span>
                    {form.paymentMethod === pm.value && <CheckCircle className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </BulletinCard>

            {/* Trust */}
            <div className="space-y-4">
              <BulletinCard rotation={-0.3} bgColor="bg-[#e0f2f7] dark:bg-sky-900/20">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 flex-shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
                  <div>
                    <div className="text-[12px] font-black uppercase mb-1">Buyer Protection Active</div>
                    <div className="text-[11px] font-bold opacity-70 leading-relaxed">
                      Money is held securely until you confirm receipt. Not happy? Open a dispute for a refund.
                    </div>
                  </div>
                </div>
              </BulletinCard>

              {form.paymentMethod !== 'cash_on_delivery' && (
                <div className="flex items-center justify-center gap-4 py-4 border-2 border-dashed border-black/10 bg-white/50 dark:bg-white/5 opacity-60 grayscale hover:grayscale-0 transition-all">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Secured by Paystack</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="relative">
              <div className="absolute -top-3 -right-2 bg-[#ff6b6b] text-white text-[9px] font-black px-2 py-0.5 z-10 rotate-[2deg] shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
                ORDER TOTAL
              </div>
              <div className="border-2 border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/20 p-6 shadow-[8px_8px_0_0_var(--bulletin-shadow)]">
                <div className="text-[10px] uppercase font-black tracking-widest opacity-40 mb-6 border-b border-black/10 dark:border-white/10 pb-2">
                  Total Cost
                </div>

                <div className="space-y-4 text-[12px] font-mono">
                  <div className="flex justify-between items-center">
                    <span className="opacity-60 uppercase">Subtotal</span>
                    <span className="font-black">GHS {subtotal.toLocaleString('en-GH')}</span>
                  </div>
                  
                  {/* Coupon Input */}
                  <div className="py-4 border-y border-black/10 dark:border-white/10">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={form.couponCode}
                        onChange={(e) => setForm((f) => ({ ...f, couponCode: e.target.value }))}
                        placeholder="COUPON CODE"
                        className="flex-1 bg-white dark:bg-black border-2 border-black p-2 text-[10px] font-black uppercase focus:outline-none"
                      />
                      <button
                        onClick={async () => {
                          if (!form.couponCode.trim()) return;
                          setValidatingCoupon(true);
                          try {
                            // Using first product's seller for now as coupons are seller-specific
                            const sellerId = products[0].seller?._id || products[0].seller;
                            const res = await orderService.validateCoupon(form.couponCode, sellerId, subtotal);
                            if (res.success) {
                              setCouponData(res.data);
                              toast.success(`Coupon Applied: GHS ${res.data.discount.toFixed(2)} off`);
                            }
                          } catch (err: any) {
                            toast.error(err.response?.data?.message || 'Invalid coupon');
                            setCouponData(null);
                          } finally {
                            setValidatingCoupon(false);
                          }
                        }}
                        disabled={validatingCoupon || !form.couponCode.trim()}
                        className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase hover:bg-[#ff6b6b] transition-colors disabled:opacity-40"
                      >
                        {validatingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponData && (
                      <div className="mt-2 flex justify-between items-center text-[#ff6b6b]">
                        <span className="text-[9px] font-black uppercase">Promo: {couponData.code}</span>
                        <button onClick={() => { setCouponData(null); setForm(f => ({...f, couponCode: ''})) }}>
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {couponData && (
                    <div className="flex justify-between items-center text-[#ff6b6b]">
                      <span className="opacity-60 uppercase">Discount</span>
                      <span className="font-black">-GHS {couponData.discount.toLocaleString('en-GH')}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[#2e7d32] dark:text-emerald-400">
                    <span className="opacity-60 uppercase text-[10px]">Processing fee</span>
                    <span className="font-black italic">Free</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-60 uppercase">Delivery</span>
                    <span className="font-black">{form.deliveryMethod === 'delivery' ? 'TBD' : 'GHS 0.00'}</span>
                  </div>
                  <div className="border-t-2 border-dashed border-black/20 dark:border-white/20 pt-4 flex justify-between items-baseline">
                    <span className="font-black uppercase text-sm">Total to Pay</span>
                    <span className="font-black text-2xl tracking-tighter">
                      GHS {(subtotal - (couponData?.discount || 0)).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="mt-8 flex items-start gap-3 border-2 border-dashed border-black/20 p-4 bg-white/20">
                  <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={form.termsAccepted}
                      onChange={(e) => setForm((f) => ({ ...f, termsAccepted: e.target.checked }))}
                      className="peer sr-only"
                    />
                    <Pin className={`h-4 w-4 transition-all ${form.termsAccepted ? 'text-red-600 rotate-45' : 'text-gray-300'}`} />
                  </label>
                  <label htmlFor="termsAccepted" className="text-[10px] font-black uppercase tracking-tight text-[var(--bulletin-text)] leading-tight cursor-pointer opacity-80">
                    I verify this purchase & agree to the <Link to="/terms" target="_blank" className="underline decoration-1 underline-offset-2">Campus Rules</Link>
                  </label>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || (form.deliveryMethod === 'delivery' && !form.deliveryAddress.trim())}
                  className={`w-full border-2 border-[var(--bulletin-border)] ${form.paymentMethod === 'cash_on_delivery' ? 'bg-[#fffacd] text-black' : 'bg-[var(--bulletin-text)] text-[var(--bulletin-bg)]'} mt-8 px-4 py-4 text-[13px] font-black uppercase shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_0_var(--bulletin-shadow)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-40`}
                >
                  {submitting ? 'Connecting...' : form.paymentMethod === 'cash_on_delivery' ? 'Confirm Order →' : 'Pay Now →'}
                </button>

                <div className="mt-6 flex items-center justify-center gap-2 opacity-30">
                  <Shield className="h-3 w-3" />
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    {form.paymentMethod === 'cash_on_delivery' ? 'Campus Safety Guaranteed' : 'Secure Payment Powered by Paystack'}
                  </span>
                </div>
              </div>

              {/* Decorative stamp effect */}
              <div className="mt-6 border-2 border-[var(--bulletin-border)]/10 p-3 flex items-center gap-3 grayscale opacity-30 select-none pointer-events-none rotate-[-1deg]">
                <Shield className="h-5 w-5" />
                <div className="text-[9px] leading-tight font-black uppercase">
                  Verified Campus<br/>Transaction
                </div>
              </div>
            </div>
          </div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default Checkout;