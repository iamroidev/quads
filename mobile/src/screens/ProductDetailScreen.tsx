import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_W } = Dimensions.get("window");
import productService from "../services/product.service";
import savedService from "../services/saved.service";
import chatService from "../services/chat.service";
import { Product } from "../types";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import FloatingCart from "../components/FloatingCart";
import { colors, shadows } from "../theme";

const ProductDetailScreen = ({ route, navigation }: any) => {
  const { productId } = route.params;
  const { user } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [priceInsights, setPriceInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const imageScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [productRes, relatedRes, recRes, insightsRes] = await Promise.all(
          [
            productService.getProductById(productId),
            productService.getRelated(productId, 6),
            productService.getRecommendations({ productId, limit: 6 }),
            productService.getPriceInsights(productId),
          ],
        );
        if (productRes.success) setProduct(productRes.data.product);
        if (relatedRes.success) setRelatedProducts(relatedRes.data);
        if (recRes.success) setRecommendations(recRes.data);
        if (insightsRes.success) setPriceInsights(insightsRes.data);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [productId]);

  useEffect(() => {
    if (!product || !user || product.seller?._id === user._id) return;
    savedService
      .isSaved(product._id)
      .then((res) => {
        if (res.success) setIsSaved(res.data.isSaved);
      })
      .catch(() => {});
  }, [product, user]);

  const sellerName = useMemo(() => {
    if (!product) return "";
    return (
      product.seller?.storeName ||
      product.seller?.brandName ||
      product.seller?.name ||
      "Seller"
    );
  }, [product]);

  const handleToggleSaved = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const res = await savedService.toggleSavedItem(product._id);
      if (res.success) setIsSaved(res.data.saved);
    } finally {
      setSaving(false);
    }
  };

  const handleMessageSeller = async () => {
    if (!product?.seller?._id || startingChat) return;
    setStartingChat(true);
    try {
      const res = await chatService.getOrCreateConversation(
        product.seller._id,
        product._id,
      );
      if (res.success) {
        navigation.getParent()?.navigate("MessagesTab", {
          screen: "Chat",
          params: {
            conversationId: res.data.conversation._id,
            otherUser: {
              _id: product.seller._id,
              name: sellerName,
              avatar: product.seller.avatar,
            },
            productTitle: product.title,
          },
        });
      }
    } finally {
      setStartingChat(false);
    }
  };

  const renderMiniProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.miniCard}
      onPress={() =>
        navigation.replace("ProductDetail", { productId: item._id })
      }
    >
      <Image
        source={
          item.images?.[0]?.url
            ? { uri: item.images[0].url }
            : require("../../assets/icon.png")
        }
        style={styles.miniImage}
      />
      <Text style={styles.miniTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.miniPrice}>
        GHS {item.price.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
      </Text>
    </TouchableOpacity>
  );

  if (loading || !product) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const dealLabel =
    priceInsights?.dealLabel === "great_deal"
      ? "Great deal"
      : priceInsights?.dealLabel === "premium"
        ? "Premium"
        : "Fair price";

  const images = product.images?.length
    ? product.images
    : [{ url: Image.resolveAssetSource(require("../../assets/icon.png")).uri }];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView>
        {/* Image gallery */}
        <View>
          <ScrollView
            ref={imageScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
              setActiveImageIdx(idx);
            }}
          >
            {images.map((img, i) => (
              <Image
                key={i}
                source={{ uri: img.url }}
                style={[styles.heroImage, { width: SCREEN_W }]}
              />
            ))}
          </ScrollView>
          {images.length > 1 && (
            <View style={styles.imageDots}>
              {images.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.imageDot,
                    i === activeImageIdx && styles.imageDotActive,
                  ]}
                  onPress={() => {
                    imageScrollRef.current?.scrollTo({
                      x: i * SCREEN_W,
                      animated: true,
                    });
                    setActiveImageIdx(i);
                  }}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.sheet}>
          <Text style={styles.category}>
            {product.category?.name || "General"}
          </Text>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>
            GHS{" "}
            {product.price.toLocaleString("en-GH", {
              minimumFractionDigits: 2,
            })}
          </Text>

          {priceInsights ? (
            <View style={styles.intelligenceCard}>
              <Text style={styles.intelTitle}>Price intelligence</Text>
              <Text style={styles.intelMeta}>
                Market range: GHS {Math.round(priceInsights.min)} - GHS{" "}
                {Math.round(priceInsights.max)}
              </Text>
              <Text style={styles.intelMeta}>
                Average: GHS {Math.round(priceInsights.average)}
              </Text>
              <Text style={styles.intelMeta}>
                Quartile range: GHS {Math.round(priceInsights.q1)} - GHS{" "}
                {Math.round(priceInsights.q3)}
              </Text>
              <Text style={styles.intelMeta}>
                Compared against {priceInsights.sampleSize} similar listings
              </Text>
              <Text style={styles.intelDeal}>{dealLabel}</Text>
            </View>
          ) : null}

          <View style={styles.metaChips}>
            <Text style={styles.chip}>
              {product.condition.replace("-", " ")}
            </Text>
            <Text style={styles.chip}>
              {product.deliveryOption === "pickup"
                ? "Campus Pickup Only"
                : product.deliveryOption}
            </Text>
            <Text style={styles.chip}>{product.views} views</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tags</Text>
            <Text style={styles.meta}>
              {(product as any).tags?.join(", ") || "No tags"}
            </Text>
          </View>

          {user && user._id !== product.seller?._id ? (
            <View style={{ gap: 10, marginTop: 16 }}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={[styles.primaryAction, { flex: 1 }]}
                  onPress={() => navigation.navigate("Checkout", { product })}
                >
                  <Text style={styles.primaryActionText}>Buy Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryAction, { flex: 1, backgroundColor: colors.accent, borderColor: colors.accent }]}
                  onPress={() => addItem(product)}
                >
                  <Text style={styles.primaryActionText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={[
                    styles.primaryAction,
                    {
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    startingChat && { opacity: 0.7 },
                  ]}
                  onPress={handleMessageSeller}
                >
                  <Text
                    style={[styles.primaryActionText, { color: colors.text }]}
                  >
                    {startingChat ? "..." : "Chat with Seller"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryAction, saving && { opacity: 0.7 }, { width: 94 }]}
                  onPress={handleToggleSaved}
                >
                  <Text style={styles.secondaryActionText}>
                    {isSaved ? "♥ Saved" : "♡ Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Seller</Text>
            <Text style={styles.sellerName}>{sellerName}</Text>
            {!!product.seller?.location && (
              <Text style={styles.meta}>{product.seller.location}</Text>
            )}
          </View>

          {relatedProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Similar Products</Text>
              <FlatList
                horizontal
                data={relatedProducts}
                keyExtractor={(item) => item._id}
                renderItem={renderMiniProduct}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
              />
            </View>
          )}

          {recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Because you viewed this</Text>
              <FlatList
                horizontal
                data={recommendations}
                keyExtractor={(item) => item._id}
                renderItem={renderMiniProduct}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
              />
            </View>
          )}
        </View>
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
  heroImage: { width: SCREEN_W, height: SCREEN_W * 0.75, backgroundColor: "#efe5d6", borderBottomWidth: 3, borderBottomColor: "#1f1a14" },
  imageDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
  },
  imageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderWidth: 1.5,
    borderColor: "#1f1a14",
  },
  imageDotActive: { backgroundColor: "#fbbf24", width: 20 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopWidth: 3,
    borderTopColor: "#1f1a14",
    padding: 16,
    paddingBottom: 40,
  },
  category: {
    fontSize: 10,
    color: "#ff6b6b",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: "900",
    color: "#1f1a14",
    textTransform: "uppercase",
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  price: { marginTop: 8, fontSize: 28, fontWeight: "900", color: "#2f5d4f" },
  intelligenceCard: {
    marginTop: 14,
    borderWidth: 2,
    borderColor: "#1f1a14",
    backgroundColor: "#bfdbfe", // pastel blue intelligence block
    padding: 14,
    ...shadows.bulletin,
  },
  intelTitle: {
    fontSize: 11,
    color: "#1f1a14",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  intelMeta: { marginTop: 4, fontSize: 12, color: "#1f1a14", fontWeight: "600" },
  intelDeal: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "900",
    color: "#2f5d4f",
    textTransform: "uppercase",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#1f1a14",
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  metaChips: { marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 2,
    borderColor: "#1f1a14",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 10,
    fontWeight: "900",
    color: "#1f1a14",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  section: {
    marginTop: 20,
    borderTopWidth: 2,
    borderTopColor: "#1f1a14",
    paddingTop: 14,
  },
  sectionLabel: {
    fontSize: 10,
    color: "#ff6b6b",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  description: { fontSize: 13, lineHeight: 20, color: "#2f2921", fontWeight: "500" },
  sellerName: { fontSize: 15, fontWeight: "900", color: "#1f1a14", textTransform: "uppercase" },
  meta: { fontSize: 12, color: "#6e6253", marginTop: 4, fontWeight: "500" },
  primaryAction: {
    flex: 1,
    backgroundColor: "#1f1a14",
    borderWidth: 2,
    borderColor: "#1f1a14",
    alignItems: "center",
    paddingVertical: 14,
    ...shadows.bulletin,
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  secondaryAction: {
    width: 94,
    borderWidth: 2,
    borderColor: "#1f1a14",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    ...shadows.bulletin,
  },
  secondaryActionText: {
    color: "#1f1a14",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  miniCard: {
    width: 160,
    borderWidth: 2,
    borderColor: "#1f1a14",
    backgroundColor: "#fff",
    paddingBottom: 10,
    ...shadows.bulletin,
    overflow: "hidden",
  },
  miniImage: { width: "100%", height: 110, backgroundColor: "#efe5d6", borderBottomWidth: 2, borderBottomColor: "#1f1a14" },
  miniTitle: {
    marginTop: 8,
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: "900",
    color: "#1f1a14",
    textTransform: "uppercase",
    minHeight: 34,
  },
  miniPrice: {
    marginTop: 4,
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: "900",
    color: "#2f5d4f",
  },
});

export default ProductDetailScreen;
