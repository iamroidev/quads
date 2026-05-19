import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import productService from "../services/product.service";
import referenceService, { PickupSpot } from "../services/reference.service";
import { useAuth } from "../context/AuthContext";
import { useColors } from "../theme/ThemeContext";
import ScreenHeader from "../components/ScreenHeader";

interface Category {
  _id: string;
  name: string;
}

const CONDITIONS = ["new", "like-new", "good", "fair", "poor"] as const;
const DELIVERY_OPTIONS = [
  { value: "pickup", label: "Pickup Only" },
  { value: "delivery", label: "Delivery Only" },
  { value: "both", label: "Pickup & Delivery" },
] as const;


const CreateListingScreen = ({ navigation, route }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const { user } = useAuth();
  const { productId, mode } = route.params ?? {};
  const isEditMode = mode === "edit" && !!productId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(true);
  const [prefilling, setPrefilling] = useState(isEditMode);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState<string>("good");
  const [deliveryOption, setDeliveryOption] = useState<string>("pickup");
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupSpots, setPickupSpots] = useState<PickupSpot[]>([]);
  const [spotPickerVisible, setSpotPickerVisible] = useState(false);
  const [spotSearch, setSpotSearch] = useState("");
  const [customPickup, setCustomPickup] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"active" | "draft">("active");
  const [images, setImages] = useState<
    Array<{ uri: string; type?: string; name?: string }>
  >([]);

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: isMobile ? 12 : 16, paddingBottom: 40 },
    label: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: 18,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 0,
      paddingHorizontal: 12,
      paddingVertical: 11,
      fontSize: isMobile ? 13 : 15,
      color: colors.text,
    },
    textarea: { minHeight: 90, textAlignVertical: "top" },
    chipScroll: { marginBottom: 4 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    emptyCategoryBox: {
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
    },
    emptyCategoryText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 0,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
      marginBottom: 8,
    },
    chipActive: { backgroundColor: colors.text, borderColor: colors.text },
    chipText: { fontSize: isMobile ? 12 : 13, color: colors.textSecondary, fontWeight: "500" },
    chipTextActive: { color: colors.background, fontWeight: "700" },
    imagePickerBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingVertical: 12,
      alignItems: "center",
    },
    imagePickerBtnText: {
      fontSize: 11,
      color: colors.text,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1.1,
    },
    previewScroll: { marginTop: 8, marginBottom: 8 },
    previewThumb: {
      position: "relative" as const,
      marginRight: 8,
    },
    previewImage: {
      width: 90,
      height: 90,
      borderWidth: 2,
      borderColor: colors.border,
    },
    coverBadge: {
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.accent,
      paddingVertical: 2,
      alignItems: "center" as const,
    },
    coverBadgeText: { fontSize: 8, fontWeight: "900" as const, color: colors.primaryContent, textTransform: "uppercase" as const, letterSpacing: 0.5 },
    deleteImgBtn: {
      position: "absolute" as const,
      top: -6,
      right: -6,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.danger,
      borderWidth: 1.5,
      borderColor: colors.primaryContent,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      zIndex: 10,
    },
    deleteImgBtnText: { color: colors.dangerContent, fontSize: 10, fontWeight: "900" as const, lineHeight: 12 },
    submitBtn: {
      marginTop: 28,
      backgroundColor: colors.text,
      paddingVertical: 14,
      borderRadius: 0,
      alignItems: "center",
    },
    submitBtnText: { color: colors.background, fontSize: isMobile ? 14 : 16, fontWeight: "700" },
    pickerBtn: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    pickerBtnText: {
      fontSize: isMobile ? 13 : 15,
      color: colors.text,
    },
    pickerChevron: {
      fontSize: 11,
      color: colors.text,
    },
    // Gate styles
    gateContent: {
      flex: 1,
      padding: 24,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 60,
    },
    gateIcon: {
      width: 100,
      height: 100,
      backgroundColor: colors.surfaceSecondary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    gateTitle: {
      fontSize: isMobile ? 18 : 22,
      fontWeight: "900",
      textTransform: "uppercase",
      marginBottom: 12,
      color: colors.text,
    },
    gateText: {
      fontSize: isMobile ? 12 : 13,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 32,
    },
    primaryBtn: {
      width: "100%",
      backgroundColor: colors.text,
      paddingVertical: 18,
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.boardBorder,
      marginBottom: 12,
    },
    primaryBtnText: {
      color: colors.background,
      fontWeight: "900",
      textTransform: "uppercase",
      fontSize: 12,
      letterSpacing: 1,
    },
    secondaryBtn: {
      width: "100%",
      backgroundColor: colors.surface,
      paddingVertical: 18,
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.boardBorder,
    },
    secondaryBtnText: {
      color: colors.text,
      fontWeight: "900",
      textTransform: "uppercase",
      fontSize: 12,
      letterSpacing: 1,
    },
    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
    modalSheet: { backgroundColor: colors.surface, borderTopWidth: 3, borderColor: colors.boardBorder, maxHeight: "80%" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: isMobile ? 12 : 16, borderBottomWidth: 2, borderColor: colors.boardBorder },
    modalHeaderTitle: { fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.2, color: colors.text },
    modalHeaderClose: { fontSize: 11, fontWeight: "800", color: colors.text, textTransform: "uppercase" },
    modalSearchWrap: { padding: 12, borderBottomWidth: 2, borderColor: colors.boardBorder },
    modalSearchInput: { borderWidth: 2, borderColor: colors.boardBorder, backgroundColor: colors.background, paddingHorizontal: 12, paddingVertical: 10, fontSize: isMobile ? 13 : 14, color: colors.text },
    spotRow: { paddingHorizontal: isMobile ? 12 : 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.surfaceSecondary },
    spotRowActive: { backgroundColor: colors.text },
    spotRowText: { fontSize: isMobile ? 13 : 14, fontWeight: "700", color: colors.text },
    spotRowTextActive: { color: colors.background },
    spotRowArea: { fontSize: 11, color: colors.muted },
    spotRowAreaActive: { color: colors.surfaceSecondary },
  }), [colors]);

  useEffect(() => {
    referenceService.getPickupSpots().then(setPickupSpots).catch(() => {});
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: isEditMode ? "Edit Listing" : "New Listing",
      headerBackTitle: "Back",
    });
    api
      .get("/categories/with-counts")
      .then((res) => {
        if (res.data.success)
          setCategories(res.data.data.categories ?? res.data.data ?? []);
      })
      .catch(() => {})
      .finally(() => setCatLoading(false));

    if (isEditMode) {
      productService
        .getProductById(productId)
        .then((res) => {
          if (res.success) {
            const p = res.data.product;
            setTitle(p.title ?? "");
            setDescription(p.description ?? "");
            setPrice(String(p.price ?? ""));
            setCategory(
              typeof p.category === "object"
                ? p.category._id
                : (p.category ?? ""),
            );
            setCondition(p.condition ?? "good");
            setDeliveryOption(p.deliveryOption ?? "pickup");
            setPickupLocation(p.pickupLocation ?? "");
            setTags((p as any).tags?.join(", ") ?? "");
            setStatus(p.status === "draft" ? "draft" : "active");
          }
        })
        .catch(() => {})
        .finally(() => setPrefilling(false));
    }
  }, [navigation, isEditMode, productId]);

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert("Required", "Please enter a title.");
    if (!price || isNaN(Number(price)))
      return Alert.alert("Required", "Please enter a valid price.");
    if (!category) return Alert.alert("Required", "Please select a category.");

    setLoading(true);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      category,
      condition,
      deliveryOption,
      pickupLocation: pickupLocation.trim() || "UMaT Campus",
      status,
      tags: tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      ...(images.length > 0 ? { images } : {}),
    };
    try {
      let res;
      if (isEditMode) {
        res = await productService.updateProduct(productId, payload);
      } else {
        res = await productService.createProduct({ ...payload, images });
      }
      if (res.success) {
        Alert.alert(
          "Success",
          isEditMode ? "Listing updated!" : "Listing created!",
          [{ text: "OK", onPress: () => navigation.goBack() }],
        );
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        (isEditMode ? "Failed to update." : "Failed to create listing.");
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert(
        "Permission needed",
        "Allow photo library access to upload listing images.",
      );
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      const picked = result.assets.slice(0, 5).map((asset, idx) => ({
        uri: asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: asset.fileName || `listing-${Date.now()}-${idx}.jpg`,
      }));
      setImages(picked);
    }
  };

  const isUnverifiedSeller =
    !isEditMode &&
    user?.role === "seller" &&
    !user?.isVerified &&
    !user?.emailVerified &&
    !user?.phoneVerified;

  if (prefilling || loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (isUnverifiedSeller) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScreenHeader
          eyebrow="Verification Required"
          title="Identity Check"
          subtitle="You must verify your student status before listing items."
        />
        <View style={styles.gateContent}>
          <View style={styles.gateIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={60}
              color={colors.border}
            />
          </View>
          <Text style={styles.gateTitle}>Verify to continue</Text>
          <Text style={styles.gateText}>
            Sellers on QUADS are required to verify their UMaT student email
            (@st.umat.edu.gh) or phone number to ensure a safe community for
            all.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("Verification")}
          >
            <Text style={styles.primaryBtnText}>Start Verification</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryBtnText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScreenHeader
          eyebrow="Seller Hub"
          title={isEditMode ? "Edit Listing" : "Create Listing"}
          subtitle={
            isEditMode
              ? "Update your product details."
              : "Post a product to the campus marketplace."
          }
        />
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Images</Text>
          <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImages}>
            <Text style={styles.imagePickerBtnText}>
              {images.length > 0 ? "Change photos" : "Add product photos"}
            </Text>
          </TouchableOpacity>
          {images.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.previewScroll}
            >
              {images.map((img, idx) => (
                <View key={`${img.uri}-${idx}`} style={styles.previewThumb}>
                  <Image
                    source={{ uri: img.uri }}
                    style={[styles.previewImage, idx === 0 && { borderColor: colors.accent, borderWidth: 2.5 }]}
                  />
                  {idx === 0 && (
                    <View style={styles.coverBadge}>
                      <Text style={styles.coverBadgeText}>Cover</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.deleteImgBtn}
                    onPress={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                  >
                    <Text style={styles.deleteImgBtnText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.previewImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSecondary, borderStyle: 'dashed' }]}
                onPress={pickImages}
              >
                <Text style={{ fontSize: isMobile ? 18 : 22, color: colors.muted }}>+</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="What are you selling?"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe your item..."
            placeholderTextColor={colors.muted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={2000}
          />

          <Text style={styles.label}>Price (GHS) *</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={colors.muted}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Category *</Text>
          {catLoading ? (
            <ActivityIndicator
              style={{ marginVertical: 12 }}
              color={colors.accent}
            />
          ) : categories.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  style={[
                    styles.chip,
                    category === cat._id && styles.chipActive,
                  ]}
                  onPress={() => setCategory(cat._id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === cat._id && styles.chipTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyCategoryBox}>
              <Text style={styles.emptyCategoryText}>
                No categories found. Seed categories on server.
              </Text>
            </View>
          )}

          <Text style={styles.label}>Condition *</Text>
          <View style={styles.chipRow}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, condition === c && styles.chipActive]}
                onPress={() => setCondition(c)}
              >
                <Text
                  style={[
                    styles.chipText,
                    condition === c && styles.chipTextActive,
                  ]}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Delivery Option *</Text>
          <View style={styles.chipRow}>
            {DELIVERY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.chip,
                  deliveryOption === opt.value && styles.chipActive,
                ]}
                onPress={() => setDeliveryOption(opt.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    deliveryOption === opt.value && styles.chipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {(deliveryOption === "pickup" || deliveryOption === "both") && (
            <>
              <Text style={styles.label}>Pickup Location</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setSpotPickerVisible(true)}
              >
                <Text style={[styles.pickerBtnText, !pickupLocation && { opacity: 0.35 }]} numberOfLines={1}>
                  {pickupLocation || "Select a pickup spot…"}
                </Text>
                <Text style={styles.pickerChevron}>▼</Text>
              </TouchableOpacity>

              {pickupLocation === "Other (specify below)" && (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder="Describe your pickup location"
                  placeholderTextColor={colors.muted}
                  value={customPickup}
                  onChangeText={setCustomPickup}
                />
              )}

              <Modal
                visible={spotPickerVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setSpotPickerVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalSheet}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalHeaderTitle}>Pickup Spot</Text>
                      <TouchableOpacity onPress={() => { setSpotPickerVisible(false); setSpotSearch(""); }}>
                        <Text style={styles.modalHeaderClose}>Close</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.modalSearchWrap}>
                      <TextInput
                        style={styles.modalSearchInput}
                        placeholder="Search spots..."
                        placeholderTextColor={colors.muted}
                        value={spotSearch}
                        onChangeText={setSpotSearch}
                        autoFocus
                      />
                    </View>
                    <FlatList
                      data={spotSearch.trim() ? pickupSpots.filter(s => s.name.toLowerCase().includes(spotSearch.toLowerCase())) : pickupSpots}
                      keyExtractor={item => item.name}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[styles.spotRow, pickupLocation === item.name && styles.spotRowActive]}
                          onPress={() => { setPickupLocation(item.name); setSpotSearch(""); setSpotPickerVisible(false); }}
                        >
                          <Text style={[styles.spotRowText, pickupLocation === item.name && styles.spotRowTextActive]}>{item.name}</Text>
                          {item.area !== "Custom" && (
                            <Text style={[styles.spotRowArea, pickupLocation === item.name && styles.spotRowAreaActive]}>{item.area}</Text>
                          )}
                        </TouchableOpacity>
                      )}
                      keyboardShouldPersistTaps="handled"
                    />
                  </View>
                </View>
              </Modal>
            </>
          )}

          <Text style={styles.label}>Tags</Text>
          <TextInput
            style={styles.input}
            placeholder="phone, hostel, calculator"
            placeholderTextColor={colors.muted}
            value={tags}
            onChangeText={setTags}
          />

          <Text style={styles.label}>Listing Status</Text>
          <View style={styles.chipRow}>
            {[
              { value: "active", label: "Publish Now" },
              { value: "draft", label: "Save Draft" },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.chip,
                  status === item.value && styles.chipActive,
                ]}
                onPress={() => setStatus(item.value as "active" | "draft")}
              >
                <Text
                  style={[
                    styles.chipText,
                    status === item.value && styles.chipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.submitBtnText}>
                {isEditMode ? "Update Listing" : "Create Listing"}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default CreateListingScreen;
