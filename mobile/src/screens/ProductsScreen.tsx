import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import productService from "../services/product.service";
import categoryService from "../services/category.service";
import { Product } from "../types";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import ScreenHeader from "../components/ScreenHeader";
import api from "../services/api";
import FloatingCart from "../components/FloatingCart";
import { BulletinCard } from "../components/BulletinCard";
import { useResponsive } from "../hooks/useResponsive";
import { getTypography } from "../theme/typography";
import EmptyState from "../components/EmptyState";

const PRODUCTS_CACHE_KEY = "products_cache_v2";
const DELIVERY_OPTIONS = [
  { label: "Any", value: "" },
  { label: "Pickup", value: "pickup" },
  { label: "Delivery", value: "delivery" },
  { label: "Both", value: "both" },
];

const ProductsScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { width, isMobile, isTablet } = useResponsive();
  const typography = getTypography(width);
  const styles = getStyles(colors, width);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [savingSearch, setSavingSearch] = useState(false);

  const [sellerId, setSellerId] = useState(route?.params?.sellerId || "");
  const [sellerName, setSellerName] = useState(route?.params?.sellerName || "");
  const [showReportUserModal, setShowReportUserModal] = useState(false);
  const [reportUserReason, setReportUserReason] = useState<"harassment" | "spam" | "scam" | "inappropriate" | "fake_listing" | "other">("spam");
  const [reportUserDescription, setReportUserDescription] = useState("");
  const [reportingUser, setReportingUser] = useState(false);

  const handleReportUser = async () => {
    if (!reportUserDescription.trim()) {
      Alert.alert("Error", "Please describe the reason for your report.");
      return;
    }
    if (!sellerId) return;
    setReportingUser(true);
    try {
      await api.post("/reports", {
        reportedUser: sellerId,
        reason: reportUserReason,
        description: reportUserDescription.trim(),
      });
      Alert.alert("Success", "Seller reported. Our team will investigate.");
      setShowReportUserModal(false);
      setReportUserDescription("");
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to report seller.");
    } finally {
      setReportingUser(false);
    }
  };

  const handleClearSellerFilter = () => {
    setSellerId("");
    setSellerName("");
    navigation.setParams({ sellerId: undefined, sellerName: undefined });
  };

  const handleSaveSearch = async () => {
    setSavingSearch(true);
    try {
      const res = await api.post("/discovery/saved-searches", {
        query: search || "",
        category: category || undefined,
        filters: {
          deliveryOption: deliveryOption || undefined,
        },
        alertEnabled: true,
      });
      if (res.data?.success) {
        Alert.alert("Success", "Search saved! You'll be notified of new listings matching your filters.");
      } else {
        Alert.alert("Error", res.data?.message || "Failed to save search.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Something went wrong.");
    } finally {
      setSavingSearch(false);
    }
  };
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "popular" | "featured">("newest");
  const [category, setCategory] = useState("");
  const [deliveryOption, setDeliveryOption] = useState("");
  const [categoriesList, setCategoriesList] = useState<{ label: string; value: string; slug: string }[]>([
    { label: "All", value: "", slug: "" }
  ]);

  useEffect(() => {
    categoryService.getCategoriesWithCounts().then(res => {
      if (res.success && res.data?.categories) {
        const list = res.data.categories.map(c => ({
          label: c.name,
          value: c._id,
          slug: c.slug
        }));
        setCategoriesList([{ label: "All", value: "", slug: "" }, ...list]);
      }
    }).catch(() => {});
  }, []);

  const hPadding = isMobile ? 12 : 16;
  const gap = isMobile ? 10 : 16;
  const columns = isMobile ? 2 : isTablet ? 2 : 3;

  const fetchProducts = useCallback(async (
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
        seller: sellerId || undefined,
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
  }, [search, sort, category, deliveryOption, sellerId]);

  useEffect(() => {
    const incomingSearch =
      typeof route?.params?.search === "string" ? route.params.search : "";
    const incomingCategory =
      typeof route?.params?.category === "string" ? route.params.category : "";
    const incomingSellerId =
      typeof route?.params?.sellerId === "string" ? route.params.sellerId : "";
    const incomingSellerName =
      typeof route?.params?.sellerName === "string" ? route.params.sellerName : "";

    if (incomingSearch) setSearch(incomingSearch);
    if (incomingCategory) setCategory(incomingCategory);
    setSellerId(incomingSellerId);
    setSellerName(incomingSellerName);
    setTimeout(() => fetchProducts(true, 1, false), 0);
  }, [route?.params?.search, route?.params?.category, route?.params?.sellerId, route?.params?.sellerName]);

  useEffect(() => {
    setTimeout(() => fetchProducts(true, 1, false), 0);
  }, [sort, category, deliveryOption, sellerId]);

  const loadMore = () => {
    if (loadingMore || loading || !hasMore) return;
    fetchProducts(false, page + 1, true);
  };

  const renderItem = useCallback(({ item }: { item: Product }) => {
    const image = item.images?.[0]?.url;
    const conditionColor =
      item.condition === 'new' ? colors.success :
      item.condition === 'like-new' ? colors.primary :
      item.condition === 'good' ? colors.pinBlue : colors.pinYellow;

    const cardWidth = (width - hPadding * 2 - gap * (columns - 1)) / columns;

    return (
      <BulletinCard style={[styles.card, { width: cardWidth }]} size="sm">
        <TouchableOpacity
          onPress={() => navigation.navigate("ProductDetail", { productId: item._id })}
          activeOpacity={0.88}
        >
          {/* Portrait image */}
          <View style={styles.imageContainer}>
            <Image
              source={image ? { uri: image } : require("../../assets/icon.png")}
              style={styles.image}
              resizeMode="cover"
            />

            {/* Featured flash — circle top-left */}
            {item.isFeatured && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>NEW</Text>
              </View>
            )}

            {/* Condition pill — top-right */}
            <View style={[styles.conditionTag, { backgroundColor: conditionColor }]}>
              <Text style={styles.conditionTagText}>{item.condition.replace('-', ' ')}</Text>
            </View>

            {/* Sold / pending stamp */}
            {(item.status === "sold" || item.status === "reserved") && (
              <View style={styles.stampOverlay}>
                <Text style={styles.stampText}>
                  {item.status === "sold" ? "SOLD" : "PENDING"}
                </Text>
              </View>
            )}
          </View>

          {/* Card body */}
          <View style={styles.cardContent}>
            <Text style={styles.price}>
              GHS {item.price.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
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
  }, [styles, colors, navigation, hPadding, gap, columns]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        eyebrow="Marketplace"
        title="Browse Listings"
        subtitle="Find verified deals by category and latest posts."
      />

      {/* Seller storefront details card */}
      {!!sellerId && (
        <View
          style={{
            marginHorizontal: hPadding,
            marginTop: 12,
            marginBottom: 4,
            padding: 14,
            backgroundColor: colors.surface,
            borderWidth: 2,
            borderColor: colors.boardBorder,
            borderBottomWidth: 3,
            borderRightWidth: 3,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* Seller Avatar */}
          <View
            style={{
              width: 38,
              height: 38,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ color: colors.primaryContent, fontWeight: "900", fontSize: 16 }}>
              {sellerName ? sellerName[0].toUpperCase() : "S"}
            </Text>
          </View>

          {/* Seller details */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontWeight: "900", color: colors.accent, textTransform: "uppercase", letterSpacing: 1 }}>
              Seller Storefront
            </Text>
            <Text style={{ fontSize: 13, fontWeight: "900", color: colors.text, textTransform: "uppercase" }} numberOfLines={1}>
              {sellerName}
            </Text>
          </View>

          {/* Report / Exit buttons */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {user && user._id !== sellerId && (
              <TouchableOpacity
                style={{
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceSecondary,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
                onPress={() => setShowReportUserModal(true)}
              >
                <Text style={{ fontSize: 9, fontWeight: "900", color: colors.danger, textTransform: "uppercase" }}>
                  Report
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={{
                borderWidth: 1.5,
                borderColor: colors.boardBorder,
                backgroundColor: colors.text,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
              onPress={handleClearSellerFilter}
            >
              <Text style={{ fontSize: 9, fontWeight: "900", color: colors.bg, textTransform: "uppercase" }}>
                Exit
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[styles.searchWrap, { paddingHorizontal: hPadding }]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for books, devices, rooms..."
          placeholderTextColor={colors.muted}
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

      {user && (search || category || deliveryOption) ? (
        <View style={{ paddingHorizontal: hPadding, paddingBottom: 10, paddingTop: 10, backgroundColor: colors.surface, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: colors.boardBorderWidth, borderBottomColor: colors.boardBorder }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary }}>
            ACTIVE FILTERS APPLIED
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.pinYellow,
              borderWidth: 1.5,
              borderColor: colors.boardBorder,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
            onPress={handleSaveSearch}
            disabled={savingSearch}
          >
            <Text style={{ fontSize: 9, fontWeight: '900', color: colors.text, textTransform: 'uppercase' }}>
              {savingSearch ? 'Saving...' : '★ Save Search'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

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
          {categoriesList.map((opt) => {
            const isActive = category === opt.value || (!!opt.slug && category === opt.slug);
            return (
              <TouchableOpacity
                key={opt.label}
                style={[
                  styles.optionChip,
                  isActive && styles.optionChipActive,
                ]}
                onPress={() => setCategory(opt.value)}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    isActive && styles.optionChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
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
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          key={String(columns)}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? [styles.grid, { gap }] : undefined}
          contentContainerStyle={[styles.listContent, { paddingHorizontal: hPadding }]}
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
                color={colors.primary}
              />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              title="No listings found"
              subtitle="Try adjusting your search or filters."
            />
          }
        />
      )}

      {/* Report Seller Modal */}
      <Modal visible={showReportUserModal} transparent animationType="slide" onRequestClose={() => setShowReportUserModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View 
            style={{ 
              width: "100%", 
              maxWidth: 380, 
              backgroundColor: colors.surface, 
              borderWidth: 3, 
              borderColor: colors.boardBorder, 
              padding: 24,
            }}
          >
            {/* Red Thumbtack detail (Top Center) */}
            <View style={{ position: "absolute", top: -10, left: "50%", marginLeft: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.pinRed, borderWidth: 2, borderColor: colors.boardBorder }} />
            
            <Text style={{ fontSize: 10, fontWeight: "900", color: colors.accent, textTransform: "uppercase", letterSpacing: 2, textAlign: "center", marginTop: 8 }}>
              Integrity Report
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text, textTransform: "uppercase", letterSpacing: -0.5, textAlign: "center", marginVertical: 8 }}>
              Report Seller
            </Text>
            
            <Text style={{ fontSize: 11, fontWeight: "900", color: colors.text, textTransform: "uppercase", marginBottom: 6 }}>
              Reason
            </Text>
            <View style={{ borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, marginBottom: 12 }}>
              {(["harassment", "spam", "scam", "inappropriate", "fake_listing", "other"] as const).map((reasonOpt) => (
                <TouchableOpacity
                  key={reasonOpt}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderBottomWidth: reasonOpt === "other" ? 0 : 1,
                    borderBottomColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: reportUserReason === reasonOpt ? colors.surface : "transparent",
                  }}
                  onPress={() => setReportUserReason(reasonOpt)}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", textTransform: "uppercase", color: colors.text }}>
                    {reasonOpt.replace("_", " ")}
                  </Text>
                  {reportUserReason === reasonOpt && (
                    <Text style={{ fontWeight: "900", color: colors.accent }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 11, fontWeight: "900", color: colors.text, textTransform: "uppercase", marginBottom: 6 }}>
              Description
            </Text>
            <TextInput
              style={{
                borderWidth: 2,
                borderColor: colors.border,
                backgroundColor: colors.surfaceSecondary,
                padding: 12,
                fontSize: 12,
                fontWeight: "600",
                color: colors.text,
                minHeight: 80,
                textAlignVertical: "top",
                marginBottom: 20,
              }}
              placeholder="Describe the issue in detail..."
              placeholderTextColor={colors.muted}
              multiline
              value={reportUserDescription}
              onChangeText={setReportUserDescription}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderWidth: 2,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceSecondary,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
                onPress={() => setShowReportUserModal(false)}
              >
                <Text style={{ fontSize: 11, fontWeight: "900", color: colors.text, textTransform: "uppercase" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.text,
                  borderWidth: 2,
                  borderColor: colors.boardBorder,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
                onPress={handleReportUser}
                disabled={reportingUser}
              >
                <Text style={{ fontSize: 11, fontWeight: "900", color: colors.bg, textTransform: "uppercase" }}>
                  {reportingUser ? "Submitting..." : "Submit"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (colors: any, width: number) => {
  const isMobile = width < 640;
  const typography = getTypography(width);
  const hPadding = isMobile ? 12 : 16;
  const gap = isMobile ? 10 : 16;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchWrap: {
      flexDirection: "row",
      gap: 8,
      paddingTop: 16,
      paddingBottom: 14,
      backgroundColor: colors.surface,
      borderBottomWidth: colors.boardBorderWidth,
      borderBottomColor: colors.boardBorder,
    },
    searchInput: {
      flex: 1,
      minWidth: 0,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.text,
      fontWeight: "700",
      fontSize: isMobile ? 13 : typography.body,
    },
    searchBtn: {
      backgroundColor: colors.primary,
      justifyContent: "center",
      paddingHorizontal: isMobile ? 14 : 18,
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
    },
    searchBtnText: {
      color: colors.primaryContent,
      fontWeight: "900",
      fontSize: isMobile ? 10 : typography.tag,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    filterRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: hPadding,
      paddingBottom: 14,
      paddingTop: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: colors.boardBorderWidth,
      borderBottomColor: colors.boardBorder,
    },
    filterChip: {
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      borderRadius: 999,
      paddingHorizontal: isMobile ? 10 : 14,
      paddingVertical: isMobile ? 6 : 8,
      backgroundColor: colors.surfaceSecondary,
    },
    filterChipActive: { backgroundColor: colors.boardBorder, borderColor: colors.boardBorder },
    filterChipText: {
      fontSize: isMobile ? 8 : typography.tag,
      fontWeight: "900",
      color: colors.text,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    filterChipTextActive: { color: colors.surface },
    filterPanel: {
      paddingHorizontal: hPadding,
      paddingTop: 12,
      paddingBottom: 14,
      backgroundColor: colors.surface,
      borderBottomWidth: colors.boardBorderWidth,
      borderBottomColor: colors.boardBorder,
    },
    filterHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    filterTitle: {
      fontSize: isMobile ? 8 : typography.tag,
      fontWeight: "900",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
    optionWrap: { gap: 8 },
    optionChip: {
      borderWidth: colors.boardBorderWidth,
      borderColor: colors.boardBorder,
      paddingHorizontal: isMobile ? 10 : 12,
      paddingVertical: isMobile ? 6 : 7,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
    },
    optionChipActive: { backgroundColor: colors.primary, borderColor: colors.boardBorder },
    optionChipText: {
      fontSize: isMobile ? 8 : typography.tag,
      fontWeight: "900",
      color: colors.text,
      textTransform: "uppercase",
    },
    optionChipTextActive: { color: colors.primaryContent },
    listContent: { paddingBottom: 24 },
    grid: { marginBottom: 12 },
    card: { flex: 1 },
    imageContainer: {
      width: "100%",
      aspectRatio: 4 / 3,
      backgroundColor: colors.surfaceSecondary,
      position: "relative",
      overflow: "hidden",
    },
    image: { width: "100%", height: "100%" } as any,
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
      borderRadius: 3,
      zIndex: 5,
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
    cardContent: {
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: 10,
      minWidth: 0,
      overflow: "hidden",
    },
    price: {
      fontSize: isMobile ? 14 : 16,
      fontWeight: "900",
      color: colors.primary,
      letterSpacing: -0.3,
      marginBottom: 3,
    },
    title: {
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
    locationBadgeText: { fontSize: 9, fontWeight: "800", color: colors.text, textTransform: "uppercase" },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    emptyText: {
      textAlign: "center",
      color: colors.textSecondary,
      marginTop: 40,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      fontSize: isMobile ? 10 : typography.label,
      fontWeight: "900",
    },
  });
};

export default ProductsScreen;