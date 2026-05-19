import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import { useCart, CartItem } from '../context/CartContext';
import { BulletinCard } from '../components/BulletinCard';
import { useResponsive } from '../hooks/useResponsive';
import { getTypography } from '../theme/typography';
import { navigationRef } from '../navigation/navigationRef';

const CartScreen = ({ navigation }: any) => {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { colors } = useTheme();
  const { width, isMobile } = useResponsive();
  const typography = getTypography(width);
  const hPadding = isMobile ? 12 : 16;
  const styles = getStyles(colors, width);

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
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: hPadding }]}>
        <View style={styles.headerRow}>
          <ScreenHeader eyebrow="Shopping" title="Cart" subtitle="Review items before checkout." />
          {items.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClearCart}>
              <Ionicons name="trash" size={15} color={colors.danger} />
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {items.length === 0 ? (
          <BulletinCard style={styles.emptyContainer} size="md">
            
            <Text style={[styles.emptyTitle, { fontSize: isMobile ? 14 : 16 }]}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>Add items from the marketplace to get started!</Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => {
                if (navigationRef.isReady()) {
                  navigationRef.navigate('HomeTab');
                }
              }}
            >
              <Text style={styles.browseBtnText}>Start Shopping</Text>
            </TouchableOpacity>
          </BulletinCard>
        ) : (
          <View style={styles.listContainer}>
            {items.map((item, idx) => {
              const bgColors = [colors.pinYellow, colors.successTint, colors.surfaceSecondary, colors.metric1Bg];
              const cardAccent = bgColors[idx % bgColors.length];
              return (
                <BulletinCard key={item._id} style={[styles.itemCard, { borderLeftColor: cardAccent }]} size="md">
                  <Image
                    source={{ uri: item.image || 'https://via.placeholder.com/150' }}
                    style={styles.itemImage}
                  />
                  <View style={styles.itemDetails}>
                    <View style={styles.sellerBadge}>
                      <Text style={styles.itemSeller} numberOfLines={1} ellipsizeMode="tail">Seller: {item.sellerName}</Text>
                    </View>
                    <Text style={styles.itemTitle} numberOfLines={2} ellipsizeMode="tail">
                      {item.title}
                    </Text>
                    <Text style={[styles.itemPrice, { fontSize: isMobile ? 12 : typography.h3 }]}>GHS {item.price.toFixed(2)}</Text>

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
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.checkoutItemBtn}
                      onPress={() => handleCheckoutItem(item)}
                    >
                      <Text style={styles.checkoutItemText}>Checkout Item</Text>
                    </TouchableOpacity>
                  </View>
                </BulletinCard>
              );
            })}

            {/* Cart Summary Banner */}
            <BulletinCard style={styles.summaryCard} size="lg">
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { fontSize: isMobile ? 12 : typography.h3 }]}>Cart Subtotal</Text>
                <Text style={[styles.totalValue, { fontSize: isMobile ? 18 : 20 }]}>GHS {totalPrice.toFixed(2)}</Text>
              </View>
              <Text style={styles.summaryNote}>
                Escrow deposits are securely processed through Paystack.
              </Text>
              <TouchableOpacity
                style={styles.checkoutAllBtn}
                onPress={() => navigation.navigate('Checkout', { cartItems: items })}
              >
                <Text style={styles.checkoutAllText}>Checkout All Items</Text>
              </TouchableOpacity>
            </BulletinCard>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: any, width: number) => {
  const isMobile = width < 640;
  const typography = getTypography(width);
  const hPadding = isMobile ? 12 : 16;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: 40 },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginTop: 8,
    },
    clearBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: colors.surfaceSecondary,
      marginTop: 10,
    },
    clearBtnText: {
      marginLeft: 6,
      fontSize: isMobile ? 9 : typography.tag,
      fontWeight: '900',
      color: colors.danger,
      textTransform: 'uppercase',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 30,
      marginTop: 40,
    },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontWeight: '900', color: colors.text, textTransform: 'uppercase' },
    emptySubtitle: { fontSize: isMobile ? 11 : typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 18 },
    browseBtn: {
      marginTop: 20,
      backgroundColor: colors.primary,
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    browseBtnText: { color: colors.primaryContent, fontSize: isMobile ? 10 : typography.tag, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    listContainer: { marginTop: 16 },
    itemCard: {
      flexDirection: 'row',
      padding: isMobile ? 10 : 12,
      marginBottom: 16,
      borderLeftWidth: 6,
    },
    itemImage: {
      width: isMobile ? 70 : 90,
      height: isMobile ? 100 : 120,
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      backgroundColor: colors.surfaceSecondary,
    } as any,
    itemDetails: { flex: 1, marginLeft: isMobile ? 10 : 12, minWidth: 0 },
    sellerBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.boardBorder,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginBottom: 4,
    },
    itemSeller: { fontSize: isMobile ? 8 : typography.tag, fontWeight: '900', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
    itemTitle: { fontSize: isMobile ? 11 : typography.body, fontWeight: '900', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.2 },
    itemPrice: { fontWeight: '900', color: colors.text, marginTop: 4 },
    controlRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 12 },
    quantityWidget: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      backgroundColor: colors.surfaceSecondary,
    },
    qtyBtn: {
      paddingHorizontal: isMobile ? 16 : 18,
      paddingVertical: isMobile ? 10 : 12,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 40,
    },
    qtyBtnText: { fontSize: isMobile ? 16 : typography.h3, fontWeight: '900', color: colors.text, lineHeight: isMobile ? 20 : 24 },
    qtyText: { paddingHorizontal: isMobile ? 14 : 16, fontSize: isMobile ? 13 : typography.body, fontWeight: '900', color: colors.text },
    deleteBtn: {
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      backgroundColor: colors.surfaceSecondary,
      padding: isMobile ? 10 : 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkoutItemBtn: {
      marginTop: 12,
      backgroundColor: colors.primary,
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      paddingVertical: 9,
      alignItems: 'center',
    },
    checkoutItemText: { color: colors.primaryContent, fontSize: isMobile ? 9 : typography.tag, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    summaryCard: {
      padding: isMobile ? 12 : 16,
      marginTop: 8,
    },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontWeight: '900', color: colors.text, textTransform: 'uppercase' },
    totalValue: { fontWeight: '900', color: colors.primary },
    summaryNote: { fontSize: isMobile ? 10 : typography.label, color: colors.textSecondary, marginTop: 10, lineHeight: 16, fontWeight: '500' },
    checkoutAllBtn: {
      marginTop: 16,
      backgroundColor: colors.pinYellow,
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      paddingVertical: isMobile ? 12 : 14,
      alignItems: 'center',
    },
    checkoutAllText: { color: '#111111', fontSize: isMobile ? 11 : typography.body, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  });
};

export default CartScreen;