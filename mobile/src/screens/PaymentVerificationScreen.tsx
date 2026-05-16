import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const PaymentVerificationScreen = ({ route, navigation }: any) => {
  const { success } = route.params || {};

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <ScreenHeader eyebrow="Payment" title="Verification" />
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
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Orders')}>
          <Text style={styles.btnText}>VIEW ORDERS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  iconBox: { marginBottom: 24 },
  status: { fontSize: 22, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 },
  subtitle: { fontSize: 12, color: colors.muted, textAlign: 'center', marginBottom: 32 },
  btn: { backgroundColor: colors.text, paddingVertical: 16, paddingHorizontal: 32 },
  btnText: { color: '#fff', fontWeight: '900', textTransform: 'uppercase', fontSize: 12 },
});

export default PaymentVerificationScreen;