import React, { useCallback, useEffect, useState } from 'react';
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { shadows } from '../theme';
import { useColors } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';
import EmptyState from '../components/EmptyState';

interface Campaign {
  _id: string; name: string; targetType: string;
  featuredBoost?: boolean; couponCode?: string;
  startsAt: string; endsAt: string; isActive: boolean;
}
interface Coupon {
  _id: string; code: string; type: 'percentage' | 'fixed'; value: number; isActive: boolean;
}

const GrowthToolsScreen = () => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const [activeTab, setActiveTab] = useState<'campaigns' | 'coupons'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [campName, setCampName] = useState('');
  const [campCoupon, setCampCoupon] = useState('');
  const [campStart, setCampStart] = useState('');
  const [campEnd, setCampEnd] = useState('');
  const [campSlot, setCampSlot] = useState<'A' | 'B'>('A');
  const [submittingCamp, setSubmittingCamp] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponVal, setCouponVal] = useState('');
  const [submittingCoupon, setSubmittingCoupon] = useState(false);

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    tabContainer: { flexDirection: 'row', marginHorizontal: 16, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, marginTop: 12, ...shadows.bulletin },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.surface },
    tabBtnActive: { backgroundColor: colors.text },
    tabBtnText: { fontSize: 12, fontWeight: '900', color: colors.text, textTransform: 'uppercase' },
    tabBtnTextActive: { color: colors.bg },
    innerSection: { paddingHorizontal: isMobile ? 12 : 16, marginTop: 20 },
    card: { borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, padding: isMobile ? 12 : 16, ...shadows.bulletin },
    couponCard: { borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, padding: isMobile ? 12 : 16, ...shadows.bulletin },
    cardLabel: { fontSize: isMobile ? 13 : 14, fontWeight: '900', color: colors.text, marginBottom: 6 },
    cardDescription: { fontSize: 12, color: colors.muted, fontWeight: '700', lineHeight: 18, marginBottom: 16 },
    field: { marginBottom: 14, gap: 4 },
    inputLabel: { fontSize: 10, fontWeight: '900', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, paddingHorizontal: 12, paddingVertical: 10, fontSize: isMobile ? 12 : 13, fontWeight: '700', color: colors.text },
    gridFields: { flexDirection: 'row', gap: 12 },
    selectorRow: { flexDirection: 'row', gap: 8 },
    selectorBtn: { flex: 1, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, paddingVertical: 10, alignItems: 'center' },
    selectorBtnActive: { backgroundColor: colors.text },
    selectorText: { fontSize: 11, fontWeight: '900', color: colors.text, textTransform: 'uppercase' },
    selectorTextActive: { color: colors.bg },
    submitBtn: { backgroundColor: colors.text, paddingVertical: 14, alignItems: 'center', marginTop: 10, borderWidth: 2, borderColor: colors.border, ...shadows.bulletin },
    btnDisabled: { opacity: 0.5 },
    submitBtnText: { color: colors.bg, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: colors.accent, letterSpacing: 1.5, marginBottom: 10 },
    emptyCard: { padding: 32, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', ...shadows.bulletin },
    emptyText: { fontSize: 12, fontWeight: '700', color: colors.muted },
    itemRow: { flexDirection: 'row', alignItems: 'center', padding: isMobile ? 12 : 16, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, marginBottom: 10, ...shadows.bulletin },
    itemName: { fontSize: isMobile ? 12 : 13, fontWeight: '900', color: colors.text, textTransform: 'uppercase' },
    itemSub: { fontSize: 11, color: colors.muted, fontWeight: '700', marginTop: 4 },
    statusBadge: { backgroundColor: colors.successTint, borderWidth: 1, borderColor: colors.success, paddingHorizontal: 10, paddingVertical: 4 },
    statusBadgeText: { fontSize: 9, fontWeight: '900', color: colors.successTintText },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: { width: '48%', borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, padding: isMobile ? 12 : 16, alignItems: 'center', ...shadows.bulletin },
    gridItemCode: { fontSize: isMobile ? 13 : 14, fontWeight: '900', color: colors.text },
    gridItemValue: { fontSize: 11, fontWeight: '700', color: colors.muted, marginTop: 4 },
  }), [colors]);

  const fetchData = useCallback(async () => {
    try {
      const [campRes, coupRes] = await Promise.all([api.get('/growth/campaigns'), api.get('/orders/seller/coupons')]);
      setCampaigns(campRes.data.data || []);
      setCoupons(coupRes.data.data?.coupons || []);
    } catch (err) {
      console.warn('Error fetching growth toolkit statistics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateCampaign = async () => {
    if (!campName.trim() || !campStart.trim() || !campEnd.trim()) {
      Alert.alert('Required Fields', 'Please fill in campaign name, start date, and end date.'); return;
    }
    setSubmittingCamp(true);
    try {
      await api.post('/growth/campaigns', { name: campName.trim(), startsAt: campStart.trim(), endsAt: campEnd.trim(), couponCode: campCoupon.trim(), featuredBoost: true, abSlot: campSlot, targetType: 'all' });
      Alert.alert('Campaign Created', 'Your campaign has been successfully scheduled!');
      setCampName(''); setCampCoupon(''); setCampStart(''); setCampEnd('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create campaign.');
    } finally { setSubmittingCamp(false); }
  };

  const handleCreateCoupon = async () => {
    const trimmedCode = couponCode.trim().toUpperCase();
    const val = parseFloat(couponVal);
    if (!trimmedCode || isNaN(val) || val <= 0) { Alert.alert('Invalid Form', 'Please provide a valid coupon code and value.'); return; }
    setSubmittingCoupon(true);
    try {
      await api.post('/orders/seller/coupons', { code: trimmedCode, type: couponType, value: val });
      Alert.alert('Coupon Created', `Discount code ${trimmedCode} is now active!`);
      setCouponCode(''); setCouponVal(''); fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create coupon.');
    } finally { setSubmittingCoupon(false); }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={colors.text} /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenHeader eyebrow="SELLER HUB" title="Growth Toolkit" subtitle="Boost item visibility, create coupons, and drive student conversions." />

          <View style={styles.tabContainer}>
            {(['campaigns', 'coupons'] as const).map((tab) => (
              <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                  {tab === 'campaigns' ? 'Featured Campaigns' : 'Smart Coupons'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'campaigns' && (
            <View style={styles.innerSection}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>CREATE CAMPAIGN</Text>
                <Text style={styles.cardDescription}>Feature your products at the top of the campus board during target hours to maximize discovery.</Text>
                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Campaign Name *</Text>
                  <TextInput style={styles.input} placeholder="e.g. Midsem Clearance Sale" placeholderTextColor={colors.textDisabled} value={campName} onChangeText={setCampName} />
                </View>
                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Linked Coupon Code (Optional)</Text>
                  <TextInput style={styles.input} placeholder="e.g. MIDSEM15" placeholderTextColor={colors.textDisabled} value={campCoupon} onChangeText={setCampCoupon} autoCapitalize="characters" />
                </View>
                <View style={styles.gridFields}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Starts At *</Text>
                    <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textDisabled} value={campStart} onChangeText={setCampStart} />
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Ends At *</Text>
                    <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textDisabled} value={campEnd} onChangeText={setCampEnd} />
                  </View>
                </View>
                <View style={styles.field}>
                  <Text style={styles.inputLabel}>A/B Testing Segment Slot</Text>
                  <View style={styles.selectorRow}>
                    {(['A', 'B'] as const).map((slot) => (
                      <TouchableOpacity key={slot} style={[styles.selectorBtn, campSlot === slot && styles.selectorBtnActive]} onPress={() => setCampSlot(slot)}>
                        <Text style={[styles.selectorText, campSlot === slot && styles.selectorTextActive]}>Segment {slot}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <TouchableOpacity style={[styles.submitBtn, submittingCamp && styles.btnDisabled]} onPress={handleCreateCampaign} disabled={submittingCamp}>
                  {submittingCamp ? <ActivityIndicator color={colors.bg} size={16} /> : <Text style={styles.submitBtnText}>Schedule Active Campaign</Text>}
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 24 }}>
                <Text style={styles.sectionTitle}>ACTIVE & SCHEDULED CAMPAIGNS</Text>
                {campaigns.length === 0 ? (
                  <EmptyState title="No campaigns yet" subtitle="Create your first campaign above." />
                ) : campaigns.map((c) => (
                  <View key={c._id} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{c.name}</Text>
                      <Text style={styles.itemSub}>{new Date(c.startsAt).toLocaleDateString()} - {new Date(c.endsAt).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>ACTIVE</Text></View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'coupons' && (
            <View style={styles.innerSection}>
              <View style={styles.couponCard}>
                <Text style={styles.cardLabel}>CREATE COUPON CODE</Text>
                <Text style={styles.cardDescription}>Generate unique promotional discount codes for social campaigns or loyal repeat buyers.</Text>
                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Promo Coupon Code *</Text>
                  <TextInput style={styles.input} placeholder="e.g. FRESHERS20" placeholderTextColor={colors.textDisabled} value={couponCode} onChangeText={setCouponCode} autoCapitalize="characters" />
                </View>
                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Discount Calculation Mode</Text>
                  <View style={styles.selectorRow}>
                    {(['percentage', 'fixed'] as const).map((t) => (
                      <TouchableOpacity key={t} style={[styles.selectorBtn, couponType === t && styles.selectorBtnActive]} onPress={() => setCouponType(t)}>
                        <Text style={[styles.selectorText, couponType === t && styles.selectorTextActive]}>{t === 'percentage' ? 'Percentage (%)' : 'Fixed GHS'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Discount Value *</Text>
                  <TextInput style={styles.input} placeholder={couponType === 'percentage' ? 'e.g. 15 (%)' : 'e.g. 50 (GHS)'} placeholderTextColor={colors.textDisabled} value={couponVal} onChangeText={setCouponVal} keyboardType="numeric" />
                </View>
                <TouchableOpacity style={[styles.submitBtn, submittingCoupon && styles.btnDisabled]} onPress={handleCreateCoupon} disabled={submittingCoupon}>
                  {submittingCoupon ? <ActivityIndicator color={colors.bg} size={16} /> : <Text style={styles.submitBtnText}>Publish Live Coupon</Text>}
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 24 }}>
                <Text style={styles.sectionTitle}>YOUR ACTIVE DISCOUNT CODES</Text>
                {coupons.length === 0 ? (
                  <EmptyState title="No discount codes" subtitle="Create your first coupon code above." />
                ) : (
                  <View style={styles.gridContainer}>
                    {coupons.map((c) => (
                      <View key={c._id} style={styles.gridItem}>
                        <Ionicons name="ticket-outline" size={18} color={colors.text} style={{ marginBottom: 4 }} />
                        <Text style={styles.gridItemCode}>{c.code}</Text>
                        <Text style={styles.gridItemValue}>{c.type === 'percentage' ? `${c.value}% OFF` : `GHS ${c.value} OFF`}</Text>
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

export default GrowthToolsScreen;
