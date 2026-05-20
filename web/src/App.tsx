import React, { lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Routes, Route, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from './components/layout';
import { ProtectedRoute } from './components/auth';
import { useAuth } from './context/AuthContext';

const lazyWithRetry = (
  importer: () => Promise<{ default: React.ComponentType }>,
  moduleId: string
) =>
  lazy(async () => {
    const retryKey = `lazy-retry:${moduleId}`;

    try {
      const loadedModule = await importer();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(retryKey);
      }
      return loadedModule;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isChunkLoadError = /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i.test(
        message
      );

      if (isChunkLoadError && typeof window !== 'undefined') {
        const hasRetried = sessionStorage.getItem(retryKey) === '1';

        if (!hasRetried) {
          sessionStorage.setItem(retryKey, '1');
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations().catch(() => []);
            await Promise.all(
              registrations.map((registration) => registration.update().catch(() => undefined))
            );
          }
          window.location.reload();
          return new Promise<never>(() => {});
        }

        sessionStorage.removeItem(retryKey);
      }

      throw error;
    }
  });

// Pages
// All pages lazy-loaded for optimal initial bundle size
const HomePage               = lazyWithRetry(() => import('./pages/Home'), 'home');
const DashboardPage          = lazyWithRetry(() => import('./pages/Dashboard'), 'dashboard');
const LoginPage              = lazyWithRetry(() => import('./pages/Login'), 'login');
const RegisterPage           = lazyWithRetry(() => import('./pages/Register'), 'register');
const ProfilePage            = lazyWithRetry(() => import('./pages/Profile'), 'profile');
const NotFoundPage           = lazyWithRetry(() => import('./pages/NotFound'), 'not-found');
const ProductsPage           = lazyWithRetry(() => import('./pages/Products'), 'products');
const FollowingFeedPage      = lazyWithRetry(() => import('./pages/FollowingFeed'), 'following');
const ProductDetailPage      = lazyWithRetry(() => import('./pages/ProductDetail'), 'product-detail');
const CreateEditProductPage  = lazyWithRetry(() => import('./pages/CreateEditProduct'), 'create-product');
const MyListingsPage         = lazyWithRetry(() => import('./pages/MyListings'), 'my-listings');
const CategoriesPage         = lazyWithRetry(() => import('./pages/Categories'), 'categories');
const MessagesPage           = lazyWithRetry(() => import('./pages/Messages'), 'messages');
const ChatRoomPage           = lazyWithRetry(() => import('./pages/ChatRoom'), 'chatroom');
const CheckoutPage           = lazyWithRetry(() => import('./pages/Checkout'), 'checkout');
const PaymentVerificationPage= lazyWithRetry(() => import('./pages/PaymentVerification'), 'payment-verify');
const OrdersPage             = lazyWithRetry(() => import('./pages/Orders'), 'orders');
const OrderDetailPage        = lazyWithRetry(() => import('./pages/OrderDetail'), 'order-detail');
const SellerOrdersPage       = lazyWithRetry(() => import('./pages/SellerOrders'), 'seller-orders');
const SavedItemsPage         = lazyWithRetry(() => import('./pages/SavedItems'), 'saved');
const NotificationsPage      = lazyWithRetry(() => import('./pages/Notifications'), 'notifications');
const AdminDashboardPage     = lazyWithRetry(() => import('./pages/AdminDashboard'), 'admin');
const SettingsPage           = lazyWithRetry(() => import('./pages/Settings'), 'settings');
const SellerAnalyticsPage    = lazyWithRetry(() => import('./pages/SellerAnalytics'), 'seller-analytics');
const CollectionDetailPage   = lazyWithRetry(() => import('./pages/CollectionDetail'), 'collection');
const SellerOnboardingPage   = lazyWithRetry(() => import('./pages/SellerOnboarding'), 'seller-onboarding');
const AdminGrowthPage        = lazyWithRetry(() => import('./pages/AdminGrowth'), 'admin-growth');
const VerificationPage       = lazyWithRetry(() => import('./pages/Verification'), 'verification');
const ForgotPasswordPage     = lazyWithRetry(() => import('./pages/ForgotPassword'), 'forgot-password');
const ResetPasswordPage      = lazyWithRetry(() => import('./pages/ResetPassword'), 'reset-password');
const SupportPage            = lazyWithRetry(() => import('./pages/Support'), 'support');
const SellerPayoutsPage      = lazyWithRetry(() => import('./pages/SellerPayouts'), 'seller-payouts');
const ContactPage            = lazyWithRetry(() => import('./pages/Contact'), 'contact');
const TermsPage              = lazyWithRetry(() => import('./pages/Terms'), 'terms');
const CartPage               = lazyWithRetry(() => import('./pages/Cart'), 'cart');
const MaintenancePage        = lazyWithRetry(() => import('./pages/Maintenance'), 'maintenance');
const SellersPage            = lazyWithRetry(() => import('./pages/Sellers'), 'sellers');
const GrowthToolsPage        = lazyWithRetry(() => import('./pages/GrowthTools'), 'growth-tools');
const PulsePage              = lazyWithRetry(() => import('./pages/Pulse'), 'pulse');
const PrivacyPolicyPage      = lazyWithRetry(() => import('./pages/PrivacyPolicy'), 'privacy');
const FAQPage                = lazyWithRetry(() => import('./pages/FAQ'), 'faq');
const AboutUsPage            = lazyWithRetry(() => import('./pages/AboutUs'), 'about');
const LostFoundPage          = lazyWithRetry(() => import('./pages/LostFound'), 'lost-found');
const StorefrontPage         = lazyWithRetry(() => import('./pages/Storefront'), 'storefront');

