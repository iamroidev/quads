import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import { useCart, CartItem } from '../context/CartContext';

const CartScreen = ({ navigation }: any) => {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();

  const handleCheckoutItem = (item: CartItem) => {
    const checkoutProduct = {
      _id: item.productId,
      title: item.title,
      price: item.price,
      images: [{ url: item.image }],
      seller: {
        _id: item.sellerId,
        name: item.sellerName,
      },
      pickupLocation: item.pickupLocation,
    };
    navigation.navigate('Checkout', { product: checkoutProduct });
  };

  const handleClearCart = () => {
    Alert.alert('Empty Cart', 'Are you sure you want to remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: clearCart },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <ScreenHeader eyebrow="Shopping" title="Cart" subtitle="Review items before checkout." />
          {items.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClearCart}>
              <Ionicons name="trash" size={15} color="#ef4444" />
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>Add items from the marketplace to get started!</Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.browseBtnText}>Start Shopping 🚀</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {items.map((item, idx) => {
              const bgColors = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8"];
              const cardAccent = bgColors[idx % bgColors.length];
              return (
                <View key={item._id} style={[styles.itemCard, { borderLeftColor: cardAccent, borderLeftWidth: 6 }]}>
                  <Image
                    source={{ uri: item.image || 'https://via.placeholder.com/150' }}
                    style={styles.itemImage}
                  />
                  <View style={styles.itemDetails}>
                    <View style={styles.sellerBadge}>
                      <Text style={styles.itemSeller}>Seller: {item.sellerName}</Text>
                    </View>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.itemPrice}>GHS {item.price.toFixed(2)}</Text>

                    {/* Quantity Controller & Actions Row */}
                    <View style={styles.controlRow}>
                      <View style={styles.quantityWidget}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => removeItem(item.productId)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ff4a4a" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.checkoutItemBtn}
                      onPress={() => handleCheckoutItem(item)}
                    >
                      <Text style={styles.checkoutItemText}>Checkout Item ⚡</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Cart Summary Banner */}
            <View style={styles.summaryCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Cart Subtotal</Text>
                <Text style={styles.totalValue}>GHS {totalPrice.toFixed(2)}</Text>
              </View>
              <Text style={styles.summaryNote}>
                Escrow deposits are securely processed through Paystack.
              </Text>
              <TouchableOpacity
                style={styles.checkoutAllBtn}
                onPress={() => navigation.navigate('Checkout', { cartItems: items })}
              >
                <Text style={styles.checkoutAllText}>Checkout All Items 🚀</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40, paddingHorizontal: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1f1a14',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#fff',
    ...shadows.bulletin,
    marginTop: 10,
  },
  clearBtnText: {
    marginLeft: 6,
    fontSize: 10,
    fontWeight: '900',
    color: '#ef4444',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 40,
    borderWidth: 2,
    borderColor: '#1f1a14',
    backgroundColor: '#fff',
    ...shadows.bulletin,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#1f1a14', textTransform: 'uppercase' },
  emptySubtitle: { fontSize: 12, color: '#7b6f61', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  browseBtn: {
    marginTop: 20,
    backgroundColor: '#2f5d4f',
    borderWidth: 2,
    borderColor: '#1f1a14',
    paddingHorizontal: 20,
    paddingVertical: 12,
    ...shadows.bulletin,
  },
  browseBtnText: { color: '#fff', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  listContainer: { marginTop: 16 },
  itemCard: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#1f1a14',
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 12,
    ...shadows.bulletin,
  },
  itemImage: {
    width: 90,
    height: 120,
    borderWidth: 2,
    borderColor: '#1f1a14',
    backgroundColor: '#efe5d6',
  } as any,
  itemDetails: { flex: 1, marginLeft: 12 },
  sellerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
    borderColor: '#1f1a14',
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  itemSeller: { fontSize: 9, fontWeight: '900', color: '#2f5d4f', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemTitle: { fontSize: 13, fontWeight: '900', color: '#1f1a14', textTransform: 'uppercase', letterSpacing: 0.2 },
  itemPrice: { fontSize: 14, fontWeight: '900', color: '#2f5d4f', marginTop: 4 },
  controlRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 12 },
  quantityWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1f1a14',
    backgroundColor: '#fff',
  },
  qtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  qtyBtnText: { fontSize: 14, fontWeight: '900', color: '#1f1a14' },
  qtyText: { paddingHorizontal: 12, fontSize: 12, fontWeight: '900', color: '#1f1a14' },
  deleteBtn: {
    borderWidth: 2,
    borderColor: '#1f1a14',
    backgroundColor: '#fff',
    padding: 7,
  },
  checkoutItemBtn: {
    marginTop: 12,
    backgroundColor: '#1f1a14',
    borderWidth: 2,
    borderColor: '#1f1a14',
    paddingVertical: 9,
    alignItems: 'center',
    ...shadows.bulletin,
  },
  checkoutItemText: { color: '#fff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  summaryCard: {
    borderWidth: 2.5,
    borderColor: '#1f1a14',
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    ...shadows.bulletin,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: '900', color: '#1f1a14', textTransform: 'uppercase' },
  totalValue: { fontSize: 20, fontWeight: '900', color: '#2f5d4f' },
  summaryNote: { fontSize: 11, color: '#7b6f61', marginTop: 10, lineHeight: 16, fontWeight: '500' },
  checkoutAllBtn: {
    marginTop: 16,
    backgroundColor: '#fbbf24',
    borderWidth: 2.5,
    borderColor: '#1f1a14',
    paddingVertical: 14,
    alignItems: 'center',
    ...shadows.bulletin,
  },
  checkoutAllText: { color: '#1f1a14', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
});

export default CartScreen;
