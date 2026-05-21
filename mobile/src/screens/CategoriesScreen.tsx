import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import categoryService, { CategoryWithCount } from '../services/category.service';

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

const CategoriesScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const hPadding = isMobile ? 12 : 16;
  const catCols = isMobile ? 2 : 3;
  const catGap = 10;
  const catCardWidth = (_sw - hPadding * 2 - catGap * (catCols - 1)) / catCols;

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: catGap, paddingHorizontal: hPadding, marginTop: 8 },
    card: {
      width: catCardWidth,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      paddingVertical: 16,
      paddingHorizontal: 14,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardIconBox: {
      width: 36,
      height: 36,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1.5,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    cardName: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, color: colors.text },
    cardCount: { fontSize: 9, fontWeight: '700', color: colors.textSecondary, marginTop: 3, letterSpacing: 0.5 },
  }), [colors, catCardWidth]);

  useEffect(() => {
    categoryService.getCategoriesWithCounts()
      .then(r => { if (r.success) setCategories(r.data.categories || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow="Browse"
          title="Categories"
          subtitle="Shop by department and category."
        />
        <View style={styles.grid}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat._id}
              style={styles.card}
              onPress={() => navigation.navigate('ProductsTab', { screen: 'ProductsHome', params: { category: cat._id } })}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardIconBox}>
                  <Ionicons name={mapSlugToIcon(cat.slug) as any} size={20} color={colors.primary} />
                </View>
                <View style={styles.cardDot} />
              </View>
              <Text style={styles.cardName}>{cat.name}</Text>
              <Text style={styles.cardCount}>
                {cat.productCount} {cat.productCount === 1 ? 'item' : 'items'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CategoriesScreen;
