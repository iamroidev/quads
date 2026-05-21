import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../theme/ThemeContext';

interface OnboardingTourProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: 'search-outline',
    title: 'Browse Campus Deals',
    description: 'Find textbooks, electronics, room gear, and local student services verified directly on your campus.',
    color: '#FF6B6B',
  },
  {
    icon: 'cart-outline',
    title: 'Bundle & Save',
    description: 'Purchase multiple listings from the same seller to automatically trigger custom bundle discounts.',
    color: '#3498DB',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Escrow Protection',
    description: 'Pay securely using mobile money. Escrow holds your funds safely until you verify the physical handoff.',
    color: '#27AE60',
  },
  {
    icon: 'cash-outline',
    title: 'Sell Your Gear',
    description: 'Declutter your hostel! List extra items, books, or devices in under a minute and earn money instantly.',
    color: '#F1C40F',
  },
];

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const colors = useColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const { width: windowWidth } = Dimensions.get('window');

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / windowWidth);
    if (index >= 0 && index < slides.length) {
      setActiveIndex(index);
    }
  };

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (activeIndex + 1) * windowWidth,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    try {
      await AsyncStorage.removeItem('quads_is_new_user');
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (err) {
      console.warn('Failed to save onboarding preference:', err);
    }
    onComplete();
  };

  const styles = React.useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    container: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.boardBorder,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      borderRadius: 4,
      overflow: 'hidden',
    },
    scrollContainer: {
      flexDirection: 'row',
    },
    slide: {
      width: windowWidth - 40, // Match the padding of the outer overlay
      maxWidth: 360,
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 24,
    },
    iconWrapper: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      borderWidth: 2,
      borderColor: colors.boardBorder,
      borderBottomWidth: 3,
      borderRightWidth: 3,
    },
    title: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    description: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      fontWeight: '700',
    },
    footer: {
      paddingBottom: 24,
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 20,
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.boardBorder,
    },
    activeDot: {
      width: 24,
      backgroundColor: colors.text,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      gap: 12,
    },
    btnSecondary: {
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    btnSecondaryText: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    btnPrimary: {
      flex: 1,
      backgroundColor: colors.text,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.boardBorder,
      borderBottomWidth: 3,
      borderRightWidth: 3,
    },
    btnPrimaryText: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.bg,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
  }), [colors, windowWidth]);

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.scrollContainer}
          >
            {slides.map((slide, index) => (
              <View key={index} style={styles.slide}>
                <View style={[styles.iconWrapper, { backgroundColor: slide.color }]}>
                  <Ionicons name={slide.icon as any} size={36} color={colors.surface} />
                </View>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.description}>{slide.description}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.dotsContainer}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    { backgroundColor: colors.surfaceSecondary },
                    activeIndex === index && styles.activeDot,
                  ]}
                />
              ))}
            </View>

            <View style={styles.buttonRow}>
              {activeIndex < slides.length - 1 ? (
                <>
                  <TouchableOpacity style={styles.btnSecondary} onPress={handleFinish}>
                    <Text style={styles.btnSecondaryText}>Skip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnPrimary} onPress={handleNext}>
                    <Text style={styles.btnPrimaryText}>Next</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.btnPrimary} onPress={handleFinish}>
                  <Text style={styles.btnPrimaryText}>Get Started</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
