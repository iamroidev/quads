import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadows } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const TermsScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow="LEGAL"
          title="Platform Rules"
          subtitle="Terms of Service & Rules of Engagement."
        />

        {/* Section 1: User conduct */}
        <View style={styles.section}>
          <Text style={styles.label}>01. USER AGREEMENT</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>By using QUADS</Text>
            <Text style={styles.text}>
              By accessing QUADS, you agree to comply with and be bound by these terms. This platform is strictly for students, staff, and faculty of the University of Mines and Technology (UMaT). Use of the platform for illegal activities or by non-institutional members is strictly prohibited.
            </Text>
            <Text style={styles.bulletTitle}>Rules of conduct:</Text>
            <Text style={styles.bullet}>• Users must represent items accurately in listings.</Text>
            <Text style={styles.bullet}>• Harassment, spamming, or fraudulent behavior will result in immediate permanent suspension.</Text>
            <Text style={styles.bullet}>• All physical meetups must occur in designated safe campus spots.</Text>
            <Text style={styles.bullet}>• Trading of illegal substances, weapons, or academic leaks is strictly banned.</Text>
          </View>
        </View>

        {/* Section 2: Buyer protection */}
        <View style={styles.section}>
          <Text style={styles.label}>02. BUYER PROTECTION</Text>
          <View style={[styles.card, { backgroundColor: '#e0f2f7' }]}>
            <Text style={styles.cardTitle}>Secure Escrow Payments</Text>
            <Text style={styles.text}>
              When you pay for an item, the funds are held by QUADS. The seller only receives payment once you confirm the item has been received and matches the description.
            </Text>
            <Text style={styles.bulletTitle}>Resolving Disputes:</Text>
            <Text style={styles.text}>
              If an item is not as described, you can open a dispute. Our campus moderators will review the case. If the item is returned in its original condition, a refund is issued directly to your platform wallet.
            </Text>
          </View>
        </View>

        {/* Section 3: Prohibited items */}
        <View style={styles.section}>
          <Text style={styles.label}>03. PROHIBITED ITEMS</Text>
          <View style={[styles.card, { borderColor: '#dc2626', backgroundColor: '#fff5f5' }]}>
            <Text style={[styles.cardTitle, { color: '#dc2626' }]}>❌ NEVER SELL THESE</Text>
            <Text style={styles.text}>
              Any listings displaying prohibited items will be instantly taken down and accounts flagged.
            </Text>
            <View style={styles.prohibitedGrid}>
              <Text style={styles.prohibitedItem}>• Alcohol & Narcotics</Text>
              <Text style={styles.prohibitedItem}>• Counterfeit Items</Text>
              <Text style={styles.prohibitedItem}>• Exam Papers & Leaks</Text>
              <Text style={styles.prohibitedItem}>• Prescription Meds</Text>
              <Text style={styles.prohibitedItem}>• Weapons of any kind</Text>
              <Text style={styles.prohibitedItem}>• Stolen Property</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>LAST UPDATED: MAY 2026</Text>
          <Text style={styles.footerSub}>
            By using the platform, you acknowledge you have read and understood these policies.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ff6b6b',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  card: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    ...shadows.bulletin,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.text,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    lineHeight: 18,
    marginBottom: 10,
  },
  bulletTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.text,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  bullet: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    lineHeight: 16,
    marginBottom: 4,
  },
  prohibitedGrid: {
    marginTop: 6,
    gap: 4,
  },
  prohibitedItem: {
    fontSize: 12,
    fontWeight: '900',
    color: '#b91c1c',
  },
  footer: {
    paddingHorizontal: 16,
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.3)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  footerSub: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default TermsScreen;
