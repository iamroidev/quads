import React from 'react';
import { ScrollView, StyleSheet, Text, View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shadows } from '../theme';
import { useColors } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';

const PrivacyPolicyScreen = () => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 40 },
    headerCard: {
      margin: 16,
      padding: 20,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.noticeBg,
      ...shadows.bulletin,
    },
    headerCardTitle: {
      fontSize: isMobile ? 15 : 18,
      fontWeight: '900',
      textTransform: 'uppercase',
      color: colors.text,
      marginBottom: 8,
    },
    headerCardText: {
      fontSize: isMobile ? 12 : 13,
      fontWeight: '700',
      color: colors.text,
      lineHeight: 18,
    },
    lastUpdated: {
      fontSize: 9,
      fontWeight: '900',
      color: colors.muted,
      marginTop: 14,
      letterSpacing: 1,
    },
    section: {
      marginTop: 16,
      paddingHorizontal: isMobile ? 12 : 16,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.accent,
      letterSpacing: 1.5,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    card: {
      padding: isMobile ? 12 : 16,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...shadows.bulletin,
    },
    cardText: {
      fontSize: isMobile ? 12 : 13,
      fontWeight: '700',
      color: colors.text,
      lineHeight: 18,
      marginBottom: 10,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginVertical: 4,
      paddingRight: 12,
    },
    bullet: {
      fontSize: isMobile ? 13 : 14,
      fontWeight: '900',
      color: colors.text,
    },
    bulletText: {
      fontSize: isMobile ? 12 : 13,
      fontWeight: '700',
      color: colors.text,
      lineHeight: 18,
    },
    bold: {
      fontWeight: '900',
    },
    alertBox: {
      marginTop: 12,
      padding: 10,
      backgroundColor: colors.metric1Bg,
      borderWidth: 1.5,
      borderColor: colors.accent,
      borderStyle: 'dashed',
    },
    alertText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.metric1Text,
      textAlign: 'center',
    },
    contactCard: {
      margin: 16,
      marginTop: 24,
      padding: 20,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...shadows.bulletin,
    },
    contactTitle: {
      fontSize: isMobile ? 13 : 14,
      fontWeight: '900',
      color: colors.text,
      letterSpacing: 1,
      marginBottom: 6,
    },
    contactText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.muted,
      lineHeight: 18,
      marginBottom: 14,
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.text,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.surface,
      letterSpacing: 0.5,
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow="LEGAL"
          title="Privacy Policy"
          subtitle="Your Data Rights & Security."
        />

        <View style={styles.headerCard}>
          <Text style={styles.headerCardTitle}>PRIVACY POLICY</Text>
          <Text style={styles.headerCardText}>
            At QUADS, your privacy is our priority. This policy outlines how we collect, use, and protect your personal information within the UMaT student community.
          </Text>
          <Text style={styles.lastUpdated}>LAST UPDATED: MAY 16, 2026</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. INFORMATION WE COLLECT</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              We collect information to provide a secure marketplace for students, including:
            </Text>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Identity Info:</Text> Full name, institutional email address (@student.umat.edu.gh), and student ID.
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Contact Info:</Text> Phone number and optional campus location (hostel/hall).
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Transaction Info:</Text> Details of items you buy or sell.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. HOW WE USE YOUR DATA</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Your data is used strictly for platform operations:
            </Text>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                Verifying that you are a legitimate member of the UMaT community.
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                Facilitating communications between buyers and sellers.
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                Processing payments and managing the secure escrow system.
              </Text>
            </View>
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>
                We NEVER sell your personal data to third-party advertisers.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. SECURITY & RETENTION</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              We use industry-standard encryption to protect your data. Sensitive identity documents uploaded for verification are automatically purged from our servers once validation is complete.
            </Text>
          </View>
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>CONTACT PRIVACY TEAM</Text>
          <Text style={styles.contactText}>
            If you have questions about this policy, contact our security officer at:
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>privacy@quadsmarket.tech</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyPolicyScreen;
