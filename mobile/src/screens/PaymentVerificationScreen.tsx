import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { shadows } from '../theme';
import { useColors } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';

const PaymentVerificationScreen = ({ route, navigation }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const { success } = route.params || {};

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { flex: 1, paddingHorizontal: isMobile ? 12 : 16, justifyContent: 'center', alignItems: 'center' },
    resultCard: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 24,
      alignItems: 'center',
      width: '100%',
      marginBottom: 24,
      ...shadows.bulletin,
    },
    iconBox: { marginBottom: 16 },
    status: { fontSize: isMobile ? 18 : 22, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, color: colors.text },
    subtitle: { fontSize: 12, color: colors.muted, textAlign: 'center' },
    btn: { backgroundColor: colors.text, paddingVertical: 16, paddingHorizontal: 32, ...shadows.bulletin },
    btnText: { color: colors.bg, fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <ScreenHeader eyebrow="Payment" title="Verification" />
        <View style={styles.resultCard}>
          <View style={styles.iconBox}>
            <Ionicons
              name={success ? 'checkmark-circle' : 'close-circle'}
              size={64}
              color={success ? colors.accent : colors.danger}
            />
          </View>
          <Text style={styles.status}>{success ? 'Payment Successful!' : 'Payment Failed'}</Text>
          <Text style={styles.subtitle}>
            {success
              ? 'Your order has been placed successfully.'
              : 'Please try again or contact support.'}
          </Text>
        </View>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Orders')}>
          <Text style={styles.btnText}>VIEW ORDERS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default PaymentVerificationScreen;
