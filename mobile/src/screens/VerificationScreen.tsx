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
import { useAuth } from '../context/AuthContext';
import verificationService from '../services/verification.service';
import { colors } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

type TabType = 'email' | 'phone';

const VerificationScreen = ({ navigation }: any) => {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState<TabType>('email');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    verificationService.getStatus().then((res) => {
      if (res.success) {
        setEmailVerified(res.data.emailVerified);
        setPhoneVerified(res.data.phoneVerified);
      }
    }).catch(() => {}).finally(() => setStatusLoading(false));
  }, []);

  const handleSend = async () => {
    setSending(true);
    try {
      if (tab === 'email') {
        const res = await verificationService.sendEmailOTP();
        if (res.success) { setCodeSent(true); setCode(''); }
        else Alert.alert('Error', res.message || 'Failed to send email OTP.');
      } else {
        if (!phone.trim()) { Alert.alert('Required', 'Enter your phone number.'); return; }
        const res = await verificationService.sendPhoneOTP(phone.trim());
        if (res.success) { setCodeSent(true); setCode(''); }
        else Alert.alert('Error', res.message || 'Failed to send SMS OTP.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim() || code.length < 4) {
      Alert.alert('Invalid code', 'Enter the 6-digit code sent to you.');
      return;
    }
    setVerifying(true);
    try {
      const res = await verificationService.verifyCode(code.trim(), tab);
      if (res.success) {
        if (tab === 'email') setEmailVerified(true);
        else setPhoneVerified(true);
        await refreshUser();
        Alert.alert('Verified!', `Your ${tab === 'email' ? 'email' : 'phone'} is now verified.`, [
          { text: 'OK', onPress: () => { if (emailVerified || phoneVerified) navigation.goBack(); } },
        ]);
        setCodeSent(false);
        setCode('');
      } else {
        Alert.alert('Failed', res.message || 'Invalid or expired code. Try again.');
      }
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message || 'Verification failed. Try again.');
    } finally {
      setVerifying(false);
    }
  };

  const isCurrentTabVerified = tab === 'email' ? emailVerified : phoneVerified;

  if (statusLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader
          eyebrow="Account security"
          title="Verify Account"
          subtitle="Verify your email or phone to start selling on campus."
        />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Status row */}
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Email</Text>
              <View style={[styles.statusBadge, emailVerified ? styles.badgeVerified : styles.badgePending]}>
                <Text style={[styles.statusBadgeText, emailVerified ? styles.badgeTextVerified : styles.badgeTextPending]}>
                  {emailVerified ? '✓ Verified' : 'Pending'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusItem, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
              <Text style={styles.statusLabel}>Phone</Text>
              <View style={[styles.statusBadge, phoneVerified ? styles.badgeVerified : styles.badgePending]}>
                <Text style={[styles.statusBadgeText, phoneVerified ? styles.badgeTextVerified : styles.badgeTextPending]}>
                  {phoneVerified ? '✓ Verified' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {(['email', 'phone'] as TabType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tab, tab === t && styles.tabActive]}
                onPress={() => { setTab(t); setCodeSent(false); setCode(''); }}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t === 'email' ? 'Email OTP' : 'Phone OTP'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Verified banner */}
          {isCurrentTabVerified ? (
            <View style={styles.verifiedBanner}>
              <Text style={styles.verifiedBannerText}>
                ✓ {tab === 'email' ? 'Email' : 'Phone'} already verified
              </Text>
            </View>
          ) : (
            <View style={styles.form}>

              {/* Phone input (only for phone tab) */}
              {tab === 'phone' && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Phone number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 0244123456"
                    placeholderTextColor="#9a8e7f"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    editable={!codeSent}
                  />
                </View>
              )}

              {/* Send button */}
              {!codeSent ? (
                <TouchableOpacity
                  style={[styles.primaryBtn, sending && styles.btnDisabled]}
                  onPress={handleSend}
                  disabled={sending}
                >
                  {sending
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.primaryBtnText}>
                        Send {tab === 'email' ? 'Email' : 'SMS'} Code
                      </Text>
                  }
                </TouchableOpacity>
              ) : (
                <>
                  <View style={styles.sentNote}>
                    <Text style={styles.sentNoteText}>
                      Code sent to your {tab === 'email' ? `email (${user?.email})` : `phone (${phone})`}. Check and enter below.
                    </Text>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Verification code</Text>
                    <TextInput
                      style={[styles.input, styles.codeInput]}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor="#9a8e7f"
                      value={code}
                      onChangeText={setCode}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryBtn, verifying && styles.btnDisabled]}
                    onPress={handleVerify}
                    disabled={verifying}
                  >
                    {verifying
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.primaryBtnText}>Verify Code</Text>
                    }
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.resendBtn} onPress={() => { setCodeSent(false); setCode(''); }}>
                    <Text style={styles.resendText}>Resend / Change number</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Why verify?</Text>
            <Text style={styles.infoText}>
              Verified sellers can list products and build trust with buyers. At least one verification (email or phone) is required.
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },

  statusRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
  statusItem: { flex: 1, padding: 14, alignItems: 'center' },
  statusLabel: { fontSize: 10, fontWeight: '800', color: '#7c6f60', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 8 },
  statusBadge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  badgeVerified: { borderColor: colors.accent, backgroundColor: '#d6ede7' },
  badgePending: { borderColor: colors.border, backgroundColor: '#fffacd' },
  statusBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  badgeTextVerified: { color: colors.accent },
  badgeTextPending: { color: '#7b6f61' },

  tabs: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.surface },
  tabActive: { backgroundColor: '#1f1a14' },
  tabText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1, color: '#6f6559' },
  tabTextActive: { color: '#fff' },

  verifiedBanner: { borderWidth: 1, borderColor: colors.accent, backgroundColor: '#d6ede7', padding: 14, marginBottom: 16 },
  verifiedBannerText: { fontSize: 13, fontWeight: '800', color: colors.accent, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },

  form: { gap: 12 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: '#7c6f60', textTransform: 'uppercase', letterSpacing: 1.4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    borderRadius: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  codeInput: { fontSize: 22, fontWeight: '900', letterSpacing: 6, textAlign: 'center' },

  primaryBtn: { backgroundColor: '#1f1a14', paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.3 },

  sentNote: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#fffacd', padding: 12 },
  sentNoteText: { fontSize: 12, color: '#5e5038', lineHeight: 18 },

  resendBtn: { marginTop: 8, alignItems: 'center', paddingVertical: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  resendText: { fontSize: 10, fontWeight: '800', color: '#6f6559', textTransform: 'uppercase', letterSpacing: 1.1 },

  infoBox: { marginTop: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14 },
  infoTitle: { fontSize: 10, fontWeight: '800', color: '#7c6f60', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 6 },
  infoText: { fontSize: 12, color: '#5e5447', lineHeight: 18 },
});

export default VerificationScreen;
