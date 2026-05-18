import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, shadows } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

export const ProfileScreen = ({ navigation }: any) => {
  const { user, logout, viewMode, setViewMode } = useAuth();

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
          { label: 'Complete Onboarding ⚠️', icon: 'alert-circle-outline', onPress: () => navigation.navigate('SellerOnboarding') }
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
                <Text style={styles.realNameText} numberOfLines={1}>👤 {user?.name}</Text>
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
                color={user?.isVerified ? "#065f46" : "#92400e"} 
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

        {/* View Mode Switcher */}
        {isSeller ? (
          <TouchableOpacity 
            style={styles.modeBanner}
            onPress={() => setViewMode(viewMode === 'seller' ? 'buyer' : 'seller')}
            activeOpacity={0.9}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.modeTitle}>
                {viewMode === 'seller' ? 'Switch to Buyer Feed 🛒' : 'Switch to Seller Hub 📈'}
              </Text>
              <Text style={styles.modeSubtitle}>
                {viewMode === 'seller' ? 'Browse products and shop the campus marketplace.' : 'Manage inventory, discounts, and track payouts.'}
              </Text>
            </View>
            <View style={styles.modeActionCircle}>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.modeBanner, { backgroundColor: '#fef3c7', borderColor: '#1f1a14' }]} 
            onPress={() => navigation.navigate('SellerOnboarding')}
            activeOpacity={0.9}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.modeTitle, { color: '#92400e' }]}>
                Start Selling on QUADS 🚀
              </Text>
              <Text style={[styles.modeSubtitle, { color: '#b45309' }]}>
                Activate your merchant store to sell textbooks, electronics, and food.
              </Text>
            </View>
            <View style={[styles.modeActionCircle, { backgroundColor: '#d97706' }]}>
              <Ionicons name="rocket-outline" size={16} color="#fff" />
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
                      <Ionicons name={item.icon} size={18} color="#1f1a14" />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={16} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Premium Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#9f3d34" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sign Out from Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#faf8f5' // Cream/ivory background
  },
  content: { 
    paddingBottom: 40 
  },
  profileCard: {
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: '#000000',
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
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
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#000000',
  },
  avatarInitial: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: '#fff' 
  },
  profileMeta: {
    marginLeft: 14,
    flex: 1,
  },
  nameText: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  realNameText: { 
    fontSize: 12, 
    color: '#4b5563', 
    fontWeight: '700',
    marginTop: 2,
  },
  emailText: { 
    fontSize: 12, 
    color: '#6b7280',
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
    borderTopColor: '#f1ebdf',
  },
  roleBadge: {
    backgroundColor: '#f1ebdf',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  roleText: { 
    fontSize: 9, 
    fontWeight: '900', 
    color: '#000000', 
    letterSpacing: 1 
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifyButtonVerified: { 
    backgroundColor: '#d1fae5' 
  },
  verifyButtonPending: { 
    backgroundColor: '#fef3c7' 
  },
  verifyText: { 
    fontSize: 9, 
    fontWeight: '900', 
    letterSpacing: 0.5 
  },
  verifyTextVerified: { 
    color: '#065f46' 
  },
  verifyTextPending: { 
    color: '#92400e' 
  },
  infoCard: {
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: '#000000',
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
    borderBottomColor: '#f1ebdf',
  },
  infoLabel: { 
    fontSize: 9, 
    fontWeight: '900', 
    color: '#9ca3af',
    letterSpacing: 0.8,
  },
  infoVal: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#000000' 
  },
  modeBanner: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#000000',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2.5,
    borderColor: '#000000',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
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
    color: '#fff', 
    fontSize: 12, 
    fontWeight: '900', 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  modeSubtitle: { 
    color: 'rgba(255,255,255,0.75)', 
    fontSize: 10, 
    marginTop: 3,
    fontWeight: '500',
    lineHeight: 13,
  },
  modeActionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#374151',
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
    color: '#78716c',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 2,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: '#000000',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
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
    borderBottomColor: '#f1ebdf' 
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
    color: '#000000', 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  logoutBtn: {
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: '#d6b8b4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    marginHorizontal: 16,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#9f3d34',
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
    color: '#9f3d34', 
    fontSize: 12, 
    fontWeight: '900', 
    textTransform: 'uppercase', 
    letterSpacing: 1.2 
  },
});

export default ProfileScreen;
