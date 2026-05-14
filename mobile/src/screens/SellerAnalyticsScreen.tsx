import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import productService from '../services/product.service';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const SellerAnalyticsScreen = ({ navigation }: any) => {
  const { user, setViewMode } = useAuth();
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
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader 
          eyebrow="Seller Hub" 
          title="Store Overview" 
          subtitle="Performance metrics and growth tools for your campus shop." 
        />

        {/* Primary Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Performance</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Revenue</Text>
              <Text style={styles.statValue}>GHS {(stats?.totalRevenue ?? 0).toFixed(0)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Active</Text>
              <Text style={styles.statValue}>{stats?.totalOrders ?? 0}</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={styles.statValue}>{stats?.pendingOrders ?? 0}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Views</Text>
              <Text style={styles.statValue}>1.2k</Text>
            </View>
          </View>
        </View>

        {/* Growth Toolkit */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Growth Toolkit</Text>
          <TouchableOpacity style={styles.toolItem} onPress={() => {}}>
            <View>
              <Text style={styles.toolTitle}>Store Campaigns</Text>
              <Text style={styles.toolSub}>Boost listings to reach more students.</Text>
            </View>
            <Ionicons name="megaphone-outline" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolItem} onPress={() => {}}>
            <View>
              <Text style={styles.toolTitle}>Coupons & Deals</Text>
              <Text style={styles.toolSub}>Create discount codes for buyers.</Text>
            </View>
            <Ionicons name="pricetag-outline" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => navigation.getParent()?.navigate('ProfileTab', { screen: 'Orders' })}
          >
            <Text style={styles.primaryBtnText}>Manage Sales & Orders →</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={() => navigation.navigate('MyListings')}
          >
            <Text style={styles.secondaryBtnText}>Edit My Inventory</Text>
          </TouchableOpacity>
        </View>
        
        {/* Workspace Switcher */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.modeBanner} 
            onPress={() => setViewMode('buyer')}
          >
            <View>
              <Text style={styles.modeBannerTitle}>Switch to Marketplace View</Text>
              <Text style={styles.modeBannerSub}>Browse campus items and shop.</Text>
            </View>
            <Text style={styles.modeBannerAction}>GO →</Text>
          </TouchableOpacity>
        </View>

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
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: colors.border, 
    padding: 16,
    backgroundColor: colors.surface,
  },
  statLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: colors.muted },
  statValue: { fontSize: 22, fontWeight: '900', marginTop: 4, color: colors.text },
  toolItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
  toolTitle: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', color: colors.text },
  toolSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
  primaryBtn: { 
    backgroundColor: colors.text, 
    paddingVertical: 18, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: colors.text,
    marginBottom: 10,
  },
  primaryBtnText: { color: '#fff', fontWeight: '900', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 },
  secondaryBtn: { 
    backgroundColor: colors.surface, 
    paddingVertical: 18, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: colors.border,
  },
  secondaryBtnText: { color: colors.text, fontWeight: '900', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 },
  modeBanner: {
    backgroundColor: '#1f1a14',
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  modeBannerTitle: { color: '#fff', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  modeBannerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  modeBannerAction: { color: '#fff', fontSize: 12, fontWeight: '900' },
});

export default SellerAnalyticsScreen;
