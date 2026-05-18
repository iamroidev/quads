import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';

interface Campaign {
  _id: string;
  name: string;
  targetType: string;
  featuredBoost?: boolean;
  couponCode?: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

interface Coupon {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
}

const GrowthToolsScreen = () => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'coupons'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Campaign Form State
  const [campName, setCampName] = useState('');
  const [campCoupon, setCampCoupon] = useState('');
  const [campStart, setCampStart] = useState('');
  const [campEnd, setCampEnd] = useState('');
  const [campSlot, setCampSlot] = useState<'A' | 'B'>('A');
  const [submittingCamp, setSubmittingCamp] = useState(false);

  // Coupon Form State
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponVal, setCouponVal] = useState('');
  const [submittingCoupon, setSubmittingCoupon] = useState(false);

  const fetchData = async () => {
    try {
      const [campRes, coupRes] = await Promise.all([
        api.get('/growth/campaigns'),
        api.get('/orders/seller/coupons'),
      ]);
      setCampaigns(campRes.data.data || []);
      setCoupons(coupRes.data.data?.coupons || []);
    } catch (err) {
      console.warn('Error fetching growth toolkit statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCampaign = async () => {
    const trimmedName = campName.trim();
    const trimmedStart = campStart.trim();
    const trimmedEnd = campEnd.trim();

    if (!trimmedName || !trimmedStart || !trimmedEnd) {
      Alert.alert('Required Fields', 'Please fill in campaign name, start date, and end date.');
      return;
    }

    setSubmittingCamp(true);
    try {
      await api.post('/growth/campaigns', {
        name: trimmedName,
        startsAt: trimmedStart,
        endsAt: trimmedEnd,
        couponCode: campCoupon.trim(),
        featuredBoost: true,
        abSlot: campSlot,
        targetType: 'all',
      });
      Alert.alert('Campaign Created', 'Your campaign has been successfully scheduled!');
      setCampName('');
      setCampCoupon('');
      setCampStart('');
      setCampEnd('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create campaign. Check date formatting.');
    } finally {
      setSubmittingCamp(false);
    }
  };

  const handleCreateCoupon = async () => {
    const trimmedCode = couponCode.trim().toUpperCase();
    const val = parseFloat(couponVal);

    if (!trimmedCode || isNaN(val) || val <= 0) {
      Alert.alert('Invalid Form', 'Please provide a valid coupon code and value.');
      return;
    }

    setSubmittingCoupon(true);
    try {
      await api.post('/orders/seller/coupons', {
        code: trimmedCode,
        type: couponType,
        value: val,
      });
      Alert.alert('Coupon Created', `Discount code ${trimmedCode} is now active!`);
      setCouponCode('');
      setCouponVal('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create coupon.');
    } finally {
      setSubmittingCoupon(false);
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            eyebrow="SELLER HUB"
            title="Growth Toolkit"
            subtitle="Boost item visibility, create coupons, and drive student conversions."
          />

          {/* Neobrutalist tab selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'campaigns' && styles.tabBtnActive]}
              onPress={() => setActiveTab('campaigns')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'campaigns' && styles.tabBtnTextActive]}>
                Featured Campaigns
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'coupons' && styles.tabBtnActive]}
              onPress={() => setActiveTab('coupons')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'coupons' && styles.tabBtnTextActive]}>
                Smart Coupons
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: CAMPAIGNS */}
          {activeTab === 'campaigns' && (
            <View style={styles.innerSection}>
              {/* Campaign creation card */}
              <View style={styles.card}>
                <Text style={styles.cardLabel}>📢 CREATE CAMPAIGN</Text>
                <Text style={styles.cardDescription}>
                  Feature your products at the top of the campus board during target hours to maximize customer discovery.
                </Text>

                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Campaign Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Midsem Clearance Sale"
                    placeholderTextColor="#9ca3af"
                    value={campName}
                    onChangeText={setCampName}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Linked Coupon Code (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. MIDSEM15"
                    placeholderTextColor="#9ca3af"
                    value={campCoupon}
                    onChangeText={setCampCoupon}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.gridFields}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Starts At (YYYY-MM-DD) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="2026-05-18"
                      placeholderTextColor="#9ca3af"
                      value={campStart}
                      onChangeText={setCampStart}
                    />
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Ends At (YYYY-MM-DD) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="2026-05-25"
                      placeholderTextColor="#9ca3af"
                      value={campEnd}
                      onChangeText={setCampEnd}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.inputLabel}>A/B Testing Segment Slot</Text>
                  <View style={styles.selectorRow}>
                    {(['A', 'B'] as const).map((slot) => (
                      <TouchableOpacity
                        key={slot}
                        style={[styles.selectorBtn, campSlot === slot && styles.selectorBtnActive]}
                        onPress={() => setCampSlot(slot)}
                      >
                        <Text style={[styles.selectorText, campSlot === slot && styles.selectorTextActive]}>
                          Segment {slot}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, submittingCamp && styles.btnDisabled]}
                  onPress={handleCreateCampaign}
                  disabled={submittingCamp}
                >
                  {submittingCamp ? (
                    <ActivityIndicator color="#fff" size={16} />
                  ) : (
                    <Text style={styles.submitBtnText}>Schedule Active Campaign</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Campaigns list */}
              <View style={{ marginTop: 24 }}>
                <Text style={styles.sectionTitle}>ACTIVE & SCHEDULED CAMPAIGNS</Text>
                {campaigns.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No active or scheduled campaigns yet.</Text>
                  </View>
                ) : (
                  campaigns.map((c) => (
                    <View key={c._id} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{c.name}</Text>
                        <Text style={styles.itemSub}>
                          {new Date(c.startsAt).toLocaleDateString()} - {new Date(c.endsAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>ACTIVE</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* TAB 2: COUPONS */}
          {activeTab === 'coupons' && (
            <View style={styles.innerSection}>
              {/* Coupon creation card */}
              <View style={[styles.card, { backgroundColor: '#fffacd' }]}>
                <Text style={styles.cardLabel}>🎫 CREATE COUPON CODE</Text>
                <Text style={styles.cardDescription}>
                  Generate unique promotional discount codes for social campaigns or loyal repeat buyers.
                </Text>

                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Promo Coupon Code *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. FRESHERS20"
                    placeholderTextColor="#9ca3af"
                    value={couponCode}
                    onChangeText={setCouponCode}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Discount Calculation Mode</Text>
                  <View style={styles.selectorRow}>
                    <TouchableOpacity
                      style={[styles.selectorBtn, couponType === 'percentage' && styles.selectorBtnActive]}
                      onPress={() => setCouponType('percentage')}
                    >
                      <Text style={[styles.selectorText, couponType === 'percentage' && styles.selectorTextActive]}>
                        Percentage (%)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.selectorBtn, couponType === 'fixed' && styles.selectorBtnActive]}
                      onPress={() => setCouponType('fixed')}
                    >
                      <Text style={[styles.selectorText, couponType === 'fixed' && styles.selectorTextActive]}>
                        Fixed GHS
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Discount Value *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={couponType === 'percentage' ? 'e.g. 15 (%)' : 'e.g. 50 (GHS)'}
                    placeholderTextColor="#9ca3af"
                    value={couponVal}
                    onChangeText={couponVal => setCouponVal(couponVal)}
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, submittingCoupon && styles.btnDisabled]}
                  onPress={handleCreateCoupon}
                  disabled={submittingCoupon}
                >
                  {submittingCoupon ? (
                    <ActivityIndicator color="#fff" size={16} />
                  ) : (
                    <Text style={styles.submitBtnText}>Publish Live Coupon</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Coupons list */}
              <View style={{ marginTop: 24 }}>
                <Text style={styles.sectionTitle}>YOUR ACTIVE DISCOUNT CODES</Text>
                {coupons.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No discount codes created yet.</Text>
                  </View>
                ) : (
                  <View style={styles.gridContainer}>
                    {coupons.map((c) => (
                      <View key={c._id} style={styles.gridItem}>
                        <Ionicons name="ticket-outline" size={18} color={colors.text} style={{ marginBottom: 4 }} />
                        <Text style={styles.gridItemCode}>{c.code}</Text>
                        <Text style={styles.gridItemValue}>
                          {c.type === 'percentage' ? `${c.value}% OFF` : `GHS ${c.value} OFF`}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#fff',
    marginTop: 12,
    ...shadows.bulletin,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  tabBtnActive: {
    backgroundColor: colors.text,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.text,
    textTransform: 'uppercase',
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  innerSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  card: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    ...shadows.bulletin,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 16,
  },
  field: {
    marginBottom: 14,
    gap: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  gridFields: {
    flexDirection: 'row',
    gap: 12,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  selectorBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#fff',
    paddingVertical: 10,
    alignItems: 'center',
  },
  selectorBtnActive: {
    backgroundColor: colors.text,
  },
  selectorText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.text,
    textTransform: 'uppercase',
  },
  selectorTextActive: {
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: colors.text,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.bulletin,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ff6b6b',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  emptyCard: {
    padding: 32,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    ...shadows.bulletin,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 10,
    ...shadows.bulletin,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.text,
    textTransform: 'uppercase',
  },
  itemSub: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '700',
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: '#e6fcf5',
    borderWidth: 1,
    borderColor: '#099268',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#099268',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    alignItems: 'center',
    ...shadows.bulletin,
  },
  gridItemCode: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
  },
  gridItemValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    marginTop: 4,
  },
});

export default GrowthToolsScreen;
