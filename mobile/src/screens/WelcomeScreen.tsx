import React, { useState, useEffect } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'basket-outline',
    title: '📍 Campus Trading',
    highlight: '0% FEES FOR SCHOLARS',
    color: '#ff6b6b',
    desc: 'Trade textbooks, dorm gear, electronics, or food instantly. Deal directly with verified UMaT students with zero commission fees.',
  },
  {
    icon: 'wallet-outline',
    title: '💳 Escrow Payments',
    highlight: 'SECURE MOBILE MONEY',
    color: '#3d307c',
    desc: 'Pay securely inside the app using Momo or cards via Paystack. Funds are kept safe in escrow until you verify the item in person.',
  },
  {
    icon: 'qr-code-outline',
    title: '🛡️ Scanner Handoff',
    highlight: 'ANTI-SCAM VERIFICATION',
    color: '#10b981',
    desc: 'Complete pickups with confidence. The seller displays a 6-digit code or QR code, and you scan it to release payments instantly.',
  },
];

const WelcomeScreen = ({ navigation }: any) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [tickerOffset] = useState(new Animated.Value(0));

  // Ticker animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(tickerOffset, {
          toValue: -200,
          duration: 10000,
          useNativeDriver: true,
        }),
        Animated.timing(tickerOffset, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % SLIDES.length);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {/* Campus Ticker Header */}
      <View style={styles.tickerHeader}>
        <Animated.View style={[styles.tickerWrapper, { transform: [{ translateX: tickerOffset }] }]}>
          <Text style={styles.tickerText}>
            ⚡ UMaT CAMPUS MARKETPLACE &bull; TARKWA, GHANA 🇬🇭 &bull; 0% SELLER FEES &bull; SECURE ESCROW &bull; verified scholars &bull; ⚡
          </Text>
        </Animated.View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Brand Hero logo banner */}
        <View style={styles.heroSection}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>VERIFIED APP</Text>
          </View>
          <Text style={styles.logoTitle}>QUADS</Text>
          <View style={styles.subtitleWrapper}>
            <Text style={styles.logoSubtitle}>STUDENT P2P COMMERCE PLATFORM</Text>
          </View>
        </View>

        {/* Catchy Carousel Visual Slides */}
        <View style={styles.slideCard}>
          <View style={[styles.slideBadge, { backgroundColor: SLIDES[activeSlide].color + '15', borderColor: SLIDES[activeSlide].color }]}>
            <Text style={[styles.slideBadgeText, { color: SLIDES[activeSlide].color }]}>
              {SLIDES[activeSlide].highlight}
            </Text>
          </View>

          <View style={styles.slideHeader}>
            <View style={[styles.iconBox, { backgroundColor: SLIDES[activeSlide].color }]}>
              <Ionicons name={SLIDES[activeSlide].icon as any} size={28} color="#fff" />
            </View>
            <Text style={styles.slideTitle}>{SLIDES[activeSlide].title}</Text>
          </View>

          <Text style={styles.slideDesc}>{SLIDES[activeSlide].desc}</Text>

          {/* Dots Indicator + Next Arrow */}
          <View style={styles.slideFooter}>
            <View style={styles.dotsRow}>
              {SLIDES.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setActiveSlide(i)}>
                  <View style={[styles.dot, activeSlide === i && styles.dotActive]} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.nextBtn} onPress={handleNextSlide}>
              <Text style={styles.nextBtnText}>NEXT</Text>
              <Ionicons name="arrow-forward-outline" size={14} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Catchy Statistics / Parity Badges */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricBox, { backgroundColor: '#fffacd', transform: [{ rotate: '-1.5deg' }] }]}>
            <Text style={styles.metricVal}>0%</Text>
            <Text style={styles.metricLabel}>Trading Fees</Text>
          </View>
          <View style={[styles.metricBox, { backgroundColor: '#ff6b6b', transform: [{ rotate: '1.2deg' }] }]}>
            <Text style={[styles.metricVal, { color: '#fff' }]}>VERIFIED</Text>
            <Text style={[styles.metricLabel, { color: '#fff' }]}>UMaT Students</Text>
          </View>
          <View style={[styles.metricBox, { backgroundColor: '#10b981', transform: [{ rotate: '-0.8deg' }] }]}>
            <Text style={[styles.metricVal, { color: '#fff' }]}>ESCROW</Text>
            <Text style={[styles.metricLabel, { color: '#fff' }]}>Paystack Protection</Text>
          </View>
        </View>

        {/* Strong Chunky Call-to-Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.signUpBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.signUpBtnText}>🎯 GET STARTED / SIGN UP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logInBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.logInBtnText}>👤 LOG IN TO MY PORTAL</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Credit */}
        <Text style={styles.credits}>
          UMaT Student Commerce Engine &bull; Tarkwa, Western Region 🇬🇭
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tickerHeader: {
    backgroundColor: '#000',
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderColor: '#000',
    overflow: 'hidden',
  },
  tickerWrapper: {
    flexDirection: 'row',
    width: 600,
  },
  tickerText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  logoBadge: {
    borderWidth: 1.5,
    borderColor: '#000',
    backgroundColor: '#fffacd',
    paddingHorizontal: 8,
    paddingVertical: 3,
    transform: [{ rotate: '-2deg' }],
  },
  logoBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
    color: '#000',
  },
  logoTitle: {
    fontSize: 50,
    fontWeight: '900',
    letterSpacing: -1.5,
    color: '#000',
    textShadowColor: '#ff6b6b',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
    marginVertical: 4,
  },
  subtitleWrapper: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 2,
  },
  logoSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#000',
  },
  
  // Interactive Onboarding Card
  slideCard: {
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: colors.surface,
    padding: 16,
    ...shadows.bulletinHeavy,
    gap: 12,
  },
  slideBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  slideBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  slideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.bulletin,
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    textTransform: 'uppercase',
  },
  slideDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#555',
  },
  slideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 2,
    borderColor: '#000',
    paddingTop: 12,
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderWidth: 1.5,
    borderColor: '#000',
    backgroundColor: '#fff',
  },
  dotActive: {
    backgroundColor: '#000',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
    backgroundColor: '#fffacd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  nextBtnText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  // Grid metrics panel
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  metricBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.bulletin,
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
  },

  // Chunky buttons
  actions: {
    gap: 12,
    marginTop: 10,
  },
  signUpBtn: {
    backgroundColor: '#ff6b6b',
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.bulletinHeavy,
  },
  signUpBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  logInBtn: {
    backgroundColor: '#fffdf8',
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.bulletinHeavy,
  },
  logInBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  credits: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8f8373',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 10,
  },
});

export default WelcomeScreen;
