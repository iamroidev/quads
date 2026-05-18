import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { supabase } from '../services/supabase';
import { colors, shadows } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const SettingsScreen = () => {
  const { user, refreshUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
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

  React.useEffect(() => {
    if (!user) return;
    if (user.notificationPrefs) {
      setNotifPrefs(user.notificationPrefs);
    }
    if (user.privacyPrefs) {
      setPrivacyPrefs(user.privacyPrefs);
    }
  }, [user]);

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
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      Alert.alert('Done', 'Password updated successfully.');
      setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update password.');
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader eyebrow="Account" title="Settings" subtitle={user?.email} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

      <Text style={styles.sectionLabel}>App theme</Text>
      <View style={styles.themeSelectorContainer}>
        {(['light', 'dark', 'system'] as const).map((t) => {
          const isActive = theme === t;
          return (
            <TouchableOpacity
              key={t}
              style={[
                styles.themeBtn,
                isActive && { backgroundColor: colors.accent, borderColor: colors.border },
              ]}
              onPress={() => setTheme(t)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.themeBtnText,
                  isActive && { color: '#ffffff', fontWeight: '900' },
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Notification settings</Text>

      <View style={styles.card}>
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
                trackColor={{ false: '#767577', true: colors.accent }}
              />
            </View>
            {idx < 4 ? <View style={styles.sep} /> : null}
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Privacy settings</Text>

      <View style={styles.card}>
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
                trackColor={{ false: '#767577', true: colors.accent }}
              />
            </View>
            {idx < 3 ? <View style={styles.sep} /> : null}
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.secondaryBtn} onPress={handleRefresh} disabled={loading} activeOpacity={0.8}>
        <Text style={styles.secondaryBtnText}>{loading ? 'Refreshing...' : 'Refresh account data'}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>Change password</Text>
      <View style={styles.card}>
        <View style={[styles.row, { paddingBottom: 0 }]}>
          <View style={{ flex: 1, paddingRight: 8, gap: 8 }}>
            <TextInput
              style={styles.pwInput}
              placeholder="New password"
              placeholderTextColor="rgba(0,0,0,0.3)"
              secureTextEntry
              value={newPw}
              onChangeText={setNewPw}
            />
            <TextInput
              style={styles.pwInput}
              placeholder="Confirm new password"
              placeholderTextColor="rgba(0,0,0,0.3)"
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
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  sectionLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 10,
    fontWeight: '900',
    color: colors.text,
    opacity: 0.6,
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
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.surface,
    ...shadows.bulletin,
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
    borderWidth: 2.5, 
    borderColor: colors.border, 
    ...shadows.bulletin 
  },
  row: { 
    paddingHorizontal: 14, 
    paddingVertical: 14, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  sep: { 
    height: 1.5, 
    backgroundColor: colors.border,
    opacity: 0.1,
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
    color: colors.text,
    opacity: 0.5, 
    fontSize: 11,
    fontWeight: '500',
  },
  secondaryBtn: { 
    marginTop: 16, 
    borderWidth: 2.5, 
    borderColor: colors.border, 
    paddingVertical: 12, 
    alignItems: 'center', 
    backgroundColor: colors.surface, 
    ...shadows.bulletin 
  },
  secondaryBtnText: { 
    fontSize: 11, 
    color: colors.text, 
    textTransform: 'uppercase', 
    fontWeight: '900', 
    letterSpacing: 1.1 
  },
  logoutBtn: { 
    marginTop: 16, 
    borderWidth: 2.5, 
    borderColor: '#d6b8b4', 
    paddingVertical: 12, 
    alignItems: 'center', 
    backgroundColor: colors.surface 
  },
  logoutText: { 
    fontSize: 11, 
    color: '#9f3d34', 
    textTransform: 'uppercase', 
    fontWeight: '900', 
    letterSpacing: 1.1 
  },
  pwInput: {
    borderWidth: 2.5, 
    borderColor: colors.border, 
    backgroundColor: colors.surface,
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    fontSize: 14, 
    color: colors.text,
  },
  pwBtn: { 
    backgroundColor: colors.accent, 
    borderWidth: 2.5,
    borderColor: colors.border,
    paddingVertical: 12, 
    alignItems: 'center', 
    marginBottom: 14, 
    ...shadows.bulletin 
  },
  pwBtnText: { 
    color: '#fff', 
    fontSize: 11, 
    fontWeight: '900', 
    textTransform: 'uppercase', 
    letterSpacing: 1.1 
  },
});

export default SettingsScreen;
