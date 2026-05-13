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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { colors } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const ForgotPasswordScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('Required', 'Please enter a valid email address.');
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed);
      if (error) throw error;
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
            /* ── Success state ── */
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>📬</Text>
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
            /* ── Form state ── */
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Email address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#9a8e7f"
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
                  ? <ActivityIndicator color="#fff" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },

  form: { gap: 14 },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 10, fontWeight: '800', color: '#7c6f60',
    textTransform: 'uppercase', letterSpacing: 1.4,
  },
  input: {
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: '#fff', borderRadius: 0,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.text,
  },
  primaryBtn: { backgroundColor: '#1f1a14', paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.3 },

  cancelBtn: { paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cancelBtnText: { fontSize: 11, fontWeight: '800', color: '#6f6559', textTransform: 'uppercase', letterSpacing: 1.1 },

  successBox: {
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: '#fffacd',
    padding: 24, alignItems: 'center', gap: 12,
  },
  successIcon: { fontSize: 36 },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#1f1a14', textTransform: 'uppercase' },
  successBody: { fontSize: 13, color: '#5e5038', lineHeight: 20, textAlign: 'center' },
  backBtn: { marginTop: 8, backgroundColor: '#1f1a14', paddingVertical: 12, paddingHorizontal: 24, alignSelf: 'stretch', alignItems: 'center' },
  backBtnText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
});

export default ForgotPasswordScreen;
