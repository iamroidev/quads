import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { shadows } from '../theme';
import { useColors } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import orderService, { Order } from '../services/order.service';

const SellerOrdersScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed' | 'disputed'>('all');

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed': return { bg: colors.successTint, text: colors.successTintText, border: colors.success };
      case 'paid':      return { bg: colors.surfaceSecondary, text: colors.text, border: colors.border };
      case 'pending':   return { bg: colors.metric1Bg, text: colors.metric1Text, border: colors.accent };
      case 'disputed':  return { bg: colors.dangerTint, text: colors.dangerTintText, border: colors.danger };
      default:          return { bg: colors.surfaceSecondary, text: colors.muted, border: colors.border };
    }
  };

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 40, paddingHorizontal: 16 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    filterContainer: {
      flexDirection: 'row', marginHorizontal: 16,
      borderWidth: 2, borderColor: colors.border,
      backgroundColor: colors.surface, marginTop: 8, marginBottom: 16, ...shadows.bulletin,
    },
    filterBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: colors.surface },
    filterBtnActive: { backgroundColor: colors.text },
    filterBtnText: { fontSize: 10, fontWeight: '900', color: colors.text, textTransform: 'uppercase' },
    filterBtnTextActive: { color: colors.bg },
    emptyCard: { marginTop: 20, padding: 32, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', ...shadows.bulletin },
    emptyTitle: { fontSize: isMobile ? 13 : 15, fontWeight: '900', color: colors.text, textTransform: 'uppercase', marginTop: 12 },
    emptyText: { fontSize: 12, fontWeight: '700', color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 18, marginBottom: 20 },
    actionBtn: { backgroundColor: colors.text, paddingHorizontal: isMobile ? 12 : 16, paddingVertical: 10, borderWidth: 2, borderColor: colors.border, ...shadows.bulletin },
    actionBtnText: { color: colors.bg, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
    card: { borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, padding: isMobile ? 12 : 16, marginBottom: 14, ...shadows.bulletin },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderId: { fontSize: isMobile ? 13 : 14, fontWeight: '900', color: colors.text },
    badge: { paddingHorizontal: 8, paddingVertical: 4 },
    badgeText: { fontSize: 9, fontWeight: '900' },
    cardBody: { marginTop: 12, gap: 4 },
    productTitle: { fontSize: isMobile ? 12 : 13, fontWeight: '900', color: colors.text, textTransform: 'uppercase' },
    buyerName: { fontSize: 11, color: colors.muted, fontWeight: '700' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, borderTopWidth: 2, borderTopColor: colors.border, borderStyle: 'dashed', paddingTop: 12 },
    dateText: { fontSize: 11, fontWeight: '900', color: colors.muted },
    amountText: { fontSize: isMobile ? 12 : 13, fontWeight: '900', color: colors.text },
  }), [colors]);

  const fetchSales = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await orderService.getMySales();
      const list = res.data?.orders || [];
      setOrders(list);
    } catch (err) {
      console.warn('Error loading seller sales:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  useEffect(() => {
    if (activeFilter === 'all') setFilteredOrders(orders);
    else if (activeFilter === 'pending') setFilteredOrders(orders.filter(o => o.status === 'pending' || o.status === 'paid'));
    else if (activeFilter === 'completed') setFilteredOrders(orders.filter(o => o.status === 'completed'));
    else if (activeFilter === 'disputed') setFilteredOrders(orders.filter(o => o.status === 'disputed'));
  }, [orders, activeFilter]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader eyebrow="SELLER HUB" title="Sales Orders" subtitle="Manage customer orders, track payments, and verify handoffs." />

      <View style={styles.filterContainer}>
        {(['all', 'pending', 'completed', 'disputed'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterBtn, activeFilter === filter && styles.filterBtnActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterBtnText, activeFilter === filter && styles.filterBtnTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSales(false); }} />}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="basket-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyTitle}>No Sales Orders</Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'all'
                ? "You haven't received any orders yet. Ensure your store listings are live and visible!"
                : `No orders matching status filter: "${activeFilter}".`}
            </Text>
            {activeFilter === 'all' && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('InventoryTab', { screen: 'CreateListing' })}>
                <Text style={styles.actionBtnText}>List New Product</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredOrders.map((o) => {
            const statusStyle = getStatusColor(o.status);
            const dateStr = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const firstItemTitle = o.items?.[0]?.title || 'Campus Item';
            const extraItemsCount = o.items ? o.items.length - 1 : 0;
            return (
              <TouchableOpacity key={o._id} style={styles.card} onPress={() => navigation.navigate('OrderDetail', { orderId: o._id })}>
                <View style={styles.cardHeader}>
                  <Text style={styles.orderId}>#{o.orderNumber?.slice(-6).toUpperCase()}</Text>
                  <View style={[styles.badge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border, borderWidth: 1 }]}>
                    <Text style={[styles.badgeText, { color: statusStyle.text }]}>{o.status.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.productTitle} numberOfLines={1}>
                    {firstItemTitle}{extraItemsCount > 0 ? ` + ${extraItemsCount} more item(s)` : ''}
                  </Text>
                  <Text style={styles.buyerName}>Buyer: <Text style={{ fontWeight: '800' }}>{o.buyer?.name || 'UMaT Student'}</Text></Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>{dateStr}</Text>
                  <Text style={styles.amountText}>GHS {o.totalAmount.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SellerOrdersScreen;
