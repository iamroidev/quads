import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadows } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';
import { Product } from '../types';
import { useNavigation } from '@react-navigation/native';
import { CardSkeleton } from '../components/SkeletonLoader';

const FollowingFeedScreen = () => {
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await api.get('/feed/pulse');
        if (res.data?.success && res.data?.data?.sections?.fromFollowing) {
          setProducts(res.data.data.sections.fromFollowing);
        }
      } catch (err) {
        console.error('Failed to fetch following feed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const getProductImage = (p: Product) => {
    return p.images && p.images[0]?.url ? { uri: p.images[0].url } : require('../../assets/adaptive-icon.png');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow="NETWORK ACTIVITY"
          title="Following"
          subtitle="Real-time listing updates from campus sellers you follow."
        />

        {loading ? (
          <View style={styles.grid}>
            <CardSkeleton />
            <CardSkeleton />
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Feed is quiet</Text>
            <Text style={styles.emptyText}>
              You aren't following any sellers yet, or the sellers you follow haven't posted new listings recently.
            </Text>
            <TouchableOpacity
              style={styles.findBtn}
              onPress={() => navigation.navigate('Sellers')}
            >
              <Text style={styles.findBtnText}>Find Campus Sellers</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {products.map((product) => (
              <TouchableOpacity
                key={product._id}
                style={styles.card}
                onPress={() =>
                  navigation.navigate('ProductsTab', {
                    screen: 'ProductDetail',
                    params: { productId: product._id },
                  })
                }
              >
                <Image source={getProductImage(product)} style={styles.cardImage} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {product.title}
                  </Text>
                  <View style={styles.row}>
                    <Text style={styles.price}>GHS {product.price}</Text>
                    <Text style={styles.sellerName}>
                      {typeof product.seller === 'object' ? (product.seller as any).name : 'Seller'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  grid: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.bulletin,
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.bg,
  },
  cardBody: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: colors.text,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ff6b6b',
  },
  sellerName: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: colors.muted,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  emptyCard: {
    margin: 16,
    padding: 32,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#fffacd',
    alignItems: 'center',
    ...shadows.bulletin,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: colors.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  findBtn: {
    backgroundColor: colors.text,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  findBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default FollowingFeedScreen;
