import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ScreenHeader from '../components/ScreenHeader';
import { useColors } from '../theme/ThemeContext';

const SellerOnboardingScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState((user as any)?.storeName || '');
  const [brandName, setBrandName] = useState((user as any)?.brandName || '');
  const [responseTimeMinutes, setResponseTimeMinutes] = useState(String((user as any)?.responseTimeMinutes || 15));
  const [payoutMethod, setPayoutMethod] = useState<'momo' | 'bank'>(((user as any)?.sellerOnboarding?.payoutMethod as any) || 'momo');
  const [payoutProvider, setPayoutProvider] = useState((user as any)?.sellerOnboarding?.payoutProvider || 'MTN');
  const [payoutAccountName, setPayoutAccountName] = useState((user as any)?.sellerOnboarding?.payoutAccountName || '');
  const [payoutAccountNumber, setPayoutAccountNumber] = useState((user as any)?.sellerOnboarding?.payoutAccountNumber || '');

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: isMobile ? 12 : 16, paddingBottom: 40 },
    label: { marginTop: 14, marginBottom: 6, fontSize: 11, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1.1 },
    input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 11, color: colors.text },
    row: { flexDirection: 'row', gap: 8 },
    chip: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.surface },
    chipActive: { backgroundColor: colors.text, borderColor: colors.text },
    chipText: { color: colors.text, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1 },
    chipTextActive: { color: colors.bg },
    saveBtn: { marginTop: 24, backgroundColor: colors.text, borderWidth: 1, borderColor: colors.text, alignItems: 'center', paddingVertical: 13 },
    saveText: { color: colors.bg, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  }), [colors]);

  const allDone = useMemo(() => {
    return !!((storeName.trim() || brandName.trim()) && payoutAccountName.trim() && payoutAccountNumber.trim());
  }, [storeName, brandName, payoutAccountName, payoutAccountNumber]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/auth/seller-onboarding', {
        storeName,
        brandName,
        responseTimeMinutes: Number(responseTimeMinutes || 15),
        payoutMethod,
        payoutProvider,
        payoutAccountName,
        payoutAccountNumber,
        completed: allDone,
      });
      await refreshUser();
      if (allDone) {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        eyebrow={user?.role === 'buyer' ? "Upgrade Account" : "Seller setup"}
        title={user?.role === 'buyer' ? "Become a Seller" : "Onboarding"}
        subtitle={user?.role === 'buyer' ? "Tell us about your campus store to start listing items." : "Branding and payout details for your seller profile."}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Store name</Text>
        <TextInput style={styles.input} value={storeName} onChangeText={setStoreName} placeholder="Store name" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Brand name</Text>
        <TextInput style={styles.input} value={brandName} onChangeText={setBrandName} placeholder="Brand name" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Response time (minutes)</Text>
        <TextInput style={styles.input} value={responseTimeMinutes} onChangeText={setResponseTimeMinutes} keyboardType="number-pad" placeholder="15" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Payout method</Text>
        <View style={styles.row}>
          {['momo', 'bank'].map((m) => (
            <TouchableOpacity key={m} style={[styles.chip, payoutMethod === m && styles.chipActive]} onPress={() => setPayoutMethod(m as any)}>
              <Text style={[styles.chipText, payoutMethod === m && styles.chipTextActive]}>{m.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Payout provider</Text>
        <TextInput style={styles.input} value={payoutProvider} onChangeText={setPayoutProvider} placeholder="MTN / Bank name" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Account name</Text>
        <TextInput style={styles.input} value={payoutAccountName} onChangeText={setPayoutAccountName} placeholder="Account name" placeholderTextColor={colors.muted} />

        <Text style={styles.label}>Account number</Text>
        <TextInput style={styles.input} value={payoutAccountNumber} onChangeText={setPayoutAccountNumber} placeholder="Account number" placeholderTextColor={colors.muted} />

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
          <Text style={styles.saveText}>{saving ? 'Saving...' : allDone ? 'Finish and Continue' : 'Save Progress'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SellerOnboardingScreen;
