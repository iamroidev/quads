import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import productService from '../services/product.service';
import { useAuth } from '../context/AuthContext';
import { colors, shadows } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const SellerAnalyticsScreen = ({ navigation }: any) => {
  const { user, setViewMode } = useAuth();
  const [stats, setStats] = useState<{
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
    totalViews: number;
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

  const onboardingCompleted = !!user?.sellerOnboarding?.completed;

  if (!onboardingCompleted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.onboardingContainer}>
          <View style={styles.onboardingHeader}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>New Merchant</Text>
            </View>
            <Text style={styles.onboardingTitle}>Welcome to the Quads Seller Hub!</Text>
            <Text style={styles.onboardingSubtitle}>
              You're just one step away from listing your first product and reaching thousands of students on campus.
            </Text>
          </View>

          <View style={styles.cardFrame}>
            <Text style={styles.cardHeader}>ONBOARDING CHECKLIST</Text>
            
            <View style={styles.checkItem}>
              <Ionicons name="shield-checkmark" size={20} color="#ff6b6b" />
              <View style={styles.checkTextContainer}>
                <Text style={styles.checkTitle}>Account Creation</Text>
                <Text style={styles.checkSub}>Google authentication verified successfully.</Text>
              </View>
            </View>

            <View style={styles.checkItem}>
              <Ionicons name="ellipse-outline" size={20} color="#7c6f60" />
              <View style={styles.checkTextContainer}>
                <Text style={styles.checkTitle}>Store & Brand Setup</Text>
                <Text style={styles.checkSub}>Set up your store name, logo, and average customer response time.</Text>
              </View>
            </View>

            <View style={styles.checkItem}>
              <Ionicons name="ellipse-outline" size={20} color="#7c6f60" />
              <View style={styles.checkTextContainer}>
                <Text style={styles.checkTitle}>Payout Settings</Text>
                <Text style={styles.checkSub}>Configure Mobile Money (MTN, Telecel, AT) or bank transfer info for earnings.</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.onboardingBtn} 
            onPress={() => navigation.getParent()?.navigate('ProfileTab', { screen: 'SellerOnboarding' })}
          >
            <Text style={styles.onboardingBtnText}>Complete Setup Wizard →</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchBackBtn} 
            onPress={() => setViewMode('buyer')}
          >
            <Text style={styles.switchBackBtnText}>Switch to Buyer Marketplace</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
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
              <Text style={styles.statValue}>
                {stats?.totalViews !== undefined
                  ? stats.totalViews >= 1000
                    ? `${(stats.totalViews / 1000).toFixed(1)}k`
                    : stats.totalViews
                  : 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Growth Toolkit */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Growth Toolkit</Text>
          <TouchableOpacity style={styles.toolItem} onPress={() => navigation.getParent()?.navigate('ProfileTab', { screen: 'GrowthTools' })}>
            <View>
              <Text style={styles.toolTitle}>Store Campaigns</Text>
              <Text style={styles.toolSub}>Boost listings to reach more students.</Text>
            </View>
            <Ionicons name="megaphone-outline" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolItem} onPress={() => navigation.getParent()?.navigate('ProfileTab', { screen: 'GrowthTools' })}>
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
            onPress={() => navigation.navigate('SellerOrdersTab')}
          >
            <Text style={styles.primaryBtnText}>Manage Sales & Orders →</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={() => navigation.navigate('InventoryTab', { screen: 'MyListings' })}
          >
            <Text style={styles.secondaryBtnText}>Edit My Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={() => navigation.navigate('ProfileTab', { screen: 'SellerPayouts' })}
          >
            <Text style={styles.secondaryBtnText}>View Earnings & Payouts</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={() => navigation.navigate('ProfileTab', { screen: 'DisputeCenter' })}
          >
            <Text style={styles.secondaryBtnText}>Dispute Center</Text>
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
  sectionLabel: { fontSize: 10, fontWeight: '900', color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: colors.border, 
    padding: 16,
    backgroundColor: colors.surface,
    ...shadows.bulletin,
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
    ...shadows.bulletin,
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
    ...shadows.bulletin,
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
    backgroundColor: colors.surface,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.bulletin,
  },
  modeBannerTitle: { color: colors.text, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  modeBannerSub: { color: colors.muted, fontSize: 11, marginTop: 2 },
  modeBannerAction: { color: colors.accent, fontSize: 12, fontWeight: '900' },
  onboardingContainer: { padding: 20, justifyContent: 'center', minHeight: '85%' },
  onboardingHeader: { marginBottom: 28 },
  badge: { backgroundColor: colors.accent, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  onboardingTitle: { fontSize: 26, fontWeight: '900', color: colors.text, textTransform: 'uppercase', lineHeight: 32 },
  onboardingSubtitle: { fontSize: 13, color: colors.muted, marginTop: 8, lineHeight: 18 },
  cardFrame: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, padding: 18, marginBottom: 24, ...shadows.bulletin },
  cardHeader: { fontSize: 10, fontWeight: '900', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 },
  checkItem: { flexDirection: 'row', gap: 14, marginBottom: 18, alignItems: 'flex-start' },
  checkTextContainer: { flex: 1 },
  checkTitle: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', color: colors.text },
  checkSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
  onboardingBtn: { backgroundColor: colors.text, paddingVertical: 18, alignItems: 'center', borderWidth: 2, borderColor: colors.border, marginBottom: 12, ...shadows.bulletin },
  onboardingBtnText: { color: colors.bg, fontWeight: '900', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 },
  switchBackBtn: { backgroundColor: colors.surface, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  switchBackBtnText: { color: colors.text, fontWeight: '800', textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 },
});

export default SellerAnalyticsScreen;
