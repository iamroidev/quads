import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shadows } from '../theme';
import { useColors } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';

const CollectionDetailScreen = ({ route }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const { slug } = route.params || {};
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    empty: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 40 },
    card: {
      padding: isMobile ? 12 : 16,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginBottom: 10,
      ...shadows.bulletin,
    },
    title: { fontSize: isMobile ? 12 : 13, fontWeight: '900', color: colors.text },
    price: { fontSize: 12, color: colors.muted, marginTop: 4 },
  }), [colors]);

  useEffect(() => {
    api.get('/products', { params: { collection: slug } })
      .then(r => setProducts(r.data.data || []))
      .finally(() => setLoading(false));
  }, [slug]);

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
        <ScreenHeader eyebrow="Collection" title={slug} />
        {products.length === 0 ? (
          <Text style={styles.empty}>No items in this collection</Text>
        ) : (
          products.map(p => (
            <View key={p._id} style={styles.card}>
              <Text style={styles.title}>{p.title}</Text>
              <Text style={styles.price}>GHS {p.price}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CollectionDetailScreen;
