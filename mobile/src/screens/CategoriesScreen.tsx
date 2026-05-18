import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import categoryService, { CategoryWithCount } from '../services/category.service';

const CategoriesScreen = ({ navigation }: any) => {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);

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
              onPress={() => navigation.navigate('Products', { categoryId: cat._id })}
            >
              <Text style={styles.cardIcon}>{cat.icon || '📦'}</Text>
              <Text style={styles.cardName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, marginTop: 8 },
  card: {
    width: '48%',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 20,
    alignItems: 'center',
    ...shadows.bulletin,
  },
  cardIcon: { fontSize: 32, marginBottom: 8 },
  cardName: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center' },
});

export default CategoriesScreen;
