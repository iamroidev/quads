import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadows } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const AboutUsScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow="QUADS STORY"
          title="About Us"
          subtitle="The campus marketplace built for students."
        />

        {/* Mission tape banner */}
        <View style={styles.missionCard}>
          <Text style={styles.missionTitle}>THE MISSION</Text>
          <Text style={styles.missionText}>
            QUADS was founded to solve a simple problem: making campus commerce safe, easy, and completely free for the UMaT student community.
          </Text>
        </View>

        {/* Core Values */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>OUR CORE VALUES</Text>

          {/* Value 1 */}
          <View style={styles.valueCard}>
            <View style={[styles.badge, { backgroundColor: '#10b981' }]}>
              <Text style={styles.badgeText}>TRUST</Text>
            </View>
            <Text style={styles.valueTitle}>Manual Verification</Text>
            <Text style={styles.valueText}>
              Every buyer and seller is verified with their official UMaT student email and a manual ID card check. Zero anonymous profiles, zero external spam.
            </Text>
          </View>

          {/* Value 2 */}
          <View style={styles.valueCard}>
            <View style={[styles.badge, { backgroundColor: '#ff6b6b' }]}>
              <Text style={styles.badgeText}>SAFETY</Text>
            </View>
            <Text style={styles.valueTitle}>Escrow Safeguards</Text>
            <Text style={styles.valueText}>
              Payments stay securely locked in escrow. Money is only released to the seller after the buyer receives and inspects the item.
            </Text>
          </View>

          {/* Value 3 */}
          <View style={styles.valueCard}>
            <View style={[styles.badge, { backgroundColor: '#0284c7' }]}>
              <Text style={styles.badgeText}>COMMUNITY</Text>
            </View>
            <Text style={styles.valueTitle}>Zero Selling Fees</Text>
            <Text style={styles.valueText}>
              Built exclusively for student budgets. We charge 0% commission. What you list is what you take home, keeping money in students' pockets.
            </Text>
          </View>
        </View>

        {/* Technical Stack information */}
        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>TARKWA CAMPUS NODE</Text>
          <Text style={styles.footerText}>
            QUADS is designed and tuned specifically for the University of Mines and Technology. Supported by campus safety zones and peer moderators.
          </Text>
          <Text style={styles.version}>VERSION 2.1.0 • PRODUCTION READY</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  missionCard: {
    margin: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#fffacd',
    ...shadows.bulletin,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: colors.text,
    marginBottom: 6,
  },
  missionText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.7)',
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: 16,
    gap: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ff6b6b',
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  valueCard: {
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.bulletin,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  valueTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.text,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    lineHeight: 18,
  },
  footerCard: {
    margin: 16,
    marginTop: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.bulletin,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    lineHeight: 18,
    marginBottom: 12,
  },
  version: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.2)',
    letterSpacing: 1,
  },
});

export default AboutUsScreen;
