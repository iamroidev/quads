import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import orderService, { Order } from '../services/order.service';
import { useAuth } from '../context/AuthContext';
import { shadows } from '../theme';
import { useColors } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';

const getStatusColors = (colors: any) => ({
  pending:   { bg: colors.metric1Bg,        text: colors.metric1Text },
  paid:      { bg: colors.surfaceSecondary,  text: colors.text },
  confirmed: { bg: colors.surfaceSecondary,  text: colors.text },
  ready:     { bg: colors.successTint,       text: colors.successTintText },
  completed: { bg: colors.successTint,       text: colors.successTintText },
  cancelled: { bg: colors.dangerTint,        text: colors.dangerTintText },
  disputed:  { bg: colors.dangerTint,        text: colors.dangerTintText },
});

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const OrdersScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const { user } = useAuth();
  const [tab, setTab] = useState<'purchases' | 'sales'>('purchases');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<string>('all');

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.boardBorder,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: colors.text },
    tabText: { fontSize: 11, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.1 },
    tabTextActive: { color: colors.text, fontWeight: '900' },
    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.boardBorder },
    statusChip: { borderWidth: 1, borderColor: colors.boardBorder, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.surfaceSecondary },
    statusChipActive: { backgroundColor: colors.primary, borderColor: colors.boardBorder },
    statusChipText: { fontSize: 10, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
    statusChipTextActive: { color: colors.primaryContent },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 12, gap: 10 },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 0,
      padding: 14,
      ...shadows.bulletin,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderNumber: { fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 0.5 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 0 },
    statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    itemTitle: { marginTop: 6, fontSize: isMobile ? 13 : 15, fontWeight: '600', color: colors.text },
    cardBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    amount: { fontSize: isMobile ? 14 : 16, fontWeight: '800', color: colors.success },
    date: { fontSize: 12, color: colors.muted },
    party: { marginTop: 6, fontSize: 12, color: colors.muted },
    emptyWrap: { padding: 40, alignItems: 'center' },
    emptyText: { fontSize: isMobile ? 13 : 15, color: colors.muted },
  }), [colors]);

  const fetchOrders = useCallback(
    async (withLoader = true) => {
      if (withLoader) setLoading(true);
      try {
        const res =
          tab === 'purchases'
            ? await orderService.getMyPurchases({ status: status === 'all' ? undefined : status })
            : await orderService.getMySales({ status: status === 'all' ? undefined : status });
        if (res.success) setOrders(res.data.orders);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [tab, status]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const renderItem = ({ item }: { item: Order }) => {
    const statusColorMap = getStatusColors(colors);
    const sc = statusColorMap[item.status as keyof typeof statusColorMap] ?? { bg: colors.surfaceSecondary, text: colors.muted };
    const firstItem = item.items[0];
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
      >
        <View style={styles.cardTop}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.itemTitle} numberOfLines={1}>
          {firstItem?.title ?? 'Item'}
          {item.items.length > 1 ? ` +${item.items.length - 1} more` : ''}
        </Text>

        <View style={styles.cardBottom}>
          <Text style={styles.amount}>
            GHS {item.totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>

        {tab === 'purchases' ? (
          <Text style={styles.party}>Seller: {item.seller?.name ?? '—'}</Text>
        ) : (
          <Text style={styles.party}>Buyer: {item.buyer?.name ?? '—'}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader eyebrow="Transactions" title="Orders" subtitle="Track purchases and sales lifecycle." />

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'purchases' && styles.tabActive]}
          onPress={() => setTab('purchases')}
        >
          <Text style={[styles.tabText, tab === 'purchases' && styles.tabTextActive]}>
            My Purchases
          </Text>
        </TouchableOpacity>
        {user?.role !== 'buyer' && (
          <TouchableOpacity
            style={[styles.tab, tab === 'sales' && styles.tabActive]}
            onPress={() => setTab('sales')}
          >
            <Text style={[styles.tabText, tab === 'sales' && styles.tabTextActive]}>
              My Sales
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statusRow}>
        {['all', 'pending', 'paid', 'confirmed', 'ready', 'completed', 'cancelled'].map((s) => (
          <TouchableOpacity key={s} style={[styles.statusChip, status === s && styles.statusChipActive]} onPress={() => setStatus(s)}>
            <Text style={[styles.statusChipText, status === s && styles.statusChipTextActive]}>{s === 'all' ? 'All' : s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchOrders(false);
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No orders found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default OrdersScreen;