import { LoadingSpinner } from './components/ui';


// Redirect helpers for legacy routes
const SearchRedirect: React.FC = () => {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  return <Navigate to={`/products${q ? `?search=${encodeURIComponent(q)}` : ''}`} replace />;
};

const CategoryRedirect: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/products?category=${slug || ''}`} replace />;
};

const SellerRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/products?seller=${id || ''}`} replace />;
};

// Root: guests → landing, logged-in → dashboard
const RootRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <HomePage />;
  return user?.roles?.includes('admin') ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <Suspense fallback={<LoadingSpinner fullScreen text="Loading page..." />}>
        <Routes>
      {/* Public routes with layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<RootRoute />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Product routes */}
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/following" element={<ProtectedRoute><FollowingFeedPage /></ProtectedRoute>} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route
          path="/sell"
          element={
            <ProtectedRoute roles={['seller', 'admin']}>
              <CreateEditProductPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <ProtectedRoute roles={['seller', 'admin']}>
              <CreateEditProductPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-listings"
          element={
            <ProtectedRoute roles={['seller', 'admin']}>
              <MyListingsPage />
            </ProtectedRoute>
          }
        />

        {/* Order & Payment routes */}
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/:id"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/verify"
          element={
            <ProtectedRoute>
              <PaymentVerificationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/orders"
          element={
            <ProtectedRoute roles={['seller', 'admin']}>
              <SellerOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/growth"
          element={
            <ProtectedRoute roles={['seller', 'admin']}>
              <GrowthToolsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/analytics"
          element={
            <ProtectedRoute roles={['seller', 'admin']}>
              <SellerAnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/payouts"
          element={
            <ProtectedRoute roles={['seller', 'admin']}>
              <SellerPayoutsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/onboarding"
          element={
            <ProtectedRoute roles={['buyer', 'seller', 'admin']}>
              <SellerOnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Messaging routes */}
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:id"
          element={
            <ProtectedRoute>
              <ChatRoomPage />
            </ProtectedRoute>
          }
        />

        {/* Redirect routes for backward compat */}
        <Route path="/search" element={<SearchRedirect />} />
        <Route path="/category/:slug" element={<CategoryRedirect />} />
        <Route path="/sellers/:id" element={<SellerRedirect />} />
        <Route path="/pulse" element={<PulsePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/collections/:slug" element={<CollectionDetailPage />} />
        <Route path="/lost-found" element={<LostFoundPage />} />
        <Route path="/store/:slug" element={<StorefrontPage />} />

        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <SavedItemsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/verification" element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/sellers" element={<SellersPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/growth"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminGrowthPage />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      </Routes>
      </Suspense>
    </HelmetProvider>
  );
};

export default App;
