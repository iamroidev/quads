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
    icon: 'storefront-outline',
    title: 'Campus Swaps',
    highlight: '🔥 0% COMMISSION ALWAYS',
    color: '#ff6b6b',
    desc: 'Selling your old mini-fridge, engineering calculator, or textbook gear? Post it in 10 seconds. Keep 100% of your money. Zero commission. Always.',
  },
  {
    icon: 'lock-closed-outline',
    title: 'Paystack Escrow',
    highlight: '🛡️ NO MORE SCAMS',
    color: '#3d307c',
    desc: 'Pay with Momo inside the app. We hold the cash securely in escrow. The seller doesn\'t get a single pesewa until you verify the item in person.',
  },
  {
    icon: 'scan-outline',
    title: 'QR Scanner Handoff',
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

  // Staggered main layout entrances
  const contentFade = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(50)).current;
  const carouselY = useRef(new Animated.Value(75)).current;
  const metricsY = useRef(new Animated.Value(100)).current;
  const actionsY = useRef(new Animated.Value(125)).current;

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
          duration: 1800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
      Animated.delay(1200),
      // 3. Slower elegant slide up
      Animated.timing(introY, {
        toValue: -height,
        duration: 900,
        easing: Easing.bezier(0.77, 0, 0.175, 1),
        useNativeDriver: true,
      }),
      // 4. Play highly dramatic staggered springs for welcome components
      Animated.parallel([
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.stagger(150, [
          Animated.spring(heroY, {
            toValue: 0,
            tension: 30,
            friction: 5.5,
            useNativeDriver: true,
          }),
          Animated.spring(carouselY, {
            toValue: 0,
            tension: 30,
            friction: 5.5,
            useNativeDriver: true,
          }),
          Animated.spring(metricsY, {
            toValue: 0,
            tension: 30,
            friction: 5.5,
            useNativeDriver: true,
          }),
          Animated.spring(actionsY, {
            toValue: 0,
            tension: 30,
            friction: 5.5,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      setShowIntro(false);
    });
  }, []);

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % SLIDES.length);
  };

  // Render highly-visual engineering graph grid background with floating shapes
  const renderBackgroundGrid = () => {
    const horizontalLines = Array.from({ length: 28 });
    const verticalLines = Array.from({ length: 12 });
    
    return (
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {/* Horizontal grid lines */}
        {horizontalLines.map((_, index) => (
          <View
            key={`h-${index}`}
            style={{
              position: 'absolute',
              top: index * 36,
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
            }}
          />
        ))}
        {/* Vertical grid lines */}
        {verticalLines.map((_, index) => (
          <View
            key={`v-${index}`}
            style={{
              position: 'absolute',
              left: index * 36,
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
            }}
          />
        ))}
        
        {/* Floating Neobrutalist Shape 1: Accent Circle in Top Right */}
        <View style={{
          position: 'absolute',
          top: 90,
          right: -40,
          width: 130,
          height: 130,
          borderRadius: 65,
          backgroundColor: colors.accent + '15',
          borderWidth: 2,
          borderColor: colors.accent + '35',
        }} />

        {/* Floating Neobrutalist Shape 2: rotated square in mid left */}
        <View style={{
          position: 'absolute',
          top: 420,
          left: -40,
          width: 90,
          height: 90,
          backgroundColor: '#fffacd15',
          borderWidth: 2,
          borderColor: '#fffacd35',
          transform: [{ rotate: '28deg' }],
        }} />

        {/* Tiny Retro crossmarks (+) floating around for depth */}
        <Text style={{ position: 'absolute', top: 120, left: 35, fontSize: 26, fontWeight: '400', color: 'rgba(0,0,0,0.18)' }}>+</Text>
        <Text style={{ position: 'absolute', top: 290, right: 45, fontSize: 22, fontWeight: '400', color: 'rgba(0,0,0,0.18)' }}>+</Text>
        <Text style={{ position: 'absolute', top: 540, left: 45, fontSize: 24, fontWeight: '400', color: 'rgba(0,0,0,0.18)' }}>+</Text>
        <Text style={{ position: 'absolute', top: 760, right: 35, fontSize: 28, fontWeight: '400', color: 'rgba(0,0,0,0.18)' }}>+</Text>
      </View>
    );
  };

  // Render a visual Red Thumbtack to simulate pinning on a board
  const renderThumbtack = () => (
    <View style={{
      position: 'absolute',
      top: -12,
      left: '50%',
      marginLeft: -10,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#ff6b6b',
      borderWidth: 2.5,
      borderColor: '#000',
      zIndex: 100,
      shadowColor: '#000',
      shadowOffset: { width: 1.5, height: 1.5 },
      shadowOpacity: 0.4,
      shadowRadius: 0,
      elevation: 4,
    }}>
      {/* Shine Reflection */}
      <View style={{
        position: 'absolute',
        top: 2,
        left: 2,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
      }} />
    </View>
  );

  // Render a beige masking tape block to simulate bulletin notes taped down
  const renderMaskingTape = (rotation: string) => (
    <View style={{
      position: 'absolute',
      top: -8,
      alignSelf: 'center',
      width: 48,
      height: 13,
      backgroundColor: '#f5e7cd',
      borderWidth: 1.5,
      borderColor: '#000',
      transform: [{ rotate: rotation }],
      zIndex: 10,
      opacity: 0.95,
      shadowColor: '#000',
      shadowOffset: { width: 1, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 0,
      elevation: 1,
    }} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {/* Main Catchy Content (fades in staggered after intro) */}
      <Animated.View style={[styles.mainLayout, { opacity: showIntro ? 0 : contentFade }]}>
        
        {/* Dynamic Campus Ticker Header */}
        <View style={styles.tickerHeader}>
          <Animated.View style={[styles.tickerWrapper, { transform: [{ translateX: tickerOffset }] }]}>
            <Text style={styles.tickerText}>
              ⚡ GET YOUR SMOOTHIES ⚡ AVOID HOSTEL SCAMS ⚡ DORM GEAR FOR CHEAP ⚡ TEXTBOOKS ON DEMAND ⚡ MEET AT THE MAIN GATE ⚡ SECURE ESCROW PROTECTION ⚡
            </Text>
          </Animated.View>
        </View>

        {/* Grid & Floating Shapes Canvas Background */}
        {renderBackgroundGrid()}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Brand Hero logo banner - Staggered Slide In */}
          <Animated.View style={[styles.heroSection, { transform: [{ translateY: heroY }] }]}>
            <Text style={styles.logoTitle}>QUADS</Text>
            <View style={styles.subtitleWrapper}>
              <Text style={styles.logoSubtitle}>THE OFFICIAL INSTITUTIONAL MARKETPLACE</Text>
            </View>
          </Animated.View>

          {/* 📢 Pinned Safety Memo Canary Yellow Sticky Note */}
          <Animated.View style={[
            styles.stickyNotice,
            { transform: [{ translateY: heroY }, { rotate: '-1.2deg' }] }
          ]}>
            {/* 📌 Red Thumbtack Pinned onto yellow sticky */}
            {renderThumbtack()}
            <Text style={styles.stickyTitle}>📢 CAMPUS SAFETY MEMO</Text>
            <Text style={styles.stickyBody}>
              Always perform exchange handoffs at public squares (Library, Hall Cafes, or Main Gates). Scan the seller's QR code on-site to release escrow instantly. Safe swaps only!
            </Text>
          </Animated.View>

          {/* Catchy Carousel Visual Slides - Staggered Slide In */}
          <Animated.View style={[styles.slideCard, { transform: [{ translateY: carouselY }] }]}>
            {/* 📌 Red Thumbtack detail pinned at the top-center */}
            {renderThumbtack()}

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
          </Animated.View>

          {/* Catchy Statistics / Parity Badges - Staggered Slide In */}
          <Animated.View style={[styles.metricsGrid, { transform: [{ translateY: metricsY }] }]}>
            <View style={[styles.metricBox, { backgroundColor: '#fffacd', transform: [{ rotate: '-1.5deg' }] }]}>
              {/* 🩹 Masking tape detailed overlay */}
              {renderMaskingTape('-12deg')}
              <Text style={styles.metricVal}>🔥 0% FEES</Text>
              <Text style={styles.metricLabel}>Zero slop swaps</Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: '#ff6b6b', transform: [{ rotate: '1.2deg' }] }]}>
              {/* 🩹 Masking tape detailed overlay */}
              {renderMaskingTape('8deg')}
              <Text style={[styles.metricVal, { color: '#fff' }]}>🛡️ ESCROW</Text>
              <Text style={[styles.metricLabel, { color: '#fff' }]}>Anti-scam shield</Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: '#10b981', transform: [{ rotate: '-0.8deg' }] }]}>
              {/* 🩹 Masking tape detailed overlay */}
              {renderMaskingTape('-5deg')}
              <Text style={[styles.metricVal, { color: '#fff' }]}>🎓 UMaT ONLY</Text>
              <Text style={[styles.metricLabel, { color: '#fff' }]}>Verified scholars</Text>
            </View>
          </Animated.View>

          {/* Strong Chunky Call-to-Actions - Staggered Slide In */}
          <Animated.View style={[styles.actions, { transform: [{ translateY: actionsY }] }]}>
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
          </Animated.View>

        </ScrollView>
      </Animated.View>

      {/* 🚀 Brand Intro Anim Container Overlay */}
      {showIntro && (
        <Animated.View style={[styles.introContainer, { transform: [{ translateY: introY }] }]}>
          <View style={styles.introInner}>
            
            {/* Animated Brand Letters with Integrated Large Vector Q-Logo */}
            <View style={styles.letterRow}>
              
              {/* 🚀 First Letter is the Official Vector Q-Logo! Slightly larger (58x58) */}
              <Animated.View
                style={[
                  styles.letterCard,
                  {
                    width: 58,
                    height: 58,
                    borderWidth: 3.5,
                    borderColor: '#000',
                    marginRight: 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{ scale: letterQ }],
                    opacity: letterQ,
                    position: 'relative',
                  },
                ]}
              >
                {/* Bold Stencil Q (Inner Ring) */}
                <View style={{
                  width: 26,
                  height: 26,
                  borderWidth: 6,
                  borderColor: '#000',
                  backgroundColor: 'transparent',
                }} />
                
                {/* Bold Stencil Q (Rotated Tail) */}
                <View style={{
                  position: 'absolute',
                  bottom: 9,
                  right: 9,
                  width: 10,
                  height: 5,
                  backgroundColor: '#000',
                  transform: [{ rotate: '45deg' }],
                }} />

                {/* Red Thumbtack detail (Top Right) */}
                <View style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#ff6b6b',
                  borderWidth: 1.5,
                  borderColor: '#000',
                }} />
              </Animated.View>

              {/* Remaining brand letters: U A D S (Standard size 48x48) */}
              {[
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
                      width: 48,
                      height: 48,
                      transform: [{ scale: item.anim }],
                      opacity: item.anim,
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Text style={[styles.letterText, { fontSize: 24 }]}>{item.letter}</Text>
                </Animated.View>
              ))}
            </View>

            {/* Intro Subtitle + Animated Loadbar */}
            <Animated.View style={[styles.introSubWrapper, { opacity: introSub }]}>
              <Text style={styles.introSubText}>THE OFFICIAL INSTITUTIONAL MARKETPLACE</Text>
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
    backgroundColor: colors.accent,
    paddingVertical: 8,
    borderBottomWidth: 3,
    borderColor: '#000',
    zIndex: 10,
    overflow: 'hidden',
  },
  tickerWrapper: {
    flexDirection: 'row',
    width: 800,
  },
  tickerText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
    zIndex: 5,
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

  // Canary Yellow Pinned Safety Memo Note
  stickyNotice: {
    position: 'relative',
    backgroundColor: '#fffacd',
    borderWidth: 2.5,
    borderColor: '#000',
    padding: 14,
    marginTop: 6,
    marginHorizontal: 2,
    ...shadows.bulletin,
  },
  stickyTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#000',
    textTransform: 'uppercase',
    marginBottom: 5,
    textAlign: 'center',
  },
  stickyBody: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#333',
    lineHeight: 15,
    textAlign: 'center',
  },
  
  // Carousel Card
  slideCard: {
    position: 'relative',
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: colors.surface,
    padding: 18,
    marginTop: 6,
    ...shadows.bulletinHeavy,
    gap: 12,
  },
  slideBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
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
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metricBox: {
    position: 'relative',
    flex: 1,
    borderWidth: 2,
    borderColor: '#000',
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...shadows.bulletin,
  },
  metricVal: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
    textAlign: 'center',
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 3,
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
    alignItems: 'center',
    gap: 8,
  },
  letterCard: {
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
