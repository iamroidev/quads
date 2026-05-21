import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import orderService from '../services/order.service';
import { useTheme } from '../theme/ThemeContext';
import { BulletinCard } from '../components/BulletinCard';
import { useResponsive } from '../hooks/useResponsive';
import { getTypography } from '../theme/typography';
import ScreenHeader from '../components/ScreenHeader';
import referenceService, { PickupSpot } from '../services/reference.service';

const CheckoutScreen = ({ route, navigation }: any) => {
  const { product, cartItems } = route.params || {};
  const { clearCart } = useCart();
  const { colors } = useTheme();
  const { width, isMobile } = useResponsive();
  const typography = getTypography(width);

  const checkoutItems = cartItems || (product ? [{
    productId: product._id,
    title: product.title,
    price: product.price,
    quantity: 1,
    seller: product.seller,
    pickupLocation: product.pickupLocation
  }] : []);

  const firstItem = checkoutItems[0] || {};
  const subtotal = checkoutItems.reduce((acc: number, item: any) => acc + item.price * (item.quantity || 1), 0);

  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [pickupLocation, setPickupLocation] = useState(firstItem.pickupLocation || '');
  const [customPickupLocation, setCustomPickupLocation] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [note, setNote] = useState('');
  const [spotPickerVisible, setSpotPickerVisible] = useState(false);
  const [spotSearch, setSpotSearch] = useState('');
  const [pickupSpots, setPickupSpots] = useState<PickupSpot[]>([]);

  useEffect(() => {
    referenceService.getPickupSpots().then(setPickupSpots).catch(() => {});
  }, []);

  const filteredSpots = (() => {
    const query = spotSearch.trim().toLowerCase();
    if (!query) return pickupSpots;
    return pickupSpots
      .filter(s => s.name.toLowerCase().includes(query) || s.area.toLowerCase().includes(query))
      .sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aArea = a.area.toLowerCase();
        const bArea = b.area.toLowerCase();

        // 1. Exact match on name
        if (aName === query && bName !== query) return -1;
        if (bName === query && aName !== query) return 1;

        // 2. Starts with query on name
        const aStarts = aName.startsWith(query);
        const bStarts = bName.startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (bStarts && !aStarts) return 1;

        // 3. Name contains query vs area contains query
        const aNameInc = aName.includes(query);
        const bNameInc = bName.includes(query);
        if (aNameInc && !bNameInc) return -1;
        if (bNameInc && !aNameInc) return 1;

        // 4. Starts with query on area
        const aAreaStarts = aArea.startsWith(query);
        const bAreaStarts = bArea.startsWith(query);
        if (aAreaStarts && !bAreaStarts) return -1;
        if (bAreaStarts && !aAreaStarts) return 1;

        // Fallback to alphabetical sorting of name
        return a.name.localeCompare(b.name);
      });
  })();

  const isManualEntry = pickupLocation === 'Other (specify below)';
  const effectivePickupLocation = isManualEntry ? customPickupLocation : pickupLocation;
  const [loading, setLoading] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = Math.max(0, subtotal - discount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const firstSeller = firstItem.seller?._id || firstItem.seller || '';
      const res = await api.get('/orders/validate-coupon', {
        params: {
          code: couponCode.trim().toUpperCase(),
          sellerId: firstSeller,
          subtotal: subtotal,
        },
      });
      if (res.data.success) {
        setAppliedCoupon({ code: couponCode.trim().toUpperCase(), discount: res.data.data.discount });
        Alert.alert('Coupon Applied', `You saved GHS ${res.data.data.discount.toFixed(2)}!`);
      } else {
        Alert.alert('Invalid Code', res.data.message || 'This coupon is invalid or expired.');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Could not validate coupon. Please try again.';
      Alert.alert('Error', errMsg);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!deliveryMethod) return Alert.alert('Required', 'Please select a delivery method.');
    if (deliveryMethod === 'pickup' && !effectivePickupLocation.trim()) {
      return Alert.alert('Required', 'Please select or enter a pickup location.');
    }
    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      return Alert.alert('Required', 'Please enter a delivery address.');
    }

    setLoading(true);
    try {
      const orderPromises = checkoutItems.map((item: any) =>
        orderService.createOrder({
          productId: item.productId,
          quantity: item.quantity || 1,
          deliveryMethod,
          pickupLocation: deliveryMethod === 'pickup' ? effectivePickupLocation : undefined,
          deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : undefined,
          note: note || undefined,
          couponCode: appliedCoupon?.code,
        })
      );
      const results = await Promise.all(orderPromises);
      const allSuccess = results.every((r: any) => r.success);
      if (allSuccess) {
        Alert.alert('Order Placed!', `Your order${checkoutItems.length > 1 ? 's have' : ' has'} been placed successfully.`, [
          { text: 'OK', onPress: () => { clearCart(); navigation.navigate('Orders'); } },
        ]);
      } else {
        Alert.alert('Partial Error', 'Some items could not be ordered. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles(colors, width);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={[styles.content, { padding: isMobile ? 12 : 16 }]}>
          <ScreenHeader
            eyebrow="Checkout"
            title={cartItems ? `Cart (${checkoutItems.length})` : 'Confirm Order'}
            subtitle="Review and confirm your order details."
          />

          {/* Order Summary */}
          <BulletinCard style={styles.section} size="md">
            <Text style={styles.sectionLabel}>Order Summary</Text>
            {checkoutItems.map((item: any, idx: number) => (
              <View key={idx} style={styles.summaryRow}>
                <Text style={styles.summaryKey} numberOfLines={1} ellipsizeMode="tail">
                  {item.title} × {item.quantity || 1}
                </Text>
                <Text style={styles.summaryValue}>
                  GHS {(item.price * (item.quantity || 1)).toFixed(2)}
                </Text>
              </View>
            ))}
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryKey, { color: colors.success }]}>Discount</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>-GHS {discount.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.totalRow]}>
              <Text style={[styles.totalLabel, { fontSize: isMobile ? 10 : typography.tag }]}>Total</Text>
              <Text style={[styles.totalAmount, { fontSize: isMobile ? 16 : typography.h3 }]}>GHS {total.toFixed(2)}</Text>
            </View>
          </BulletinCard>

          {/* Delivery Method */}
          <BulletinCard style={styles.section} size="md">
            <Text style={styles.sectionLabel}>Delivery Method</Text>
            <View style={styles.methodRow}>
              <TouchableOpacity
                style={[styles.methodBtn, deliveryMethod === 'pickup' && styles.methodBtnActive]}
                onPress={() => setDeliveryMethod('pickup')}
              >
                <Text style={[styles.methodBtnText, deliveryMethod === 'pickup' && styles.methodBtnTextActive]}>Pickup</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodBtn, deliveryMethod === 'delivery' && styles.methodBtnActive]}
                onPress={() => setDeliveryMethod('delivery')}
              >
                <Text style={[styles.methodBtnText, deliveryMethod === 'delivery' && styles.methodBtnTextActive]}>Delivery</Text>
              </TouchableOpacity>
            </View>
            {deliveryMethod === 'pickup' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Pickup location</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setSpotPickerVisible(true)}>
                  <Text style={[styles.pickerBtnText, !pickupLocation && { opacity: 0.35 }]} numberOfLines={1}>
                    {pickupLocation || 'Select a pickup spot…'}
                  </Text>
                  <Text style={styles.pickerChevron}>▼</Text>
                </TouchableOpacity>
                {isManualEntry && (
                  <TextInput
                    style={[styles.input, { marginTop: 8 }]}
                    placeholder="Describe your pickup location"
                    placeholderTextColor={colors.textDisabled}
                    value={customPickupLocation}
                    onChangeText={setCustomPickupLocation}
                  />
                )}

                <Modal visible={spotPickerVisible} animationType="slide" transparent onRequestClose={() => setSpotPickerVisible(false)}>
                  <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}
                  >
                    <View style={{ backgroundColor: colors.surface, borderTopWidth: 3, borderColor: colors.boardBorder, maxHeight: '80%' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 2, borderColor: colors.boardBorder }}>
                        <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, color: colors.text }}>Pickup Spot</Text>
                        <TouchableOpacity onPress={() => setSpotPickerVisible(false)}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary, textTransform: 'uppercase' }}>Close</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ padding: 12, borderBottomWidth: 2, borderColor: colors.boardBorder }}>
                        <TextInput
                          style={{ borderWidth: 2, borderColor: colors.boardBorder, backgroundColor: colors.surfaceSecondary, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text }}
                          placeholder="Search spots..."
                          placeholderTextColor={colors.textDisabled}
                          value={spotSearch}
                          onChangeText={setSpotSearch}
                          autoFocus
                        />
                      </View>
                      <FlatList
                        data={filteredSpots}
                        keyExtractor={item => item.name}
                        ListHeaderComponent={spotSearch.trim().length > 0 ? (
                          <TouchableOpacity
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: 14,
                              borderBottomWidth: 2,
                              borderColor: colors.boardBorder,
                              backgroundColor: colors.surfaceSecondary,
                            }}
                            onPress={() => {
                              setPickupLocation('Other (specify below)');
                              setCustomPickupLocation(spotSearch.trim());
                              setSpotSearch('');
                              setSpotPickerVisible(false);
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: '900', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Use custom spot:
                            </Text>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 2 }}>
                              "{spotSearch.trim()}"
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.boardBorder, backgroundColor: pickupLocation === item.name ? colors.primary : colors.surface }}
                            onPress={() => { setPickupLocation(item.name); setSpotSearch(''); setSpotPickerVisible(false); }}
                          >
                            <Text style={{ fontSize: 14, fontWeight: '700', color: pickupLocation === item.name ? colors.primaryContent : colors.text }}>{item.name}</Text>
                            {item.area !== 'Custom' && <Text style={{ fontSize: 11, color: pickupLocation === item.name ? colors.primaryContent : colors.textSecondary, opacity: 0.7 }}>{item.area}</Text>}
                          </TouchableOpacity>
                        )}
                        keyboardShouldPersistTaps="handled"
                      />
                    </View>
                  </KeyboardAvoidingView>
                </Modal>
              </View>
            )}
            {deliveryMethod === 'delivery' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Delivery address</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Your full delivery address on campus"
                  placeholderTextColor={colors.textDisabled}
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}
          </BulletinCard>

          {/* Promo Coupon */}
          <BulletinCard style={styles.section} size="md">
            <Text style={styles.sectionLabel}>Promo Coupon</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1, textTransform: 'uppercase', minWidth: 0 }]}
                placeholder="ENTER PROMO CODE"
                placeholderTextColor={colors.textDisabled}
                autoCapitalize="characters"
                value={couponCode}
                onChangeText={setCouponCode}
                editable={!appliedCoupon}
              />
              <TouchableOpacity
                style={[styles.applyBtn, (!couponCode.trim() || validatingCoupon) && { opacity: 0.5 }]}
                onPress={appliedCoupon ? () => { setAppliedCoupon(null); setCouponCode(''); } : handleApplyCoupon}
                disabled={validatingCoupon || !couponCode.trim()}
              >
                <Text style={styles.applyBtnText}>
                  {validatingCoupon ? '...' : appliedCoupon ? 'Remove' : 'Apply'}
                </Text>
              </TouchableOpacity>
            </View>
            {appliedCoupon && (
              <Text style={styles.couponStatus}>
                Applied promo code: {appliedCoupon.code} (-GHS {appliedCoupon.discount.toFixed(2)})
              </Text>
            )}
          </BulletinCard>

          {/* Note */}
          <BulletinCard style={styles.section} size="md">
            <Text style={styles.sectionLabel}>Note to seller (optional)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Any special instructions..."
              placeholderTextColor={colors.textDisabled}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </BulletinCard>

          <TouchableOpacity
            style={[styles.ctaBtn, loading && { opacity: 0.5 }]}
            onPress={handlePlaceOrder}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.primaryContent} />
              : <Text style={[styles.ctaBtnText, { fontSize: isMobile ? 12 : typography.h3 }]}>Place Order</Text>
            }
          </TouchableOpacity>

          {/* What happens next */}
          <BulletinCard style={{ marginTop: 4, padding: isMobile ? 14 : 16 }} size="sm">
            <Text style={[styles.sectionLabel, { marginBottom: 10 }]}>What happens next</Text>
            {[
              { step: '01', text: 'Seller confirms your order within 24 hours.' },
              { step: '02', text: 'Payment is held in escrow — released only when you confirm receipt.' },
              { step: '03', text: 'Meet at your chosen pickup spot or await delivery.' },
              { step: '04', text: 'Confirm receipt to release funds to the seller.' },
            ].map(({ step, text }, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                <View style={{ width: 28, height: 28, borderWidth: 2, borderColor: colors.boardBorder, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: colors.muted }}>{step}</Text>
                </View>
                <Text style={{ fontSize: isMobile ? 11 : 12, color: colors.muted, flex: 1, lineHeight: 17, paddingTop: 5 }}>{text}</Text>
              </View>
            ))}
          </BulletinCard>

          <Text style={styles.disclaimer}>
            Funds held securely in escrow via Paystack until you confirm receipt.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (colors: any, width: number) => {
  const isMobile = width < 640;
  const typography = getTypography(width);
  const hPadding = isMobile ? 12 : 16;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: 40, gap: 12 },

    section: { padding: isMobile ? 12 : 14 },
    sectionLabel: { fontSize: isMobile ? 9 : typography.tag, fontWeight: '900', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 12 },
    summaryKey: { fontSize: isMobile ? 11 : typography.body, color: colors.text, flex: 1 },
    summaryValue: { fontSize: isMobile ? 11 : typography.body, fontWeight: '700', color: colors.primary },
    totalRow: { borderTopWidth: colors.boardBorderWidth, borderTopColor: colors.boardBorder, paddingTop: 10, marginTop: 4, marginBottom: 0 },
    totalLabel: { fontWeight: '900', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
    totalAmount: { fontWeight: '900', color: colors.text },

    methodRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    methodBtn: {
      flex: 1,
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      backgroundColor: colors.surfaceSecondary,
      paddingVertical: 12,
      alignItems: 'center',
    },
    methodBtnActive: { backgroundColor: colors.primary, borderColor: colors.boardBorder },
    methodBtnText: {
      fontSize: isMobile ? 9 : typography.tag,
      fontWeight: '900',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    methodBtnTextActive: { color: colors.primaryContent },

    field: { gap: 6 },
    fieldLabel: { fontSize: isMobile ? 9 : typography.tag, fontWeight: '900', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.4 },
    input: {
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 0,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: isMobile ? 13 : typography.body,
      color: colors.text,
      minWidth: 0,
    },
    textarea: { minHeight: 80, textAlignVertical: 'top' },

    applyBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      justifyContent: 'center',
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
    },
    applyBtnText: {
      color: colors.primaryContent,
      fontSize: isMobile ? 9 : typography.tag,
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    couponStatus: { fontSize: isMobile ? 10 : typography.label, fontWeight: '700', color: colors.primary, marginTop: 8 },

    ctaBtn: {
      backgroundColor: colors.primary,
      paddingVertical: isMobile ? 14 : 16,
      alignItems: 'center',
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
    },
    ctaBtnText: { color: colors.primaryContent, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
    disclaimer: { fontSize: isMobile ? 10 : typography.label, color: colors.textDisabled, textAlign: 'center', lineHeight: 16 },
    pickerBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: colors.surfaceSecondary,
    },
    pickerBtnText: {
      fontSize: isMobile ? 13 : typography.body,
      color: colors.text,
      fontWeight: '700' as const,
      flex: 1,
    },
    pickerChevron: {
      fontSize: 10,
      color: colors.textSecondary,
      marginLeft: 8,
    },
  });
};

export default CheckoutScreen;