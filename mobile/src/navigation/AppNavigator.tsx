import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import OfflineBanner from '../components/OfflineBanner';

import {
   WelcomeScreen,
   LoginScreen,
   RegisterScreen,
   AdminScreen,
   HomeScreen,
   ProductsScreen,
   ProductDetailScreen,
   SavedScreen,
   ProfileScreen,
   OrdersScreen,
   ConversationListScreen,
   NotificationsScreen,
   ChatScreen,
   OrderDetailScreen,
   CreateListingScreen,
   ProfileEditScreen,
   SellerAnalyticsScreen,
   MyListingsScreen,
   SettingsScreen,
   SellerOnboardingScreen,
   VerificationScreen,
   ForgotPasswordScreen,
   CheckoutScreen,
   SellerPayoutsScreen,
   DisputeCenterScreen,
   GrowthToolsScreen,
   PulseScreen,
   CategoriesScreen,
   SellersScreen,
   SellerOrdersScreen,
   CartScreen,
   PaymentVerificationScreen,
   SupportScreen,
   ContactScreen,
   TermsScreen,
   MaintenanceScreen,
   CollectionDetailScreen,
   ResetPasswordScreen,
   ScannerScreen,
   LostFoundScreen,
   FAQScreen,
   PrivacyPolicyScreen,
   AboutUsScreen,
   FollowingFeedScreen,
   TransactionHistoryScreen,
 } from '../screens';
import { navigationRef } from './navigationRef';
import { useColors } from '../theme/ThemeContext';
import FloatingCart from '../components/FloatingCart';

const makeStackHeader = (c: ReturnType<typeof useColors>) => ({
  headerShown: true,
  headerBackTitle: 'Back',
  headerTitleStyle: {
    fontWeight: '900' as const,
    fontSize: 15,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.7,
    color: c.text,
  },
  headerStyle: { backgroundColor: c.surface },
  headerTintColor: c.text,
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
});

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Products stack ────────────────────────────────────────────────────────────
const ProductsStack = createNativeStackNavigator();
const ProductsStackScreen = () => {
  const colors = useColors();
  const dsh = makeStackHeader(colors);
  return (
    <ProductsStack.Navigator initialRouteName="ProductsHome" screenOptions={{ headerShown: false }}>
      <ProductsStack.Screen name="ProductsHome" component={ProductsScreen} />
      <ProductsStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ ...dsh, title: 'Product Details' }} />
      <ProductsStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ ...dsh, title: 'Order Details' }} />
    </ProductsStack.Navigator>
  );
};

// ── Messages stack ────────────────────────────────────────────────────────────
const MessagesStack = createNativeStackNavigator();
const MessagesStackScreen = () => {
  const colors = useColors();
  const dsh = makeStackHeader(colors);
  return (
    <MessagesStack.Navigator screenOptions={{ headerShown: false }}>
      <MessagesStack.Screen name="ConversationList" component={ConversationListScreen} />
      <MessagesStack.Screen name="Chat" component={ChatScreen} options={{ ...dsh }} />
    </MessagesStack.Navigator>
  );
};

// ── Notifications stack ───────────────────────────────────────────────────────
const NotificationsStack = createNativeStackNavigator();
const NotificationsStackScreen = () => (
  <NotificationsStack.Navigator screenOptions={{ headerShown: false }}>
    <NotificationsStack.Screen name="NotificationsHome" component={NotificationsScreen} />
  </NotificationsStack.Navigator>
);

