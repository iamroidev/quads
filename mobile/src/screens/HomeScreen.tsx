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
import productService from "../services/product.service";
import { Product } from "../types";
import { useAuth } from "../context/AuthContext";
import { colors, shadows } from "../theme";
import ScreenHeader from "../components/ScreenHeader";
import { SkeletonPulse, CardSkeleton } from "../components/SkeletonLoader";
import FloatingCart from "../components/FloatingCart";
import categoryService, {
  CategoryWithCount,
} from "../services/category.service";

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
}: {
  item: Product;
  onPress: () => void;
}) => {
  const image = item.images?.[0]?.url;
  const conditionColor = 
    item.condition === 'new' ? '#4ade80' : 
    item.condition === 'like-new' ? '#c084fc' : 
    item.condition === 'good' ? '#60a5fa' : '#fbbf24';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        <Image
          source={image ? { uri: image } : require("../../assets/icon.png")}
          style={styles.cardImage}
          resizeMode="cover"
        />
        {item.isFeatured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>⚡ DROP</Text>
          </View>
        )}
        
        <View style={[styles.conditionTag, { backgroundColor: conditionColor }]}>
          <Text style={styles.conditionTagText}>{item.condition}</Text>
        </View>

        {(item.status === "sold" || item.status === "reserved") && (
          <View style={styles.stampOverlay}>
            <Text style={styles.stampText}>
              {item.status === "sold" ? "SOLD" : "PENDING"}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.cardPriceRow}>
          <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
          <View style={styles.locationBadge}>
            <Text style={styles.locationBadgeText} numberOfLines={1}>
              📍 {item.pickupLocation || "UMaT"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }: any) => {
  const { user, setViewMode } = useAuth();
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
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  const goToProduct = (productId: string) =>
    navigation.navigate("ProductsTab", {
      screen: "ProductDetail",
      params: { productId },
    });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScreenHeader
          eyebrow="QUADS"
          title="Home"
          subtitle="Curated highlights, featured drops, and fresh campus listings."
        />
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <SkeletonPulse height={180} style={{ marginBottom: 24, borderWidth: 1, borderColor: colors.border }} />
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
          />
        }
      >
        <ScreenHeader
          eyebrow="QUADS MARKET"
          title="Campus Deals"
          subtitle="Direct student-to-student transactions with escrow protection."
        />
        
        {/* Premium Neobrutalist Header & Search */}
        <Animated.View style={[styles.premiumHeader, { opacity: fadeAnim }]}>
          <View style={styles.headerGreetingBlock}>
            <Text style={styles.premiumGreeting}>
              {user ? `Hey, ${user.name.split(" ")[0]} 👋` : "WELCOME TO QUADS"}
            </Text>
            <Text style={styles.premiumSubtitle}>Find great deals verified on campus.</Text>
          </View>
          
          <View style={styles.premiumSearchBox}>
            <TextInput
              style={styles.premiumSearchInput}
              placeholder="Search textbooks, devices, hostel items..."
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.premiumSearchBtn} onPress={handleSearch}>
              <Text style={styles.premiumSearchBtnText}>GO 🔍</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.secondaryHeroBtn}
            onPress={openBrowse}
          >
            <Text style={styles.secondaryHeroBtnText}>Browse All Campus Listings</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Curated Spotlights */}
        <View style={styles.quickSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>CURATED SELECTIONS</Text>
            <Text style={styles.sectionTitle}>Shop by need</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScroll}
          >
            {CURATED_HERO_CARDS.map((card) => {
              const cardIcon = 
                card.id === 'study' ? 'library-outline' : 
                card.id === 'hostel' ? 'bed-outline' : 'hardware-chip-outline';
              
              return (
                <TouchableOpacity
                  key={card.id}
                  style={styles.curatedCard}
                  onPress={() =>
                    navigation.navigate("ProductsTab", {
                      screen: "ProductsHome",
                      params: { search: card.filter },
                    })
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.curatedTopRow}>
                    <View style={styles.curatedIconBox}>
                      <Ionicons name={cardIcon} size={20} color="#ff6b6b" />
                    </View>
                    <View style={styles.curatedBadge}>
                      <Text style={styles.curatedBadgeText}>SPOTLIGHT</Text>
                    </View>
                  </View>
                  <Text style={styles.curatedCardTitle}>{card.title}</Text>
                  <Text style={styles.curatedCardSubtitle}>{card.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Categories / Departments */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>DEPARTMENTS</Text>
              <Text style={styles.sectionTitle}>Browse categories</Text>
            </View>
            <View style={styles.categoryGrid}>
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

                return (
                  <TouchableOpacity
                    key={cat._id}
                    style={styles.categoryTile}
                    onPress={() =>
                      navigation.navigate("ProductsTab", {
                        screen: "ProductsHome",
                        params: { category: cat._id },
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <View style={styles.categoryTileHeader}>
                      <View style={styles.categoryIconBox}>
                        <Ionicons name={mapSlugToIcon(cat.slug) as any} size={18} color="#2f5d4f" />
                      </View>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>
                          {cat.productCount} {cat.productCount === 1 ? 'item' : 'items'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.categoryTileTitle} numberOfLines={1}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Featured */}
        {featured.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>⚡ SPOTLIGHT</Text>
              <Text style={styles.sectionTitle}>Featured Drops</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScroll}
            >
              {featured.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.featuredCard}
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
                    <Text style={styles.featuredTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.featuredPrice}>
                      {formatPrice(item.price)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>LATEST LISTINGS</Text>
            <Text style={styles.sectionTitle}>Freshly Posted</Text>
          </View>
          <FlatList
            data={recent}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <ProductCard item={item} onPress={() => goToProduct(item._id)} />
            )}
            numColumns={2}
            columnWrapperStyle={styles.grid}
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>TRENDING</Text>
            <Text style={styles.sectionTitle}>Most Popular</Text>
          </View>
          <FlatList
            data={trending}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <ProductCard item={item} onPress={() => goToProduct(item._id)} />
            )}
            numColumns={2}
            columnWrapperStyle={styles.grid}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No trending products yet.</Text>
            }
          />
        </View>

        {user?.role === "buyer" ? (
          <TouchableOpacity
            style={styles.buyerCta}
            onPress={() =>
              navigation.navigate("ProfileTab", { screen: "SellerOnboarding" })
            }
            activeOpacity={0.9}
          >
            <Text style={styles.buyerCtaTop}>Got items to declutter?</Text>
            <Text style={styles.buyerCtaTitle}>Upgrade to seller account</Text>
            <Text style={styles.buyerCtaSub}>
              Set up your seller profile and start listing campus items instantly.
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.buyerCta}
            onPress={() => setViewMode("seller")}
            activeOpacity={0.9}
          >
            <Text style={styles.buyerCtaTop}>Seller workspace</Text>
            <Text style={styles.buyerCtaTitle}>Return to Seller Hub</Text>
            <Text style={styles.buyerCtaSub}>
              Post new products, manage active listings, and track your campus sales.
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  // Premium Header
  premiumHeader: {
    backgroundColor: "#000000",
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomWidth: 4,
    borderBottomColor: "#000000",
  },
  headerGreetingBlock: {
    marginBottom: 16,
  },
  premiumGreeting: {
    fontSize: 26,
    fontWeight: "900",
    color: "#ff6b6b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  premiumSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
    fontWeight: "600",
  },
  premiumSearchBox: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  premiumSearchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 2.5,
    borderColor: "#000000",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#000000",
    fontWeight: "600",
  },
  premiumSearchBtn: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#000000',
    ...shadows.bulletin,
  },
  premiumSearchBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  secondaryHeroBtn: {
    marginTop: 16,
    backgroundColor: "#ffffff",
    borderWidth: 2.5,
    borderColor: "#000000",
    paddingVertical: 12,
    alignItems: "center",
    ...shadows.bulletin,
  },
  secondaryHeroBtnText: {
    color: "#000000",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  // Sections
  section: { paddingTop: 26, paddingBottom: 10 },
  quickSection: { paddingTop: 22, paddingBottom: 8 },
  sectionHeader: { paddingHorizontal: 16, marginBottom: 14 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#ff6b6b",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#000000",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Curated horizontal scroll
  hScroll: { paddingHorizontal: 16, gap: 12 },
  curatedCard: {
    width: 210,
    backgroundColor: "#fff",
    borderWidth: 2.5,
    borderColor: "#000000",
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 4,
      },
    }),
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
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#000000",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  curatedBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 0.8,
  },
  curatedCardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  curatedCardSubtitle: {
    marginTop: 6,
    fontSize: 11,
    color: "#6b7280",
    lineHeight: 16,
    fontWeight: "600",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryTile: {
    width: "48%",
    backgroundColor: "#fff",
    borderWidth: 2.5,
    borderColor: "#000000",
    paddingVertical: 14,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 3,
      },
    }),
    justifyContent: "space-between",
  },
  categoryTileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryIconBox: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryTileTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  categoryBadge: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#000000",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#ff6b6b",
    letterSpacing: 0.5,
  },
  // Featured list
  featuredCard: {
    width: 190,
    height: 140,
    borderWidth: 2.5,
    borderColor: "#000000",
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 3,
      },
    }),
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
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderTopWidth: 1.5,
    borderTopColor: "#000000",
  },
  featuredTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  featuredPrice: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "900",
    color: "#ff6b6b",
  },
  // Grid
  grid: { paddingHorizontal: 12, gap: 10, marginBottom: 10 },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 2.5,
    borderColor: "#000000",
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 3,
      },
    }),
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: 120,
    backgroundColor: "#f3f4f6",
    position: "relative",
    borderBottomWidth: 2.5,
    borderBottomColor: "#000000",
  },
  cardImage: { width: "100%", height: "100%" } as any,
  featuredBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#000000',
    zIndex: 5,
  },
  featuredBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },
  conditionTag: {
    position: "absolute",
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#000000',
    zIndex: 5,
  },
  conditionTagText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#000000",
    textTransform: "uppercase",
  },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: "900", color: "#000000", textTransform: "uppercase", letterSpacing: 0.2, minHeight: 34 },
  cardPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: "#000000",
  },
  locationBadge: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1.5,
    borderColor: "#000000",
    paddingHorizontal: 4,
    paddingVertical: 2,
    maxWidth: "50%",
  },
  locationBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#000000",
    textTransform: "uppercase",
  },
  stampOverlay: {
    position: "absolute",
    top: "30%",
    left: "10%",
    right: "10%",
    transform: [{ rotate: "-12deg" }],
    backgroundColor: "#dc2626",
    borderWidth: 2.5,
    borderColor: "#000000",
    paddingVertical: 4,
    alignItems: "center",
    zIndex: 10,
  },
  stampText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  emptyText: {
    textAlign: "center",
    color: "#8f8478",
    padding: 24,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontWeight: "900",
    fontSize: 11,
  },
  buyerCta: {
    marginTop: 18,
    marginHorizontal: 16,
    marginBottom: 28,
    borderWidth: 2.5,
    borderColor: "#000000",
    backgroundColor: "#000000",
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buyerCtaTop: {
    fontSize: 10,
    color: "#ff6b6b",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  buyerCtaTitle: {
    marginTop: 6,
    fontSize: 18,
    color: "#fff",
    fontWeight: "900",
    textTransform: "uppercase",
  },
  buyerCtaSub: { marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.75)", lineHeight: 16 },
  loadMoreBtn: {
    marginTop: 12,
    alignSelf: "center",
    borderWidth: 2.5,
    borderColor: "#000000",
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  loadMoreBtnText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
});

export default HomeScreen;
