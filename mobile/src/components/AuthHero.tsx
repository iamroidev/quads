import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing } from '../theme';
import { useColors } from '../theme/ThemeContext';

interface AuthHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

const AuthHero: React.FC<AuthHeroProps> = ({ eyebrow, title, subtitle }) => {
  const colors = useColors();

  const styles = React.useMemo(() => StyleSheet.create({
    wrap: {
      marginBottom: spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: spacing.md,
    },
    eyebrow: {
      color: colors.muted,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 2,
      fontWeight: '800',
    },
    title: {
      marginTop: 8,
      color: colors.text,
      fontSize: 32,
      fontWeight: '900',
      textTransform: 'uppercase',
    },
    subtitle: {
      marginTop: 6,
      color: colors.muted,
      fontSize: 13,
      lineHeight: 20,
    },
  }), [colors]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

export default AuthHero;
