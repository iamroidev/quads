import React from 'react';
import { ScrollView, StyleSheet, Text, View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shadows } from '../theme';
import { useColors } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';

const AboutUsScreen = () => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 40 },
    missionCard: { margin: 16, padding: 20, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, ...shadows.bulletin },
    missionTitle: { fontSize: isMobile ? 15 : 18, fontWeight: '900', textTransform: 'uppercase', color: colors.text, marginBottom: 6 },
    missionText: { fontSize: isMobile ? 12 : 13, fontWeight: '700', color: colors.muted, lineHeight: 18 },
    section: { paddingHorizontal: isMobile ? 12 : 16, gap: 16 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: colors.accent, letterSpacing: 1.5, marginBottom: 4, textTransform: 'uppercase' },
    valueCard: { padding: isMobile ? 12 : 16, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, ...shadows.bulletin },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
    badgeText: { fontSize: 9, fontWeight: '900', color: colors.primaryContent, letterSpacing: 0.5 },
    valueTitle: { fontSize: isMobile ? 13 : 15, fontWeight: '900', color: colors.text, textTransform: 'uppercase', marginBottom: 4 },
    valueText: { fontSize: isMobile ? 12 : 13, fontWeight: '700', color: colors.muted, lineHeight: 18 },
    footerCard: { margin: 16, marginTop: 24, padding: 20, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, ...shadows.bulletin },
    footerTitle: { fontSize: isMobile ? 13 : 14, fontWeight: '900', color: colors.text, letterSpacing: 1, marginBottom: 4 },
    footerText: { fontSize: 12, fontWeight: '700', color: colors.muted, lineHeight: 18, marginBottom: 12 },
    version: { fontSize: 9, fontWeight: '900', color: colors.textDisabled, letterSpacing: 1 },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader eyebrow="QUADS STORY" title="About Us" subtitle="The campus marketplace built for students." />

        <View style={styles.missionCard}>
          <Text style={styles.missionTitle}>THE MISSION</Text>
          <Text style={styles.missionText}>
            QUADS was founded to solve a simple problem: making campus commerce safe, easy, and completely free for the UMaT student community.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>OUR CORE VALUES</Text>

          <View style={styles.valueCard}>
            <View style={[styles.badge, { backgroundColor: colors.success }]}>
              <Text style={styles.badgeText}>TRUST</Text>
            </View>
            <Text style={styles.valueTitle}>Manual Verification</Text>
            <Text style={styles.valueText}>Every buyer and seller is verified with their official UMaT student email and a manual ID card check. Zero anonymous profiles, zero external spam.</Text>
          </View>

          <View style={styles.valueCard}>
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>SAFETY</Text>
            </View>
            <Text style={styles.valueTitle}>Escrow Safeguards</Text>
            <Text style={styles.valueText}>Payments stay securely locked in escrow. Money is only released to the seller after the buyer receives and inspects the item.</Text>
          </View>

          <View style={styles.valueCard}>
            <View style={[styles.badge, { backgroundColor: colors.pinBlue }]}>
              <Text style={styles.badgeText}>COMMUNITY</Text>
            </View>
            <Text style={styles.valueTitle}>Zero Selling Fees</Text>
            <Text style={styles.valueText}>Built exclusively for student budgets. We charge 0% commission. What you list is what you take home, keeping money in students' pockets.</Text>
          </View>
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>TARKWA CAMPUS NODE</Text>
          <Text style={styles.footerText}>QUADS is designed and tuned specifically for the University of Mines and Technology. Supported by campus safety zones and peer moderators.</Text>
          <Text style={styles.version}>VERSION 2.1.0 • PRODUCTION READY</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutUsScreen;
