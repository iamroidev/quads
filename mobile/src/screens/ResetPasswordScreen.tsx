import React, { useState, useRef, useEffect } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import api from '../services/api';

const ResetPasswordScreen = ({ navigation, route }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;

  // email may be pre-filled from ForgotPassword screen via route params
  const [email, setEmail]                     = useState(route.params?.email || '');
  const [otp, setOtp]                         = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting]           = useState(false);
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const otpRefs = useRef<any[]>([]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const styles = React.useMemo(() => StyleSheet.create({
    container:   { flex: 1, backgroundColor: colors.bg },
    content:     { padding: isMobile ? 12 : 16, paddingBottom: 40 },
    label:       { fontSize: 10, fontWeight: '900', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 6 },
    input:       { borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, fontSize: 15, color: colors.text, marginBottom: 16 },
    btn:         { backgroundColor: colors.text, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: colors.border, marginTop: 8 },
    btnTxt:      { fontSize: 13, fontWeight: '900', color: colors.bg, textTransform: 'uppercase', letterSpacing: 1 },
    otpRow:      { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 16 },
    otpBox:      { width: 46, height: 56, borderWidth: 3, borderColor: colors.border, backgroundColor: colors.surface, textAlign: 'center', fontSize: 22, fontWeight: '900', color: colors.text },
    row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    linkTxt:     { fontSize: 11, fontWeight: '900', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
    mutedTxt:    { fontSize: 11, fontWeight: '900', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  }), [colors, isMobile]);

  const handleResend = async () => {
    if (!email.trim() || resendCountdown > 0) return;
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setResendCountdown(60);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to resend.');
    }
  };

  const handleSubmit = async () => {
    if (!email.trim()) { Alert.alert('Required', 'Enter your email address.'); return; }
    if (otp.length !== 6) { Alert.alert('Required', 'Enter the 6-digit code from your email.'); return; }
    if (password.length < 6) { Alert.alert('Too short', 'Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { Alert.alert('Mismatch', "Passwords don't match."); return; }

    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { email: email.trim().toLowerCase(), code: otp, password });
      Alert.alert('Success', 'Password updated successfully!', [{ text: 'Log In', onPress: () => navigation.replace('Login') }]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader eyebrow="Account recovery" title="Reset Password" subtitle="Enter the code from your email and your new password." />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@email.com"
            placeholderTextColor={colors.textDisabled}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.row}>
            <Text style={styles.label}>Verification Code</Text>
            <TouchableOpacity onPress={handleResend} disabled={resendCountdown > 0 || !email.trim()}>
              <Text style={resendCountdown > 0 || !email.trim() ? styles.mutedTxt : styles.linkTxt}>
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Send Code'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.otpRow}>
            {Array.from({ length: 6 }).map((_, i) => (
              <TextInput
                key={i}
                ref={r => { otpRefs.current[i] = r; }}
                style={[styles.otpBox, otp[i] ? { borderColor: colors.text } : {}]}
                keyboardType="number-pad"
                maxLength={1}
                value={otp[i] || ''}
                textContentType={i === 0 ? 'oneTimeCode' : 'none'}
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                onChangeText={v => {
                  const digit = v.replace(/\D/g, '').slice(-1);
                  const arr = otp.split('');
                  arr[i] = digit;
                  setOtp(arr.join('').slice(0, 6));
                  if (digit && i < 5) otpRefs.current[i + 1]?.focus();
                }}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                }}
              />
            ))}
          </View>

          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.textDisabled}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter password"
            placeholderTextColor={colors.textDisabled}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            autoComplete="new-password"
          />

          <TouchableOpacity style={[styles.btn, submitting && { opacity: 0.5 }]} onPress={handleSubmit} disabled={submitting}>
            <Text style={styles.btnTxt}>{submitting ? 'Updating...' : 'Set New Password'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 16, alignItems: 'center' }} onPress={() => navigation.goBack()}>
            <Text style={styles.mutedTxt}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default ResetPasswordScreen;
