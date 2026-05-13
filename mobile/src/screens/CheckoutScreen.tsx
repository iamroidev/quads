import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import orderService from '../services/order.service';
import { colors } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const CheckoutScreen = ({ route, navigation }: any) => {
  const { product } = route.params;
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [pickupLocation, setPickupLocation] = useState(product.pickupLocation || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const total = product.price;

  const handlePlaceOrder = async () => {
    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      Alert.alert('Required', 'Please enter a delivery address.');
      return;
    }
    setLoading(true);
    try {
      const res = await orderService.createOrder({
        productId: product._id,
        quantity: 1,
        deliveryMethod,
        pickupLocation: deliveryMethod === 'pickup' ? pickupLocation || product.pickupLocation : undefined,
        deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress.trim() : undefined,
        note: note.trim() || undefined,
      });
      if (res.success) {
        Alert.alert(
          'Order placed!',
          `Order #${res.data.order.orderNumber} is pending payment.`,
          [{ 
            text: 'View My Orders', 
            onPress: () => {
              navigation.popToTop(); // Reset the product browse stack
              navigation.getParent()?.navigate('ProfileTab', { screen: 'Orders' });
            } 
          }]
        );
      }
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message || 'Could not place order. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader eyebrow="Purchase" title="Checkout" subtitle={`Buying: ${product.title}`} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Order summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>{product.title}</Text>
              <Text style={styles.summaryValue}>
                GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>
                GHS {total.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {/* Delivery method */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Delivery method</Text>
            <View style={styles.methodRow}>
              {(['pickup', 'delivery'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.methodBtn, deliveryMethod === m && styles.methodBtnActive]}
                  onPress={() => setDeliveryMethod(m)}
                >
                  <Text style={[styles.methodBtnText, deliveryMethod === m && styles.methodBtnTextActive]}>
                    {m === 'pickup' ? '📍 Campus Pickup' : '🚚 Delivery'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {deliveryMethod === 'pickup' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Pickup location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Library, Main Gate"
                  placeholderTextColor="#9a8e7f"
                  value={pickupLocation}
                  onChangeText={setPickupLocation}
                />
              </View>
            )}
            {deliveryMethod === 'delivery' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Delivery address</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Your full delivery address on campus"
                  placeholderTextColor="#9a8e7f"
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}
          </View>

          {/* Note */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Note to seller (optional)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Any special instructions..."
              placeholderTextColor="#9a8e7f"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.ctaBtn, loading && { opacity: 0.5 }]}
            onPress={handlePlaceOrder}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaBtnText}>Place Order</Text>
            }
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Payment is arranged directly with the seller after the order is confirmed.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40, gap: 12 },

  section: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#7c6f60', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 12 },
  summaryKey: { fontSize: 13, color: colors.text, flex: 1 },
  summaryValue: { fontSize: 13, fontWeight: '700', color: colors.accent },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4, marginBottom: 0 },
  totalLabel: { fontSize: 12, fontWeight: '800', color: '#7c6f60', textTransform: 'uppercase', letterSpacing: 1 },
  totalAmount: { fontSize: 18, fontWeight: '900', color: colors.text },

  methodRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  methodBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', paddingVertical: 12, alignItems: 'center' },
  methodBtnActive: { backgroundColor: '#1f1a14', borderColor: '#1f1a14' },
  methodBtnText: { fontSize: 11, fontWeight: '800', color: '#6f6559', textTransform: 'uppercase', letterSpacing: 1 },
  methodBtnTextActive: { color: '#fff' },

  field: { gap: 6 },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: '#7c6f60', textTransform: 'uppercase', letterSpacing: 1.4 },
  input: {
    borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff',
    borderRadius: 0, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },

  ctaBtn: { backgroundColor: '#1f1a14', paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1f1a14' },
  ctaBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  disclaimer: { fontSize: 11, color: '#9a8e7f', textAlign: 'center', lineHeight: 16 },
});

export default CheckoutScreen;
