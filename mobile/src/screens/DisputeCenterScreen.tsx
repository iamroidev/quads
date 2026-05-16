import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
}

const DisputeCenterScreen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    api.get('/orders/my/purchases', { params: { status: 'completed' } })
      .then(r => setOrders(r.data.data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  const openDispute = async () => {
    if (!selectedOrder || !reason.trim()) {
      Alert.alert('Error', 'Please select an order and provide a reason');
      return;
    }
    try {
      await api.post(`/orders/${selectedOrder._id}/dispute`, { reason });
      Alert.alert('Success', 'Dispute opened successfully');
      setReason('');
      setSelectedOrder(null);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to open dispute');
    }
  };

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
          eyebrow="Support"
          title="Dispute Center"
          subtitle="Resolve issues with orders or report problems."
        />

        {orders.length === 0 ? (
          <Text style={styles.emptyText}>No completed orders to dispute</Text>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Select Order</Text>
              {orders.map(o => (
                <TouchableOpacity
                  key={o._id}
                  style={[styles.orderRow, selectedOrder?._id === o._id && styles.selectedOrder]}
                  onPress={() => setSelectedOrder(o)}
                >
                  <Text style={styles.orderText}>#{o.orderNumber}</Text>
                  <Text style={styles.orderAmount}>GHS {o.totalAmount}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedOrder && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Reason for Dispute</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Describe the issue..."
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={4}
                />
                <TouchableOpacity style={styles.submitBtn} onPress={openDispute}>
                  <Text style={styles.submitBtnText}>OPEN DISPUTE</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  emptyText: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 40 },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  selectedOrder: { borderColor: colors.accent, backgroundColor: colors.accent + '10' },
  orderText: { fontSize: 12, fontWeight: '900' },
  orderAmount: { fontSize: 12, color: colors.muted },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: colors.danger,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: { color: '#fff', fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
});

export default DisputeCenterScreen;