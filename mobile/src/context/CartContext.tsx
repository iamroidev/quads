import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { Product } from '../types';

export interface CartItem {
  _id: string;
  productId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  sellerId: string;
  sellerName: string;
  pickupLocation?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem('quads_cart')
      .then((saved) => {
        if (saved) {
          setItems(JSON.parse(saved));
        }
      })
      .catch((err) => {
        console.error('Failed to load cart from storage', err);
      });
  }, []);

  // Save cart to AsyncStorage whenever items change
  const saveCart = async (newItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem('quads_cart', JSON.stringify(newItems));
    } catch (err) {
      console.error('Failed to save cart to storage', err);
    }
  };

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.productId === product._id);
      let updatedItems: CartItem[];

      if (existingItem) {
        Alert.alert('Cart Updated', `Updated quantity of ${product.title} in your cart.`);
        updatedItems = currentItems.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        const sellerName = product.seller?.storeName || product.seller?.brandName || product.seller?.name || 'Seller';
        const image = product.images?.[0]?.url || '';
        
        Alert.alert('Added to Cart', `${product.title} added to your cart.`);
        updatedItems = [
          ...currentItems,
          {
            _id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            productId: product._id,
            title: product.title,
            price: product.price,
            image,
            quantity,
            sellerId: product.seller?._id || '',
            sellerName,
            pickupLocation: product.pickupLocation,
          },
        ];
      }

      saveCart(updatedItems);
      return updatedItems;
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((currentItems) => {
      const updatedItems = currentItems.filter((item) => item.productId !== productId);
      saveCart(updatedItems);
      Alert.alert('Item Removed', 'The item was removed from your cart.');
      return updatedItems;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((currentItems) => {
      const updatedItems = currentItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
      saveCart(updatedItems);
      return updatedItems;
    });
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    AsyncStorage.removeItem('quads_cart').catch(() => {});
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
