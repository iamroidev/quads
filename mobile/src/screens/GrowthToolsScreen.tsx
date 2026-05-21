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
  const [activeTab, setActiveTab] = useState<'campaigns' | 'coupons' | 'bundles'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
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
  
  // Bundles State
  const [bundleName, setBundleName] = useState('');
  const [bundleDiscount, setBundleDiscount] = useState('');
  const [selectedBundleProductIds, setSelectedBundleProductIds] = useState<string[]>([]);
  const [submittingBundle, setSubmittingBundle] = useState(false);

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    tabContainer: { flexDirection: 'row', marginHorizontal: 16, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, marginTop: 12, ...shadows.bulletin },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.surface },
    tabBtnActive: { backgroundColor: colors.text },
    tabBtnText: { fontSize: 11, fontWeight: '900', color: colors.text, textTransform: 'uppercase' },
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
      const [campRes, coupRes, bundleRes, listingRes] = await Promise.all([
        api.get('/growth/campaigns'),
        api.get('/orders/seller/coupons'),
        api.get('/orders/seller/bundles'),
        api.get('/products/my/listings', { params: { status: 'active' } })
      ]);
      setCampaigns(campRes.data.data || []);
      setCoupons(coupRes.data.data?.coupons || []);
      setBundles(bundleRes.data.data?.bundles || bundleRes.data.data || []);
      setListings(listingRes.data.data || []);
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

  const handleDeleteCoupon = (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this coupon code?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/orders/seller/coupons/${id}`);
              if (res.data.success) {
                Alert.alert('Success', 'Coupon deleted.');
                fetchData();
              }
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete coupon.');
            }
          }
        }
      ]
    );
  };

  const handleToggleCoupon = async (id: string) => {
    try {
      const res = await api.patch(`/orders/seller/coupons/${id}/toggle`);
      if (res.data.success) {
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to toggle coupon status.');
    }
  };

  // Bundles Handlers
  const handleCreateBundle = async () => {
    const trimmedName = bundleName.trim();
    const discount = parseFloat(bundleDiscount);
    if (!trimmedName || isNaN(discount) || discount <= 0) {
      Alert.alert('Invalid Form', 'Please provide a valid bundle name and discount percentage.');
      return;
    }
    if (selectedBundleProductIds.length < 2) {
      Alert.alert('Selection Required', 'Please select at least 2 products to create a bundle.');
      return;
    }
    setSubmittingBundle(true);
    try {
      await api.post('/orders/seller/bundles', {
        name: trimmedName,
        discountPercent: discount,
        productIds: selectedBundleProductIds
      });
      Alert.alert('Bundle Created', `Bundle "${trimmedName}" is now active!`);
      setBundleName('');
      setBundleDiscount('');
      setSelectedBundleProductIds([]);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create bundle.');
    } finally {
      setSubmittingBundle(false);
    }
  };

  const handleDeleteBundle = (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this bundle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/orders/seller/bundles/${id}`);
              if (res.data.success) {
                Alert.alert('Success', 'Bundle deleted.');
                fetchData();
              }
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete bundle.');
            }
          }
        }
      ]
    );
  };

  const handleToggleBundle = async (id: string) => {
    try {
      const res = await api.patch(`/orders/seller/bundles/${id}/toggle`);
      if (res.data.success) {
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to toggle bundle status.');
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={colors.text} /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenHeader eyebrow="SELLER HUB" title="Growth Toolkit" subtitle="Boost item visibility, create coupons, and drive student conversions." />

          <View style={styles.tabContainer}>
            {(['campaigns', 'coupons', 'bundles'] as const).map((tab) => (
              <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                  {tab === 'campaigns' ? 'Campaigns' : tab === 'coupons' ? 'Coupons' : 'Bundles'}
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
                  <View style={{ gap: 10 }}>
                    {coupons.map((c) => (
                      <View key={c._id} style={styles.itemRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={styles.itemName}>{c.code}</Text>
                            <View style={{
                              backgroundColor: c.isActive ? colors.successTint : '#fee2e2',
                              borderWidth: 1,
                              borderColor: c.isActive ? colors.success : '#f87171',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                            }}>
                              <Text style={{ fontSize: 8, fontWeight: '900', color: c.isActive ? colors.successTintText : '#b91c1c' }}>
                                {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.itemSub}>{c.type === 'percentage' ? `${c.value}% OFF` : `GHS ${c.value} OFF`}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <TouchableOpacity
                            onPress={() => handleToggleCoupon(c._id)}
                            style={{
                              borderWidth: 2,
                              borderColor: colors.border,
                              backgroundColor: colors.surfaceSecondary,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                            }}
                          >
                            <Text style={{ fontSize: 9, fontWeight: '900', color: colors.text, textTransform: 'uppercase' }}>Toggle</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteCoupon(c._id)}
                            style={{
                              borderWidth: 2,
                              borderColor: colors.border,
                              backgroundColor: '#fee2e2',
                              paddingHorizontal: 8,
                              paddingVertical: 6,
                            }}
                          >
                            <Ionicons name="trash-outline" size={14} color="#b91c1c" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {activeTab === 'bundles' && (
            <View style={styles.innerSection}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>CREATE DYNAMIC BUNDLE</Text>
                <Text style={styles.cardDescription}>Offer automatic discounts when buyers purchase related items together from your store.</Text>
                
                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Bundle Name *</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Starter Pack" 
                    placeholderTextColor={colors.textDisabled} 
                    value={bundleName} 
                    onChangeText={setBundleName} 
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Bundle Discount % *</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. 10" 
                    placeholderTextColor={colors.textDisabled} 
                    value={bundleDiscount} 
                    onChangeText={setBundleDiscount} 
                    keyboardType="numeric" 
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.inputLabel}>Select Included Products (Min 2)</Text>
                  {listings.length === 0 ? (
                    <Text style={[styles.emptyText, { marginVertical: 10 }]}>No active listings found to bundle.</Text>
                  ) : (
                    <View style={{ maxHeight: 200, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, padding: 8, marginTop: 4 }}>
                      <ScrollView nestedScrollEnabled style={{ flex: 1 }}>
                        {listings.map((p) => {
                          const isSelected = selectedBundleProductIds.includes(p._id);
                          return (
                            <TouchableOpacity
                              key={p._id}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 10,
                                paddingVertical: 8,
                                paddingHorizontal: 6,
                                borderBottomWidth: 1,
                                borderBottomColor: colors.border,
                                backgroundColor: isSelected ? colors.surface : 'transparent',
                              }}
                              onPress={() => {
                                if (isSelected) {
                                  setSelectedBundleProductIds(selectedBundleProductIds.filter((id) => id !== p._id));
                                } else {
                                  setSelectedBundleProductIds([...selectedBundleProductIds, p._id]);
                                }
                              }}
                            >
                              <View style={{
                                width: 18,
                                height: 18,
                                borderWidth: 2,
                                borderColor: colors.text,
                                backgroundColor: isSelected ? colors.text : 'transparent',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {isSelected && <Ionicons name="checkmark" size={12} color={colors.bg} />}
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 11, fontWeight: '900', color: colors.text }} numberOfLines={1}>
                                  {p.title.toUpperCase()}
                                </Text>
                                <Text style={{ fontSize: 9, fontWeight: '700', color: colors.muted }}>
                                  GHS {p.price}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <TouchableOpacity 
                  style={[styles.submitBtn, (submittingBundle || selectedBundleProductIds.length < 2) && styles.btnDisabled]} 
                  onPress={handleCreateBundle} 
                  disabled={submittingBundle || selectedBundleProductIds.length < 2}
                >
                  {submittingBundle ? <ActivityIndicator color={colors.bg} size={16} /> : <Text style={styles.submitBtnText}>Create Active Bundle</Text>}
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 24 }}>
                <Text style={styles.sectionTitle}>YOUR ACTIVE BUNDLE DEALS</Text>
                {bundles.length === 0 ? (
                  <EmptyState title="No active bundle deals" subtitle="Create your first bundle above." />
                ) : (
                  <View style={{ gap: 10 }}>
                    {bundles.map((b) => (
                      <View key={b._id} style={styles.itemRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={styles.itemName}>{b.name}</Text>
                            <View style={{
                              backgroundColor: b.isActive ? colors.successTint : '#fee2e2',
                              borderWidth: 1,
                              borderColor: b.isActive ? colors.success : '#f87171',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                            }}>
                              <Text style={{ fontSize: 8, fontWeight: '900', color: b.isActive ? colors.successTintText : '#b91c1c' }}>
                                {b.isActive ? 'ACTIVE' : 'INACTIVE'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.itemSub}>{b.discountPercent}% Bundle Discount</Text>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: colors.muted, marginTop: 4 }}>
                            Includes: {b.productIds?.map((p: any) => p.title || `Item ${String(p).slice(-4)}`).join(', ')}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <TouchableOpacity
                            onPress={() => handleToggleBundle(b._id)}
                            style={{
                              borderWidth: 2,
                              borderColor: colors.border,
                              backgroundColor: colors.surfaceSecondary,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                            }}
                          >
                            <Text style={{ fontSize: 9, fontWeight: '900', color: colors.text, textTransform: 'uppercase' }}>Toggle</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteBundle(b._id)}
                            style={{
                              borderWidth: 2,
                              borderColor: colors.border,
                              backgroundColor: '#fee2e2',
                              paddingHorizontal: 8,
                              paddingVertical: 6,
                            }}
                          >
                            <Ionicons name="trash-outline" size={14} color="#b91c1c" />
                          </TouchableOpacity>
                        </View>
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
