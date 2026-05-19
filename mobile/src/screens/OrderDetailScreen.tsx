import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import orderService, { Order } from '../services/order.service';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { shadows } from '../theme';
import { useColors } from '../theme/ThemeContext';

const STATUS_STEPS = ['pending', 'paid', 'confirmed', 'ready', 'completed'] as const;
const STEP_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  paid: 'Payment Received',
  confirmed: 'Seller Confirmed',
  ready: 'Ready for Pickup / Dispatch',
  completed: 'Completed',
};

const getStatusColors = (colors: any) => ({
  pending:   { border: colors.border,      bg: colors.metric1Bg,        text: colors.metric1Text },
  paid:      { border: colors.border,      bg: colors.surfaceSecondary, text: colors.text },
  confirmed: { border: colors.border,      bg: colors.surfaceSecondary, text: colors.text },
  ready:     { border: colors.accent,      bg: colors.successTint,      text: colors.successTintText },
  completed: { border: colors.accent,      bg: colors.successTint,      text: colors.successTintText },
  cancelled: { border: colors.danger,      bg: colors.dangerTint,       text: colors.dangerTintText },
  disputed:  { border: colors.danger,      bg: colors.dangerTint,       text: colors.dangerTintText },
});

const formatDate = (d: string) =>
  new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const OrderDetailScreen = ({ route, navigation }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const { orderId } = route.params;
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: isMobile ? 12 : 16, paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },

    orderHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface,
      padding: 14, marginBottom: 12, ...shadows.bulletin,
    },
    orderNumberLabel: { fontSize: 10, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1.4 },
    orderNumber: { fontSize: isMobile ? 13 : 15, fontWeight: '900', color: colors.text, marginTop: 2, textTransform: 'uppercase' },
    statusBadge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
    statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },

    section: {
      borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface,
      padding: 14, marginBottom: 12, ...shadows.bulletin,
    },
    sectionTitle: { fontSize: 10, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 12 },

    // Timeline
    timelineRow: { flexDirection: 'row', minHeight: 40 },
    timelineLeft: { width: 22, alignItems: 'center' },
    dot: { width: 10, height: 10, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
    dotDone: { borderColor: colors.accent, backgroundColor: colors.accent },
    dotCurrent: { borderColor: colors.accent, backgroundColor: colors.surface, borderWidth: 3, width: 12, height: 12 },
    connector: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 2 },
    connectorDone: { backgroundColor: colors.accent },
    timelineContent: { flex: 1, paddingLeft: 10, paddingBottom: 6, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    stepLabel: { fontSize: isMobile ? 12 : 13, color: colors.muted },
    stepLabelDone: { color: colors.text, fontWeight: '600' },
    currentBadge: { borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.successTint, paddingHorizontal: 6, paddingVertical: 2 },
    currentBadgeText: { fontSize: 9, fontWeight: '800', color: colors.accent, textTransform: 'uppercase', letterSpacing: 1 },

    // Items
    itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
    itemQty: { width: 28, height: 28, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, justifyContent: 'center', alignItems: 'center' },
    itemQtyText: { fontSize: 12, fontWeight: '700', color: colors.text },
    itemTitle: { flex: 1, fontSize: isMobile ? 12 : 13, color: colors.text },
    itemPrice: { fontSize: isMobile ? 12 : 13, fontWeight: '700', color: colors.accent },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 },
    totalLabel: { fontSize: isMobile ? 12 : 13, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
    totalAmount: { fontSize: isMobile ? 14 : 16, fontWeight: '900', color: colors.text },

    // Details
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 12 },
    detailKey: { fontSize: 12, color: colors.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, flexShrink: 0 },
    detailValue: { fontSize: isMobile ? 12 : 13, color: colors.text, fontWeight: '600', textAlign: 'right', flex: 1 },

    // Actions
    actions: { gap: 8 },
    actionBtn: { backgroundColor: colors.text, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.text, ...shadows.bulletin },
    actionBtnText: { color: colors.bg, fontWeight: '800', fontSize: isMobile ? 12 : 13, textTransform: 'uppercase', letterSpacing: 1 },
    payBtn: { backgroundColor: colors.success, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.success, ...shadows.bulletin },
    payBtnText: { color: colors.successContent, fontWeight: '900', fontSize: isMobile ? 12 : 13, textTransform: 'uppercase', letterSpacing: 1 },
    cancelBtn: { borderWidth: 1, borderColor: colors.dangerTint, backgroundColor: colors.dangerTint, paddingVertical: 12, alignItems: 'center' },
    cancelBtnText: { color: colors.dangerTintText, fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    reviewBtn: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, paddingVertical: 12, alignItems: 'center' },
    reviewBtnText: { color: colors.muted, fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    disputeBtn: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingVertical: 12, alignItems: 'center' },
    disputeBtnText: { color: colors.muted, fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    btnDisabled: { opacity: 0.5 },

    // Handover Styles
    handoverSection: {
      borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface,
      padding: isMobile ? 12 : 16, marginBottom: 12, ...shadows.bulletin,
    },
    sellerHandover: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    handoverText: { flex: 1 },
    handoverBadge: { fontSize: 9, fontWeight: '800', color: colors.accent, textTransform: 'uppercase', marginBottom: 4 },
    handoverTitle: { fontSize: isMobile ? 14 : 16, fontWeight: '900', color: colors.text, marginBottom: 4 },
    handoverSub: { fontSize: 11, color: colors.muted, fontWeight: '600' },
    codeContainer: { marginTop: 12, backgroundColor: colors.text, paddingVertical: 8, alignItems: 'center' },
    codeText: { color: colors.bg, fontSize: isMobile ? 15 : 18, fontWeight: '900', letterSpacing: 4 },
    qrContainer: { padding: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },

    buyerHandover: { alignItems: 'center' },
    handoverBadgeBuyer: { fontSize: 9, fontWeight: '800', color: colors.accent, textTransform: 'uppercase', marginBottom: 4 },
    handoverActions: { flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' },
    scanBtn: { flex: 1, backgroundColor: colors.text, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
    scanBtnText: { color: colors.bg, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    manualBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
    manualBtnText: { color: colors.text, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

    successSection: {
      flexDirection: 'row', alignItems: 'center', gap: 16,
      borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.successTint,
      padding: isMobile ? 12 : 16, marginBottom: 12,
    },
    successContent: { flex: 1 },
    successTitle: { fontSize: isMobile ? 14 : 16, fontWeight: '900', color: colors.text },
    successSub: { fontSize: 12, color: colors.accent, fontWeight: '600' },

    // Horizontal step progress bar
    stepBar: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      marginTop: 12,
      paddingHorizontal: 4,
    },
    stepBarItem: {
      flex: 1,
      alignItems: 'center' as const,
      position: 'relative' as const,
    },
    stepConnector: {
      position: 'absolute' as const,
      top: 6,
      right: '50%',
      left: '-50%',
      height: 2,
      backgroundColor: colors.border,
    },
    stepConnectorDone: {
      backgroundColor: colors.accent,
    },
    stepDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      zIndex: 1,
    },
    stepDotDone: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    stepDotCurrent: {
      borderColor: colors.accent,
      backgroundColor: colors.surface,
      borderWidth: 3,
      width: 16,
      height: 16,
      borderRadius: 8,
    },
    stepLabelNew: {
      fontSize: 8,
      fontWeight: '700' as const,
      color: colors.muted,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.3,
      marginTop: 5,
      textAlign: 'center' as const,
    },
    stepLabelCurrent: {
      color: colors.accent,
      fontWeight: '900' as const,
    },
  }), [colors]);

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
    const isPaid = order?.status === 'paid';
    const warningMsg = isPaid
      ? 'Are you sure you want to cancel this order? Since you have already paid, your escrow refund will be processed.'
      : 'Are you sure you want to cancel this order?';
    Alert.alert('Cancel Order', warningMsg, [
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

  const handleVerifyHandoff = async (code: string) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/orders/${orderId}/verify-handoff`, { code });
      if (res.data.success) {
        Alert.alert('Success', 'Handoff verified! Transaction completed.');
        setOrder(res.data.data.order);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Verification failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayNow = async () => {
    setPaying(true);
    try {
      const callbackUrl = `${api.defaults.baseURL}/payments/verify-success`;
      const initRes = await api.post('/payments/initiate', {
        orderId: order?._id,
        paymentMethod: 'momo',
        callbackUrl,
      });

      if (initRes.data.success) {
        const { authorizationUrl, reference } = initRes.data.data;
        await WebBrowser.openBrowserAsync(authorizationUrl);
        setActionLoading(true);
        try {
          const verifyRes = await api.get(`/payments/verify/${reference}`);
          if (verifyRes.data.success) {
            Alert.alert('Payment Successful!', 'Your payment was successfully validated.');
            const freshRes = await orderService.getOrderById(orderId);
            if (freshRes.success) setOrder(freshRes.data.order);
          } else {
            Alert.alert('Payment Pending', 'Verification pending. If you just completed the payment, please refresh in a moment.');
          }
        } catch {
          Alert.alert('Payment Completed?', 'Please refresh your order list to verify the payment receipt.');
        } finally {
          setActionLoading(false);
        }
      }
    } catch (err: any) {
      Alert.alert('Payment Failed', err?.response?.data?.message || 'Could not initiate Paystack payment. Try again.');
    } finally {
      setPaying(false);
    }
  };

  const handleOpenScanner = () => {
    navigation.navigate('Scanner', {
      onScan: (code: string) => handleVerifyHandoff(code),
    });
  };

  const handleManualEntry = () => {
    Alert.prompt(
      'Manual Entry',
      'Enter the 6-digit handover code from the seller:',
      (code) => {
        if (code?.length === 6) {
          handleVerifyHandoff(code);
        } else {
          Alert.alert('Invalid', 'Code must be 6 digits.');
        }
      },
      'plain-text'
    );
  };

  if (loading || !order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const statusColorMap = getStatusColors(colors);
  const sc = statusColorMap[order.status as keyof typeof statusColorMap] ?? { border: colors.border, bg: colors.surface, text: colors.muted };
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

      {/* Timeline — horizontal step bar */}
      {!isCancelledOrDisputed && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <View style={styles.stepBar}>
            {STATUS_STEPS.map((step, idx) => {
              const done = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <View key={step} style={styles.stepBarItem}>
                  {/* Connector before */}
                  {idx > 0 && (
                    <View style={[styles.stepConnector, idx <= currentStepIdx && styles.stepConnectorDone]} />
                  )}
                  {/* Dot */}
                  <View style={[
                    styles.stepDot,
                    done && styles.stepDotDone,
                    isCurrent && styles.stepDotCurrent,
                  ]} />
                  {/* Label */}
                  <Text style={[
                    styles.stepLabelNew,
                    done && styles.stepLabelDone,
                    isCurrent && styles.stepLabelCurrent,
                  ]} numberOfLines={1}>
                    {STEP_LABELS[step]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Handover System */}
      {order.status === 'ready' && (
        <View style={styles.handoverSection}>
          {isSeller ? (
            <View style={styles.sellerHandover}>
              <View style={styles.handoverText}>
                <Text style={styles.handoverBadge}>Handover Protocol</Text>
                <Text style={styles.handoverTitle}>Show this to the buyer</Text>
                <Text style={styles.handoverSub}>The buyer must scan this code to confirm receipt.</Text>
                <View style={styles.codeContainer}>
                  <Text style={styles.codeText}>{order.handoffCode}</Text>
                </View>
              </View>
              <View style={styles.qrContainer}>
                <QRCode
                  value={JSON.stringify({ orderId: order._id, code: order.handoffCode, type: 'HANDOVER' })}
                  size={120}
                />
              </View>
            </View>
          ) : (
            <View style={styles.buyerHandover}>
              <Text style={styles.handoverBadgeBuyer}>Handover Verification</Text>
              <Text style={styles.handoverTitle}>Ready to pick up?</Text>
              <Text style={styles.handoverSub}>Scan the seller's QR code or enter their code manually.</Text>
              <View style={styles.handoverActions}>
                <TouchableOpacity style={styles.scanBtn} onPress={handleOpenScanner}>
                  <Ionicons name="camera-outline" size={20} color={colors.bg} />
                  <Text style={styles.scanBtnText}>Scan QR Code</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.manualBtn} onPress={handleManualEntry}>
                  <Ionicons name="keypad-outline" size={20} color={colors.text} />
                  <Text style={styles.manualBtnText}>Manual Code</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {order.status === 'completed' && order.handoffStatus === 'verified' && (
        <View style={styles.successSection}>
          <Ionicons name="checkmark-circle" size={40} color={colors.accent} />
          <View style={styles.successContent}>
            <Text style={styles.successTitle}>Transaction Finalized</Text>
            <Text style={styles.successSub}>
              {isSeller ? 'Funds added to your payout balance.' : 'Thank you for shopping on QUADS!'}
            </Text>
          </View>
        </View>
      )}

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
        {(([
          ['Delivery', order.deliveryMethod],
          order.pickupLocation ? ['Pickup at', order.pickupLocation] : null,
          order.deliveryAddress ? ['Deliver to', order.deliveryAddress] : null,
          order.note ? ['Note', order.note] : null,
          ['Placed', formatDate(order.createdAt)],
          [isSeller ? 'Buyer' : 'Seller', isSeller ? order.buyer?.name : order.seller?.name],
        ].filter(Boolean)) as string[][]).map(([key, val], i) => (
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
                ? <ActivityIndicator size="small" color={colors.bg} />
                : <Text style={styles.actionBtnText}>
                    Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                  </Text>
              }
            </TouchableOpacity>
          )}
          {!isSeller && order.status === 'pending' && (
            <TouchableOpacity
              style={[styles.payBtn, (actionLoading || paying) && styles.btnDisabled]}
              onPress={handlePayNow}
              disabled={actionLoading || paying}
            >
              {paying ? (
                <ActivityIndicator size="small" color={colors.successContent} />
              ) : (
                <Text style={styles.payBtnText}>Pay Now</Text>
              )}
            </TouchableOpacity>
          )}
          {['pending', 'paid'].includes(order.status) && (
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
              <Text style={styles.reviewBtnText}>Leave a Review</Text>
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

export default OrderDetailScreen;
