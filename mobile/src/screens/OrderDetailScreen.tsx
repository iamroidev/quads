import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import orderService, { Order } from '../services/order.service';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const STATUS_STEPS = ['pending', 'paid', 'confirmed', 'ready', 'completed'] as const;
const STEP_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  paid: 'Payment Received',
  confirmed: 'Seller Confirmed',
  ready: 'Ready for Pickup / Dispatch',
  completed: 'Completed',
};

const STATUS_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  pending:   { border: '#c8b48c', bg: '#fffacd', text: '#7b5e1a' },
  paid:      { border: colors.border, bg: '#e0f2f7', text: '#1a4a5e' },
  confirmed: { border: colors.border, bg: '#e8e4f8', text: '#3d307c' },
  ready:     { border: colors.accent, bg: '#d6ede7', text: colors.accent },
  completed: { border: colors.accent, bg: '#d6ede7', text: colors.accent },
  cancelled: { border: '#b3453a', bg: '#fde8e6', text: '#b3453a' },
  disputed:  { border: '#c57f3f', bg: '#fdf0e0', text: '#8f5428' },
};

const formatDate = (d: string) =>
  new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const OrderDetailScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params;
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderService.getOrderById(orderId);
      if (res.success) setOrder(res.data.order);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    navigation.setOptions({ headerShown: true, title: 'Order Details', headerBackTitle: 'Back' });
    fetchOrder();
  }, [fetchOrder, navigation]);

  const isSeller = order?.seller?._id === user?._id;

  const handleUpdateStatus = (newStatus: string) => {
    Alert.alert('Update Status', `Mark order as "${newStatus}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setActionLoading(true);
          try {
            const res = await orderService.updateStatus(orderId, newStatus);
            if (res.success) setOrder(res.data.order);
          } catch {
            Alert.alert('Error', 'Could not update status.');
          } finally { setActionLoading(false); }
        },
      },
    ]);
  };

  const handleOpenDispute = () => {
    Alert.prompt(
      'Open Dispute',
      'Briefly describe the issue with this order:',
      async (reason) => {
        if (!reason?.trim()) return;
        setActionLoading(true);
        try {
          await api.post(`/orders/${orderId}/dispute`, { reason: reason.trim() });
          await fetchOrder();
          Alert.alert('Dispute opened', 'Our team will review your case.');
        } catch {
          Alert.alert('Error', 'Could not open dispute.');
        } finally { setActionLoading(false); }
      },
      'plain-text'
    );
  };

  const handleLeaveReview = () => {
    Alert.prompt(
      'Leave a Review',
      'Rate 1-5 and write your comments (format: "5 Great seller!"):',
      async (input) => {
        if (!input?.trim()) return;
        const [ratingStr, ...commentParts] = input.trim().split(' ');
        const rating = parseInt(ratingStr, 10);
        if (!rating || rating < 1 || rating > 5) {
          Alert.alert('Invalid', 'Start with a rating from 1 to 5.');
          return;
        }
        setActionLoading(true);
        try {
          await api.post('/reviews', {
            orderId,
            sellerId: order?.seller._id,
            rating,
            comment: commentParts.join(' ').trim() || '',
          });
          Alert.alert('Review submitted', 'Thank you for your feedback!');
        } catch (err: any) {
          Alert.alert('Error', err?.response?.data?.message || 'Could not submit review.');
        } finally { setActionLoading(false); }
      },
      'plain-text'
    );
  };

  const handleCancel = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            const res = await orderService.cancelOrder(orderId, 'Cancelled by user');
            if (res.success) setOrder(res.data.order);
          } catch {
            Alert.alert('Error', 'Could not cancel order.');
          } finally { setActionLoading(false); }
        },
      },
    ]);
  };

  if (loading || !order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const sc = STATUS_COLORS[order.status] ?? { border: colors.border, bg: '#fffdf8', text: '#6f6559' };
  const currentStepIdx = STATUS_STEPS.indexOf(order.status as any);
  const isCancelledOrDisputed = ['cancelled', 'disputed'].includes(order.status);
  const nextStatusMap: Record<string, string> = { paid: 'confirmed', confirmed: 'ready', ready: 'completed' };
  const nextStatus = isSeller ? nextStatusMap[order.status] : undefined;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumberLabel}>Order</Text>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: sc.border, backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.text }]}>
            {order.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Timeline */}
      {!isCancelledOrDisputed && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress</Text>
          {STATUS_STEPS.map((step, idx) => {
            const done = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <View key={step} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.dot, done && styles.dotDone, isCurrent && styles.dotCurrent]} />
                  {idx < STATUS_STEPS.length - 1 && (
                    <View style={[styles.connector, done && styles.connectorDone]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{STEP_LABELS[step]}</Text>
                  {isCurrent && <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>Now</Text></View>}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <View style={styles.itemQty}>
              <Text style={styles.itemQtyText}>{item.quantity}×</Text>
            </View>
            <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.itemPrice}>
              GHS {(item.price * item.quantity).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>
            GHS {order.totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        {[
          ['Delivery', order.deliveryMethod],
          order.pickupLocation ? ['Pickup at', order.pickupLocation] : null,
          order.deliveryAddress ? ['Deliver to', order.deliveryAddress] : null,
          order.note ? ['Note', order.note] : null,
          ['Placed', formatDate(order.createdAt)],
          [isSeller ? 'Buyer' : 'Seller', isSeller ? order.buyer?.name : order.seller?.name],
        ].filter(Boolean).map(([key, val], i) => (
          <View key={i} style={styles.detailRow}>
            <Text style={styles.detailKey}>{key}</Text>
            <Text style={styles.detailValue}>{val}</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      {!isCancelledOrDisputed && (
        <View style={styles.actions}>
          {isSeller && nextStatus && (
            <TouchableOpacity
              style={[styles.actionBtn, actionLoading && styles.btnDisabled]}
              onPress={() => handleUpdateStatus(nextStatus)}
              disabled={actionLoading}
            >
              {actionLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.actionBtnText}>
                    Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                  </Text>
              }
            </TouchableOpacity>
          )}
          {order.status === 'pending' && (
            <TouchableOpacity
              style={[styles.cancelBtn, actionLoading && styles.btnDisabled]}
              onPress={handleCancel}
              disabled={actionLoading}
            >
              <Text style={styles.cancelBtnText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
          {!isSeller && order.status === 'completed' && (
            <TouchableOpacity
              style={[styles.reviewBtn, actionLoading && styles.btnDisabled]}
              onPress={handleLeaveReview}
              disabled={actionLoading}
            >
              <Text style={styles.reviewBtnText}>⭐ Leave a Review</Text>
            </TouchableOpacity>
          )}
          {['paid', 'confirmed', 'ready'].includes(order.status) && (
            <TouchableOpacity
              style={[styles.disputeBtn, actionLoading && styles.btnDisabled]}
              onPress={handleOpenDispute}
              disabled={actionLoading}
            >
              <Text style={styles.disputeBtnText}>Open Dispute</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },

  orderHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    padding: 14, marginBottom: 12,
  },
  orderNumberLabel: { fontSize: 10, fontWeight: '800', color: '#7c6f60', textTransform: 'uppercase', letterSpacing: 1.4 },
  orderNumber: { fontSize: 15, fontWeight: '900', color: colors.text, marginTop: 2, textTransform: 'uppercase' },
  statusBadge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },

  section: {
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    padding: 14, marginBottom: 12,
  },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: '#7c6f60', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 12 },

  // Timeline
  timelineRow: { flexDirection: 'row', minHeight: 40 },
  timelineLeft: { width: 22, alignItems: 'center' },
  dot: { width: 10, height: 10, borderWidth: 2, borderColor: colors.border, backgroundColor: '#fffdf8' },
  dotDone: { borderColor: colors.accent, backgroundColor: colors.accent },
  dotCurrent: { borderColor: colors.accent, backgroundColor: '#fff', borderWidth: 3, width: 12, height: 12 },
  connector: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 2 },
  connectorDone: { backgroundColor: colors.accent },
  timelineContent: { flex: 1, paddingLeft: 10, paddingBottom: 6, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  stepLabel: { fontSize: 13, color: '#9a8e7f' },
  stepLabelDone: { color: colors.text, fontWeight: '600' },
  currentBadge: { borderWidth: 1, borderColor: colors.accent, backgroundColor: '#d6ede7', paddingHorizontal: 6, paddingVertical: 2 },
  currentBadgeText: { fontSize: 9, fontWeight: '800', color: colors.accent, textTransform: 'uppercase', letterSpacing: 1 },

  // Items
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  itemQty: { width: 28, height: 28, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  itemQtyText: { fontSize: 12, fontWeight: '700', color: colors.text },
  itemTitle: { flex: 1, fontSize: 13, color: colors.text },
  itemPrice: { fontSize: 13, fontWeight: '700', color: colors.accent },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 13, fontWeight: '800', color: '#7c6f60', textTransform: 'uppercase', letterSpacing: 1 },
  totalAmount: { fontSize: 16, fontWeight: '900', color: colors.text },

  // Details
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 12 },
  detailKey: { fontSize: 12, color: '#7b6f61', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, flexShrink: 0 },
  detailValue: { fontSize: 13, color: colors.text, fontWeight: '600', textAlign: 'right', flex: 1 },

  // Actions
  actions: { gap: 8 },
  actionBtn: { backgroundColor: '#1f1a14', paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1f1a14' },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  cancelBtn: { borderWidth: 1, borderColor: '#d6b8b4', backgroundColor: '#fde8e6', paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#9f3d34', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  reviewBtn: { borderWidth: 1, borderColor: '#c8b48c', backgroundColor: '#fffacd', paddingVertical: 12, alignItems: 'center' },
  reviewBtnText: { color: '#7b5e1a', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  disputeBtn: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingVertical: 12, alignItems: 'center' },
  disputeBtnText: { color: '#6f6559', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  btnDisabled: { opacity: 0.5 },
});

export default OrderDetailScreen;
