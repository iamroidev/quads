import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useColors } from '../theme/ThemeContext';

const ADMIN_URL = 'https://quadsmarket.tech/admin';

export default function AdminScreen() {
  const { user, logout } = useAuth();
  const colors = useColors();

  const styles = StyleSheet.create({
    container:  { flex: 1, backgroundColor: colors.bg },
    content:    { padding: 24, paddingBottom: 48 },
    logoBox:    { width: 72, height: 72, borderWidth: 4, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: colors.boardShadow, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5, marginBottom: 24 },
    logoInner:  { width: 32, height: 32, borderWidth: 8, borderColor: colors.text, backgroundColor: 'transparent' },
    logoTail:   { position: 'absolute', bottom: 11, right: 11, width: 12, height: 6, backgroundColor: colors.text, transform: [{ rotate: '45deg' }] },
    logoPin:    { position: 'absolute', top: 5, right: 5, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.pinRed, borderWidth: 2, borderColor: colors.border },
    eyebrow:    { fontSize: 10, fontWeight: '900', color: colors.accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
    title:      { fontSize: 28, fontWeight: '900', color: colors.text, textTransform: 'uppercase', letterSpacing: -0.5, marginBottom: 8 },
    subtitle:   { fontSize: 13, color: colors.muted, lineHeight: 20, marginBottom: 32 },
    divider:    { height: 2, backgroundColor: colors.border, marginBottom: 32 },
    card:       { borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, marginBottom: 16, shadowColor: colors.boardShadow, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
    cardLabel:  { fontSize: 9, fontWeight: '900', color: colors.accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
    cardTitle:  { fontSize: 15, fontWeight: '900', color: colors.text, textTransform: 'uppercase', marginBottom: 4 },
    cardDesc:   { fontSize: 12, color: colors.muted, lineHeight: 18 },
    btn:        { backgroundColor: colors.text, borderWidth: 2, borderColor: colors.border, padding: 16, alignItems: 'center', shadowColor: colors.boardShadow, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5, marginBottom: 12 },
    btnText:    { fontSize: 13, fontWeight: '900', color: colors.bg, textTransform: 'uppercase', letterSpacing: 1.5 },
    btnOutline: { borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, alignItems: 'center', marginBottom: 12 },
    btnOutText: { fontSize: 12, fontWeight: '900', color: colors.text, textTransform: 'uppercase', letterSpacing: 1 },
    userRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    userLabel:  { fontSize: 10, fontWeight: '900', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
    userValue:  { fontSize: 12, fontWeight: '700', color: colors.text },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Q Logo */}
        <View style={styles.logoBox}>
          <View style={styles.logoInner} />
          <View style={styles.logoTail} />
          <View style={styles.logoPin} />
        </View>

        <Text style={styles.eyebrow}>Admin Console</Text>
        <Text style={styles.title}>Welcome,{'\n'}{user?.name?.split(' ')[0]}.</Text>
        <Text style={styles.subtitle}>
          The QUADS admin dashboard runs on the web. Use your browser for full access to users, products, orders, disputes, and platform analytics.
        </Text>

        <View style={styles.divider} />

        {/* Stats cards */}
        {[
          { label: 'Your Account', title: user?.email || '', desc: 'Logged in as administrator' },
          { label: 'Platform', title: 'quadsmarket.tech', desc: 'Full dashboard at /admin — users, products, orders, disputes, payouts, broadcast' },
        ].map(c => (
          <View key={c.label} style={styles.card}>
            <Text style={styles.cardLabel}>{c.label}</Text>
            <Text style={styles.cardTitle}>{c.title}</Text>
            <Text style={styles.cardDesc}>{c.desc}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.btn} onPress={() => Linking.openURL(ADMIN_URL)}>
          <Text style={styles.btnText}>Open Admin Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnOutline} onPress={logout}>
          <Text style={styles.btnOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
