import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import productService from '../services/product.service';
import { Product } from '../types';
import { colors } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const MyListingsScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchListings = useCallback(async (withLoader = true, targetPage = 1, append = false) => {
    if (withLoader) setLoading(true);
    if (append) setLoadingMore(true);
    try {
      const response = await productService.getMyListings({ page: targetPage, limit: 20 });
      if (response.success) {
        setProducts((prev) => (append ? [...prev, ...response.data] : response.data));
        setPage(targetPage);
        setHasMore((response.pagination?.pages || 1) > targetPage);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchListings(true, 1, false);
  }, [fetchListings]);

  const loadMore = () => {
    if (loadingMore || !hasMore || loading) return;
    fetchListings(false, page + 1, true);
  };

  const handleDuplicate = async (id: string) => {
    try {
      await productService.duplicateProduct(id);
      Alert.alert('Success', 'Listing duplicated.');
      fetchListings(false, 1, false);
    } catch {
      Alert.alert('Error', 'Failed to duplicate listing.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader eyebrow="Seller workspace" title="Sell" subtitle="Create, manage, and optimize your listings." />
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.primaryAction} onPress={() => navigation.navigate('CreateListing')}>
          <Text style={styles.primaryActionText}>New Listing</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('SellerAnalytics')}>
          <Text style={styles.secondaryActionText}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={async () => {
            const picked = await DocumentPicker.getDocumentAsync({ type: 'text/csv', copyToCacheDirectory: true });
            if (picked.canceled) return;
            const file = picked.assets?.[0];
            if (!file?.uri) return;
            try {
              const res = await productService.importProductsCsv({
                uri: file.uri,
                name: file.name || 'import.csv',
                type: 'text/csv',
              });
              Alert.alert('CSV import', res.message || 'Import completed.');
              fetchListings(false, 1, false);
            } catch (e: any) {
              Alert.alert('CSV import failed', e?.response?.data?.message || 'Unable to import CSV.');
            }
          }}
        >
          <Text style={styles.secondaryActionText}>Import CSV</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statusRow}>
        {['All', 'Active', 'Draft', 'Reserved', 'Sold', 'Removed'].map((s) => (
          <View key={s} style={[styles.statusChip, s === 'All' && styles.statusChipActive]}>
            <Text style={[styles.statusChipText, s === 'All' && styles.statusChipTextActive]}>{s}</Text>
          </View>
        ))}
      </View>
      <FlatList
      contentContainerStyle={styles.content}
      data={products}
      keyExtractor={(item) => item._id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchListings(false, 1, false); }} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 12 }} color={colors.accent} /> : null}
      ListEmptyComponent={<View style={styles.emptyWrap}><Text style={styles.empty}>No Listings Yet</Text><Text style={styles.emptySub}>Start selling by creating your first listing.</Text></View>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Image
            source={{ uri: item.images?.[0]?.url || 'https://placehold.co/160x160/e2e8f0/64748b?text=Item' }}
            style={styles.image}
          />
          <View style={styles.meta}>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.price}>GHS {item.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</Text>
            <Text style={styles.status}>{item.status.toUpperCase()} · {item.views} views</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}>
                <Text style={styles.secondaryBtnText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => handleDuplicate(item._id)}>
                <Text style={styles.primaryBtnText}>Duplicate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  actionBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: colors.text,
    borderWidth: 1,
    borderColor: colors.text,
    alignItems: 'center',
    paddingVertical: 11,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  secondaryAction: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffdf8',
  },
  secondaryActionText: {
    color: '#463d31',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#fffdf8',
  },
  statusChip: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6 },
  statusChipActive: { backgroundColor: colors.text, borderColor: colors.text },
  statusChipText: { fontSize: 10, fontWeight: '800', color: '#6f6559', textTransform: 'uppercase', letterSpacing: 1 },
  statusChipTextActive: { color: '#fff' },
  emptyWrap: { marginTop: 44, alignItems: 'center' },
  empty: { textAlign: 'center', color: '#1f1a14', fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  emptySub: { marginTop: 8, textAlign: 'center', color: '#7b6f61', fontSize: 13 },
  card: { flexDirection: 'row', gap: 12, padding: 12, backgroundColor: '#fffdf8', borderWidth: 1, borderColor: colors.border, borderRadius: 0, marginBottom: 12 },
  image: { width: 88, height: 88, borderRadius: 10, backgroundColor: '#e5e7eb' },
  meta: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: '#111827' },
  price: { marginTop: 6, fontSize: 14, fontWeight: '700', color: '#111827' },
  status: { marginTop: 4, fontSize: 11, color: '#7b6f61', textTransform: 'uppercase', letterSpacing: 0.8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  primaryBtn: { backgroundColor: '#1f1a14', paddingVertical: 10, paddingHorizontal: 14 },
  primaryBtnText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1 },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, paddingVertical: 10, paddingHorizontal: 14 },
  secondaryBtnText: { color: '#463d31', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1 },
});

export default MyListingsScreen;
