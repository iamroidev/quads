import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';

interface Campaign {
  _id: string;
  name: string;
  targetType: string;
  featuredBoost?: boolean;
  couponCode?: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

const GrowthToolsScreen = ({ navigation }: any) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/growth/campaigns')
      .then(r => setCampaigns(r.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow="Seller Hub"
          title="Growth Toolkit"
          subtitle="Boost visibility and drive more sales."
        />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your Campaigns</Text>
          {campaigns.length === 0 ? (
            <Text style={styles.emptyText}>No campaigns yet</Text>
          ) : (
            campaigns.map(c => (
              <View key={c._id} style={styles.campaignCard}>
                <Text style={styles.campaignName}>{c.name}</Text>
                <Text style={styles.campaignMeta}>
                  {c.featuredBoost ? 'Featured Boost' : 'Coupon'} • {c.couponCode || 'N/A'}
                </Text>
                <View style={[styles.statusDot, { backgroundColor: c.isActive ? colors.accent : colors.muted }]} />
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.toolCard} onPress={() => {}}>
            <Ionicons name="megaphone-outline" size={24} color={colors.text} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.toolTitle}>Create Campaign</Text>
              <Text style={styles.toolSub}>Boost listings to reach more students</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolCard} onPress={() => {}}>
            <Ionicons name="pricetag-outline" size={24} color={colors.text} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.toolTitle}>Manage Coupons</Text>
              <Text style={styles.toolSub}>Create discount codes</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  emptyText: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 20 },
  campaignCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
  campaignName: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', flex: 1 },
  campaignMeta: { fontSize: 11, color: colors.muted },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  toolTitle: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  toolSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
});

export default GrowthToolsScreen;