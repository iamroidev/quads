import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Caveat_700Bold } from "@expo-google-fonts/caveat";
import productService from "../services/product.service";
import { Product } from "../types";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { BulletinCard } from "../components/BulletinCard";
import ScreenHeader from "../components/ScreenHeader";
import { SkeletonPulse, CardSkeleton } from "../components/SkeletonLoader";
import FloatingCart from "../components/FloatingCart";
import categoryService, {
  CategoryWithCount,
} from "../services/category.service";
import { useResponsive } from "../hooks/useResponsive";
import { getTypography } from "../theme/typography";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OnboardingTour from "../components/OnboardingTour";

// Washi tape divider component
const WashiTapeDivider = ({ color, bgColor }: { color: string; bgColor: string }) => (
  <View style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
    <View style={{
      height: 6,
      backgroundColor: color,
      opacity: 0.25,
      borderRadius: 1,
    }} />
  </View>
);

const CURATED_HERO_CARDS = [
  {
    id: "study",
    title: "Study essentials",
    subtitle: "Textbooks, calculators, and practical kits",
    filter: "books",
  },
  {
    id: "hostel",
    title: "Hostel upgrades",
    subtitle: "Fans, mini-fridges, storage and comfort picks",
    filter: "hostel",
  },
  {
    id: "gadgets",
    title: "Gadgets",
    subtitle: "Phones, laptops, and accessories from students",
    filter: "electronics",
  },
];

