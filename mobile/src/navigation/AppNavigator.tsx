import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

import {
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
 } from '../screens';
import { navigationRef } from './navigationRef';
import { colors } from '../theme';

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
    backgroundColor: '#fffdf8',
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
               name="MessagesList"
               component={ConversationListScreen}
               options={{ ...defaultStackHeader, title: 'Messages' }}
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
          </ProfileStack.Navigator>
        );

// ── Bottom tabs ───────────────────────────────────────────────────────────────
const tabIcon = (name: any) => ({ color }: { color: string }) => (
  <Ionicons name={name} size={19} color={color} />
);

const MainTabs = () => {
  const { user, viewMode } = useAuth();
  const isSellerMode = (user?.role === 'seller' || user?.role === 'admin') && viewMode === 'seller';
  const insets = useSafeAreaInsets();

  const commonOptions = {
    headerShown: false,
    tabBarActiveTintColor: colors.text,
    tabBarInactiveTintColor: '#9f9382',
    tabBarStyle: {
      borderTopColor: colors.border,
      backgroundColor: '#fffdf8',
      height: 62 + (Platform.OS === 'ios' ? insets.bottom : 0),
      paddingTop: 8,
      paddingBottom: Math.max(insets.bottom, 8),
      paddingHorizontal: 0,
    },
    tabBarLabelStyle: {
      fontSize: 9,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
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
      {isSellerMode && (
        <Tab.Screen
          name="SellerDashboard"
          component={SellerAnalyticsScreen}
          options={{ title: 'Dashboard', tabBarIcon: tabIcon('analytics-outline') }}
        />
      )}
      {isSellerMode && (
        <Tab.Screen
          name="InventoryTab"
          component={SellerStackScreen}
          options={{ title: 'Inventory', tabBarIcon: tabIcon('cube-outline') }}
        />
      )}

      {!isSellerMode && (
        <Tab.Screen
          name="HomeTab"
          component={HomeScreen}
          options={{ title: 'Home', tabBarIcon: tabIcon('home-outline') }}
        />
      )}
{!isSellerMode && (
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
       )}
       {!isSellerMode && (
         <Tab.Screen
           name="PulseTab"
           component={PulseScreen}
           options={{ title: 'Pulse', tabBarIcon: tabIcon('pulse-outline') }}
         />
       )}
       <Tab.Screen
         name="MessagesTab"
         component={MessagesStackScreen}
         options={{ title: 'Chat', tabBarIcon: tabIcon('chatbubble-ellipses-outline') }}
       />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{ title: 'Me', tabBarIcon: tabIcon('person-outline') }}
      />
    </Tab.Navigator>
  );
};

// ── Root navigator ────────────────────────────────────────────────────────────
const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ ...defaultStackHeader, title: 'Reset Password', headerShown: true }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
