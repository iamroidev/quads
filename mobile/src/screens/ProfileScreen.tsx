import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { shadows } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';

export const ProfileScreen = ({ navigation }: any) => {
  const { user, logout, viewMode, setViewMode, refreshUser } = useAuth();
  const { colors } = useTheme();

  const [verifSending, setVerifSending] = useState(false);
  const [verifCodeSent, setVerifCodeSent] = useState(false);
  const [verifCode, setVerifCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleSendVerifCode = async () => {
    setVerifSending(true);
    try {
      await api.post('/auth/send-verification-email');
      setVerifCodeSent(true);
    } catch {
      Alert.alert('Error', 'Could not send verification code. Try again.');
    } finally {
      setVerifSending(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (verifCode.trim().length < 6) return;
    setVerifying(true);
    try {
      await api.post('/auth/verify-email', { code: verifCode.trim() });
      await refreshUser();
      Alert.alert('Verified!', 'Your email has been verified.');
      setVerifCodeSent(false);
      setVerifCode('');
    } catch (err: any) {
      Alert.alert('Invalid Code', err?.response?.data?.message || 'Incorrect or expired code.');
    } finally {
      setVerifying(false);
    }
  };
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const styles = getStyles(colors, isMobile);

  const sellerOnboardingDone = !!(user as any)?.sellerOnboarding?.completed;
  const isSellerMode = (user?.role === 'seller' || user?.role === 'admin') && viewMode === 'seller';
  const identityName = user?.storeName || user?.brandName || user?.name;
  const isSeller = user?.role === 'seller' || user?.role === 'admin';

  // Define categorized menu lists for clean, structured rendering
  const buyerGroups = [
    {
      title: 'Profile & Security',
      items: [
        { label: 'Edit Profile', icon: 'person-outline', onPress: () => navigation.navigate('ProfileEdit') },
        { label: 'Get Verified', icon: 'shield-checkmark-outline', onPress: () => navigation.navigate('Verification') },
        { label: 'Settings', icon: 'settings-outline', onPress: () => navigation.navigate('Settings') },
      ],
    },
    {
      title: 'My Activity',
      items: [
        { label: 'Shopping Cart', icon: 'cart-outline', onPress: () => navigation.navigate('Cart') },
        { label: 'My Purchases', icon: 'receipt-outline', onPress: () => navigation.navigate('OrdersTab') },
        { label: 'Saved Items', icon: 'bookmark-outline', onPress: () => navigation.navigate('SavedItems') },
        { label: 'Alerts', icon: 'notifications-outline', onPress: () => navigation.navigate('Alerts') },
        { label: 'Messages', icon: 'chatbubbles-outline', onPress: () => navigation.navigate('MessagesTab') },
      ],
    },
    {
      title: 'Campus & Support',
      items: [
        { label: 'Campus Pulse', icon: 'pulse-outline', onPress: () => navigation.navigate('PulseTab') },
        { label: 'Following Feed', icon: 'people-outline', onPress: () => navigation.navigate('FollowingFeed') },
        { label: 'Lost & Found', icon: 'search-outline', onPress: () => navigation.navigate('LostFound') },
        { label: 'Support Desk', icon: 'help-circle-outline', onPress: () => navigation.navigate('Support') },
        { label: 'Contact Support', icon: 'mail-outline', onPress: () => navigation.navigate('Contact') },
      ],
    },
    {
      title: 'About QUADS',
      items: [
        { label: 'Frequently Asked Questions', icon: 'information-circle-outline', onPress: () => navigation.navigate('FAQ') },
        { label: 'About QUADS', icon: 'school-outline', onPress: () => navigation.navigate('AboutUs') },
        { label: 'Terms of Service', icon: 'document-text-outline', onPress: () => navigation.navigate('Terms') },
        { label: 'Privacy Policy', icon: 'lock-closed-outline', onPress: () => navigation.navigate('PrivacyPolicy') },
      ],
    },
  ];

  const sellerGroups = [
    {
      title: 'Store Operations',
      items: [
        ...(!sellerOnboardingDone ? [
          { label: 'Complete Onboarding', icon: 'alert-circle-outline', onPress: () => navigation.navigate('SellerOnboarding') }
        ] : []),
        { label: 'Edit Profile', icon: 'person-outline', onPress: () => navigation.navigate('ProfileEdit') },
        { label: 'Get Verified', icon: 'shield-checkmark-outline', onPress: () => navigation.navigate('Verification') },
        { label: 'My Listings', icon: 'list-outline', onPress: () => navigation.navigate('InventoryTab', { screen: 'MyListings' }) },
        { label: 'Sales Orders', icon: 'receipt-outline', onPress: () => navigation.navigate('SellerOrdersTab') },
        { label: 'Growth Toolkit', icon: 'trending-up-outline', onPress: () => navigation.navigate('GrowthTab') },
      ],
    },
    {
      title: 'Resolution & Feeds',
      items: [
        { label: 'Dispute Center', icon: 'shield-alert-outline', onPress: () => navigation.navigate('DisputeCenter') },
        { label: 'Lost & Found', icon: 'search-outline', onPress: () => navigation.navigate('LostFound') },
        { label: 'Campus Pulse', icon: 'pulse-outline', onPress: () => navigation.navigate('PulseTab') },
        { label: 'Following Feed', icon: 'people-outline', onPress: () => navigation.navigate('FollowingFeed') },
      ],
    },
    {
      title: 'Support & Settings',
      items: [
        { label: 'Shopping Cart', icon: 'cart-outline', onPress: () => navigation.navigate('Cart') },
        { label: 'Settings', icon: 'settings-outline', onPress: () => navigation.navigate('Settings') },
        { label: 'Support Desk', icon: 'help-circle-outline', onPress: () => navigation.navigate('Support') },
        { label: 'Contact Support', icon: 'mail-outline', onPress: () => navigation.navigate('Contact') },
      ],
    },
    {
      title: 'About QUADS',
      items: [
        { label: 'Frequently Asked Questions', icon: 'information-circle-outline', onPress: () => navigation.navigate('FAQ') },
        { label: 'About QUADS', icon: 'school-outline', onPress: () => navigation.navigate('AboutUs') },
        { label: 'Terms of Service', icon: 'document-text-outline', onPress: () => navigation.navigate('Terms') },
        { label: 'Privacy Policy', icon: 'lock-closed-outline', onPress: () => navigation.navigate('PrivacyPolicy') },
      ],
    },
  ];

  const activeGroups = isSellerMode ? sellerGroups : buyerGroups;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader eyebrow="ACCOUNT CENTER" title="Me" subtitle="Manage your campus store, items, and settings." />

        {/* Premium Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.nameText} numberOfLines={1}>{identityName}</Text>
              {(user?.storeName || user?.brandName) && (
                <Text style={styles.realNameText} numberOfLines={1}>{user?.name}</Text>
              )}
              <Text style={styles.emailText} numberOfLines={1}>{user?.email}</Text>
            </View>
          </View>

          {/* Verification Badge & Role Tag */}
          <View style={styles.statusRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{(viewMode || user?.role)?.toUpperCase()}</Text>
            </View>

            <TouchableOpacity
              onPress={() => !user?.isVerified && navigation.navigate('Verification')}
              style={[
                styles.verifyButton,
                user?.isVerified ? styles.verifyButtonVerified : styles.verifyButtonPending
              ]}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={user?.isVerified ? "shield-checkmark" : "shield-outline"} 
                size={12} 
                color={user?.isVerified ? colors.successTintText : colors.primaryTintText} 
                style={{ marginRight: 4 }}
              />
              <Text style={[
                styles.verifyText,
                user?.isVerified ? styles.verifyTextVerified : styles.verifyTextPending
              ]}>
                {user?.isVerified ? 'VERIFIED STUDENT' : 'TAP TO VERIFY'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats mini-grid */}
        {(user?.role === 'seller' || user?.role === 'admin') && (
          <View style={styles.statsGrid}>
            {[
              { label: 'Rating', value: '—', icon: '' },
              { label: 'Response', value: `${user?.responseTimeMinutes ?? 15}m`, icon: '' },
            ].map(({ label, value, icon }) => (
              <View key={label} style={styles.statBox}>
                
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Quick Info Grid */}
        <View style={styles.infoCard}>
          {user?.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>MOMO / PHONE</Text>
              <Text style={styles.infoVal}>{user.phone}</Text>
            </View>
          )}
          {user?.location && (
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>CAMPUS LOCATION</Text>
              <Text style={styles.infoVal}>{user.location}</Text>
            </View>
          )}
        </View>

        {/* Email verification banner */}
        {user && !user.emailVerified && (
          <View style={styles.verifBanner}>
            <View style={styles.verifHeaderRow}>
              <Ionicons name="shield-outline" size={16} color={colors.accent} />
              <Text style={styles.verifTitle}>Verify your email to unlock all features</Text>
            </View>
            {!verifCodeSent ? (
              <TouchableOpacity
                style={styles.verifBtn}
                onPress={handleSendVerifCode}
                disabled={verifSending}
              >
                <Text style={styles.verifBtnText}>{verifSending ? 'Sending…' : 'Send Verification Code'}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.verifCodeRow}>
                <TextInput
                  style={styles.verifInput}
                  placeholder="6-digit code"
                  placeholderTextColor={colors.muted}
                  value={verifCode}
                  onChangeText={setVerifCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={[styles.verifBtn, { flex: 0, paddingHorizontal: 14 }]}
                  onPress={handleVerifyEmail}
                  disabled={verifying || verifCode.length < 6}
                >
                  <Text style={styles.verifBtnText}>{verifying ? '…' : 'Verify'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSendVerifCode} disabled={verifSending}>
                  <Text style={styles.verifResend}>Resend</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* View Mode Switcher */}
        {isSeller ? (
          <TouchableOpacity 
            style={styles.modeBanner}
            onPress={() => setViewMode(viewMode === 'seller' ? 'buyer' : 'seller')}
            activeOpacity={0.9}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.modeTitle}>
                {viewMode === 'seller' ? 'Switch to Buyer Feed' : 'Switch to Seller Hub'}
              </Text>
              <Text style={styles.modeSubtitle}>
                {viewMode === 'seller' ? 'Browse products and shop the campus marketplace.' : 'Manage inventory, discounts, and track payouts.'}
              </Text>
            </View>
            <View style={styles.modeActionCircle}>
              <Ionicons name="arrow-forward" size={16} color={colors.background} />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.modeBanner, { backgroundColor: colors.primaryTint, borderColor: colors.boardBorder }]} 
            onPress={() => navigation.navigate('SellerOnboarding')}
            activeOpacity={0.9}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.modeTitle, { color: colors.primaryTintText }]}>
                Start Selling
              </Text>
              <Text style={[styles.modeSubtitle, { color: colors.primaryTintText, opacity: 0.85 }]}>
                Activate your merchant store to sell textbooks, electronics, and food.
              </Text>
            </View>
            <View style={[styles.modeActionCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="rocket-outline" size={16} color={colors.primaryContent} />
            </View>
          </TouchableOpacity>
        )}

        {/* Categorized Menus */}
        {activeGroups.map((group, groupIdx) => (
          <View key={groupIdx} style={styles.menuContainer}>
            <Text style={styles.groupHeading}>{group.title}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item: any, itemIdx) => (
                <TouchableOpacity
                  key={itemIdx}
                  style={[
                    styles.menuRow,
                    itemIdx < group.items.length - 1 && styles.menuRowBorder
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuLeft}>
                    <View style={styles.iconBox}>
                      <Ionicons name={item.icon} size={18} color={colors.text} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Premium Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sign Out from Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: any, isMobile = true) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background
  },
  content: { 
    paddingBottom: 40 
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderWidth: colors.boardBorderWidth,
    borderColor: colors.boardBorder,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: isMobile ? 12 : 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.boardShadow,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: colors.boardBorderWidth,
    borderColor: colors.boardBorder,
  },
  avatarInitial: { 
    fontSize: isMobile ? 20 : 26, 
    fontWeight: '900', 
    color: colors.background
  },
  profileMeta: {
    marginLeft: 14,
    flex: 1,
  },
  nameText: { 
    fontSize: isMobile ? 15 : 18, 
    fontWeight: '900', 
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  realNameText: { 
    fontSize: 12, 
    color: colors.textSecondary, 
    fontWeight: '700',
    marginTop: 2,
  },
  emailText: { 
    fontSize: 12, 
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
  },
  roleBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: colors.boardBorder,
  },
  roleText: { 
    fontSize: 9, 
    fontWeight: '900', 
    color: colors.text, 
    letterSpacing: 1 
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.boardBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifyButtonVerified: { 
    backgroundColor: colors.successTint 
  },
  verifyButtonPending: { 
    backgroundColor: colors.primaryTint 
  },
  verifyText: { 
    fontSize: 9, 
    fontWeight: '900', 
    letterSpacing: 0.5 
  },
  verifyTextVerified: { 
    color: colors.successTintText 
  },
  verifyTextPending: { 
    color: colors.primaryTintText 
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: colors.boardBorderWidth,
    borderColor: colors.boardBorder,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    fontSize: isMobile ? 15 : 18,
    marginBottom: 4,
  },
  statValue: {
    fontSize: isMobile ? 13 : 14,
    fontWeight: '900',
    color: colors.text,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderWidth: colors.boardBorderWidth,
    borderColor: colors.boardBorder,
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  infoLabel: { 
    fontSize: 9, 
    fontWeight: '900', 
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  infoVal: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: colors.text 
  },
  modeBanner: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: colors.text,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: colors.boardBorderWidth,
    borderColor: colors.boardBorder,
    ...Platform.select({
      ios: {
        shadowColor: colors.boardShadow,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  modeTitle: { 
    color: colors.background, 
    fontSize: 12, 
    fontWeight: '900', 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  modeSubtitle: { 
    color: colors.background, 
    fontSize: 10, 
    marginTop: 3,
    fontWeight: '500',
    lineHeight: 13,
    opacity: 0.8,
  },
  modeActionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  menuContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  groupHeading: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 2,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderWidth: colors.boardBorderWidth,
    borderColor: colors.boardBorder,
    ...Platform.select({
      ios: {
        shadowColor: colors.boardShadow,
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  menuRowBorder: { 
    borderBottomWidth: 1.5, 
    borderBottomColor: colors.border 
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 26,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  menuLabel: { 
    fontSize: 12, 
    color: colors.text, 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  logoutBtn: {
    backgroundColor: colors.surface,
    borderWidth: colors.boardBorderWidth,
    borderColor: colors.boardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    marginHorizontal: 16,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: colors.danger,
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 0,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  logoutText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2
  },
  verifBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: colors.accent,
    backgroundColor: colors.metric1Bg,
    padding: 14,
    gap: 10,
  },
  verifHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  verifTitle: {
    fontSize: 11,
    fontWeight: '900' as const,
    color: colors.metric1Text,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    flex: 1,
  },
  verifBtn: {
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.primaryPressed,
    paddingVertical: 10,
    alignItems: 'center' as const,
  },
  verifBtnText: {
    color: colors.primaryContent,
    fontSize: 11,
    fontWeight: '900' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  verifCodeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  verifInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: isMobile ? 14 : 16,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: 4,
  },
  verifResend: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: colors.accent,
    textDecorationLine: 'underline' as const,
  },
});

export default ProfileScreen;