const formatPrice = (n: number) =>
  `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

const ProductCard = ({
  item,
  onPress,
  columns,
}: {
  item: Product;
  onPress: () => void;
  columns: number;
}) => {
  const { colors } = useTheme();
  const { width } = useResponsive();
  const styles = getStyles(colors, width);
  const image = item.images?.[0]?.url;
  const conditionColor = 
    item.condition === 'new' ? colors.success : 
    item.condition === 'like-new' ? colors.primary : 
    item.condition === 'good' ? colors.pinBlue : colors.textSecondary;

  const gap = 16;
  const padding = width < 640 ? 12 : 16;
  const cardWidth = (width - padding * 2 - gap * (columns - 1)) / columns;

  return (
    <BulletinCard style={[styles.card, { width: cardWidth }]} size="sm">
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
        {/* Image — tall portrait ratio */}
        <View style={styles.imageContainer}>
          <Image
            source={image ? { uri: image } : require("../../assets/icon.png")}
            style={styles.cardImage}
            resizeMode="cover"
          />

          {/* Top-left: featured flash badge */}
          {item.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>NEW</Text>
            </View>
          )}

          {/* Top-right: sticker-style condition badge */}
          <View style={[styles.conditionTag, { backgroundColor: conditionColor, transform: [{ rotate: '3deg' }] }]}>
            <Text style={styles.conditionTagText}>{item.condition.replace('-', ' ')}</Text>
          </View>

          {/* SOLD / PENDING stamp */}
          {(item.status === "sold" || item.status === "reserved") && (
            <View style={styles.stampOverlay}>
              <Text style={styles.stampText}>
                {item.status === "sold" ? "SOLD" : "PENDING"}
              </Text>
            </View>
          )}
        </View>

        {/* Card body */}
        <View style={styles.cardBody}>
          <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
          <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">
            {item.title}
          </Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardMetaText} numberOfLines={1}>
              {item.pickupLocation || "UMaT"}
            </Text>
            {(item.views ?? 0) > 0 && (
              <Text style={styles.cardViews}>{item.views} views</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </BulletinCard>
  );
};

const RecentlyViewedCard = ({
  item,
  onPress,
  colors,
}: {
  item: Product;
  onPress: () => void;
  colors: any;
}) => {
  const image = item.images?.[0]?.url;
  
  return (
    <BulletinCard style={{ width: 140, borderWidth: 2, borderColor: colors.boardBorder, backgroundColor: colors.surface }} size="sm">
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
        <View style={{ width: "100%", height: 100, backgroundColor: colors.surfaceSecondary, overflow: "hidden", borderBottomWidth: 1.5, borderBottomColor: colors.boardBorder }}>
          <Image
            source={image ? { uri: image } : require("../../assets/icon.png")}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </View>
        <View style={{ padding: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "900", color: colors.successTintText }} numberOfLines={1}>
            {formatPrice(item.price)}
          </Text>
          <Text style={{ fontSize: 10, fontWeight: "900", color: colors.text, marginTop: 2, textTransform: "uppercase", height: 28 }} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
      </TouchableOpacity>
    </BulletinCard>
  );
};

const HomeScreen = ({ navigation }: any) => {
  const { user, setViewMode } = useAuth();
  const { colors, isDark } = useTheme();
  const { width, isMobile, isTablet } = useResponsive();
  const typography = getTypography(width);
  const [fontsLoaded] = useFonts({ Caveat_700Bold });
  const styles = getStyles(colors, width, fontsLoaded);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [recent, setRecent] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [recentPage, setRecentPage] = useState(1);
  const [hasMoreRecent, setHasMoreRecent] = useState(true);
  const [loadingMoreRecent, setLoadingMoreRecent] = useState(false);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) {
        setShowOnboarding(false);
        return;
      }
      try {
        const hasSeen = await AsyncStorage.getItem("hasSeenOnboarding");
        if (!hasSeen) {
          setShowOnboarding(true);
        }
      } catch (err) {
        console.warn("Failed to read onboarding state:", err);
      }
    };
    checkOnboarding();
  }, [user]);

  const columns = isMobile ? 2 : isTablet ? 2 : 3;

  const fetchData = useCallback(async (withLoader = true) => {
    if (withLoader) setLoading(true);
    try {
      const [featuredRes, recentRes, trendingRes, categoryRes] =
        await Promise.all([
          productService.getProducts({ limit: 8, sort: "featured" }),
          productService.getProducts({ page: 1, limit: 20, sort: "newest" }),
          productService.getProducts({ limit: 8, sort: "popular" }),
          categoryService.getCategoriesWithCounts(),
        ]);
      if (featuredRes.success)
        setFeatured(featuredRes.data.filter((p) => p.isFeatured).slice(0, 6));
      if (recentRes.success) setRecent(recentRes.data);
      if (recentRes.success) {
        setRecentPage(1);
        setHasMoreRecent((recentRes.pagination?.pages || 1) > 1);
      }
      if (trendingRes?.success) setTrending(trendingRes.data);
      if (categoryRes?.success)
        setCategories(categoryRes.data.categories.slice(0, 8));

      if (user) {
        const rvRes = await api.get('/discovery/recently-viewed');
        if (rvRes.data?.success) {
          setRecentlyViewed(rvRes.data.data || []);
        }
      }
    } catch (e) {
      console.log("Error fetching home data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadMoreRecent = async () => {
    if (loadingMoreRecent || !hasMoreRecent) return;
    setLoadingMoreRecent(true);
    try {
      const nextPage = recentPage + 1;
      const recentRes = await productService.getProducts({
        page: nextPage,
        limit: 20,
        sort: "newest",
      });
      if (recentRes.success) {
        setRecent((prev) => [...prev, ...recentRes.data]);
        setRecentPage(nextPage);
        setHasMoreRecent((recentRes.pagination?.pages || 1) > nextPage);
      }
    } finally {
      setLoadingMoreRecent(false);
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSearch = () => {
    navigation.navigate("ProductsTab", {
      screen: "ProductsHome",
      params: { search },
    });
  };

  const openBrowse = () =>
    navigation.navigate("ProductsTab", {
      screen: "ProductsHome",
      params: { search },
    });

  const goToProduct = useCallback((productId: string) =>
    navigation.navigate("ProductsTab", {
      screen: "ProductDetail",
      params: { productId },
    }), [navigation]);

  const renderProductItem = useCallback(({ item }: { item: Product }) => (
    <ProductCard item={item} onPress={() => goToProduct(item._id)} columns={columns} />
  ), [goToProduct, columns]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScreenHeader
          eyebrow="QUADS"
          title="Home"
          subtitle="Curated highlights, featured drops, and fresh campus listings."
        />
        <ScrollView contentContainerStyle={{ padding: isMobile ? 12 : 16 }}>
          <SkeletonPulse height={180} style={{ marginBottom: 24, borderWidth: 1, borderColor: colors.boardBorder }} />
          <SkeletonPulse width="40%" height={16} style={{ marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <CardSkeleton />
            <CardSkeleton />
          </View>
          <SkeletonPulse width="30%" height={16} style={{ marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <CardSkeleton />
            <CardSkeleton />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const hPadding = isMobile ? 12 : 16;
  const sectionVSpace = isMobile ? 18 : 26;
  const curatedCardW = isMobile ? 170 : isTablet ? 200 : 210;
  const curatedCardPad = isMobile ? 12 : 16;
  const featuredCardW = isMobile ? 160 : isTablet ? 180 : 190;
  const featuredCardH = isMobile ? 120 : isTablet ? 130 : 140;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData(false);
            }}
            tintColor={colors.primary}
            colors={[colors.primary, colors.pinYellow, colors.pinBlue]}
            title="📌 Refreshing..."
            titleColor={colors.textSecondary}
          />
        }
      >
        <ScreenHeader
          eyebrow="QUADS MARKET"
          title="Campus Deals"
          subtitle="Direct student-to-student transactions with escrow protection."
        />
        
        <Animated.View style={[styles.premiumHeader, { opacity: fadeAnim }]}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerGreetingBlock}>
              <Text style={[styles.premiumGreeting]}>
                {user ? `Hey, ${user.name.split(" ")[0]}` : "WELCOME TO QUADS"}
              </Text>
              <Text style={styles.premiumSubtitle}>Find great deals verified on campus.</Text>
            </View>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Cart')}
              activeOpacity={0.7}
            >
              <Ionicons name="cart-outline" size={19} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.premiumSearchBox}>
            <TextInput
              style={styles.premiumSearchInput}
              placeholder="Search textbooks, devices, hostel items..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.premiumSearchBtn} onPress={handleSearch}>
              <Text style={styles.premiumSearchBtnText}>GO</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.secondaryHeroBtn}
            onPress={openBrowse}
          >
            <Text style={styles.secondaryHeroBtnText}>Browse All Campus Listings</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.quickSection}>
          <View style={[styles.sectionHeader, { paddingHorizontal: hPadding }]}>
            <Text style={styles.sectionLabel}>CURATED SELECTIONS</Text>
            <Text style={styles.sectionTitle}>Shop by need</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.hScroll, { paddingHorizontal: hPadding }]}
          >
            {CURATED_HERO_CARDS.map((card) => {
              const cardIcon = 
                card.id === 'study' ? 'library-outline' : 
                card.id === 'hostel' ? 'bed-outline' : 'hardware-chip-outline';
              
              return (
                <BulletinCard key={card.id} style={[styles.curatedCard, { width: curatedCardW }]} size="md">
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("ProductsTab", {
                        screen: "ProductsHome",
                        params: { search: card.filter },
                      })
                    }
                    activeOpacity={0.8}
                  >
                    {/* Diagonal tape strip */}
                    <View style={styles.tapeStrip} pointerEvents="none" />
                    <View style={[styles.curatedTopRow, { padding: curatedCardPad }]}>
                      <View style={styles.curatedIconBox}>
                        <Ionicons name={cardIcon} size={20} color={colors.primary} />
                      </View>
                      <View style={styles.curatedBadge}>
                        <Text style={styles.curatedBadgeText}>SPOTLIGHT</Text>
                      </View>
                    </View>
                    <View style={{ padding: curatedCardPad, paddingTop: 0 }}>
                      <Text style={styles.curatedCardTitle} numberOfLines={2} ellipsizeMode="tail">{card.title}</Text>
                      <Text style={styles.curatedCardSubtitle} numberOfLines={2} ellipsizeMode="tail">{card.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                </BulletinCard>
              );
            })}
          </ScrollView>
        </View>

        <WashiTapeDivider color={colors.primary} bgColor={colors.background} />

        {user && recentlyViewed.length > 0 && (
          <View style={styles.quickSection}>
            <View style={[styles.sectionHeader, { paddingHorizontal: hPadding }]}>
              <Text style={styles.sectionLabel}>RECENTLY VIEWED</Text>
              <Text style={styles.sectionTitle}>Pick up where you left off</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.hScroll, { paddingHorizontal: hPadding }]}
            >
              {recentlyViewed.map((item) => (
                <RecentlyViewedCard
                  key={item.product._id}
                  item={item.product}
                  onPress={() => goToProduct(item.product._id)}
                  colors={colors}
                />
              ))}
            </ScrollView>
            <WashiTapeDivider color={colors.pinYellow} bgColor={colors.background} />
          </View>
        )}

        {categories.length > 0 && (
          <View style={[styles.section, { paddingTop: sectionVSpace }]}>
            <View style={[styles.sectionHeader, { paddingHorizontal: hPadding }]}>
              <Text style={styles.sectionLabel}>DEPARTMENTS</Text>
              <Text style={styles.sectionTitle}>Browse categories</Text>
            </View>
            <View style={[styles.categoryGrid, { paddingHorizontal: hPadding }]}>
              {categories.map((cat) => {
                const mapSlugToIcon = (slug: string): string => {
                  const s = slug.toLowerCase();
                  if (s.includes('book') || s.includes('textbook')) return 'book-outline';
                  if (s.includes('phone') || s.includes('electro') || s.includes('device') || s.includes('gadget') || s.includes('tech')) return 'laptop-outline';
                  if (s.includes('food') || s.includes('drink') || s.includes('meal') || s.includes('smooth')) return 'fast-food-outline';
                  if (s.includes('cloth') || s.includes('fashion') || s.includes('wear')) return 'shirt-outline';
                  if (s.includes('service')) return 'construct-outline';
                  if (s.includes('accom') || s.includes('hostel') || s.includes('room') || s.includes('stay')) return 'home-outline';
                  if (s.includes('station')) return 'pencil-outline';
                  if (s.includes('sport') || s.includes('gym')) return 'football-outline';
                  return 'grid-outline';
                };

                const catCols = isMobile ? 2 : 4;
                const catGap = 12;
                const catCardWidth = (width - hPadding * 2 - catGap * (catCols - 1)) / catCols;

                return (
                  <View key={cat._id} style={[styles.categoryTile, { width: catCardWidth }]}>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("ProductsTab", {
                          screen: "ProductsHome",
                          params: { category: cat._id },
                        })
                      }
                      activeOpacity={0.8}
                      style={styles.categoryTileInner}
                    >
                      <View style={styles.categoryTileHeader}>
                        <View style={styles.categoryIconBox}>
                          <Ionicons name={mapSlugToIcon(cat.slug) as any} size={20} color={colors.primary} />
                        </View>
                        <View style={styles.categoryDot} />
                      </View>
                      <Text style={styles.categoryTileTitle} numberOfLines={1} ellipsizeMode="tail">
                        {cat.name}
                      </Text>
                      <Text style={styles.categoryCountText}>
                        {cat.productCount} {cat.productCount === 1 ? 'item' : 'items'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <WashiTapeDivider color={colors.pinYellow} bgColor={colors.background} />

        {featured.length > 0 && (
          <View style={[styles.section, { paddingTop: sectionVSpace }]}>
            <View style={[styles.sectionHeader, { paddingHorizontal: hPadding }]}>
              <Text style={styles.sectionLabel}>SPOTLIGHT</Text>
              <Text style={styles.sectionTitle}>Featured Drops</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.hScroll, { paddingHorizontal: hPadding }]}
            >
              {featured.map((item) => (
                <BulletinCard key={item._id} style={[styles.featuredCard, { width: featuredCardW, height: featuredCardH }]} size="md">
                  <TouchableOpacity
                    onPress={() => goToProduct(item._id)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={
                        item.images?.[0]?.url
                          ? { uri: item.images[0].url }
                          : require("../../assets/icon.png")
                      }
                      style={styles.featuredImage}
                    />
                    <View style={styles.featuredOverlay} />
                    <View style={styles.featuredInfo}>
                      <Text style={[styles.featuredTitle, { fontSize: isMobile ? 10 : 11 }]} numberOfLines={2} ellipsizeMode="tail">
                        {item.title}
                      </Text>
                      <Text style={[styles.featuredPrice, { fontSize: isMobile ? 10 : 11 }]}>
                        {formatPrice(item.price)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </BulletinCard>
              ))}
            </ScrollView>
          </View>
        )}

        <WashiTapeDivider color={colors.pinBlue} bgColor={colors.background} />

        <View style={[styles.section, { paddingTop: sectionVSpace }]}>
          <View style={[styles.sectionHeader, { paddingHorizontal: hPadding }]}>
            <Text style={styles.sectionLabel}>LATEST LISTINGS</Text>
            <Text style={styles.sectionTitle}>Freshly Posted</Text>
          </View>
          <FlatList
            data={recent}
            key={String(columns)}
            keyExtractor={(item) => item._id}
            renderItem={renderProductItem}
            numColumns={columns}
            columnWrapperStyle={columns > 1 ? [styles.grid, { paddingHorizontal: hPadding }] : undefined}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No listings available yet. Check back shortly.
              </Text>
            }
            ListFooterComponent={
              hasMoreRecent ? (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={loadMoreRecent}
                  disabled={loadingMoreRecent}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loadMoreBtnText}>
                    {loadingMoreRecent ? "Loading..." : "Load more listings"}
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </View>

        <WashiTapeDivider color={colors.pinGreen} bgColor={colors.background} />

        <View style={[styles.section, { paddingTop: sectionVSpace }]}>
          <View style={[styles.sectionHeader, { paddingHorizontal: hPadding }]}>
            <Text style={styles.sectionLabel}>TRENDING</Text>
            <Text style={styles.sectionTitle}>Most Popular</Text>
          </View>
          <FlatList
            data={trending}
            key={String(columns)}
            keyExtractor={(item) => item._id}
            renderItem={renderProductItem}
            numColumns={columns}
            columnWrapperStyle={columns > 1 ? [styles.grid, { paddingHorizontal: hPadding }] : undefined}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No trending products yet.</Text>
            }
          />
        </View>

        {user?.role === "buyer" || !(user as any)?.sellerOnboarding?.completed ? (
          <TouchableOpacity
            style={[styles.buyerCta, { marginHorizontal: hPadding }]}
            onPress={() => navigation.navigate("ProfileTab", { screen: "SellerOnboarding" })}
            activeOpacity={0.88}
          >
            
            <View style={styles.buyerCtaContent}>
              <Text style={styles.buyerCtaTop}>Got items to sell?</Text>
              <Text style={styles.buyerCtaTitle}>Start selling on QUADS</Text>
              <Text style={styles.buyerCtaSub}>List campus items and reach thousands of UMaT students.</Text>
            </View>
            
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.buyerCta, { marginHorizontal: hPadding }]}
            onPress={() => setViewMode("seller")}
            activeOpacity={0.88}
          >
            
            <View style={styles.buyerCtaContent}>
              <Text style={styles.buyerCtaTop}>Seller workspace</Text>
              <Text style={styles.buyerCtaTitle}>Return to Seller Hub</Text>
              <Text style={styles.buyerCtaSub}>Manage listings, orders and growth tools.</Text>
            </View>
            
          </TouchableOpacity>
        )}
      </ScrollView>
      {showOnboarding && (
        <OnboardingTour onComplete={() => setShowOnboarding(false)} />
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors: any, width: number, fontsLoaded = false) => {
  const isMobile = width < 640;
  const typography = getTypography(width);
  const hPadding = isMobile ? 12 : 16;
  const gap = isMobile ? 10 : 16;
  const handwrittenFont = fontsLoaded ? 'Caveat_700Bold' : undefined;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    premiumHeader: {
      backgroundColor: colors.background,
      paddingTop: 16,
      paddingBottom: 20,
      paddingHorizontal: hPadding,
      borderBottomWidth: colors.boardBorderWidth,
      borderBottomColor: colors.boardBorder,
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 16,
      gap: 12,
    },
    headerGreetingBlock: {
      flex: 1,
    },
    headerIconBtn: {
      width: 38,
      height: 38,
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    premiumGreeting: {
      fontSize: isMobile ? 20 : typography.h1,
      fontWeight: "900",
      color: colors.primary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    premiumSubtitle: {
      fontSize: isMobile ? 11 : typography.label,
      color: colors.textSecondary,
      marginTop: 4,
      fontWeight: "700",
    },
    premiumSearchBox: {
      flexDirection: "row",
      gap: 8,
      marginTop: 8,
    },
    premiumSearchInput: {
      flex: 1,
      minWidth: 0,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: isMobile ? 13 : typography.body,
      color: colors.text,
      fontWeight: "700",
    },
    premiumSearchBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: isMobile ? 14 : 20,
      justifyContent: 'center',
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
    },
    premiumSearchBtnText: {
      color: colors.primaryContent,
      fontWeight: "900",
      fontSize: isMobile ? 11 : typography.tag,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    secondaryHeroBtn: {
      marginTop: 16,
      backgroundColor: colors.surface,
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      paddingVertical: 12,
      alignItems: "center",
    },
    secondaryHeroBtnText: {
      color: colors.text,
      fontSize: isMobile ? 10 : typography.label,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    section: { paddingTop: 26, paddingBottom: 10 },
    quickSection: { paddingTop: 22, paddingBottom: 8 },
    sectionHeader: { paddingHorizontal: hPadding, marginBottom: 14 },
    sectionLabel: {
      fontSize: isMobile ? 9 : typography.tag,
      fontWeight: "900",
      color: colors.primary,
      letterSpacing: 2,
      textTransform: "uppercase",
    },
    sectionTitle: {
      fontSize: isMobile ? 22 : typography.h2 + 4,
      fontWeight: "900",
      color: colors.text,
      marginTop: 2,
      letterSpacing: 0.5,
      ...(handwrittenFont ? { fontFamily: handwrittenFont, textTransform: undefined } : { textTransform: "uppercase" }),
    },
    hScroll: { paddingHorizontal: hPadding, paddingRight: isMobile ? 24 : 32, gap: gap, paddingBottom: 10 },
    curatedCard: {
      padding: 0,
      overflow: 'hidden',
    },
    tapeStrip: {
      position: 'absolute',
      top: -8,
      right: 10,
      width: 20,
      height: 40,
      backgroundColor: colors.pinYellow,
      opacity: 0.35,
      transform: [{ rotate: '15deg' }],
      zIndex: 10,
    },
    curatedTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    curatedIconBox: {
      width: 32,
      height: 32,
      justifyContent: "center",
      alignItems: "center",
    },
    curatedBadge: {
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.boardBorder,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    curatedBadgeText: {
      fontSize: isMobile ? 7 : typography.tag,
      fontWeight: "900",
      color: colors.text,
      letterSpacing: 0.8,
    },
    curatedCardTitle: {
      fontSize: isMobile ? 12 : typography.h3,
      fontWeight: "900",
      color: colors.text,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    curatedCardSubtitle: {
      marginTop: 6,
      fontSize: isMobile ? 10 : typography.body,
      color: colors.textSecondary,
      lineHeight: isMobile ? 14 : 16,
      fontWeight: "700",
    },
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: hPadding,
      gap: 10,
    },
    categoryTile: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.boardBorder,
      borderBottomWidth: 3,
      borderRightWidth: 3,
    },
    categoryTileInner: {
      paddingVertical: 14,
      paddingHorizontal: 12,
    },
    categoryTileHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    categoryIconBox: {
      width: 34,
      height: 34,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1.5,
      borderColor: colors.boardBorder,
      justifyContent: "center",
      alignItems: "center",
    },
    categoryDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    categoryTileTitle: {
      fontSize: isMobile ? 11 : typography.label,
      fontWeight: "900",
      color: colors.text,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    categoryCountText: {
      fontSize: isMobile ? 9 : typography.tag,
      fontWeight: "700",
      color: colors.textSecondary,
      marginTop: 3,
      letterSpacing: 0.5,
    },
    featuredCard: {
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      overflow: "hidden",
      backgroundColor: colors.surfaceSecondary,
    },
    featuredImage: { width: "100%", height: "100%", position: "absolute" } as any,
    featuredOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    featuredInfo: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 10,
      backgroundColor: colors.overlay,
      borderTopWidth: 1,
      borderTopColor: colors.boardBorder,
    },
    featuredTitle: {
      fontWeight: "900",
      color: colors.primaryContent,
      lineHeight: 14,
      textTransform: "uppercase",
    },
    featuredPrice: {
      marginTop: 2,
      fontWeight: "900",
      color: colors.primary,
    },
    grid: { paddingHorizontal: hPadding, gap: gap, marginBottom: 12 },
    card: { flex: 1 },
    imageContainer: {
      width: "100%",
      aspectRatio: 4 / 3,
      backgroundColor: colors.surfaceSecondary,
      position: "relative",
      overflow: "hidden",
    },
    cardImage: { width: "100%", height: "100%" } as any,
    featuredBadge: {
      position: "absolute",
      top: 6,
      left: 6,
      backgroundColor: colors.primary,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 3,
      zIndex: 5,
    },
    featuredBadgeText: {
      fontSize: 9,
      fontWeight: "900",
      color: colors.primaryContent,
    },
    conditionTag: {
      position: "absolute",
      top: 6,
      right: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 2,
      zIndex: 5,
      borderWidth: 0.5,
      borderColor: 'rgba(0,0,0,0.15)',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 1, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 1,
        },
        android: { elevation: 2 },
      }),
    },
    conditionTagText: {
      fontSize: 8,
      fontWeight: "900",
      color: colors.primaryContent,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    stampOverlay: {
      position: "absolute",
      top: "32%",
      left: "5%",
      right: "5%",
      transform: [{ rotate: "-10deg" }],
      backgroundColor: colors.danger,
      borderWidth: 2,
      borderColor: colors.primaryContent,
      paddingVertical: 5,
      alignItems: "center",
      zIndex: 10,
    },
    stampText: {
      color: colors.dangerContent,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 2,
    },
    cardBody: {
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: 10,
      minWidth: 0,
      overflow: "hidden",
    },
    cardPrice: {
      fontSize: isMobile ? 14 : 16,
      fontWeight: "900",
      color: colors.primary,
      letterSpacing: -0.3,
      marginBottom: 3,
    },
    cardTitle: {
      fontSize: isMobile ? 11 : 13,
      fontWeight: "700",
      color: colors.text,
      lineHeight: isMobile ? 15 : 18,
      minHeight: isMobile ? 30 : 36,
    },
    cardMeta: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 5,
      gap: 4,
    },
    cardMetaText: {
      fontSize: 9,
      color: colors.muted,
      fontWeight: "500",
      flex: 1,
    },
    cardViews: {
      fontSize: 9,
      color: colors.textDisabled,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    locationBadge: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.boardBorder, paddingHorizontal: 4, paddingVertical: 2, maxWidth: "50%" },
    locationBadgeText: { fontSize: isMobile ? 7 : 9, fontWeight: "800", color: colors.text, textTransform: "uppercase" },
    emptyText: {
      textAlign: "center",
      color: colors.textSecondary,
      padding: 24,
      textTransform: "uppercase",
      letterSpacing: 1.1,
      fontWeight: "900",
      fontSize: isMobile ? 10 : typography.label,
    },
    buyerCta: {
      marginTop: 18,
      marginBottom: 28,
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      backgroundColor: colors.surface,
      padding: isMobile ? 14 : 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    buyerCtaIcon: {
      fontSize: 28,
    },
    buyerCtaContent: { flex: 1 },
    buyerCtaTop: {
      fontSize: isMobile ? 9 : typography.tag,
      color: colors.accent,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
    buyerCtaTitle: {
      marginTop: 4,
      color: colors.text,
      fontWeight: "900",
      fontSize: isMobile ? 14 : 16,
    },
    buyerCtaSub: {
      marginTop: 3,
      color: colors.textSecondary,
      fontSize: isMobile ? 10 : 11,
      lineHeight: 16,
      fontWeight: "600",
    },
    loadMoreBtn: {
      marginTop: 12,
      alignSelf: "center",
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      paddingHorizontal: 18,
      paddingVertical: 10,
      backgroundColor: colors.surface,
    },
    loadMoreBtnText: {
      fontSize: isMobile ? 9 : typography.tag,
      fontWeight: "900",
      color: colors.text,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
  });
};

export default HomeScreen;