import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  ArrowRight, 
  ShoppingBag,
  CreditCard,
  ShieldCheck,
  Package
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';

const CartPage: React.FC = () => {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <BulletinLayout title="Your Pins" subtitle="Empty Board" section="CART">
        <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
          <div className="flex flex-col items-center justify-center py-20 border-4 border-dashed border-[var(--bulletin-border)]/20 bg-white/50 dark:bg-black/20">
            <div className="h-20 w-20 bg-[var(--bulletin-card)] border-2 border-[var(--bulletin-border)] flex items-center justify-center shadow-[8px_8px_0_0_var(--bulletin-shadow)] rotate-[-3deg] mb-8">
              <ShoppingCart className="h-10 w-10 opacity-20" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--bulletin-text)]">Your board is empty</h2>
            <p className="mt-2 text-[12px] font-bold opacity-40 uppercase tracking-widest text-[var(--bulletin-text)]">Pin some items to start your transaction</p>
            <Link
              to="/products"
              className="mt-10 border-4 border-black bg-black text-white px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-[#ff6b6b] transition-all shadow-[6px_6px_0_0_rgba(0,0,0,0.2)]"
            >
              Browse Products
            </Link>
          </div>
        </BulletinSection>
      </BulletinLayout>
    );
  }

  return (
    <BulletinLayout title="Your Pins" subtitle="Shopping Cart" section="CART">
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Cart Items - The Pins */}
          <div className="lg:col-span-2 grid gap-8 sm:grid-cols-2">
            {items.map((item, idx) => (
              <div 
                key={item.productId}
                className="relative group animate-card-drop"
                style={{ 
                  transform: `rotate(${(idx % 3 - 1) * 1.5}deg)`,
                  '--reveal-delay': `${idx * 100}ms`
                } as any}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-4 w-12 bg-[#ffd700]/40 z-20 border border-black/10" 
                     style={{ transform: 'rotate(-2deg)' }} />
                
                <BulletinCard rotation={0} className="!p-4 border-4 border-black bg-white dark:bg-[#111] h-full flex flex-col">
                  {/* Product Image */}
                  <div className="aspect-square w-full border-2 border-black overflow-hidden mb-4 bg-gray-100">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>

                  <div className="flex-1 flex flex-col">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 text-black dark:text-white/40 mb-1">
                      {item.sellerName}
                    </div>
                    <h3 className="text-sm font-black uppercase leading-tight mb-2 line-clamp-2 text-black dark:text-white">
                      {item.title}
                    </h3>
                    
                    <div className="mt-auto pt-4 border-t-2 border-black/5 flex items-center justify-between">
                      <span className="text-lg font-black text-black dark:text-white">GHS {item.price.toLocaleString()}</span>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center border-2 border-black bg-black/5">
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 hover:bg-black hover:text-white transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-[11px] font-black">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 hover:bg-black hover:text-white transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button 
                    onClick={() => removeItem(item.productId)}
                    className="absolute -top-2 -right-2 h-8 w-8 bg-red-500 border-2 border-black rounded-full flex items-center justify-center text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:scale-110 active:scale-95 transition-all z-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </BulletinCard>
              </div>
            ))}
          </div>

          {/* Checkout Summary - Sticky Note Style */}
          <div className="lg:sticky lg:top-24">
            <div className="relative animate-fade-up-in">
              <div className="absolute -top-2 right-10 h-6 w-6 rounded-full bg-red-600 border-2 border-black z-30 shadow-[2px_2px_0_0_rgba(0,0,0,1)]" />
              
              <BulletinCard rotation={1} className="!p-8 border-4 border-black bg-[#fffacd] dark:bg-yellow-900/20 text-black dark:text-yellow-100 shadow-[12px_12px_0_0_rgba(0,0,0,1)]">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-8">Summary Ledger</div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span>PINNED ITEMS</span>
                    <span>{totalItems}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span>SUBTOTAL</span>
                    <span>GHS {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span>COMMISSION</span>
                    <span className="text-green-600 dark:text-green-400">FREE</span>
                  </div>
                  <div className="pt-4 border-t-4 border-black">
                    <div className="flex justify-between items-center text-xl font-black">
                      <span>TOTAL</span>
                      <span>GHS {totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-tight opacity-60">
                    <ShieldCheck className="h-4 w-4" /> Secure Escrow
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-tight opacity-60">
                    <Package className="h-4 w-4" /> Campus Safe Pickup
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/checkout')}
                  className="w-full border-4 border-black bg-black text-white py-5 text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#ff6b6b] transition-all shadow-[6px_6px_0_0_rgba(0,0,0,0.2)]"
                >
                  Confirm & Checkout <ArrowRight className="h-5 w-5" />
                </button>
                
                <Link 
                  to="/products" 
                  className="block text-center mt-6 text-[9px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4 opacity-40 hover:opacity-100 transition-opacity"
                >
                  ← Pin More Items
                </Link>
              </BulletinCard>
            </div>
          </div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default CartPage;
