import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import productService from '../services/product.service';
import { colors } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const SellerAnalyticsScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState<{
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.getSellerStats()
      .then((res) => {
        if (res.success) setStats(res.data.stats);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content}>
      <ScreenHeader eyebrow="Dashboard" title="Seller Orders" subtitle="Analytics" />

      <View style={styles.grid}>
        {[
          { label: 'Total', value: stats?.totalOrders ?? 0 },
          { label: 'Pending', value: stats?.pendingOrders ?? 0 },
          { label: 'Completed', value: stats?.completedOrders ?? 0 },
          { label: 'Revenue', value: `GHS ${(stats?.totalRevenue ?? 0).toFixed(2)}` },
        ].map((item) => (
          <View key={item.label} style={styles.card}>
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Text style={styles.cardValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.orderShortcut}>
        <TouchableOpacity style={styles.shortBtn} onPress={() => navigation.getParent()?.navigate('ProfileTab', { screen: 'Orders' })}>
          <Text style={styles.shortBtnText}>Open Seller Orders</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  grid: { gap: 12 },
  card: { backgroundColor: '#fffdf8', borderWidth: 1, borderColor: colors.border, padding: 18, borderRadius: 0 },
  cardLabel: { fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 },
  cardValue: { fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 6 },
  orderShortcut: { marginTop: 16 },
  shortBtn: { borderWidth: 1, borderColor: colors.text, backgroundColor: colors.text, alignItems: 'center', paddingVertical: 12 },
  shortBtnText: { color: '#fff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
});

export default SellerAnalyticsScreen;
