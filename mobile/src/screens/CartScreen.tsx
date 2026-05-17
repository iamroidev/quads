import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';

const CartScreen = ({ navigation }: any) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cart').then(r => setItems(r.data.data?.items || [])).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader eyebrow="Shopping" title="Cart" subtitle="Review items before checkout." />
        {items.length === 0 ? (
          <Text style={styles.empty}>Your cart is empty</Text>
        ) : (
          items.map(i => (
            <View key={i.product} style={styles.item}>
              <Text style={styles.itemTitle}>{i.title}</Text>
              <Text style={styles.itemPrice}>GHS {i.price} × {i.quantity}</Text>
            </View>
          ))
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>GHS {total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => navigation.navigate('Checkout')}>
          <Text style={styles.checkoutText}>CHECKOUT →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40, paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  empty: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 40 },
  item: { padding: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginBottom: 10, ...shadows.bulletin },
  itemTitle: { fontSize: 13, fontWeight: '900' },
  itemPrice: { fontSize: 11, color: colors.muted, marginTop: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderColor: colors.border },
  totalLabel: { fontSize: 13, fontWeight: '900' },
  totalValue: { fontSize: 14, fontWeight: '900' },
  checkoutBtn: { backgroundColor: colors.text, paddingVertical: 16, alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: colors.text, ...shadows.bulletin },
  checkoutText: { color: '#fff', fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
});

export default CartScreen;