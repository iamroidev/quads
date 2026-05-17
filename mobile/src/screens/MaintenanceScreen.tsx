import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme';

const MaintenanceScreen = () => (
  <SafeAreaView style={styles.container} edges={['top']}>
    <View style={styles.content}>
      <View style={styles.card}>
        <Ionicons name="construct-outline" size={64} color={colors.muted} />
        <Text style={styles.title}>Under Maintenance</Text>
        <Text style={styles.subtitle}>We're working on something awesome. Check back soon!</Text>
      </View>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    ...shadows.bulletin,
  },
  title: { fontSize: 22, fontWeight: '900', textTransform: 'uppercase', marginTop: 24, marginBottom: 8 },
  subtitle: { fontSize: 12, color: colors.muted, textAlign: 'center' },
});

export default MaintenanceScreen;