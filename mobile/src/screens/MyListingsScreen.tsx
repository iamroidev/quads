import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import productService from '../services/product.service';
import { Product } from '../types';
import { shadows } from '../theme';
import { useColors } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';

const STATUS_OPTIONS = ['all', 'active', 'draft', 'reserved', 'sold', 'removed'] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

const MyListingsScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: isMobile ? 12 : 16, paddingBottom: 32 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    actionBar: {
      paddingHorizontal: isMobile ? 12 : 16, paddingTop: 12, paddingBottom: 10,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      backgroundColor: colors.surface, flexDirection: 'row', gap: 10,
    },
    primaryAction: { flex: 1, backgroundColor: colors.text, borderWidth: 1, borderColor: colors.text, alignItems: 'center', paddingVertical: 11, ...shadows.bulletin },
    primaryActionText: { color: colors.bg, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
    secondaryAction: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
    secondaryActionText: { color: colors.text, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1 },
    statusRow: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 8,
      paddingHorizontal: isMobile ? 12 : 16, paddingTop: 10, paddingBottom: 8,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    statusChip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, paddingHorizontal: 10, paddingVertical: 6 },
    statusChipActive: { backgroundColor: colors.text, borderColor: colors.text },
    statusChipText: { fontSize: 10, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
    statusChipTextActive: { color: colors.bg },
    emptyWrap: { marginTop: 44, alignItems: 'center' },
    empty: { textAlign: 'center', color: colors.text, fontSize: isMobile ? 15 : 18, fontWeight: '900', textTransform: 'uppercase' },
    emptySub: { marginTop: 8, textAlign: 'center', color: colors.muted, fontSize: 13 },
    card: { flexDirection: 'row', gap: 12, padding: 12, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 0, marginBottom: 12, ...shadows.bulletin },
    image: { width: 88, height: 88, borderRadius: 0, backgroundColor: colors.surfaceSecondary },
    meta: { flex: 1 },
    title: { fontSize: isMobile ? 13 : 15, fontWeight: '700', color: colors.text },
    price: { marginTop: 6, fontSize: isMobile ? 13 : 14, fontWeight: '700', color: colors.accent },
    status: { marginTop: 4, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
    actions: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
    primaryBtn: { backgroundColor: colors.text, paddingVertical: 8, paddingHorizontal: 10 },
    primaryBtnText: { color: colors.bg, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    secondaryBtn: { borderWidth: 1, borderColor: colors.border, paddingVertical: 8, paddingHorizontal: 10 },
    secondaryBtnText: { color: colors.text, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    dangerBtn: { borderWidth: 1, borderColor: colors.dangerTint, backgroundColor: colors.dangerTint, paddingVertical: 8, paddingHorizontal: 10 },
    dangerBtnText: { color: colors.dangerTintText, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  }), [colors]);

  const fetchListings = useCallback(async (withLoader = true, targetPage = 1, append = false, status: StatusFilter = 'all') => {
    if (withLoader) setLoading(true);
    if (append) setLoadingMore(true);
    try {
      const params: any = { page: targetPage, limit: 20 };
      if (status !== 'all') params.status = status;
      const response = await productService.getMyListings(params);
      if (response.success) {
        setProducts((prev) => (append ? [...prev, ...response.data] : response.data));
        setPage(targetPage);
        const fetchedLength = response.data?.length || 0;
        const totalPages = response.pagination?.pages || 1;
        setHasMore(totalPages > targetPage && fetchedLength >= 20);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchListings(true, 1, false, statusFilter);
  }, [fetchListings, statusFilter]);

  const loadMore = () => {
    if (loadingMore || !hasMore || loading) return;
    fetchListings(false, page + 1, true, statusFilter);
  };

  const handleDuplicate = async (id: string) => {
    try {
      await productService.duplicateProduct(id);
      Alert.alert('Success', 'Listing duplicated.');
      fetchListings(false, 1, false, statusFilter);
    } catch {
      Alert.alert('Error', 'Failed to duplicate listing.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete listing', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await productService.deleteProduct(id);
            setProducts((prev) => prev.filter((p) => p._id !== id));
          } catch {
            Alert.alert('Error', 'Failed to delete listing.');
          }
        },
      },
    ]);
  };

  const renderItem = useCallback(({ item }: { item: Product }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.images?.[0]?.url || 'https://placehold.co/160x160/e2e8f0/64748b?text=Item' }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.price}>GHS {item.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</Text>
        <Text style={styles.status}>{item.status.toUpperCase()} · {item.views} views</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}>
            <Text style={styles.secondaryBtnText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('CreateListing', { productId: item._id, mode: 'edit' })}>
            <Text style={styles.secondaryBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => handleDuplicate(item._id)}>
            <Text style={styles.primaryBtnText}>Dup.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerBtn} onPress={() => handleDelete(item._id)}>
            <Text style={styles.dangerBtnText}>Del.</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [styles, navigation, handleDuplicate, handleDelete]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader eyebrow="Seller workspace" title="My Listings" subtitle="Create, manage, and optimize your listings." />

      {/* Action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.primaryAction} onPress={() => navigation.navigate('CreateListing')}>
          <Text style={styles.primaryActionText}>+ New</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('SellerAnalytics')}>
          <Text style={styles.secondaryActionText}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={async () => {
            const picked = await DocumentPicker.getDocumentAsync({ type: 'text/csv', copyToCacheDirectory: true });
            if (picked.canceled) return;
            const file = picked.assets?.[0];
            if (!file?.uri) return;
            try {
              const res = await productService.importProductsCsv({ uri: file.uri, name: file.name || 'import.csv', type: 'text/csv' });
              Alert.alert('CSV import', res.message || 'Import completed.');
              fetchListings(false, 1, false, statusFilter);
            } catch (e: any) {
              Alert.alert('CSV import failed', e?.response?.data?.message || 'Unable to import CSV.');
            }
          }}
        >
          <Text style={styles.secondaryActionText}>Import CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Status filter */}
      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.statusChip, statusFilter === s && styles.statusChipActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.statusChipText, statusFilter === s && styles.statusChipTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        contentContainerStyle={styles.content}
        data={products}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchListings(false, 1, false, statusFilter); }}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 12 }} color={colors.accent} /> : null}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>No Listings</Text>
            <Text style={styles.emptySub}>
              {statusFilter !== 'all' ? `No ${statusFilter} listings.` : 'Start selling by creating your first listing.'}
            </Text>
          </View>
        }
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
};

export default MyListingsScreen;
