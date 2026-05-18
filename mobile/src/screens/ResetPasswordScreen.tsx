import React, { useState, useEffect } from 'react';
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
import { colors, shadows } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const ResetPasswordScreen = ({ navigation, route }: any) => {
  const [accessToken, setAccessToken] = useState(route.params?.accessToken || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // If no access token in params, try to get from Supabase session
    if (!accessToken) {
      // For now, we'll rely on the navigation params
      // In a real implementation, we might check for a stored token
    }
  }, []);

  const handleSubmit = async () => {
    if (!accessToken) {
      Alert.alert('Error', 'No valid reset session. Please request a new reset link.');
      navigation.goBack();
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      // First verify the access token
      const { data: sessionData, error: sessionError } = await supabase.auth.getUser(accessToken);
      if (sessionError) throw sessionError;

      // Update password
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      Alert.alert('Success', 'Password updated successfully!');
      navigation.replace('Login');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update password. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.text} />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            eyebrow="Account recovery"
            title="Reset Password"
            subtitle="Enter your new password below."
          />

          <View style={styles.form}>
            {/* New Password */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••"
                  placeholderTextColor="#9a8e7f"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <Text style={styles.toggleText}>Hide</Text>
                  ) : (
                    <Text style={styles.toggleText}>Show</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••"
                  placeholderTextColor="#9a8e7f"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <Text style={styles.toggleText}>Hide</Text>
                  ) : (
                    <Text style={styles.toggleText}>Show</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                submitting && styles.btnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size={16} />
              ) : (
                <Text style={styles.primaryBtnText}>Update Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backBtnText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },

  form: { gap: 20 },
  field: { gap: 8 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7c6f60',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#fff',
    borderRadius: 0,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: colors.muted,
  },
  primaryBtn: {
    backgroundColor: '#1f1a14',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.bulletin,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  backBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginTop: 20,
    ...shadows.bulletin,
  },
  backBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6f6559',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
});

export default ResetPasswordScreen;
