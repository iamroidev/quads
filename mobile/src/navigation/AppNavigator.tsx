import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

import {
   WelcomeScreen,
   LoginScreen,
   RegisterScreen,
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

// ── Seller tools stack ────────────────────────────────────────────────────────
const SellerStack = createNativeStackNavigator();
const SellerStackScreen = () => {
  const colors = useColors();
  const dsh = makeStackHeader(colors);
  return (
    <SellerStack.Navigator initialRouteName="MyListings" screenOptions={{ headerShown: false }}>
      <SellerStack.Screen name="CreateListing" component={CreateListingScreen} options={{ ...dsh, title: 'New Listing' }} />
      <SellerStack.Screen name="MyListings" component={MyListingsScreen} />
      <SellerStack.Screen name="SellerAnalytics" component={SellerAnalyticsScreen} options={{ ...dsh, title: 'Seller Dashboard' }} />
    </SellerStack.Navigator>
  );
};

// ── Orders stack ──────────────────────────────────────────────────────────────
const OrdersStack = createNativeStackNavigator();
const OrdersStackScreen = () => {
  const colors = useColors();
  const dsh = makeStackHeader(colors);
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="OrdersList" component={OrdersScreen} />
      <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ ...dsh, title: 'Order Details' }} />
      <OrdersStack.Screen name="Scanner" component={ScannerScreen} options={{ ...dsh, title: 'Scanner', headerShown: false }} />
    </OrdersStack.Navigator>
  );
};

// ── Profile stack ─────────────────────────────────────────────────────────────
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
      <ProfileStack.Screen name="Alerts" component={NotificationsScreen} options={{ ...dsh, title: 'Alerts' }} />
      <ProfileStack.Screen name="MessagesCenter" component={ConversationListScreen} options={{ ...dsh, title: 'Messages' }} />
      <ProfileStack.Screen name="Chat" component={ChatScreen} options={{ ...dsh }} />
      <ProfileStack.Screen name="Verification" component={VerificationScreen} options={{ ...dsh, title: 'Verify Account' }} />
      <ProfileStack.Screen name="Categories" component={CategoriesScreen} options={{ ...dsh, title: 'Categories' }} />
      <ProfileStack.Screen name="Sellers" component={SellersScreen} options={{ ...dsh, title: 'Sellers' }} />
      <ProfileStack.Screen name="MyListings" component={MyListingsScreen} options={{ ...dsh, title: 'My Listings' }} />
      <ProfileStack.Screen name="SellerOrders" component={SellerOrdersScreen} options={{ ...dsh, title: 'Sales Orders' }} />
      <ProfileStack.Screen name="Support" component={SupportScreen} options={{ ...dsh, title: 'Support' }} />
      <ProfileStack.Screen name="Contact" component={ContactScreen} options={{ ...dsh, title: 'Contact' }} />
      <ProfileStack.Screen name="Terms" component={TermsScreen} options={{ ...dsh, title: 'Terms' }} />
      <ProfileStack.Screen name="CollectionDetail" component={CollectionDetailScreen} options={{ ...dsh, title: 'Collection' }} />
      <ProfileStack.Screen name="Scanner" component={ScannerScreen} options={{ ...dsh, title: 'Scanner', headerShown: false }} />
      <ProfileStack.Screen name="LostFound" component={LostFoundScreen} options={{ ...dsh, title: 'Lost & Found' }} />
      <ProfileStack.Screen name="SellerPayouts" component={SellerPayoutsScreen} options={{ ...dsh, title: 'Earnings' }} />
      <ProfileStack.Screen name="DisputeCenter" component={DisputeCenterScreen} options={{ ...dsh, title: 'Disputes' }} />
      <ProfileStack.Screen name="GrowthTools" component={GrowthToolsScreen} options={{ ...dsh, title: 'Growth Tools' }} />
      <ProfileStack.Screen name="Maintenance" component={MaintenanceScreen} options={{ ...dsh, title: 'Maintenance' }} />
      <ProfileStack.Screen name="FAQ" component={FAQScreen} options={{ ...dsh, title: 'FAQ' }} />
      <ProfileStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ ...dsh, title: 'Privacy Policy' }} />
      <ProfileStack.Screen name="AboutUs" component={AboutUsScreen} options={{ ...dsh, title: 'About Us' }} />
      <ProfileStack.Screen name="FollowingFeed" component={FollowingFeedScreen} options={{ ...dsh, title: 'Following Feed' }} />
      <ProfileStack.Screen name="Pulse" component={PulseScreen} options={{ ...dsh, title: 'Campus Pulse' }} />
    </ProfileStack.Navigator>
  );
};

const PulseStack = createNativeStackNavigator();
const PulseStackScreen = () => (
  <PulseStack.Navigator screenOptions={{ headerShown: false }}>
    <PulseStack.Screen name="PulseHome" component={PulseScreen} />
  </PulseStack.Navigator>
);

const SellerOrdersStack = createNativeStackNavigator();
const SellerOrdersStackScreen = () => {
  const colors = useColors();
  const dsh = makeStackHeader(colors);
  return (
    <SellerOrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <SellerOrdersStack.Screen name="SellerOrdersHome" component={SellerOrdersScreen} />
      <SellerOrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ ...dsh, title: 'Order Details' }} />
    </SellerOrdersStack.Navigator>
  );
};

const GrowthToolsStack = createNativeStackNavigator();
const GrowthToolsStackScreen = () => (
  <GrowthToolsStack.Navigator screenOptions={{ headerShown: false }}>
    <GrowthToolsStack.Screen name="GrowthToolsHome" component={GrowthToolsScreen} />
  </GrowthToolsStack.Navigator>
);

