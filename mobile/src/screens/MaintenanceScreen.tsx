import React from 'react';
import { StyleSheet, Text, View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { shadows } from '../theme';
import { useColors } from '../theme/ThemeContext';

const MaintenanceScreen = () => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
    card: {
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 32,
      alignItems: 'center',
      width: '100%',
      ...shadows.bulletin,
    },
    title: { fontSize: isMobile ? 18 : 22, fontWeight: '900', textTransform: 'uppercase', marginTop: 24, marginBottom: 8, color: colors.text },
    subtitle: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  }), [colors]);

  return (
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
};

export default MaintenanceScreen;
