import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import orderService from '../services/order.service';

const SellerOrdersScreen = ({ navigation }: any) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getMySales().then(r => setOrders(r.data.orders || [])).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow="Seller Hub"
          title="Sales Orders"
          subtitle="Manage orders from your buyers."
        />
        {orders.length === 0 ? (
          <Text style={styles.empty}>No sales yet</Text>
        ) : (
          orders.map(o => (
            <TouchableOpacity key={o._id} style={styles.card} onPress={() => navigation.navigate('OrderDetail', { orderId: o._id })}>
              <Text style={styles.orderId}>#{o.orderNumber?.slice(-6)}</Text>
              <Text style={styles.amount}>GHS {o.totalAmount}</Text>
              <View style={[styles.badge, { backgroundColor: o.status === 'paid' ? colors.accent : colors.muted }]}>
                <Text style={styles.badgeText}>{o.status.toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  empty: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 40 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
  orderId: { fontSize: 13, fontWeight: '900' },
  amount: { fontSize: 12, color: colors.muted },
  badge: { paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 9, fontWeight: '900', color: '#fff' },
});

export default SellerOrdersScreen;