import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Text, View, Platform } from 'react-native';
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
import { colors, shadows } from '../theme';

const defaultStackHeader = {
  headerShown: true,
  headerBackTitle: 'Back',
  headerTitleStyle: {
    fontWeight: '900' as const,
    fontSize: 15,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.7,
    color: '#1f1a14',
  },
  headerStyle: {
    backgroundColor: colors.surface,
  },
  headerTintColor: '#1f1a14',
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Products stack ────────────────────────────────────────────────────────────
const ProductsStack = createNativeStackNavigator();
const ProductsStackScreen = () => (
  <ProductsStack.Navigator initialRouteName="ProductsHome" screenOptions={{ headerShown: false }}>
    <ProductsStack.Screen name="ProductsHome" component={ProductsScreen} />
    <ProductsStack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{ ...defaultStackHeader, title: 'Product Details' }}
    />
    <ProductsStack.Screen
      name="Checkout"
      component={CheckoutScreen}
      options={{ ...defaultStackHeader, title: 'Checkout' }}
    />
  </ProductsStack.Navigator>
);

// ── Messages stack ────────────────────────────────────────────────────────────
const MessagesStack = createNativeStackNavigator();
const MessagesStackScreen = () => (
  <MessagesStack.Navigator screenOptions={{ headerShown: false }}>
    <MessagesStack.Screen name="ConversationList" component={ConversationListScreen} />
    <MessagesStack.Screen
      name="Chat"
      component={ChatScreen}
      options={{ ...defaultStackHeader }}
    />
  </MessagesStack.Navigator>
);

// ── Seller tools stack ────────────────────────────────────────────────────────
const SellerStack = createNativeStackNavigator();
const SellerStackScreen = () => (
  <SellerStack.Navigator initialRouteName="MyListings" screenOptions={{ headerShown: false }}>
    <SellerStack.Screen
      name="CreateListing"
      component={CreateListingScreen}
      options={{ ...defaultStackHeader, title: 'New Listing' }}
    />
    <SellerStack.Screen name="MyListings" component={MyListingsScreen} />
    <SellerStack.Screen
      name="SellerAnalytics"
      component={SellerAnalyticsScreen}
      options={{ ...defaultStackHeader, title: 'Seller Dashboard' }}
    />
  </SellerStack.Navigator>
);

// ── Orders stack ──────────────────────────────────────────────────────────────
const OrdersStack = createNativeStackNavigator();
const OrdersStackScreen = () => (
  <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
    <OrdersStack.Screen name="OrdersList" component={OrdersScreen} />
    <OrdersStack.Screen
      name="OrderDetail"
      component={OrderDetailScreen}
      options={{ ...defaultStackHeader, title: 'Order Details' }}
    />
    <OrdersStack.Screen
      name="Scanner"
      component={ScannerScreen}
      options={{ ...defaultStackHeader, title: 'Scanner', headerShown: false }}
    />
  </OrdersStack.Navigator>
);

// ── Profile stack ─────────────────────────────────────────────────────────────
const ProfileStack = createNativeStackNavigator();
const ProfileStackScreen = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
    <ProfileStack.Screen
      name="ProfileEdit"
      component={ProfileEditScreen}
      options={{ ...defaultStackHeader, title: 'Edit Profile' }}
    />
    <ProfileStack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ ...defaultStackHeader, title: 'Settings' }}
    />
    <ProfileStack.Screen
      name="SellerOnboarding"
      component={SellerOnboardingScreen}
      options={{ ...defaultStackHeader, title: 'Seller Onboarding' }}
    />
    <ProfileStack.Screen
      name="SavedItems"
      component={SavedScreen}
      options={{ ...defaultStackHeader, title: 'Saved Items' }}
    />
    <ProfileStack.Screen
      name="Orders"
      component={OrdersScreen}
      options={{ ...defaultStackHeader, title: 'My Orders' }}
    />
    <ProfileStack.Screen
      name="OrderDetail"
      component={OrderDetailScreen}
      options={{ ...defaultStackHeader, title: 'Order Details' }}
    />
    <ProfileStack.Screen
      name="Alerts"
      component={NotificationsScreen}
      options={{ ...defaultStackHeader, title: 'Alerts' }}
    />
    <ProfileStack.Screen
      name="MessagesCenter"
      component={ConversationListScreen}
      options={{ ...defaultStackHeader, title: 'Messages' }}
    />
    <ProfileStack.Screen
      name="Chat"
      component={ChatScreen}
      options={{ ...defaultStackHeader }}
    />
    <ProfileStack.Screen
      name="Verification"
      component={VerificationScreen}
      options={{ ...defaultStackHeader, title: 'Verify Account' }}
    />
    <ProfileStack.Screen
      name="Checkout"
      component={CheckoutScreen}
      options={{ ...defaultStackHeader, title: 'Checkout' }}
    />
    <ProfileStack.Screen
      name="Categories"
      component={CategoriesScreen}
      options={{ ...defaultStackHeader, title: 'Categories' }}
    />
    <ProfileStack.Screen
      name="Sellers"
      component={SellersScreen}
      options={{ ...defaultStackHeader, title: 'Sellers' }}
    />
    <ProfileStack.Screen
      name="SellerOrders"
      component={SellerOrdersScreen}
      options={{ ...defaultStackHeader, title: 'Sales Orders' }}
    />
    <ProfileStack.Screen
      name="Cart"
      component={CartScreen}
      options={{ ...defaultStackHeader, title: 'Shopping Cart' }}
    />
    <ProfileStack.Screen
      name="PaymentVerification"
      component={PaymentVerificationScreen}
      options={{ ...defaultStackHeader, title: 'Payment Status' }}
    />
    <ProfileStack.Screen
      name="Support"
      component={SupportScreen}
      options={{ ...defaultStackHeader, title: 'Support' }}
    />
    <ProfileStack.Screen
      name="Contact"
      component={ContactScreen}
      options={{ ...defaultStackHeader, title: 'Contact' }}
    />
    <ProfileStack.Screen
      name="Terms"
      component={TermsScreen}
      options={{ ...defaultStackHeader, title: 'Terms' }}
    />
    <ProfileStack.Screen
      name="CollectionDetail"
      component={CollectionDetailScreen}
      options={{ ...defaultStackHeader, title: 'Collection' }}
    />
    <ProfileStack.Screen
      name="Scanner"
      component={ScannerScreen}
      options={{ ...defaultStackHeader, title: 'Scanner', headerShown: false }}
    />
    <ProfileStack.Screen
      name="LostFound"
      component={LostFoundScreen}
      options={{ ...defaultStackHeader, title: 'Lost & Found' }}
    />
    {/* Previously dead screens — now registered */}
    <ProfileStack.Screen
      name="SellerPayouts"
      component={SellerPayoutsScreen}
      options={{ ...defaultStackHeader, title: 'Earnings' }}
    />
    <ProfileStack.Screen
      name="DisputeCenter"
      component={DisputeCenterScreen}
      options={{ ...defaultStackHeader, title: 'Disputes' }}
    />
    <ProfileStack.Screen
      name="GrowthTools"
      component={GrowthToolsScreen}
      options={{ ...defaultStackHeader, title: 'Growth Tools' }}
    />
    <ProfileStack.Screen
      name="Maintenance"
      component={MaintenanceScreen}
      options={{ ...defaultStackHeader, title: 'Maintenance' }}
    />
    <ProfileStack.Screen
      name="FAQ"
      component={FAQScreen}
      options={{ ...defaultStackHeader, title: 'FAQ' }}
    />
    <ProfileStack.Screen
      name="PrivacyPolicy"
      component={PrivacyPolicyScreen}
      options={{ ...defaultStackHeader, title: 'Privacy Policy' }}
    />
    <ProfileStack.Screen
      name="AboutUs"
      component={AboutUsScreen}
      options={{ ...defaultStackHeader, title: 'About Us' }}
    />
    <ProfileStack.Screen
      name="FollowingFeed"
      component={FollowingFeedScreen}
      options={{ ...defaultStackHeader, title: 'Following Feed' }}
    />
    <ProfileStack.Screen
      name="Pulse"
      component={PulseScreen}
      options={{ ...defaultStackHeader, title: 'Campus Pulse' }}
    />
  </ProfileStack.Navigator>
);

