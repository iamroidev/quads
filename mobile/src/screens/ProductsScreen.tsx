import React, { useEffect, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import productService from "../services/product.service";
import { Product } from "../types";
import { colors, shadows } from "../theme";
import ScreenHeader from "../components/ScreenHeader";
import FloatingCart from "../components/FloatingCart";

const PRODUCTS_CACHE_KEY = "products_cache_v2";
const CATEGORY_OPTIONS = [
  { label: "All", value: "" },
  { label: "Books", value: "books" },
  { label: "Electronics", value: "electronics" },
  { label: "Hostel", value: "hostel" },
  { label: "Services", value: "services" },
  { label: "Fashion", value: "fashion" },
];
const DELIVERY_OPTIONS = [
  { label: "Any", value: "" },
  { label: "Pickup", value: "pickup" },
  { label: "Delivery", value: "delivery" },
  { label: "Both", value: "both" },
];

const ProductsScreen = ({ navigation, route }: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "popular" | "featured">("newest");
  const [category, setCategory] = useState("");
  const [deliveryOption, setDeliveryOption] = useState("");

  const fetchProducts = async (
    withLoader = true,
    targetPage = 1,
    append = false,
  ) => {
    if (withLoader) setLoading(true);
    if (append) setLoadingMore(true);
    try {
      const res = await productService.getProducts({
        page: targetPage,
        limit: 20,
        search: search || undefined,
        sort,
        category: category || undefined,
        deliveryOption: deliveryOption || undefined,
      });
      if (res.success) {
        const nextProducts = append ? [...products, ...res.data] : res.data;
        setProducts(nextProducts);
        setPage(targetPage);
        const fetchedLength = res.data?.length || 0;
        const totalPages = res.pagination?.pages || 1;
        setHasMore(totalPages > targetPage && fetchedLength >= 20);
        await AsyncStorage.setItem(
          PRODUCTS_CACHE_KEY,
          JSON.stringify(nextProducts),
        );
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
      const cached = await AsyncStorage.getItem(PRODUCTS_CACHE_KEY);
      if (cached) setProducts(JSON.parse(cached));
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const incomingSearch =
      typeof route?.params?.search === "string" ? route.params.search : "";
    const incomingCategory =
      typeof route?.params?.category === "string" ? route.params.category : "";
    if (incomingSearch) setSearch(incomingSearch);
    if (incomingCategory) setCategory(incomingCategory);
    setTimeout(() => fetchProducts(true, 1, false), 0);
  }, [route?.params?.search, route?.params?.category]);

  useEffect(() => {
    setTimeout(() => fetchProducts(true, 1, false), 0);
  }, [sort, category, deliveryOption]);

  const loadMore = () => {
    if (loadingMore || loading || !hasMore) return;
    fetchProducts(false, page + 1, true);
  };

  const renderItem = ({ item }: { item: Product }) => {
    const image = item.images?.[0]?.url;
    const conditionColor = 
      item.condition === 'new' ? '#4ade80' : 
      item.condition === 'like-new' ? '#c084fc' : 
      item.condition === 'good' ? '#60a5fa' : '#fbbf24';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("ProductDetail", { productId: item._id })
        }
        activeOpacity={0.85}
      >
        <View style={styles.imageContainer}>
          <Image
            source={image ? { uri: image } : require("../../assets/icon.png")}
            style={styles.image}
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
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.cardPriceRow}>
            <Text style={styles.price}>
              GHS{" "}
              {item.price.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
            </Text>
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        eyebrow="Marketplace"
        title="Browse Listings"
        subtitle="Find verified deals by category and latest posts."
      />

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for books, devices, rooms..."
          placeholderTextColor="#9a8e7f"
          value={search}
          onChangeText={(value: string) => setSearch(value)}
          onSubmitEditing={() => fetchProducts(true, 1, false)}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => fetchProducts(true, 1, false)}
        >
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {(["newest", "popular", "featured"] as const).map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.filterChip,
              sort === option && styles.filterChipActive,
            ]}
            onPress={() => setSort(option)}
          >
            <Text
              style={[
                styles.filterChipText,
                sort === option && styles.filterChipTextActive,
              ]}
            >
              {option.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterPanel}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>Category</Text>
          <Text style={styles.filterTitle}>Delivery</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.optionWrap}
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={[
                styles.optionChip,
                category === opt.value && styles.optionChipActive,
              ]}
              onPress={() => setCategory(opt.value)}
            >
              <Text
                style={[
                  styles.optionChipText,
                  category === opt.value && styles.optionChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.optionWrap, { marginTop: 8 }]}
        >
          {DELIVERY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={[
                styles.optionChip,
                deliveryOption === opt.value && styles.optionChipActive,
              ]}
              onPress={() => setDeliveryOption(opt.value)}
            >
              <Text
                style={[
                  styles.optionChipText,
                  deliveryOption === opt.value && styles.optionChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.grid}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchProducts(false, 1, false);
              }}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                style={{ marginVertical: 10 }}
                color={colors.accent}
              />
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No products found. Try changing filters.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchWrap: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: "#1f1a14",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#1f1a14",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#1f1a14",
    fontWeight: "600",
  },
  searchBtn: {
    backgroundColor: "#ff6b6b",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: "#1f1a14",
    ...shadows.bulletin,
  },
  searchBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: "#1f1a14",
  },
  filterChip: {
    borderWidth: 2,
    borderColor: "#1f1a14",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  filterChipActive: { backgroundColor: "#1f1a14", borderColor: "#1f1a14" },
  filterChipText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#1f1a14",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterChipTextActive: { color: "#fff" },
  filterPanel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 3,
    borderBottomColor: "#1f1a14",
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#7b6f61",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  optionWrap: { gap: 8 },
  optionChip: {
    borderWidth: 2,
    borderColor: "#1f1a14",
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#fff",
    borderRadius: 999,
  },
  optionChipActive: { backgroundColor: "#2f5d4f", borderColor: "#1f1a14" },
  optionChipText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#1f1a14",
    textTransform: "uppercase",
  },
  optionChipTextActive: { color: "#fff" },
  listContent: { padding: 12, paddingBottom: 24 },
  grid: { gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: "#1f1a14",
    ...shadows.bulletin,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: 130,
    backgroundColor: "#efe5d6",
    position: "relative",
    borderBottomWidth: 2,
    borderBottomColor: "#1f1a14",
  },
  image: { width: "100%", height: "100%" } as any,
  featuredBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#1f1a14',
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
    borderColor: '#1f1a14',
    zIndex: 5,
  },
  conditionTagText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#1f1a14",
    textTransform: "uppercase",
  },
  cardContent: { padding: 10 },
  title: { fontSize: 13, fontWeight: "900", color: "#1f1a14", textTransform: "uppercase", letterSpacing: 0.2, minHeight: 34 },
  cardPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  price: { fontSize: 13, fontWeight: "900", color: "#2f5d4f" },
  locationBadge: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#1f1a14",
    paddingHorizontal: 4,
    paddingVertical: 2,
    maxWidth: "50%",
  },
  locationBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#1f1a14",
    textTransform: "uppercase",
  },
  stampOverlay: {
    position: "absolute",
    top: "30%",
    left: "10%",
    right: "10%",
    transform: [{ rotate: "-12deg" }],
    backgroundColor: "#dc2626",
    borderWidth: 2,
    borderColor: "#1f1a14",
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  emptyText: {
    textAlign: "center",
    color: "#8f8478",
    marginTop: 40,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: "900",
  },
});

export default ProductsScreen;
