import React, { useState, useEffect, useRef } from 'react';
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
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'swap-horizontal-outline',
    title: '📍 Campus Swaps',
    highlight: '🔥 0% COMMISSION ALWAYS',
    color: '#ff6b6b',
    desc: 'Selling your old mini-fridge, late-night noodles, or textbook gear? Post it in 10 seconds. Keep 100% of your money. Zero commission. Always.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: '💳 Paystack Escrow',
    highlight: '🛡️ NO MORE SCAMS',
    color: '#3d307c',
    desc: 'Pay with Momo inside the app. We hold the cash securely in escrow. The seller doesn\'t get a single pesewa until you verify the item in person.',
  },
  {
    icon: 'qr-code-outline',
    title: '🚀 QR Scanner Handoff',
    highlight: '⚡ INSTANT RELEASE',
    color: '#10b981',
    desc: 'Meet safely at the Library or Main Gate. Scan the seller\'s automatically generated QR code on your phone to instantly release escrow funds.',
  },
];

const WelcomeScreen = ({ navigation }: any) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  // Ticker offsets
  const tickerOffset = useRef(new Animated.Value(0)).current;

  // Intro animations
  const introY = useRef(new Animated.Value(0)).current;
  const letterQ = useRef(new Animated.Value(0)).current;
  const letterU = useRef(new Animated.Value(0)).current;
  const letterA = useRef(new Animated.Value(0)).current;
  const letterD = useRef(new Animated.Value(0)).current;
  const letterS = useRef(new Animated.Value(0)).current;
  const introSub = useRef(new Animated.Value(0)).current;
  const loadBar = useRef(new Animated.Value(0)).current;

  // Content fade
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Ticker Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(tickerOffset, {
          toValue: -250,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(tickerOffset, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 2. Play Staggered Brand Letter Springs
    const springConfig = (val: Animated.Value) =>
      Animated.spring(val, {
        toValue: 1,
        tension: 50,
        friction: 4,
        useNativeDriver: true,
      });

    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        springConfig(letterQ),
        Animated.sequence([Animated.delay(100), springConfig(letterU)]),
        Animated.sequence([Animated.delay(200), springConfig(letterA)]),
        Animated.sequence([Animated.delay(300), springConfig(letterD)]),
        Animated.sequence([Animated.delay(400), springConfig(letterS)]),
      ]),
      Animated.parallel([
        Animated.timing(introSub, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(loadBar, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false, // width animation doesn't support native driver
        }),
      ]),
      Animated.delay(600),
      // 3. Slide intro up out of screen
      Animated.timing(introY, {
        toValue: -height,
        duration: 800,
        easing: Easing.bezier(0.77, 0, 0.175, 1),
        useNativeDriver: true,
      }),
      // 4. Fade main content in
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowIntro(false);
    });
  }, []);

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % SLIDES.length);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {/* Main Catchy Content (fades in after intro) */}
      <Animated.View style={[styles.mainLayout, { opacity: showIntro ? 0 : contentFade }]}>
        
        {/* Dynamic Campus Ticker Header - ACCENT COLOR BACKGROUND */}
        <View style={styles.tickerHeader}>
          <Animated.View style={[styles.tickerWrapper, { transform: [{ translateX: tickerOffset }] }]}>
            <Text style={styles.tickerText}>
              ⚡ GET YOUR SMOOTHIES ⚡ AVOID HOSTEL SCAMS ⚡ DORM GEAR FOR CHEAP ⚡ TEXTBOOKS ON DEMAND ⚡ MEET AT THE MAIN GATE ⚡ SECURE ESCROW PROTECTION ⚡
            </Text>
          </Animated.View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Brand Hero logo banner */}
          <View style={styles.heroSection}>
            <Text style={styles.logoTitle}>QUADS</Text>
            <View style={styles.subtitleWrapper}>
              <Text style={styles.logoSubtitle}>DITCH THE SLOP &bull; CAMPUS SWAPS</Text>
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
              <Text style={styles.metricVal}>🔥 0% FEES</Text>
              <Text style={styles.metricLabel}>Zero slop swaps</Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: '#ff6b6b', transform: [{ rotate: '1.2deg' }] }]}>
              <Text style={[styles.metricVal, { color: '#fff' }]}>🛡️ ESCROW</Text>
              <Text style={[styles.metricLabel, { color: '#fff' }]}>Anti-scam shield</Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: '#10b981', transform: [{ rotate: '-0.8deg' }] }]}>
              <Text style={[styles.metricVal, { color: '#fff' }]}>🎓 UMaT ONLY</Text>
              <Text style={[styles.metricLabel, { color: '#fff' }]}>Verified scholars</Text>
            </View>
          </View>

          {/* Strong Chunky Call-to-Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.signUpBtn}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.signUpBtnText}>🚀 LETS GO / SIGN UP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logInBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.logInBtnText}>🔑 ALREADY A MEMBER? LOG IN</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </Animated.View>

      {/* 🚀 Brand Intro Anim Container Overlay */}
      {showIntro && (
        <Animated.View style={[styles.introContainer, { transform: [{ translateY: introY }] }]}>
          <View style={styles.introInner}>
            {/* Animated Brand Letters */}
            <View style={styles.letterRow}>
              {[
                { letter: 'Q', anim: letterQ },
                { letter: 'U', anim: letterU },
                { letter: 'A', anim: letterA },
                { letter: 'D', anim: letterD },
                { letter: 'S', anim: letterS },
              ].map((item, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.letterCard,
                    {
                      transform: [{ scale: item.anim }],
                      opacity: item.anim,
                    },
                  ]}
                >
                  <Text style={styles.letterText}>{item.letter}</Text>
                </Animated.View>
              ))}
            </View>

            {/* Intro Subtitle + Animated Loadbar */}
            <Animated.View style={[styles.introSubWrapper, { opacity: introSub }]}>
              <Text style={styles.introSubText}>TARKWA'S FINEST CAMPUS ESCROW</Text>
              <View style={styles.loadTrack}>
                <Animated.View
                  style={[
                    styles.loadFill,
                    {
                      width: loadBar.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  mainLayout: {
    flex: 1,
  },
  tickerHeader: {
    backgroundColor: colors.accent, // ACCENT COLOR BACKGROUND
    paddingVertical: 8,
    borderBottomWidth: 3,
    borderColor: '#000',
    overflow: 'hidden',
  },
  tickerWrapper: {
    flexDirection: 'row',
    width: 800,
  },
  tickerText: {
    color: '#000', // BOLD BLACK TEXT FOR HIGH CONTRAST
    fontSize: 10,
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
    marginTop: 15,
    gap: 2,
  },
  logoTitle: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -2,
    color: '#000',
    textShadowColor: colors.accent,
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
    marginVertical: 4,
  },
  subtitleWrapper: {
    borderBottomWidth: 2.5,
    borderBottomColor: '#000',
    paddingBottom: 2,
  },
  logoSubtitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#000',
  },
  
  // Carousel Card
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
    fontSize: 9,
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
    fontSize: 13,
    lineHeight: 19,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  nextBtnText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  metricBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.bulletin,
  },
  metricVal: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
  },

  // CTA Buttons
  actions: {
    gap: 12,
    marginTop: 10,
  },
  signUpBtn: {
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.bulletinHeavy,
  },
  signUpBtnText: {
    color: '#fff',
    fontSize: 14,
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
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  // 🚀 Brand Intro Animations Overlay Styles
  introContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  introInner: {
    alignItems: 'center',
    gap: 24,
  },
  letterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  letterCard: {
    width: 52,
    height: 52,
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.bulletinHeavy,
  },
  letterText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000',
  },
  introSubWrapper: {
    alignItems: 'center',
    gap: 12,
  },
  introSubText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
    color: '#7c6f60',
    textTransform: 'uppercase',
  },
  loadTrack: {
    width: 200,
    height: 6,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#fff',
    borderRadius: 3,
    overflow: 'hidden',
  },
  loadFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
});

export default WelcomeScreen;