// ── Profile stack ─────────────────────────────────────────────────────────────
// All screens reachable from the Me tab live here (including seller tools)
const ProfileStack = createNativeStackNavigator();
const ProfileStackScreen = () => {
  const colors = useColors();
  const dsh = makeStackHeader(colors);
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ ...dsh, title: 'Product Details' }} />
      <ProfileStack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ ...dsh, title: 'Edit Profile' }} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ ...dsh, title: 'Settings' }} />
      <ProfileStack.Screen name="SellerOnboarding" component={SellerOnboardingScreen} options={{ ...dsh, title: 'Seller Onboarding' }} />
      <ProfileStack.Screen name="SavedItems" component={SavedScreen} options={{ ...dsh, title: 'Saved Items' }} />
      <ProfileStack.Screen name="Orders" component={OrdersScreen} options={{ ...dsh, title: 'My Orders' }} />
      <ProfileStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ ...dsh, title: 'Order Details' }} />
      <ProfileStack.Screen name="MessagesCenter" component={ConversationListScreen} options={{ ...dsh, title: 'Messages' }} />
      <ProfileStack.Screen name="Chat" component={ChatScreen} options={{ ...dsh }} />
      <ProfileStack.Screen name="Verification" component={VerificationScreen} options={{ ...dsh, title: 'Verify Account' }} />
      <ProfileStack.Screen name="Categories" component={CategoriesScreen} options={{ ...dsh, title: 'Categories' }} />
      <ProfileStack.Screen name="Sellers" component={SellersScreen} options={{ ...dsh, title: 'Sellers' }} />
      {/* Seller tools */}
      <ProfileStack.Screen name="MyListings" component={MyListingsScreen} options={{ ...dsh, title: 'My Listings' }} />
      <ProfileStack.Screen name="CreateListing" component={CreateListingScreen} options={{ ...dsh, title: 'New Listing' }} />
      <ProfileStack.Screen name="SellerOrders" component={SellerOrdersScreen} options={{ ...dsh, title: 'Sales Orders' }} />
      <ProfileStack.Screen name="SellerAnalytics" component={SellerAnalyticsScreen} options={{ ...dsh, title: 'Seller Dashboard' }} />
      <ProfileStack.Screen name="SellerPayouts" component={SellerPayoutsScreen} options={{ ...dsh, title: 'Earnings' }} />
      <ProfileStack.Screen name="GrowthTools" component={GrowthToolsScreen} options={{ ...dsh, title: 'Growth Tools' }} />
      <ProfileStack.Screen name="DisputeCenter" component={DisputeCenterScreen} options={{ ...dsh, title: 'Disputes' }} />
      {/* Support & info */}
      <ProfileStack.Screen name="Support" component={SupportScreen} options={{ ...dsh, title: 'Support' }} />
      <ProfileStack.Screen name="Contact" component={ContactScreen} options={{ ...dsh, title: 'Contact' }} />
      <ProfileStack.Screen name="Terms" component={TermsScreen} options={{ ...dsh, title: 'Terms' }} />
      <ProfileStack.Screen name="FAQ" component={FAQScreen} options={{ ...dsh, title: 'FAQ' }} />
      <ProfileStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ ...dsh, title: 'Privacy Policy' }} />
      <ProfileStack.Screen name="AboutUs" component={AboutUsScreen} options={{ ...dsh, title: 'About Us' }} />
      {/* Campus */}
      <ProfileStack.Screen name="Pulse" component={PulseScreen} options={{ ...dsh, title: 'Campus Pulse' }} />
      <ProfileStack.Screen name="FollowingFeed" component={FollowingFeedScreen} options={{ ...dsh, title: 'Following Feed' }} />
      <ProfileStack.Screen name="LostFound" component={LostFoundScreen} options={{ ...dsh, title: 'Lost & Found' }} />
      <ProfileStack.Screen name="CollectionDetail" component={CollectionDetailScreen} options={{ ...dsh, title: 'Collection' }} />
      <ProfileStack.Screen name="Scanner" component={ScannerScreen} options={{ ...dsh, title: 'Scanner', headerShown: false }} />
      <ProfileStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} options={{ ...dsh, title: 'Transaction Ledger' }} />
      <ProfileStack.Screen name="Maintenance" component={MaintenanceScreen} options={{ ...dsh, title: 'Maintenance' }} />
    </ProfileStack.Navigator>
  );
};

// ── Custom Tab Bar ────────────────────────────────────────────────────────────
const ROUTE_CONFIG: Record<string, { label: string; icon: string; iconFocused: string }> = {
  HomeTab:     { label: 'Home',   icon: 'home-outline',                iconFocused: 'home' },
  ProductsTab: { label: 'Browse', icon: 'grid-outline',                iconFocused: 'grid' },
  AlertsTab:   { label: 'Alerts', icon: 'notifications-outline',       iconFocused: 'notifications' },
  MessagesTab: { label: 'Chat',   icon: 'chatbubble-ellipses-outline', iconFocused: 'chatbubble-ellipses' },
  ProfileTab:  { label: 'Me',     icon: 'person-outline',              iconFocused: 'person' },
};

const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const { unreadMessagesCount, unreadNotificationsCount } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');
  const isNarrow = width < 375;

  const BADGES: Record<string, number | undefined> = {
    AlertsTab:   unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    MessagesTab: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
  };

  const tabH = (isNarrow ? 56 : 64) + (Platform.OS === 'ios' ? insets.bottom : 0);

  return (
    <View
      style={{
        flexDirection: 'row',
        height: tabH,
        backgroundColor: colors.surface,
        borderTopWidth: 2,
        borderTopColor: colors.boardBorder,
        paddingBottom: Math.max(insets.bottom, 6),
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
          },
          android: { elevation: 12 },
        }),
      }}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = ROUTE_CONFIG[route.name] ?? {
          label: route.name,
          icon: 'ellipse-outline',
          iconFocused: 'ellipse',
        };
        const badge = BADGES[route.name];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!event.defaultPrevented) {
            if (route.name === 'ProductsTab') {
              navigation.navigate('ProductsTab' as any, { screen: 'ProductsHome' });
            } else if (route.name === 'ProfileTab') {
              navigation.navigate('ProfileTab' as any, { screen: 'ProfileHome' });
            } else {
              navigation.navigate(route.name as any);
            }
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.65}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 8,
              position: 'relative',
            }}
          >
            {/* Active indicator stripe at top */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                width: 28,
                height: 3,
                backgroundColor: isFocused ? colors.primary : 'transparent',
              }}
            />

            {/* Icon + badge */}
            <View style={{ position: 'relative' }}>
              <Ionicons
                name={(isFocused ? config.iconFocused : config.icon) as any}
                size={isNarrow ? 20 : 22}
                color={isFocused ? colors.primary : colors.textSecondary}
              />
              {badge != null && (
                <View
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -9,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: colors.danger,
                    borderWidth: 1.5,
                    borderColor: colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 7,
                      fontWeight: '900',
                      color: '#fff',
                      lineHeight: 9,
                    }}
                  >
                    {badge > 99 ? '99+' : String(badge)}
                  </Text>
                </View>
              )}
            </View>

            {/* Label */}
            <Text
              style={{
                marginTop: 3,
                fontSize: 8,
                fontWeight: isFocused ? '900' : '700',
                color: isFocused ? colors.primary : colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
              }}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ── Unified main tabs — same 5 tabs for buyer + seller ────────────────────────
const MainTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="HomeTab" component={HomeScreen} />
    <Tab.Screen name="ProductsTab" component={ProductsStackScreen} />
    <Tab.Screen name="AlertsTab" component={NotificationsStackScreen} />
    <Tab.Screen name="MessagesTab" component={MessagesStackScreen} />
    <Tab.Screen name="ProfileTab" component={ProfileStackScreen} />
  </Tab.Navigator>
);

const MainTabsWrapper = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminScreen />;
  return <MainTabs />;
};

// ── Root navigator ────────────────────────────────────────────────────────────
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const colors = useColors();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <View style={{ alignItems: 'center', gap: 20 }}>
          {/* Brand Row: Q-Logo box + U, A, D, S subscripts */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5 }}>
            <View
              style={{
                width: 76,
                height: 76,
                borderWidth: 4,
                borderColor: colors.boardBorder,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.boardShadow,
                shadowOffset: { width: 5, height: 5 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 5,
                position: 'relative',
              }}
            >
              <View style={{ width: 36, height: 36, borderWidth: 8, borderColor: colors.text, backgroundColor: 'transparent' }} />
              <View
                style={{
                  position: 'absolute',
                  bottom: 12,
                  right: 12,
                  width: 14,
                  height: 7,
                  backgroundColor: colors.text,
                  transform: [{ rotate: '45deg' }],
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: colors.pinRed,
                  borderWidth: 2,
                  borderColor: colors.boardBorder,
                }}
              />
            </View>

            {['U', 'A', 'D', 'S'].map((char, idx) => (
              <View
                key={idx}
                style={{
                  width: 28,
                  height: 28,
                  borderWidth: 2.2,
                  borderColor: colors.boardBorder,
                  backgroundColor: colors.surface,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 2,
                  shadowColor: colors.boardShadow,
                  shadowOffset: { width: 2, height: 2 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                  elevation: 2,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '900', color: colors.text }}>{char}</Text>
              </View>
            ))}
          </View>

          <Text
            style={{
              fontSize: 9,
              fontWeight: '900',
              letterSpacing: 1.4,
              color: colors.muted,
              textTransform: 'uppercase',
              borderTopWidth: 2,
              borderTopColor: colors.boardBorder,
              paddingTop: 8,
              marginTop: 4,
            }}
          >
            THE OFFICIAL INSTITUTIONAL MARKETPLACE
          </Text>

          <View
            style={{
              marginTop: 10,
              width: 140,
              height: 6,
              borderWidth: 2,
              borderColor: colors.boardBorder,
              backgroundColor: colors.surfaceSecondary,
              overflow: 'hidden',
            }}
          >
            <View style={{ width: '65%', height: '100%', backgroundColor: colors.accent }} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <View style={{ flex: 1 }}>
        <OfflineBanner />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <>
              <Stack.Screen name="Main" component={MainTabsWrapper} />
              <Stack.Screen
                name="Cart"
                component={CartScreen}
                options={{ ...makeStackHeader(colors), title: 'Shopping Cart', headerShown: true }}
              />
              <Stack.Screen
                name="Checkout"
                component={CheckoutScreen}
                options={{ ...makeStackHeader(colors), title: 'Checkout', headerShown: true }}
              />
              <Stack.Screen
                name="PaymentVerification"
                component={PaymentVerificationScreen}
                options={{ ...makeStackHeader(colors), title: 'Payment Status', headerShown: true }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
                options={{ ...makeStackHeader(colors), title: 'Reset Password', headerShown: true }}
              />
              <Stack.Screen
                name="ResetPassword"
                component={ResetPasswordScreen}
                options={{ ...makeStackHeader(colors), title: 'New Password', headerShown: true }}
              />
            </>
          )}
        </Stack.Navigator>
        {isAuthenticated && <FloatingCart />}
      </View>
    </NavigationContainer>
  );
};

export default AppNavigator;
