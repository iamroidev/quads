import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { shadows } from '../theme';
import { useColors } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';

interface Transaction {
  _id: string;
  reference: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  createdAt: string;
  order?: {
    orderNumber: string;
    status: string;
    totalAmount: number;
    seller?: {
      name: string;
    };
  };
}

const TransactionHistoryScreen = () => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalRefunded: 0,
    count: 0,
  });

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: isMobile ? 12 : 16, marginTop: 8 },
    statCard: {
      flex: 1,
      borderWidth: 2,
      borderColor: colors.border,
      padding: 12,
      backgroundColor: colors.surface,
      alignItems: 'center',
      ...shadows.bulletin,
    },
    statLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', color: colors.muted },
    statValue: { fontSize: isMobile ? 16 : 18, fontWeight: '900', color: colors.text, marginTop: 4 },
    section: { marginTop: 24, paddingHorizontal: 16 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: colors.accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
    emptyText: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 40 },
    transactionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginBottom: 10,
      ...shadows.bulletin,
    },
    iconWrapper: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    detailsWrapper: { flex: 1 },
    txTitle: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', color: colors.text },
    txMeta: { fontSize: 9, color: colors.muted, marginTop: 2 },
    txInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    txSeller: { fontSize: 10, fontWeight: '700', color: colors.text, opacity: 0.8 },
    amountWrapper: { alignItems: 'flex-end', marginLeft: 8 },
    txAmount: { fontSize: 13, fontWeight: '900', color: colors.text },
    statusText: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase', marginTop: 4 },
  }), [colors, isMobile]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return colors.accent;
      case 'refunded': return colors.accentAlt;
      case 'failed': return colors.danger;
      default: return colors.muted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'refunded': return 'arrow-undo-outline';
      case 'failed': return 'close-circle-outline';
      case 'pending': return 'time-outline';
      default: return 'card-outline';
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions/my');
      if (response.data?.success) {
        const list: Transaction[] = response.data.data.transactions || [];
        setTransactions(list);

        const spent = list
          .filter(t => t.status === 'success')
          .reduce((sum, t) => sum + t.amount, 0);

        const refunded = list
          .filter(t => t.status === 'refunded')
          .reduce((sum, t) => sum + t.amount, 0);

        setStats({
          totalSpent: spent,
          totalRefunded: refunded,
          count: list.length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
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
          eyebrow="Payments"
          title="Receipts Ledger"
          subtitle="Your transaction history and refund receipts."
        />

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={styles.statValue}>GHS {stats.totalSpent.toFixed(0)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Refunded</Text>
            <Text style={styles.statValue}>GHS {stats.totalRefunded.toFixed(0)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Txns</Text>
            <Text style={styles.statValue}>{stats.count}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Transactions</Text>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transaction records found</Text>
          ) : (
            transactions.map(t => {
              const statusColor = getStatusColor(t.status);
              const isRefund = t.status === 'refunded';
              const sellerName = t.order?.seller?.name || 'UMaT Seller';

              return (
                <View key={t._id} style={styles.transactionCard}>
                  <View style={[styles.iconWrapper, { backgroundColor: statusColor + '15' }]}>
                    <Ionicons name={getStatusIcon(t.status)} size={18} color={statusColor} />
                  </View>
                  <View style={styles.detailsWrapper}>
                    <Text style={styles.txTitle}>
                      {isRefund ? 'Refund Issued' : 'Payment Made'}
                    </Text>
                    <Text style={styles.txMeta}>
                      Ref: {t.reference.slice(-10).toUpperCase()} · {new Date(t.createdAt).toLocaleDateString()}
                    </Text>
                    <View style={styles.txInfoRow}>
                      <Ionicons
                        name={isRefund ? 'arrow-undo' : 'person-outline'}
                        size={10}
                        color={colors.muted}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.txSeller}>
                        {isRefund ? `From: ${sellerName}` : `To: ${sellerName}`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.amountWrapper}>
                    <Text style={[styles.txAmount, { color: isRefund ? colors.accentAlt : colors.text }]}>
                      {isRefund ? '+' : '-'} GHS {t.amount.toFixed(2)}
                    </Text>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {t.status}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TransactionHistoryScreen;
