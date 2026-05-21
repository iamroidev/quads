import { useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
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
  Modal,
  TextInput,
  Alert,
  Linking,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../services/api";

const { width: SCREEN_W } = Dimensions.get("window");
import productService from "../services/product.service";
import savedService from "../services/saved.service";
import chatService from "../services/chat.service";
import { Product } from "../types";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { shadows } from "../theme";
import { useColors } from "../theme/ThemeContext";

const ProductDetailScreen = ({ route, navigation }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
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

  // User Reporting States
  const [showReportUserModal, setShowReportUserModal] = useState(false);
  const [reportUserReason, setReportUserReason] = useState("harassment");
  const [reportUserDescription, setReportUserDescription] = useState("");
  const [reportingUser, setReportingUser] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.bg,
    },
    heroImage: { width: SCREEN_W, height: SCREEN_W * 0.75, backgroundColor: colors.surfaceSecondary },
    // Back button overlay on gallery
    backBtn: {
      position: "absolute",
      top: 14,
      left: 14,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.overlay,
      borderWidth: 1.5,
      borderColor: colors.boardBorder,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 20,
    },
    backBtnText: { color: colors.primaryContent, fontSize: isMobile ? 15 : 18, fontWeight: "900", lineHeight: 20 },
    // Image counter badge top-right
    imageCounter: {
      position: "absolute",
      top: 14,
      right: 14,
      backgroundColor: colors.overlay,
      borderWidth: 1.5,
      borderColor: colors.boardBorder,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 0,
      zIndex: 20,
    },
    imageCounterText: { color: colors.primaryContent, fontSize: 10, fontWeight: "900" },
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
      borderRadius: 0,
      backgroundColor: colors.overlay,
      borderWidth: 1.5,
      borderColor: colors.boardBorder,
    },
    imageDotActive: { backgroundColor: colors.pinYellow, width: 20 },
    sheet: {
      backgroundColor: colors.surface,
      borderTopWidth: 3,
      borderTopColor: colors.boardBorder,
      padding: isMobile ? 12 : 16,
      paddingBottom: 100, // space for sticky bar
    },
    // Sticky action bar
    stickyBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderTopWidth: 3,
      borderTopColor: colors.boardBorder,
      paddingHorizontal: isMobile ? 12 : 16,
      paddingVertical: 12,
      paddingBottom: 20,
      flexDirection: "row",
      gap: 10,
    },
    stickyBuyBtn: {
      flex: 2,
      backgroundColor: colors.text,
      borderWidth: 2,
      borderColor: colors.boardBorder,
      alignItems: "center",
      paddingVertical: 14,
      ...shadows.bulletin,
    },
    stickyCartBtn: {
      flex: 1,
      backgroundColor: colors.accent,
      borderWidth: 2,
      borderColor: colors.boardBorder,
      alignItems: "center",
      paddingVertical: 14,
      ...shadows.bulletin,
    },
    stickySaveBtn: {
      width: 52,
      borderWidth: 2,
      borderColor: colors.boardBorder,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
    },
    stickyBtnText: {
      color: colors.bg,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    stickySaveBtnText: {
      fontSize: isMobile ? 15 : 18,
      color: colors.text,
    },
    category: {
      fontSize: 10,
      color: colors.accent,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
    title: {
      marginTop: 6,
      fontSize: isMobile ? 18 : 22,
      fontWeight: "900",
      color: colors.text,
      textTransform: "uppercase",
      lineHeight: 28,
      letterSpacing: 0.2,
    },
    price: { marginTop: 8, fontSize: 28, fontWeight: "900", color: colors.successTintText },
    intelligenceCard: {
      marginTop: 14,
      borderWidth: 2,
      borderColor: colors.boardBorder,
      backgroundColor: colors.primaryTint,
      padding: 14,
      ...shadows.bulletin,
    },
    intelTitle: {
      fontSize: 11,
      color: colors.text,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    intelMeta: { marginTop: 4, fontSize: 12, color: colors.text, fontWeight: "600" },
    intelDeal: {
      marginTop: 8,
      fontSize: 11,
      fontWeight: "900",
      color: colors.successTintText,
      textTransform: "uppercase",
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.boardBorder,
      paddingHorizontal: 8,
      paddingVertical: 3,
      alignSelf: "flex-start",
    },
    metaChips: { marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      borderWidth: 2,
      borderColor: colors.boardBorder,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      fontSize: 10,
      fontWeight: "900",
      color: colors.text,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    section: {
      marginTop: 20,
      borderTopWidth: 2,
      borderTopColor: colors.boardBorder,
      paddingTop: 14,
    },
    sectionLabel: {
      fontSize: 10,
      color: colors.accent,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: 6,
    },
    description: { fontSize: isMobile ? 12 : 13, lineHeight: 20, color: colors.text, fontWeight: "500" },
    sellerName: { fontSize: isMobile ? 13 : 15, fontWeight: "900", color: colors.text, textTransform: "uppercase" },
    meta: { fontSize: 12, color: colors.muted, marginTop: 4, fontWeight: "500" },
    primaryAction: {
      flex: 1,
      backgroundColor: colors.text,
      borderWidth: 2,
      borderColor: colors.boardBorder,
      alignItems: "center",
      paddingVertical: 14,
      ...shadows.bulletin,
    },
    primaryActionText: {
      color: colors.bg,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    secondaryAction: {
      width: 94,
      borderWidth: 2,
      borderColor: colors.boardBorder,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      ...shadows.bulletin,
    },
    secondaryActionText: {
      color: colors.text,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    miniCard: {
      width: 160,
      borderWidth: 2,
      borderColor: colors.boardBorder,
      backgroundColor: colors.surface,
      paddingBottom: 10,
      ...shadows.bulletin,
      overflow: "hidden",
    },
    miniImage: { width: "100%", height: 110, backgroundColor: colors.surfaceSecondary, borderBottomWidth: 2, borderBottomColor: colors.boardBorder },
    miniTitle: {
      marginTop: 8,
      paddingHorizontal: 8,
      fontSize: 12,
      fontWeight: "900",
      color: colors.text,
      textTransform: "uppercase",
      minHeight: 34,
    },
    miniPrice: {
      marginTop: 4,
      paddingHorizontal: 8,
      fontSize: 12,
      fontWeight: "900",
      color: colors.successTintText,
    },
  }), [colors]);

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

  const handleWhatsAppShare = async () => {
    if (!product) return;
    const shareText = `${product.title} - GHS ${product.price}: https://quadsmarket.tech/products/${product._id}`;
    const url = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to standard share
        await Share.share({
          message: shareText,
        });
      }
    } catch (err) {
      console.warn("Error sharing to WhatsApp:", err);
      try {
        await Share.share({
          message: shareText,
        });
      } catch (shareErr) {
        Alert.alert("Error", "Could not share this product.");
      }
    }
  };

  const handleReportUser = async () => {
    if (!reportUserDescription.trim()) {
      Alert.alert("Error", "Please describe the reason for your report.");
      return;
    }
    setReportingUser(true);
    try {
      await api.post("/reports", {
        reportedUser: product?.seller?._id,
        reason: reportUserReason,
        description: reportUserDescription,
        productId: product?._id,
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

          {/* Back button overlay */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>

          {/* Image counter */}
          {images.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>{activeImageIdx + 1} / {images.length}</Text>
            </View>
          )}

          {/* Dot indicators */}
          {images.length > 1 && (
            <View style={styles.imageDots}>
              {images.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.imageDot, i === activeImageIdx && styles.imageDotActive]}
                  onPress={() => {
                    imageScrollRef.current?.scrollTo({ x: i * SCREEN_W, animated: true });
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

          {/* Chat with seller (stays inline) */}
          {user && user._id !== product.seller?._id && (
            <TouchableOpacity
              style={[styles.primaryAction, { marginTop: 16, backgroundColor: colors.surface, borderColor: colors.border }, startingChat && { opacity: 0.7 }]}
              onPress={handleMessageSeller}
            >
              <Text style={[styles.primaryActionText, { color: colors.text }]}>
                {startingChat ? "Connecting..." : "Chat with Seller"}
              </Text>
            </TouchableOpacity>
          )}

          {/* WhatsApp Share Button */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: "#25D366",
              borderWidth: 2,
              borderColor: colors.boardBorder,
              borderBottomWidth: 3,
              borderRightWidth: 3,
              paddingVertical: 12,
              marginTop: 16,
            }}
            onPress={handleWhatsAppShare}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 }}>
              Share on WhatsApp
            </Text>
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Seller</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => {
                  if (product.seller?._id) {
                    navigation.navigate("ProductsTab", {
                      screen: "ProductsHome",
                      params: {
                        sellerId: product.seller._id,
                        sellerName: sellerName,
                      }
                    });
                  }
                }}
              >
                <Text style={styles.sellerName}>{sellerName}</Text>
                {!!product.seller?.location && (
                  <Text style={styles.meta}>{product.seller.location}</Text>
                )}
              </TouchableOpacity>
              {user && product && user._id !== product.seller?._id && (
                <TouchableOpacity
                  style={{
                    borderWidth: 2,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                  onPress={() => setShowReportUserModal(true)}
                >
                  <Text style={{ fontSize: 10, fontWeight: "900", color: colors.text, textTransform: "uppercase" }}>
                    Report Seller
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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

      {/* Sticky bottom action bar */}
      {user && product && user._id !== product.seller?._id && (
        <View style={styles.stickyBar}>
          <TouchableOpacity
            style={styles.stickyBuyBtn}
            onPress={() => navigation.navigate("Checkout", { product })}
          >
            <Text style={styles.stickyBtnText}>Buy Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.stickyCartBtn}
            onPress={() => addItem(product)}
          >
            <Text style={styles.stickyBtnText}>+ Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.stickySaveBtn, saving && { opacity: 0.6 }]}
            onPress={handleToggleSaved}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={isSaved ? colors.accent : colors.text}
            />
          </TouchableOpacity>
        </View>
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

export default ProductDetailScreen;
