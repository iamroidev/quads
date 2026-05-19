import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useColors } from '../theme/ThemeContext';

interface SkeletonProps {
  width?: any;
  height?: any;
  style?: any;
}

export const SkeletonPulse = ({ width = '100%', height = 20, style }: SkeletonProps) => {
  const colors = useColors();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  const styles = React.useMemo(() => StyleSheet.create({
    base: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 0,
    },
  }), [colors]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.base, { width, height, opacity: pulseAnim }, style]} />
  );
};

export const CardSkeleton = () => {
  const colors = useColors();

  const styles = React.useMemo(() => StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 0,
      marginBottom: 10,
    },
    cardImage: { width: '100%' },
    cardBody: { padding: 10 },
  }), [colors]);

  return (
    <View style={styles.card}>
      <SkeletonPulse height={120} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <SkeletonPulse width="40%" height={10} style={{ marginBottom: 6 }} />
        <SkeletonPulse width="85%" height={14} style={{ marginBottom: 8 }} />
        <SkeletonPulse width="30%" height={14} />
      </View>
    </View>
  );
};

export const ProductDetailSkeleton = () => {
  const colors = useColors();

  const styles = React.useMemo(() => StyleSheet.create({
    detailContainer: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
  }), [colors]);

  return (
    <View style={styles.detailContainer}>
      <SkeletonPulse height={300} style={{ marginBottom: 16 }} />
      <View style={{ paddingHorizontal: 16 }}>
        <SkeletonPulse width="30%" height={12} style={{ marginBottom: 8 }} />
        <SkeletonPulse width="90%" height={24} style={{ marginBottom: 12 }} />
        <SkeletonPulse width="40%" height={28} style={{ marginBottom: 16 }} />
        <View style={styles.divider} />
        <SkeletonPulse width="100%" height={14} style={{ marginBottom: 8 }} />
        <SkeletonPulse width="100%" height={14} style={{ marginBottom: 8 }} />
        <SkeletonPulse width="60%" height={14} style={{ marginBottom: 24 }} />
        <SkeletonPulse height={50} />
      </View>
    </View>
  );
};
