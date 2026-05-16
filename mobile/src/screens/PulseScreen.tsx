import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';

interface PulseItem {
  _id: string;
  type: 'trending' | 'following' | 'nearby';
  data: any;
}

const PulseScreen = () => {
  const [items, setItems] = useState<PulseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPulse = async () => {
    try {
      const r = await api.get('/feed/pulse');
      if (r.data.success) {
        const raw = r.data.data || {};
        const arr: PulseItem[] = [];
        if (raw.trending) arr.push({ _id: 'trending', type: 'trending', data: raw.trending });
        if (raw.hyperlocal) arr.push({ _id: 'hyperlocal', type: 'nearby', data: raw.hyperlocal });
        if (raw.following) arr.push({ _id: 'following', type: 'following', data: raw.following });
        setItems(arr);
      }
    } catch { }
    setLoading(false);
  };

  useEffect(() => {
    fetchPulse();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPulse();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <ScreenHeader
          eyebrow="Discovery"
          title="Campus Pulse"
          subtitle="Trending items and activity from your network."
        />

        {items.length === 0 ? (
          <Text style={styles.emptyText}>No pulse items yet</Text>
        ) : (
          items.map(item => (
            <View key={item._id} style={styles.pulseCard}>
              <View style={styles.pulseBadge}>
                <Text style={styles.pulseBadgeText}>{item.type.toUpperCase()}</Text>
              </View>
              <Text style={styles.pulseTitle}>Item</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  emptyText: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 40 },
  pulseCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
  },
  pulseBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  pulseBadgeText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  pulseTitle: { fontSize: 13, fontWeight: '900' },
});

export default PulseScreen;