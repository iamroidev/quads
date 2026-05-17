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
import { colors } from "../theme";
import ScreenHeader from "../components/ScreenHeader";

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
        setHasMore((res.pagination?.pages || 1) > targetPage);
        await AsyncStorage.setItem(
          PRODUCTS_CACHE_KEY,
          JSON.stringify(nextProducts),
        );
      }
    } catch {
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
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("ProductDetail", { productId: item._id })
        }
      >
        <Image
          source={image ? { uri: image } : require("../../assets/icon.png")}
          style={styles.image}
        />
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.price}>
            GHS{" "}
            {item.price.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {item.category?.name || "Category"} •{" "}
            {item.pickupLocation || "UMaT Campus"}
          </Text>
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
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#1f1a14",
  },
  searchBtn: {
    backgroundColor: colors.text,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  searchBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#fff",
  },
  filterChipActive: { backgroundColor: colors.text, borderColor: colors.text },
  filterChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6f6559",
    letterSpacing: 1.1,
  },
  filterChipTextActive: { color: "#fff" },
  filterPanel: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#fffdf8",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  filterTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#7b6f61",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  optionWrap: { gap: 8 },
  optionChip: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 999,
  },
  optionChipActive: { backgroundColor: colors.text, borderColor: colors.text },
  optionChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6f6559",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  optionChipTextActive: { color: "#fff" },
  listContent: { padding: 10, paddingBottom: 18 },
  grid: { gap: 10, marginBottom: 10 },
  card: {
    flex: 1,
    backgroundColor: "#fffdf8",
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: "100%", height: 130, backgroundColor: "#e5e7eb" },
  cardContent: { padding: 10 },
  title: { fontSize: 13, fontWeight: "700", color: "#111827" },
  price: { marginTop: 4, fontSize: 14, fontWeight: "800", color: "#2f5d4f" },
  meta: {
    marginTop: 4,
    fontSize: 11,
    color: "#7b6f61",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  emptyText: {
    textAlign: "center",
    color: "#7b6f61",
    marginTop: 40,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontSize: 12,
    fontWeight: "700",
  },
});

export default ProductsScreen;
