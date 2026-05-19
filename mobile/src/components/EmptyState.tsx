import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '../theme/ThemeContext';
import { shadows } from '../theme';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle, action }) => {
  const colors = useColors();
  const { width } = Dimensions.get('window');
  const isMobile = width < 640;

  const styles = React.useMemo(() => StyleSheet.create({
    wrap: {
      marginHorizontal: isMobile ? 12 : 16,
      marginTop: 24,
      borderWidth: 2,
      borderColor: colors.boardBorder,
      backgroundColor: colors.surface,
      padding: isMobile ? 24 : 32,
      alignItems: 'center',
      ...shadows.bulletin,
    },
    rule: {
      width: 28,
      height: 3,
      backgroundColor: colors.accent,
      marginBottom: 14,
    },
    title: {
      fontSize: isMobile ? 13 : 14,
      fontWeight: '900',
      color: colors.text,
      textTransform: 'uppercase',
      letterSpacing: 1,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 7,
      fontSize: isMobile ? 11 : 12,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: isMobile ? 17 : 18,
      fontWeight: '600',
    },
    btn: {
      marginTop: 18,
      backgroundColor: colors.text,
      borderWidth: 2,
      borderColor: colors.boardBorder,
      paddingHorizontal: 18,
      paddingVertical: 10,
      ...shadows.bulletin,
    },
    btnText: {
      fontSize: isMobile ? 10 : 11,
      fontWeight: '900',
      color: colors.bg,
      textTransform: 'uppercase',
      letterSpacing: 1.1,
    },
  }), [colors, isMobile]);

  return (
    <View style={styles.wrap}>
      <View style={styles.rule} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {action ? (
        <TouchableOpacity style={styles.btn} onPress={action.onPress} activeOpacity={0.85}>
          <Text style={styles.btnText}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default EmptyState;