// ── Bottom tabs ───────────────────────────────────────────────────────────────
const tabIcon = (name: any) => ({ color }: { color: string }) => (
  <Ionicons name={name} size={19} color={color} />
);

const BuyerTabs = () => {
  const { unreadMessagesCount, unreadNotificationsCount } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const commonOptions = {
    headerShown: false,
    tabBarActiveTintColor: colors.text,
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarStyle: {
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      height: 62 + (Platform.OS === 'ios' ? insets.bottom : 0),
      paddingTop: 8,
      paddingBottom: Math.max(insets.bottom, 8),
      paddingHorizontal: 0,
    },
    tabBarLabelStyle: {
      fontSize: 8,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 0,
    } as any,
    tabBarItemStyle: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 0,
    } as any,
  };

  return (
    <Tab.Navigator screenOptions={commonOptions as any}>
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Home', tabBarIcon: tabIcon('home-outline') }}
      />
      <Tab.Screen
        name="ProductsTab"
        component={ProductsStackScreen}
        options={{ 
          title: 'Browse', 
          tabBarIcon: tabIcon('grid-outline')
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('ProductsTab', { screen: 'ProductsHome' });
          },
        })}
      />
      <Tab.Screen
        name="PulseTab"
        component={PulseStackScreen}
        options={{ title: 'Pulse', tabBarIcon: tabIcon('flash-outline') }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackScreen}
        options={{ title: 'Orders', tabBarIcon: tabIcon('receipt-outline') }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesStackScreen}
        options={{
          title: 'Chat',
          tabBarIcon: tabIcon('chatbubble-ellipses-outline'),
          tabBarBadge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{
          title: 'Me',
          tabBarIcon: tabIcon('person-outline'),
          tabBarBadge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('ProfileTab', { screen: 'ProfileHome' });
          },
        })}
      />
    </Tab.Navigator>
  );
};

const SellerTabs = () => {
  const { unreadMessagesCount, unreadNotificationsCount } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const commonOptions = {
    headerShown: false,
    tabBarActiveTintColor: colors.text,
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarStyle: {
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      height: 62 + (Platform.OS === 'ios' ? insets.bottom : 0),
      paddingTop: 8,
      paddingBottom: Math.max(insets.bottom, 8),
      paddingHorizontal: 0,
    },
    tabBarLabelStyle: {
      fontSize: 8,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 0,
    } as any,
    tabBarItemStyle: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 0,
    } as any,
  };

  return (
    <Tab.Navigator screenOptions={commonOptions as any}>
      <Tab.Screen
        name="SellerDashboard"
        component={SellerAnalyticsScreen}
        options={{ title: 'Dashboard', tabBarIcon: tabIcon('analytics-outline') }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={SellerStackScreen}
        options={{ title: 'Inventory', tabBarIcon: tabIcon('cube-outline') }}
      />
      <Tab.Screen
        name="SellerOrdersTab"
        component={SellerOrdersStackScreen}
        options={{ title: 'Sales', tabBarIcon: tabIcon('receipt-outline') }}
      />
      <Tab.Screen
        name="GrowthTab"
        component={GrowthToolsStackScreen}
        options={{ title: 'Growth', tabBarIcon: tabIcon('rocket-outline') }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesStackScreen}
        options={{
          title: 'Chat',
          tabBarIcon: tabIcon('chatbubble-ellipses-outline'),
          tabBarBadge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{
          title: 'Me',
          tabBarIcon: tabIcon('person-outline'),
          tabBarBadge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('ProfileTab', { screen: 'ProfileHome' });
          },
        })}
      />
    </Tab.Navigator>
  );
};

const MainTabsWrapper = () => {
  const { user, viewMode } = useAuth();
  const isSellerMode = (user?.role === 'seller' || user?.role === 'admin') && viewMode === 'seller';
  return isSellerMode ? <SellerTabs /> : <BuyerTabs />;
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
            {/* Centered Brand Mark Box (Q-Logo) */}
            <View style={{
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
            }}>
              {/* Bold Stencil Q (Outer Frame) */}
              <View style={{
                width: 36,
                height: 36,
                borderWidth: 8,
                borderColor: colors.text,
                backgroundColor: 'transparent',
              }} />

              {/* Bold Stencil Q (Rotated Tail) */}
              <View style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                width: 14,
                height: 7,
                backgroundColor: colors.text,
                transform: [{ rotate: '45deg' }],
              }} />

              {/* Red Thumbtack detail (Top Right) */}
              <View style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.pinRed,
                borderWidth: 2,
                borderColor: colors.boardBorder,
              }} />
            </View>

            {/* Subscript letters: U A D S */}
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

          {/* Official Tagline */}
          <Text style={{
            fontSize: 9,
            fontWeight: '900',
            letterSpacing: 1.4,
            color: colors.muted,
            textTransform: 'uppercase',
            borderTopWidth: 2,
            borderTopColor: colors.boardBorder,
            paddingTop: 8,
            marginTop: 4,
          }}>
            THE OFFICIAL INSTITUTIONAL MARKETPLACE
          </Text>

          {/* High contrast loading progress indicator */}
          <View style={{
            marginTop: 10,
            width: 140,
            height: 6,
            borderWidth: 2,
            borderColor: colors.boardBorder,
            backgroundColor: colors.surfaceSecondary,
            overflow: 'hidden',
          }}>
            <View style={{
              width: '65%',
              height: '100%',
              backgroundColor: colors.accent,
            }} />
          </View>
        </View>
      </View>
    );
  }


  return (
    <NavigationContainer ref={navigationRef}>
      <View style={{ flex: 1 }}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <>
              <Stack.Screen 
                name="Main" 
                component={MainTabsWrapper} 
              />
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