const PulseStack = createNativeStackNavigator();
const PulseStackScreen = () => (
  <PulseStack.Navigator screenOptions={{ headerShown: false }}>
    <PulseStack.Screen name="PulseHome" component={PulseScreen} />
  </PulseStack.Navigator>
);

const SellerOrdersStack = createNativeStackNavigator();
const SellerOrdersStackScreen = () => (
  <SellerOrdersStack.Navigator screenOptions={{ headerShown: false }}>
    <SellerOrdersStack.Screen name="SellerOrdersHome" component={SellerOrdersScreen} />
  </SellerOrdersStack.Navigator>
);

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

  const commonOptions = {
    headerShown: false,
    tabBarActiveTintColor: colors.text,
    tabBarInactiveTintColor: '#9f9382',
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
      />
    </Tab.Navigator>
  );
};

const SellerTabs = () => {
  const { unreadMessagesCount, unreadNotificationsCount } = useAuth();
  const insets = useSafeAreaInsets();

  const commonOptions = {
    headerShown: false,
    tabBarActiveTintColor: colors.text,
    tabBarInactiveTintColor: '#9f9382',
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

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        {/* Stunning, Stylized Neobrutalist Splash Loading Screen */}
        <View style={{ alignItems: 'center', gap: 20 }}>
          {/* Centered Brand Mark box */}
          <View style={{
            width: 76,
            height: 76,
            borderWidth: 4,
            borderColor: '#000',
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
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
              borderColor: '#000',
              backgroundColor: 'transparent',
            }} />
            
            {/* Bold Stencil Q (Rotated Tail) */}
            <View style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              width: 14,
              height: 7,
              backgroundColor: '#000',
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
              backgroundColor: '#ff6b6b',
              borderWidth: 2,
              borderColor: '#000',
            }} />
          </View>

          {/* Large Stylized Brand Title */}
          <Text style={{
            fontSize: 48,
            fontWeight: '900',
            letterSpacing: -2,
            color: '#000',
            textShadowColor: colors.accent,
            textShadowOffset: { width: 3, height: 3 },
            textShadowRadius: 0,
          }}>
            QUADS
          </Text>

          {/* Official Tagline */}
          <Text style={{
            fontSize: 9,
            fontWeight: '900',
            letterSpacing: 1.2,
            color: '#7c6f60',
            textTransform: 'uppercase',
            borderTopWidth: 2,
            borderColor: '#000',
            paddingTop: 8,
            marginTop: 4,
          }}>
            THE OFFICIAL INSTITUTIONAL MARKETPLACE
          </Text>

          {/* High contrast loading progress indicator */}
          <View style={{
            marginTop: 15,
            width: 140,
            height: 6,
            borderWidth: 2,
            borderColor: '#000',
            backgroundColor: '#fff',
            overflow: 'hidden',
          }}>
            <View style={{
              width: '60%',
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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen 
            name="Main" 
            component={MainTabsWrapper} 
          />
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ ...defaultStackHeader, title: 'Reset Password', headerShown: true }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ ...defaultStackHeader, title: 'New Password', headerShown: true }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
