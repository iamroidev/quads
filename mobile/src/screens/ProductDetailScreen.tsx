import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
import productService from '../services/product.service';
import savedService from '../services/saved.service';
import chatService from '../services/chat.service';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const ProductDetailScreen = ({ route, navigation }: any) => {
  const { productId } = route.params;
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [priceInsights, setPriceInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const imageScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [productRes, relatedRes, recRes, insightsRes] = await Promise.all([
          productService.getProductById(productId),
          productService.getRelated(productId, 6),
          productService.getRecommendations({ productId, limit: 6 }),
          productService.getPriceInsights(productId),
        ]);
        if (productRes.success) setProduct(productRes.data.product);
        if (relatedRes.success) setRelatedProducts(relatedRes.data);
        if (recRes.success) setRecommendations(recRes.data);
        if (insightsRes.success) setPriceInsights(insightsRes.data);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [productId]);

  useEffect(() => {
    if (!product || !user || product.seller?._id === user._id) return;
    savedService.isSaved(product._id).then((res) => {
      if (res.success) setIsSaved(res.data.isSaved);
    }).catch(() => {});
  }, [product, user]);

  const sellerName = useMemo(() => {
    if (!product) return '';
    return product.seller?.storeName || product.seller?.brandName || product.seller?.name || 'Seller';
  }, [product]);

  const handleToggleSaved = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const res = await savedService.toggleSavedItem(product._id);
      if (res.success) setIsSaved(res.data.saved);
    } finally {
      setSaving(false);
    }
  };

  const handleMessageSeller = async () => {
    if (!product?.seller?._id || startingChat) return;
    setStartingChat(true);
    try {
      const res = await chatService.getOrCreateConversation(product.seller._id, product._id);
      if (res.success) {
        navigation.getParent()?.navigate('MessagesTab', {
          screen: 'Chat',
          params: {
            conversationId: res.data.conversation._id,
            otherUser: { _id: product.seller._id, name: sellerName, avatar: product.seller.avatar },
            productTitle: product.title,
          },
        });
      }
    } finally {
      setStartingChat(false);
    }
  };

  const renderMiniProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.miniCard} onPress={() => navigation.replace('ProductDetail', { productId: item._id })}>
      <Image source={{ uri: item.images?.[0]?.url || 'https://placehold.co/200x140/e2e8f0/64748b?text=Item' }} style={styles.miniImage} />
      <Text style={styles.miniTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.miniPrice}>GHS {item.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</Text>
    </TouchableOpacity>
  );

  if (loading || !product) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.accent} /></View>;
  }

  const dealLabel = priceInsights?.dealLabel === 'great_deal' ? 'Great deal' : priceInsights?.dealLabel === 'premium' ? 'Premium' : 'Fair price';

  const images = product.images?.length ? product.images : [{ url: 'https://placehold.co/900x560/e2e8f0/64748b?text=Product' }];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        {/* Image gallery */}
        <View>
          <ScrollView
            ref={imageScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
              setActiveImageIdx(idx);
            }}
          >
            {images.map((img, i) => (
              <Image
                key={i}
                source={{ uri: img.url }}
                style={[styles.heroImage, { width: SCREEN_W }]}
              />
            ))}
          </ScrollView>
          {images.length > 1 && (
            <View style={styles.imageDots}>
              {images.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.imageDot, i === activeImageIdx && styles.imageDotActive]}
                  onPress={() => {
                    imageScrollRef.current?.scrollTo({ x: i * SCREEN_W, animated: true });
                    setActiveImageIdx(i);
                  }}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.sheet}>
          <Text style={styles.category}>{product.category?.name || 'General'}</Text>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</Text>

          {priceInsights ? (
            <View style={styles.intelligenceCard}>
              <Text style={styles.intelTitle}>Price intelligence</Text>
              <Text style={styles.intelMeta}>Market range: GHS {Math.round(priceInsights.min)} - GHS {Math.round(priceInsights.max)}</Text>
              <Text style={styles.intelMeta}>Average: GHS {Math.round(priceInsights.average)}</Text>
              <Text style={styles.intelMeta}>Quartile range: GHS {Math.round(priceInsights.q1)} - GHS {Math.round(priceInsights.q3)}</Text>
              <Text style={styles.intelMeta}>Compared against {priceInsights.sampleSize} similar listings</Text>
              <Text style={styles.intelDeal}>{dealLabel}</Text>
            </View>
          ) : null}

          <View style={styles.metaChips}>
            <Text style={styles.chip}>{product.condition.replace('-', ' ')}</Text>
            <Text style={styles.chip}>{product.deliveryOption === 'pickup' ? 'Campus Pickup Only' : product.deliveryOption}</Text>
            <Text style={styles.chip}>{product.views} views</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tags</Text>
            <Text style={styles.meta}>{(product as any).tags?.join(', ') || 'No tags'}</Text>
          </View>

          {user && user._id !== product.seller?._id ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.primaryAction, { flex: 1 }]}
                onPress={() => navigation.navigate('Checkout', { product })}
              >
                <Text style={styles.primaryActionText}>Buy Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryAction, { backgroundColor: colors.surface, borderColor: colors.border }, startingChat && { opacity: 0.7 }]}
                onPress={handleMessageSeller}
              >
                <Text style={[styles.primaryActionText, { color: colors.text }]}>{startingChat ? '...' : 'Chat'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryAction, saving && { opacity: 0.7 }]} onPress={handleToggleSaved}>
                <Text style={styles.secondaryActionText}>{isSaved ? '♥' : '♡'}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Seller</Text>
            <Text style={styles.sellerName}>{sellerName}</Text>
            {!!product.seller?.location && <Text style={styles.meta}>{product.seller.location}</Text>}
          </View>

          {relatedProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Similar Products</Text>
              <FlatList horizontal data={relatedProducts} keyExtractor={(item) => item._id} renderItem={renderMiniProduct} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }} />
            </View>
          )}

          {recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Because you viewed this</Text>
              <FlatList horizontal data={recommendations} keyExtractor={(item) => item._id} renderItem={renderMiniProduct} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }} />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  heroImage: { width: SCREEN_W, height: 280, backgroundColor: '#e5e7eb' },
  imageDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, position: 'absolute', bottom: 10, left: 0, right: 0 },
  imageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)' },
  imageDotActive: { backgroundColor: '#fff', width: 16 },
  sheet: { backgroundColor: '#fffdf8', borderTopWidth: 1, borderTopColor: colors.border, padding: 16 },
  category: { fontSize: 10, color: '#7b6f61', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  title: { marginTop: 8, fontSize: 24, fontWeight: '900', color: '#1f1a14', textTransform: 'uppercase', lineHeight: 30 },
  price: { marginTop: 6, fontSize: 28, fontWeight: '900', color: '#2f5d4f' },
  intelligenceCard: { marginTop: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', padding: 12 },
  intelTitle: { fontSize: 11, color: '#6f6559', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1 },
  intelMeta: { marginTop: 4, fontSize: 12, color: '#4b4136' },
  intelDeal: { marginTop: 6, fontSize: 12, fontWeight: '900', color: '#2f5d4f', textTransform: 'uppercase' },
  metaChips: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', paddingHorizontal: 9, paddingVertical: 5, fontSize: 10, fontWeight: '800', color: '#6f6559', textTransform: 'uppercase', letterSpacing: 1 },
  section: { marginTop: 18, borderTopWidth: 1, borderTopColor: '#efe5d6', paddingTop: 12 },
  sectionLabel: { fontSize: 10, color: '#7b6f61', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },
  description: { fontSize: 14, lineHeight: 22, color: '#2e2820' },
  sellerName: { fontSize: 16, fontWeight: '700', color: '#1f1a14' },
  meta: { fontSize: 13, color: '#6e6253', marginTop: 4 },
  actionRow: { marginTop: 16, flexDirection: 'row', gap: 10 },
  primaryAction: { flex: 1, backgroundColor: colors.text, borderWidth: 1, borderColor: colors.text, alignItems: 'center', paddingVertical: 13 },
  primaryActionText: { color: '#fff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
  secondaryAction: { width: 94, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  secondaryActionText: { color: '#463d31', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1 },
  miniCard: { width: 170, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', paddingBottom: 8 },
  miniImage: { width: '100%', height: 100, backgroundColor: '#e5e7eb' },
  miniTitle: { marginTop: 8, paddingHorizontal: 8, fontSize: 12, fontWeight: '700', color: '#1f1a14' },
  miniPrice: { marginTop: 4, paddingHorizontal: 8, fontSize: 12, fontWeight: '800', color: '#2f5d4f' },
});

export default ProductDetailScreen;
