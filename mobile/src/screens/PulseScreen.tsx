import React, { useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadows } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';
import { CardSkeleton, SkeletonPulse } from '../components/SkeletonLoader';

interface PulseProduct {
  _id: string;
  title: string;
  price: number;
  images?: { url: string }[];
  views?: number;
  seller?: { name: string; storeName?: string };
  pickupLocation?: string;
  condition?: string;
}

interface PulseData {
  sections: {
    trending: PulseProduct[];
    nearYou: PulseProduct[];
    newArrivals: PulseProduct[];
  };
  activities: any[];
  pulse: any[];
}

const formatPrice = (n: number) => {
  const value = typeof n === 'number' ? n : parseFloat(n as any) || 0;
  return `GHS ${value.toFixed(2)}`;
};

const PulseScreen = ({ navigation }: any) => {
  const [data, setData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPulse = async () => {
    try {
      const r = await api.get('/feed/pulse');
      if (r.data?.success) {
        setData(r.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch pulse feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPulse();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPulse();
    setRefreshing(false);
  };

  const navigateToProduct = (id: string) => {
    navigation.navigate('ProductsTab', {
      screen: 'ProductDetail',
      params: { productId: id },
    });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader
          eyebrow="Discovery"
          title="Campus Pulse"
          subtitle="Trending items and activity from your network."
        />
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE FEED</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <SkeletonPulse width="40%" height={16} style={{ marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <CardSkeleton />
            <CardSkeleton />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const renderProductCard = (product: PulseProduct) => (
    <TouchableOpacity
      key={product._id}
      style={styles.productCard}
      onPress={() => navigateToProduct(product._id)}
    >
      <Image
        source={
          product.images && product.images[0]?.url
            ? { uri: product.images[0].url }
            : require('../../assets/adaptive-icon.png')
        }
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productSeller} numberOfLines={1}>
          {product.seller?.storeName || product.seller?.name || 'Student Seller'}
        </Text>
        <Text style={styles.productTitle} numberOfLines={1}>
          {product.title || 'Campus Item'}
        </Text>
        <View style={styles.productBottom}>
          <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
          <Text style={styles.productViews}>👁 {product.views || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSection = (
    label: string,
    title: string,
    items: PulseProduct[],
    emoji: string,
  ) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionLabel}>
              {emoji} {label}
            </Text>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScroll}
        >
          {items.map(renderProductCard)}
        </ScrollView>
      </View>
    );
  };

  const hasData =
    data &&
    ((data.sections?.trending?.length || 0) > 0 ||
      (data.sections?.nearYou?.length || 0) > 0 ||
      (data.sections?.newArrivals?.length || 0) > 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ScreenHeader
          eyebrow="Discovery"
          title="Campus Pulse"
          subtitle="Trending items and activity from your network."
        />

        {/* Live indicator */}
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE FEED</Text>
        </View>

        {!hasData ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📡</Text>
            <Text style={styles.emptyTitle}>Calibrating...</Text>
            <Text style={styles.emptySub}>
              Pulse learns from campus trends to show you relevant gear first.
            </Text>
          </View>
        ) : (
          <>
            {renderSection(
              'HYPER-LOCAL',
              'Hot In Your Hall',
              data!.sections.nearYou || [],
              '📍',
            )}
            {renderSection(
              'TRENDING',
              'Most Pinned Today',
              data!.sections.trending || [],
              '🔥',
            )}
            {renderSection(
              'FRESH',
              'Just Dropped',
              data!.sections.newArrivals || [],
              '✨',
            )}
          </>
        )}

        {/* Smart Feed banner */}
        <View style={styles.smartBanner}>
          <Text style={styles.smartBannerTitle}>⚡ SMART FEED</Text>
          <Text style={styles.smartBannerSub}>
            Pulse learns from campus trends to show you relevant gear first.
          </Text>
          <Text style={styles.smartBannerCode}>
            /// CALIBRATING NODE: TARKWA-HQ ///
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b6b',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ff6b6b',
    letterSpacing: 2,
  },
  section: { marginTop: 24 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ff6b6b',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  hScroll: { paddingHorizontal: 16, gap: 12 },
  productCard: {
    width: 200,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.bulletin,
  },
  productImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#e5e7eb',
  },
  productInfo: { padding: 10 },
  productSeller: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.text,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  productBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: { fontSize: 16, fontWeight: '900', color: colors.text },
  productViews: { fontSize: 10, color: colors.muted },
  emptyWrap: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    textTransform: 'uppercase',
  },
  emptySub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  smartBanner: {
    marginTop: 32,
    marginHorizontal: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#fffacd',
    padding: 20,
    ...shadows.bulletin,
  },
  smartBannerTitle: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: colors.text,
  },
  smartBannerSub: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.6)',
    marginTop: 6,
    lineHeight: 18,
  },
  smartBannerCode: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.2)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 12,
  },
});

export default PulseScreen;
