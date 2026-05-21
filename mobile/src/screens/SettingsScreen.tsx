import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
  Dimensions, Share, Clipboard, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import api from '../services/api';
import ScreenHeader from '../components/ScreenHeader';
import { BulletinCard } from '../components/BulletinCard';

const SettingsScreen = () => {
  const { user, refreshUser, logout } = useAuth();
  const { theme, setTheme, colors } = useTheme();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const styles = getStyles(colors, isMobile);
  
  const [notifPrefs, setNotifPrefs] = React.useState({
    orderUpdates: true, messages: true, reviews: true, promotions: false, systemAlerts: true,
  });
  const [privacyPrefs, setPrivacyPrefs] = React.useState({
    showPhone: false, showLocation: true, allowMessages: true, showOnlineStatus: true,
  });
  const [loading, setLoading] = React.useState(false);
  const [savingNotif, setSavingNotif] = React.useState(false);
  const [savingPrivacy, setSavingPrivacy] = React.useState(false);
  const [newPw, setNewPw] = React.useState('');
  const [confirmPw, setConfirmPw] = React.useState('');
  const [changingPw, setChangingPw] = React.useState(false);

  // 2FA TOTP State
  const [totpEnabled, setTotpEnabled] = React.useState(user?.totpEnabled || false);
  const [totpWizardStep, setTotpWizardStep] = React.useState<'none' | 'setup' | 'disable'>('none');
  const [totpSecret, setTotpSecret] = React.useState('');
  const [totpToken, setTotpToken] = React.useState('');
  const [totpPassword, setTotpPassword] = React.useState('');
  const [totpLoading, setTotpLoading] = React.useState(false);

  // Biometrics State
  const [biometricsAvailable, setBiometricsAvailable] = React.useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = React.useState(false);
  const [biometricsPasswordModal, setBiometricsPasswordModal] = React.useState(false);
  const [biometricsPassword, setBiometricsPassword] = React.useState('');

  React.useEffect(() => {
    if (!user) return;
    if (user.notificationPrefs) {
      setNotifPrefs(user.notificationPrefs);
    }
    if (user.privacyPrefs) {
      setPrivacyPrefs(user.privacyPrefs);
    }
    setTotpEnabled(user.totpEnabled || false);
  }, [user]);

  React.useEffect(() => {
    const checkBiometrics = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricsAvailable(hasHardware && isEnrolled);

      const stored = await SecureStore.getItemAsync('biometric_credentials');
      setBiometricsEnabled(!!stored);
    };
    checkBiometrics();
  }, []);

  const saveNotification = async (key: keyof typeof notifPrefs, enabled: boolean) => {
    const next = { ...notifPrefs, [key]: enabled };
    setNotifPrefs(next);
    setSavingNotif(true);
    try {
      await api.put('/auth/settings/notifications', next);
      await refreshUser();
    } catch {
      setNotifPrefs(notifPrefs);
    } finally {
      setSavingNotif(false);
    }
  };

  const savePrivacy = async (key: keyof typeof privacyPrefs, enabled: boolean) => {
    const next = { ...privacyPrefs, [key]: enabled };
    setPrivacyPrefs(next);
    setSavingPrivacy(true);
    try {
      await api.put('/auth/settings/privacy', next);
      await refreshUser();
    } catch {
      setPrivacyPrefs(privacyPrefs);
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPw || newPw.length < 6) { Alert.alert('Too short', 'Password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { Alert.alert('Mismatch', 'Passwords do not match.'); return; }
    setChangingPw(true);
    try {
      await api.post('/auth/forgot-password', { email: user?.email });
      Alert.alert('Check your email', 'A reset code has been sent to your email. Use the Reset Password screen to set your new password.');
      setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to send reset code.');
    } finally { setChangingPw(false); }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshUser();
    } finally {
      setLoading(false);
    }
  };

  const startTotpSetup = async () => {
    setTotpLoading(true);
    try {
      const res = await api.post('/auth/totp/setup');
      setTotpSecret(res.data.secret);
      setTotpWizardStep('setup');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to start 2FA setup');
    } finally {
      setTotpLoading(false);
    }
  };

  const verifyTotpSetup = async () => {
    if (totpToken.trim().length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit verification code');
      return;
    }
    setTotpLoading(true);
    try {
      await api.post('/auth/totp/verify', { token: totpToken.trim() });
      await refreshUser();
      setTotpEnabled(true);
      setTotpWizardStep('none');
      setTotpToken('');
      setTotpSecret('');
      Alert.alert('Success', 'Two-factor authentication has been enabled!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Invalid verification code');
    } finally {
      setTotpLoading(false);
    }
  };

  const disableTotp = async () => {
    if (!totpPassword) {
      Alert.alert('Password Required', 'Please enter your password to disable 2FA');
      return;
    }
    setTotpLoading(true);
    try {
      await api.post('/auth/totp/disable', { password: totpPassword });
      await refreshUser();
      setTotpEnabled(false);
      setTotpWizardStep('none');
      setTotpPassword('');
      Alert.alert('Success', 'Two-factor authentication has been disabled.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to disable 2FA');
    } finally {
      setTotpLoading(false);
    }
  };

  const downloadMyData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/data-export');
      const shareContent = JSON.stringify(res.data, null, 2);
      await Share.share({
        title: 'My QUADS Data Export',
        message: shareContent,
      });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBiometrics = async (value: boolean) => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometric login',
      });
      if (result.success) {
        setBiometricsPasswordModal(true);
      } else {
        setBiometricsEnabled(false);
      }
    } else {
      await SecureStore.deleteItemAsync('biometric_credentials');
      setBiometricsEnabled(false);
      Alert.alert('Disabled', 'Biometric login has been disabled.');
    }
  };

  const confirmEnableBiometrics = async () => {
    if (!biometricsPassword) {
      Alert.alert('Password Required', 'Please enter your password to enable biometric login');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/login', { email: user?.email, password: biometricsPassword });
      await SecureStore.setItemAsync(
        'biometric_credentials',
        JSON.stringify({ email: user?.email, password: biometricsPassword })
      );
      setBiometricsEnabled(true);
      setBiometricsPasswordModal(false);
      setBiometricsPassword('');
      Alert.alert('Success', 'Biometric login has been successfully enabled!');
    } catch (err: any) {
      Alert.alert('Verification Failed', err.response?.data?.message || err.message || 'Incorrect password.');
      setBiometricsEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader eyebrow="Account" title="Settings" subtitle={user?.email} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>

      <Text style={styles.sectionLabel}>App theme</Text>
      <View style={styles.themeSelectorContainer}>
        {(['light', 'dark', 'system'] as const).map((t) => {
          const isActive = theme === t;
          return (
            <TouchableOpacity
              key={t}
              style={[
                styles.themeBtn,
                isActive && { backgroundColor: colors.primary, borderColor: colors.boardBorder },
              ]}
              onPress={() => setTheme(t)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.themeBtnText,
                  isActive && { color: colors.primaryContent, fontWeight: '900' },
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Notification settings</Text>

      <BulletinCard style={styles.card} size="sm">
        {[
          ['orderUpdates', 'Order updates', 'Payment, confirmation, and delivery status changes'],
          ['messages', 'Messages', 'When buyers or sellers reply to your chats'],
          ['reviews', 'Reviews', 'Feedback events and review reminders'],
          ['promotions', 'Promotions', 'Deals, campaigns, and featured opportunities'],
          ['systemAlerts', 'System alerts', 'Security and account notices'],
        ].map(([key, title, note], idx) => (
          <View key={key}>
            <View style={styles.row}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowNote}>{note}</Text>
              </View>
              <Switch
                value={notifPrefs[key as keyof typeof notifPrefs]}
                onValueChange={(v) => saveNotification(key as keyof typeof notifPrefs, v)}
                disabled={savingNotif}
                trackColor={{ false: colors.surfaceSecondary, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
            {idx < 4 ? <View style={styles.sep} /> : null}
          </View>
        ))}
      </BulletinCard>

      <Text style={styles.sectionLabel}>Privacy settings</Text>

      <BulletinCard style={styles.card} size="sm">
        {[
          ['showPhone', 'Show phone', 'Let others contact you directly'],
          ['showLocation', 'Show location', 'Display campus pickup area on profile/listing'],
          ['allowMessages', 'Allow messages', 'Allow new chat requests'],
          ['showOnlineStatus', 'Show online status', 'Show active/last seen in chat'],
        ].map(([key, title, note], idx) => (
          <View key={key}>
            <View style={styles.row}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowNote}>{note}</Text>
              </View>
              <Switch
                value={privacyPrefs[key as keyof typeof privacyPrefs]}
                onValueChange={(v) => savePrivacy(key as keyof typeof privacyPrefs, v)}
                disabled={savingPrivacy}
                trackColor={{ false: colors.surfaceSecondary, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
            {idx < 3 ? <View style={styles.sep} /> : null}
          </View>
        ))}
      </BulletinCard>

      <Text style={styles.sectionLabel}>Security Settings</Text>

      <BulletinCard style={styles.card} size="sm">
        <View>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.rowTitle}>Two-factor auth (2FA)</Text>
              <Text style={styles.rowNote}>
                {totpEnabled ? 'Enabled' : 'Secure your account with 2FA TOTP'}
              </Text>
            </View>
            <Switch
              value={totpEnabled}
              onValueChange={(v) => {
                if (v) {
                  startTotpSetup();
                } else {
                  setTotpWizardStep('disable');
                }
              }}
              trackColor={{ false: colors.surfaceSecondary, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
          
          {totpWizardStep === 'setup' && (
            <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10 }}>
              <Text style={styles.rowNote}>
                1. Copy this key and add it to your authenticator app (Google Authenticator, Authy, etc.):
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  style={[styles.pwInput, { flex: 1 }]}
                  value={totpSecret}
                  editable={false}
                />
                <TouchableOpacity
                  style={[styles.pwBtn, { marginTop: 0, paddingHorizontal: 12, paddingVertical: 10 }]}
                  onPress={() => {
                    Clipboard.setString(totpSecret);
                    Alert.alert('Copied', 'TOTP secret copied to clipboard');
                  }}
                >
                  <Text style={styles.pwBtnText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.rowNote}>2. Enter the 6-digit code below to verify:</Text>
              <TextInput
                style={styles.pwInput}
                placeholder="6-digit code"
                placeholderTextColor={colors.textDisabled}
                keyboardType="numeric"
                maxLength={6}
                value={totpToken}
                onChangeText={(v) => setTotpToken(v.replace(/\D/g, ''))}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.secondaryBtn, { flex: 1, marginTop: 0 }]}
                  onPress={() => {
                    setTotpWizardStep('none');
                    setTotpToken('');
                    setTotpSecret('');
                  }}
                >
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pwBtn, { flex: 1, marginTop: 0 }, totpLoading && { opacity: 0.5 }]}
                  onPress={verifyTotpSetup}
                  disabled={totpLoading}
                >
                  <Text style={styles.pwBtnText}>{totpLoading ? 'Verifying...' : 'Verify'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {totpWizardStep === 'disable' && (
            <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10 }}>
              <Text style={styles.rowNote}>Confirm your password to disable 2FA:</Text>
              <TextInput
                style={styles.pwInput}
                placeholder="Your password"
                placeholderTextColor={colors.textDisabled}
                secureTextEntry
                value={totpPassword}
                onChangeText={setTotpPassword}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.secondaryBtn, { flex: 1, marginTop: 0 }]}
                  onPress={() => {
                    setTotpWizardStep('none');
                    setTotpPassword('');
                  }}
                >
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.logoutBtn, { flex: 1, marginTop: 0 }, totpLoading && { opacity: 0.5 }]}
                  onPress={disableTotp}
                  disabled={totpLoading}
                >
                  <Text style={[styles.logoutText, { color: colors.danger }]}>
                    {totpLoading ? 'Disabling...' : 'Disable'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {biometricsAvailable && (
          <>
            <View style={styles.sep} />
            <View style={styles.row}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.rowTitle}>Biometric login</Text>
                <Text style={styles.rowNote}>Sign in using Face ID or fingerprint</Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={handleToggleBiometrics}
                trackColor={{ false: colors.surfaceSecondary, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
          </>
        )}
      </BulletinCard>

      <Text style={styles.sectionLabel}>Data & privacy compliance</Text>
      <View style={{ gap: 8, marginTop: 6 }}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={downloadMyData} disabled={loading} activeOpacity={0.8}>
          <Text style={styles.secondaryBtnText}>{loading ? 'Generating Export...' : 'Download My Data (GDPR)'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.secondaryBtn, { marginTop: 0 }]} onPress={handleRefresh} disabled={loading} activeOpacity={0.8}>
          <Text style={styles.secondaryBtnText}>{loading ? 'Refreshing...' : 'Refresh account data'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Change password</Text>
      <BulletinCard style={styles.card} size="sm">
        <View style={[styles.row, { paddingBottom: 0 }]}>
          <View style={{ flex: 1, paddingRight: 8, gap: 12, paddingVertical: 12 }}>
            <TextInput
              style={styles.pwInput}
              placeholder="New password"
              placeholderTextColor={colors.textDisabled}
              secureTextEntry
              value={newPw}
              onChangeText={setNewPw}
            />
            <TextInput
              style={styles.pwInput}
              placeholder="Confirm new password"
              placeholderTextColor={colors.textDisabled}
              secureTextEntry
              value={confirmPw}
              onChangeText={setConfirmPw}
            />
            <TouchableOpacity
              style={[styles.pwBtn, changingPw && { opacity: 0.5 }]}
              onPress={handleChangePassword}
              disabled={changingPw}
              activeOpacity={0.8}
            >
              <Text style={styles.pwBtnText}>{changingPw ? 'Updating...' : 'Update Password'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BulletinCard>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
      </ScrollView>

      {/* Biometrics Password Confirmation Modal */}
      <Modal
        visible={biometricsPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setBiometricsPasswordModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 }}>
          <View style={{ width: '100%', backgroundColor: colors.surface, borderRightWidth: 4, borderBottomWidth: 4, borderWidth: colors.boardBorderWidth, borderColor: colors.boardBorder, padding: 20, gap: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: '900', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Enable Biometric Login
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Enter your current password to securely link biometric authentication to this account.
            </Text>
            <TextInput
              style={styles.pwInput}
              placeholder="Your password"
              placeholderTextColor={colors.textDisabled}
              secureTextEntry
              value={biometricsPassword}
              onChangeText={setBiometricsPassword}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { flex: 1, marginTop: 0 }]}
                onPress={() => {
                  setBiometricsPasswordModal(false);
                  setBiometricsPassword('');
                  setBiometricsEnabled(false);
                }}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pwBtn, { flex: 1, marginTop: 0 }]}
                onPress={confirmEnableBiometrics}
                disabled={loading}
              >
                <Text style={styles.pwBtnText}>{loading ? 'Verifying...' : 'Enable'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (colors: any, isMobile = true) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionLabel: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 10,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  themeSelectorContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  themeBtn: {
    flex: 1,
    borderWidth: colors.boardBorderWidth,
    borderColor: colors.boardBorder,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  themeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.text,
    letterSpacing: 1,
  },
  card: { 
    marginTop: 10, 
    backgroundColor: colors.surface, 
    borderWidth: 0, // border handled by BulletinCard
  },
  row: { 
    paddingHorizontal: 14, 
    paddingVertical: 14, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  sep: { 
    height: 1, 
    backgroundColor: colors.boardBorder,
    opacity: 0.2,
  },
  rowTitle: { 
    fontSize: 12, 
    fontWeight: '900', 
    color: colors.text, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  rowNote: { 
    marginTop: 2, 
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  secondaryBtn: { 
    marginTop: 20, 
    borderWidth: colors.boardBorderWidth, 
    borderColor: colors.boardBorder, 
    paddingVertical: 12, 
    alignItems: 'center', 
    backgroundColor: colors.surface, 
  },
  secondaryBtnText: { 
    fontSize: 11, 
    color: colors.text, 
    textTransform: 'uppercase', 
    fontWeight: '900', 
    letterSpacing: 1.1 
  },
  logoutBtn: { 
    marginTop: 24, 
    borderWidth: colors.boardBorderWidth, 
    borderColor: colors.danger, 
    paddingVertical: 12, 
    alignItems: 'center', 
    backgroundColor: colors.surfaceSecondary 
  },
  logoutText: { 
    fontSize: 11, 
    color: colors.danger, 
    textTransform: 'uppercase', 
    fontWeight: '900', 
    letterSpacing: 1.1 
  },
  pwInput: {
    borderWidth: colors.boardBorderWidth, 
    borderColor: colors.boardBorder, 
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    fontSize: isMobile ? 13 : 14, 
    color: colors.text,
  },
  pwBtn: { 
    backgroundColor: colors.primary, 
    borderWidth: colors.boardBorderWidth,
    borderColor: colors.boardBorder,
    paddingVertical: 12, 
    alignItems: 'center', 
    marginTop: 8,
  },
  pwBtnText: { 
    color: colors.primaryContent, 
    fontSize: 11, 
    fontWeight: '900', 
    textTransform: 'uppercase', 
    letterSpacing: 1.1 
  }
});

export default SettingsScreen;
