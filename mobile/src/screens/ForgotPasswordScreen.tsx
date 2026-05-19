import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { shadows } from '../theme';
import { useColors } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';

const ForgotPasswordScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: isMobile ? 12 : 16, paddingBottom: 40 },
    form: { gap: 14 },
    field: { gap: 6 },
    fieldLabel: {
      fontSize: 10, fontWeight: '800', color: colors.muted,
      textTransform: 'uppercase', letterSpacing: 1.4,
    },
    input: {
      borderWidth: 2, borderColor: colors.border,
      backgroundColor: colors.surfaceSecondary, borderRadius: 0,
      paddingHorizontal: 14, paddingVertical: 12,
      fontSize: isMobile ? 13 : 15, color: colors.text,
    },
    primaryBtn: { backgroundColor: colors.text, paddingVertical: 14, alignItems: 'center', marginTop: 4, borderWidth: 2, borderColor: colors.border, ...shadows.bulletin },
    btnDisabled: { opacity: 0.5 },
    primaryBtnText: { color: colors.bg, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.3 },
    cancelBtn: { paddingVertical: 12, alignItems: 'center', borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, ...shadows.bulletin },
    cancelBtnText: { fontSize: 11, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1.1 },
    successBox: {
      borderWidth: 2, borderColor: colors.border,
      backgroundColor: colors.surfaceSecondary,
      padding: 24, alignItems: 'center', gap: 12,
      ...shadows.bulletin,
    },
    successIcon: { fontSize: 36 },
    successTitle: { fontSize: isMobile ? 17 : 20, fontWeight: '900', color: colors.text, textTransform: 'uppercase' },
    successBody: { fontSize: isMobile ? 12 : 13, color: colors.muted, lineHeight: 20, textAlign: 'center' },
    backBtn: { marginTop: 8, backgroundColor: colors.text, paddingVertical: 12, paddingHorizontal: 24, alignSelf: 'stretch', alignItems: 'center', borderWidth: 2, borderColor: colors.border, ...shadows.bulletin },
    backBtnText: { color: colors.bg, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  }), [colors]);

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('Required', 'Please enter a valid email address.');
      return;
    }
    setSending(true);
    try {
      await api.post('/auth/forgot-password', { email: trimmed });
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send reset email. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader
          eyebrow="Account recovery"
          title="Reset Password"
          subtitle="Enter your email and we'll send a reset link."
        />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {sent ? (
            <View style={styles.successBox}>
              
              <Text style={styles.successTitle}>Reset link sent</Text>
              <Text style={styles.successBody}>
                Check your inbox for <Text style={{ fontWeight: '800' }}>{email}</Text>.{'\n'}
                Click the link to set a new password. It expires in 1 hour.
              </Text>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.backBtnText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Email address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, sending && styles.btnDisabled]}
                onPress={handleSend}
                disabled={sending}
              >
                {sending
                  ? <ActivityIndicator color={colors.bg} />
                  : <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.cancelBtnText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;
