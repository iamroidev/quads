import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shadows } from '../theme';
import { useColors } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import categoryService, { CategoryWithCount } from '../services/category.service';

const CategoriesScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: isMobile ? 12 : 16, marginTop: 8 },
    card: {
      width: '48%',
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 20,
      alignItems: 'center',
      ...shadows.bulletin,
    },
    cardIcon: { fontSize: 32, marginBottom: 8 },
    cardName: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', color: colors.text },
  }), [colors]);

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
            >
              <Text style={styles.cardIcon}>{cat.icon || 'PKG'}</Text>
              <Text style={styles.cardName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CategoriesScreen;
