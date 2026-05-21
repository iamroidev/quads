import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View,
  Dimensions, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shadows } from '../theme';
import { useColors } from '../theme/ThemeContext';
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
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalPending: 0, totalCompleted: 0, totalAmount: 0 });

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: isMobile ? 12 : 16, marginTop: 8 },
    statCard: {
      flex: 1, borderWidth: 2, borderColor: colors.border, padding: 12,
      backgroundColor: colors.surface, alignItems: 'center', ...shadows.bulletin,
    },
    statLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', color: colors.muted },
    statValue: { fontSize: isMobile ? 17 : 20, fontWeight: '900', color: colors.text, marginTop: 4 },
    section: { marginTop: 24, paddingHorizontal: 16 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: colors.accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
    emptyText: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 20 },
    payoutRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    payoutOrder: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', color: colors.text },
    payoutDate: { fontSize: 10, color: colors.muted, marginTop: 2 },
    payoutAmount: { fontSize: isMobile ? 12 : 13, fontWeight: '900', marginRight: 12, color: colors.text },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4 },
    statusText: { fontSize: 9, fontWeight: '900' },
    retryBtn: {
      borderWidth: 2, borderColor: colors.danger, backgroundColor: colors.surface,
      paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8,
    },
    retryBtnText: { fontSize: 8, fontWeight: '900', color: colors.danger },
  }), [colors, isMobile]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.accent;
      case 'processing': return colors.accentAlt;
      case 'failed': return colors.danger;
      default: return colors.muted;
    }
  };

  const fetchPayouts = async () => {
    try {
      const payoutRes = await api.get('/payouts/seller').then(r => r.data);
      if (payoutRes.success) {
        const list: Payout[] = payoutRes.data.payouts || [];
        setPayouts(list);
        setStats({
          totalPending: list.filter(p => p.status === 'pending' || p.status === 'processing').length,
          totalCompleted: list.filter(p => p.status === 'completed').length,
          totalAmount: list.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.netAmount || 0), 0),
        });
      }
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleRetryPayout = async (payoutId: string) => {
    setRetryingId(payoutId);
    try {
      const res = await api.post(`/payouts/${payoutId}/retry`);
      if (res.data.success) {
        await fetchPayouts();
        Alert.alert('Success', 'Payout retry succeeded!');
      } else {
        Alert.alert('Retry Failed', res.data.message || 'The retry was unsuccessful.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to retry payout.');
    } finally {
      setRetryingId(null);
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
        <ScreenHeader eyebrow="Seller Hub" title="Earnings Ledger" subtitle="Track your payouts and sales performance." />

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
                {p.status === 'failed' && (
                  <TouchableOpacity
                    onPress={() => handleRetryPayout(p._id)}
                    style={styles.retryBtn}
                    disabled={retryingId === p._id}
                  >
                    <Text style={styles.retryBtnText}>
                      {retryingId === p._id ? '...' : 'RETRY'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SellerPayoutsScreen;

