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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import productService from "../services/product.service";
import { Product } from "../types";
import { useAuth } from "../context/AuthContext";
import { colors, shadows } from "../theme";
import ScreenHeader from "../components/ScreenHeader";
import { SkeletonPulse, CardSkeleton } from "../components/SkeletonLoader";
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
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={image ? { uri: image } : require("../../assets/icon.png")}
        style={styles.cardImage}
      />
      {item.isFeatured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>FEATURED</Text>
        </View>
      )}
      {(item.status === "sold" || item.status === "reserved") && (
        <View style={styles.stampOverlay}>
          <Text style={styles.stampText}>
            {item.status === "sold" ? "SOLD" : "PENDING"}
          </Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {item.condition} · {item.pickupLocation || "UMaT"}
        </Text>
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
          eyebrow="QUADS"
          title="Home"
          subtitle="Curated highlights, featured drops, and fresh campus listings."
        />
        {/* Hero / Search */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim }]}>
          <Text style={styles.heroGreeting}>
            {user ? `Hey, ${user.name.split(" ")[0]} 👋` : "QUADS"}
          </Text>
          <Text style={styles.heroSubtitle}>Find great deals on campus.</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <Text style={styles.searchBtnText}>Go</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.secondaryHeroBtn}
            onPress={openBrowse}
          >
            <Text style={styles.secondaryHeroBtnText}>Browse all listings</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.quickSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>CURATED</Text>
            <Text style={styles.sectionTitle}>Shop by need</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScroll}
          >
            {CURATED_HERO_CARDS.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.curatedCard}
                onPress={() =>
                  navigation.navigate("ProductsTab", {
                    screen: "ProductsHome",
                    params: { search: card.filter },
                  })
                }
              >
                <Text style={styles.curatedCardTitle}>{card.title}</Text>
                <Text style={styles.curatedCardSubtitle}>{card.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>CATEGORY</Text>
              <Text style={styles.sectionTitle}>Shop by category</Text>
            </View>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  style={styles.categoryTile}
                  onPress={() =>
                    navigation.navigate("ProductsTab", {
                      screen: "ProductsHome",
                      params: { category: cat._id },
                    })
                  }
                >
                  <Text style={styles.categoryTileTitle} numberOfLines={1}>
                    {cat.name}
                  </Text>
                  <Text style={styles.categoryTileCount}>
                    {cat.productCount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Featured */}
        {featured.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>SPOTLIGHT</Text>
              <Text style={styles.sectionTitle}>Featured Listings</Text>
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
            <Text style={styles.sectionLabel}>LATEST</Text>
            <Text style={styles.sectionTitle}>Recent Listings</Text>
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
                >
                  <Text style={styles.loadMoreBtnText}>
                    {loadingMoreRecent ? "Loading..." : "Load more"}
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>TRENDING</Text>
            <Text style={styles.sectionTitle}>Most viewed</Text>
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
          >
            <Text style={styles.buyerCtaTop}>Got something to sell?</Text>
            <Text style={styles.buyerCtaTitle}>Upgrade to seller account</Text>
            <Text style={styles.buyerCtaSub}>
              Set up your seller profile and start listing campus items.
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.buyerCta}
            onPress={() => setViewMode("seller")}
          >
            <Text style={styles.buyerCtaTop}>Seller workspace</Text>
            <Text style={styles.buyerCtaTitle}>Return to Seller Hub</Text>
            <Text style={styles.buyerCtaSub}>
              Post new products, manage stock, and track activity.
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
  // Hero
  hero: {
    backgroundColor: "#1f1a14",
    paddingTop: 18,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  heroGreeting: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 20,
  },
  searchRow: { flexDirection: "row", gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 0,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#fff",
  },
  searchBtn: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.bulletin,
  },
  searchBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  secondaryHeroBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 0,
  },
  secondaryHeroBtnText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  // Sections
  section: { paddingTop: 24, paddingBottom: 8 },
  quickSection: { paddingTop: 20, paddingBottom: 6 },
  sectionHeader: { paddingHorizontal: 16, marginBottom: 12 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ff6b6b",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1f1a14",
    marginTop: 2,
    textTransform: "uppercase",
  },
  // Featured horizontal scroll
  hScroll: { paddingHorizontal: 16, gap: 12 },
  curatedCard: {
    width: 220,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    ...shadows.bulletin,
  },
  curatedCardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1f1a14",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  curatedCardSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#7b6f61",
    lineHeight: 17,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTile: {
    width: "48%",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 10,
    ...shadows.bulletin,
  },
  categoryTileTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#1f1a14",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  categoryTileCount: { marginTop: 4, fontSize: 11, color: "#8d7f6f" },
  featuredCard: {
    width: 200,
    height: 150,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
  featuredImage: { width: "100%", height: "100%", position: "absolute" },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  featuredInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  featuredTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 16,
  },
  featuredPrice: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  // Grid
  grid: { paddingHorizontal: 12, gap: 10, marginBottom: 10 },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.bulletin,
  },
  cardImage: { width: "100%", height: 120, backgroundColor: "#e5e7eb" },
  featuredBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#000',
  },
  featuredBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  cardBody: { padding: 8 },
  cardTitle: { fontSize: 13, fontWeight: "600", color: "#111827" },
  cardPrice: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "800",
    color: "#2f5d4f",
  },
  cardMeta: {
    marginTop: 2,
    fontSize: 10,
    color: "#9a8e7f",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  stampOverlay: {
    position: "absolute",
    top: "30%",
    left: "10%",
    right: "10%",
    transform: [{ rotate: "-12deg" }],
    backgroundColor: "#dc2626",
    borderWidth: 2,
    borderColor: "#000",
    paddingVertical: 4,
    alignItems: "center",
    zIndex: 10,
  },
  stampText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  emptyText: {
    textAlign: "center",
    color: "#8f8478",
    padding: 24,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontWeight: "700",
    fontSize: 11,
  },
  buyerCta: {
    marginTop: 14,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2f2921",
    backgroundColor: "#1f1a14",
    padding: 14,
    ...shadows.bulletin,
  },
  buyerCtaTop: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  buyerCtaTitle: {
    marginTop: 6,
    fontSize: 18,
    color: "#fff",
    fontWeight: "900",
    textTransform: "uppercase",
  },
  buyerCtaSub: { marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.7)" },
  loadMoreBtn: {
    marginTop: 6,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    ...shadows.bulletin,
  },
  loadMoreBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6f6559",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
});

export default HomeScreen;
