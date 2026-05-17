import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

interface SkeletonProps {
  width?: any;
  height?: any;
  style?: any;
}

export const SkeletonPulse = ({ width = '100%', height = 20, style }: SkeletonProps) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, opacity: pulseAnim },
        style,
      ]}
    />
  );
};

export const CardSkeleton = () => (
  <View style={styles.card}>
    <SkeletonPulse height={120} style={styles.cardImage} />
    <View style={styles.cardBody}>
      <SkeletonPulse width="40%" height={10} style={{ marginBottom: 6 }} />
      <SkeletonPulse width="85%" height={14} style={{ marginBottom: 8 }} />
      <SkeletonPulse width="30%" height={14} />
    </View>
  </View>
);

export const ProductDetailSkeleton = () => (
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

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#e5e7eb',
    borderRadius: 0,
  },
  card: {
    flex: 1,
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 0,
    marginBottom: 10,
  },
  cardImage: {
    width: '100%',
  },
  cardBody: {
    padding: 10,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
});
