import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';

interface Seller {
  _id: string;
  name: string;
  storeName?: string;
  listingCount: number;
}

const SellersScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: isMobile ? 12 : 16,
      marginBottom: 10,
      marginHorizontal: 16,
      borderBottomWidth: 3,
      borderRightWidth: 3,
    },
    avatar: {
      width: 40, height: 40,
      backgroundColor: colors.accent,
      alignItems: 'center', justifyContent: 'center',
      marginRight: 12,
    },
    avatarText: { color: colors.primaryContent, fontWeight: '900', fontSize: 16 },
    name: { fontSize: isMobile ? 12 : 13, fontWeight: '900', textTransform: 'uppercase', color: colors.text },
    listings: { fontSize: 11, color: colors.muted, marginTop: 2 },
  }), [colors]);

  useEffect(() => {
    api.get('/products/top-sellers')
      .then(r => setSellers(r.data.data || []))
      .catch(() => {})
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
        <ScreenHeader eyebrow="Marketplace" title="Top Sellers" subtitle="Browse verified sellers on campus." />
        {sellers.map(s => (
          <TouchableOpacity
            key={s._id}
            style={styles.row}
            onPress={() => navigation.navigate('ProductsTab', {
              screen: 'ProductsHome',
              params: { sellerId: s._id, sellerName: s.storeName || s.name }
            })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{s.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{s.storeName || s.name}</Text>
              <Text style={styles.listings}>{s.listingCount} listings</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SellersScreen;
