import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';

interface Payout {
  _id: string;
  amount: number;
  netAmount: number;
  commissionAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  order: { orderNumber: string; totalAmount: number };
}

const SellerPayoutsScreen = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalCompleted: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    Promise.all([
      api.get('/payouts/seller').then(r => r.data),
      api.get('/payouts').then(r => r.data),
    ]).then(([payoutRes, statsRes]) => {
      if (payoutRes.success) setPayouts(payoutRes.data.payouts || []);
      if (statsRes.success) {
        const s = statsRes.data.stats || {};
        setStats({
          totalPending: s.totalPending || 0,
          totalCompleted: s.totalCompleted || 0,
          totalAmount: s.totalCommissionEarned || 0,
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.accent;
      case 'processing': return colors.accentAlt;
      case 'failed': return colors.danger;
      default: return colors.muted;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow="Seller Hub"
          title="Earnings Ledger"
          subtitle="Track your payouts and sales performance."
        />

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>{stats.totalPending}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statValue}>{stats.totalCompleted}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>GHS Earned</Text>
            <Text style={styles.statValue}>{stats.totalAmount.toFixed(0)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Recent Payouts</Text>
          {payouts.length === 0 ? (
            <Text style={styles.emptyText}>No payouts yet</Text>
          ) : (
            payouts.map(p => (
              <View key={p._id} style={styles.payoutRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payoutOrder}>Order #{p.order?.orderNumber?.slice(-6) || p._id.slice(-6)}</Text>
                  <Text style={styles.payoutDate}>{new Date(p.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.payoutAmount}>GHS {p.netAmount.toFixed(2)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(p.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(p.status) }]}>
                    {p.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 8 },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    ...shadows.bulletin,
  },
  statLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', color: colors.muted },
  statValue: { fontSize: 20, fontWeight: '900', color: colors.text, marginTop: 4 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  emptyText: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 20 },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  payoutOrder: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  payoutDate: { fontSize: 10, color: colors.muted, marginTop: 2 },
  payoutAmount: { fontSize: 13, fontWeight: '900', marginRight: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 9, fontWeight: '900' },
});

export default SellerPayoutsScreen;
