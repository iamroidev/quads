import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CartItem, ProductPopulated } from '../types';
import toast from 'react-hot-toast';

interface CartContextType {
  items: CartItem[];
  addItem: (product: ProductPopulated, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('quads_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Save cart to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('quads_cart', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: ProductPopulated, quantity: number = 1) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.productId === product._id);
      
      if (existingItem) {
        toast.success(`Updated ${product.title} quantity in cart`);
        return currentItems.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      toast.success(`Added ${product.title} to cart`);
      return [
        ...currentItems,
        {
          _id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productId: product._id,
          title: product.title,
          price: product.price,
          image: product.images[0]?.url || '',
          quantity,
          sellerId: product.seller._id,
          sellerName: product.seller.storeName || product.seller.name,
        },
      ];
    });
    setIsCartOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
    toast.success('Item removed from cart');
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(() => 
    items.reduce((total, item) => total + item.quantity, 0), 
  [items]);

  const totalPrice = useMemo(() => 
    items.reduce((total, item) => total + (item.price * item.quantity), 0), 
  [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
