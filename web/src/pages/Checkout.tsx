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
} from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../services/product.service';
import orderService from '../services/order.service';
import { useAuth } from '../context/AuthContext';
import { ProductPopulated, PaymentMethod, PAYMENT_METHODS } from '../types';
import { LoadingSpinner } from '../components/ui';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

interface CheckoutFormState {
  deliveryMethod: 'pickup' | 'delivery';
  pickupLocation: string;
  deliveryAddress: string;
  note: string;
  paymentMethod: PaymentMethod;
}

const Checkout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState<ProductPopulated | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CheckoutFormState>({
    deliveryMethod: 'pickup',
    pickupLocation: '',
    deliveryAddress: '',
    note: '',
    paymentMethod: 'momo_mtn',
  });

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        // Timeout after 15 seconds
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out. Please check your connection.')), 15000)
        );
        const res = await Promise.race([
          productService.getProduct(id),
          timeoutPromise,
        ]) as any;
        if (res.success) {
          setProduct(res.data.product);
          setForm((prev) => ({ ...prev, pickupLocation: res.data.product.pickupLocation }));
        }
      } catch (err: any) {
        const msg = err?.message || 'Failed to load product';
        if (msg.includes('timed out') || msg.includes('network')) {
          toast.error(msg);
        } else {
          toast.error('Failed to load product');
          navigate('/products');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);
  const handleSubmit = async () => {
    if (!product || !user) {
      toast.error('Please log in to continue');
      return;
    }

    setSubmitting(true);
    try {
      const res = await orderService.createOrder({
        productId: product._id,
        deliveryMethod: form.deliveryMethod,
        pickupLocation: form.deliveryMethod === 'pickup' ? form.pickupLocation : undefined,
        deliveryAddress: form.deliveryMethod === 'delivery' ? form.deliveryAddress : undefined,
        note: form.note || undefined,
      });

      if (res.success) {
        navigate(`/orders/${res.data.order._id}`);
        toast.success('Order placed!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading checkout..." fullScreen />;

  if (!product) return null;

  const mainImage = product.images[0]?.url || 'https://placehold.co/400x400/e2e8f0/64748b?text=Item';

  return (
    <BulletinLayout title="Checkout" subtitle="Purchase" section="11">
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Left: Form */}
          <div>
            {/* Product Summary */}
            <BulletinCard rotation={-0.3} bgColor="bg-white" className="mb-6">
              <div className="text-[10px] uppercase tracking-wider opacity-60 mb-3">Item</div>
              <div className="flex gap-3">
                <div className="w-16 h-16 border border-black bg-[#f8f7f4] flex-shrink-0 overflow-hidden">
                  <img src={mainImage} alt={product.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold line-clamp-1">{product.title}</div>
                  <div className="text-[10px] opacity-60 mt-0.5 capitalize">{product.condition}</div>
                  <div className="text-base font-bold mt-1">
                    GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </BulletinCard>

            {/* Delivery Method */}
            <BulletinCard rotation={0.3} bgColor="bg-white" className="mb-6">
              <div className="text-[10px] uppercase tracking-wider opacity-60 mb-4">
                <Truck className="inline-block h-3.5 w-3.5 mr-1" />
                Delivery
              </div>
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setForm((f) => ({ ...f, deliveryMethod: 'pickup' }))}
                  className={`flex-1 border border-black p-3 text-[11px] font-bold uppercase transition-colors ${
                    form.deliveryMethod === 'pickup' ? 'bg-black text-white' : 'bg-white hover:bg-[#f8f7f4]'
                  }`}
                >
                  <MapPin className="inline-block h-4 w-4 mr-1" />
                  Campus Pickup
                </button>
                <button
                  onClick={() => setForm((f) => ({ ...f, deliveryMethod: 'delivery' }))}
                  className={`flex-1 border border-black p-3 text-[11px] font-bold uppercase transition-colors ${
                    form.deliveryMethod === 'delivery' ? 'bg-black text-white' : 'bg-white hover:bg-[#f8f7f4]'
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
                  className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black"
                />
              ) : (
                <textarea
                  value={form.deliveryAddress}
                  onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
                  placeholder="Enter your delivery address"
                  rows={2}
                  className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />
              )}
            </BulletinCard>

            {/* Note */}
            <BulletinCard rotation={-0.3} bgColor="bg-white" className="mb-6">
              <div className="text-[10px] uppercase tracking-wider opacity-60 mb-3">Note to seller</div>
              <textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Optional — e.g. I'll be there at 2pm..."
                rows={2}
                className="w-full border border-black bg-[#fefdfb] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </BulletinCard>

            {/* Payment Method */}
            <BulletinCard rotation={0.3} bgColor="bg-white" className="mb-6">
              <div className="text-[10px] uppercase tracking-wider opacity-60 mb-4">
                <CreditCard className="inline-block h-3.5 w-3.5 mr-1" />
                Payment
              </div>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.value}
                    onClick={() => setForm((f) => ({ ...f, paymentMethod: pm.value }))}
                    className={`w-full flex items-center gap-3 border border-black p-3 text-[12px] font-bold transition-colors ${
                      form.paymentMethod === pm.value ? 'bg-black text-white' : 'bg-white hover:bg-[#f8f7f4]'
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
            <BulletinCard rotation={-0.3} bgColor="bg-[#e0f2f7]">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[12px] font-bold mb-1">Protected by buyer guarantee</div>
                  <div className="text-[11px] opacity-70">
                    Payment is held securely until you confirm receipt. Learn more about buyer protection.
                  </div>
                </div>
              </div>
            </BulletinCard>
          </div>

          {/* Right: Order Summary */}
          <div>
            <BulletinCard rotation={-0.5} bgColor="bg-[#fefdfb]" className="sticky top-24">
              <div className="text-[10px] uppercase tracking-wider opacity-60 mb-4">Order Summary</div>

              <div className="space-y-3 text-[12px]">
                <div className="flex justify-between">
                  <span className="opacity-60">Item price</span>
                  <span className="font-bold">GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Delivery fee</span>
                  <span className="font-bold">{form.deliveryMethod === 'delivery' ? 'Calculated later' : 'Free'}</span>
                </div>
                <div className="border-t border-black pt-3 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || (form.deliveryMethod === 'delivery' && !form.deliveryAddress.trim())}
                className="w-full border border-black bg-black mt-6 px-4 py-3 text-[11px] font-bold uppercase text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-colors disabled:opacity-40"
              >
                {submitting ? 'Processing...' : 'Place Order'}
              </button>

              <div className="mt-4 text-[10px] opacity-40 text-center">
                You won't be charged yet
              </div>
            </BulletinCard>
          </div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default Checkout;