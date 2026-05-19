import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import savedService from "../services/saved.service";
import { Product } from "../types";
import { shadows } from "../theme";
import { useColors } from "../theme/ThemeContext";
import EmptyState from '../components/EmptyState';

const SavedScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    listContent: { padding: 12, gap: 10 },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 0,
      borderWidth: 2,
      borderColor: colors.boardBorder,
      ...shadows.bulletin,
    },
    image: { width: "100%", height: 150, backgroundColor: colors.surfaceSecondary },
    content: { padding: 10 },
    title: { fontSize: isMobile ? 13 : 14, fontWeight: "700", color: colors.text },
    price: { marginTop: 4, fontSize: isMobile ? 14 : 16, fontWeight: "900", color: colors.primary },
  }), [colors]);

  const fetchSaved = useCallback(async (withLoader = true) => {
    if (withLoader) setLoading(true);
    try {
      const res = await savedService.getSavedItems(1, 50);
      if (res.success) setProducts(res.data.products);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => fetchSaved());
    return unsub;
  }, [navigation, fetchSaved]);

  const renderItem = useCallback(({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("ProductDetail", { productId: item._id })}
      activeOpacity={0.88}
    >
      <Image
        source={item.images?.[0]?.url ? { uri: item.images[0].url } : require("../../assets/icon.png")}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.price}>
          GHS {item.price.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
        </Text>
      </View>
    </TouchableOpacity>
  ), [styles, navigation]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchSaved(false); }}
          />
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState title="Nothing saved yet" subtitle="Tap the bookmark on any listing to save it for later." />
        }
      />
    </SafeAreaView>
  );
};

export default SavedScreen;
