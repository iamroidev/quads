import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Linking, Alert, ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shadows } from '../theme';
import { useColors } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import { Ionicons } from '@expo/vector-icons';
import chatService from '../services/chat.service';

interface SupportArticle { title: string; content: string; }

const ARTICLES = {
  help: [
    { title: 'Getting Started with QUADS', content: 'Welcome to the official QUADS platform for UMaT. Use your institutional email (@student.umat.edu.gh or @st.umat.edu.gh) to register. After login, visit the Security Center to verify your account. You can browse listings on the Board or switch to Seller mode to manage your own store.' },
    { title: 'Safe Buying Guide', content: 'Message sellers directly via Chat. All meetups must happen on campus (e.g., Library foyer or Student Center). Use our secure payment system; funds are held until you confirm receipt of the item.' },
    { title: 'Selling and Store Management', content: 'Create listings with clear titles and high-quality photos. When an item sells, coordinate the meetup. Once the buyer confirms receipt, your payout is processed to your linked MoMo wallet within 24-48 hours.' },
  ],
  safety: [
    { title: 'Payment Safety', content: 'Our secure payment system holds buyer funds until the transaction is complete. NEVER pay via direct MoMo transfer outside the platform or pay "advance money" in advance. Report any user asking for external payments.' },
    { title: 'Inspection Checklist', content: 'Test electronics thoroughly (battery, ports, Wi-Fi). Check textbooks for missing pages. Meet near a power outlet for appliances. Do not confirm the transaction if the item does not match the description.' },
    { title: 'Reporting and Security', content: 'Use the Report button for fraudulent listings. In emergencies, contact UMaT Campus Security. Our moderation team reviews all reports within 24 hours.' },
  ],
};

const SupportScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 40 },
    aiCard: { margin: 16, padding: isMobile ? 12 : 16, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, ...shadows.bulletin },
    aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    aiTitle: { fontSize: isMobile ? 12 : 13, fontWeight: '900', color: colors.text },
    aiText: { fontSize: 11, fontWeight: '700', color: colors.muted, lineHeight: 16, marginBottom: 12 },
    aiActionRow: { backgroundColor: colors.text, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    aiActionText: { color: colors.bg, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    quickContacts: { flexDirection: 'row', paddingHorizontal: isMobile ? 12 : 16, gap: 12, marginTop: 12 },
    contactCard: { flex: 1, padding: isMobile ? 12 : 16, borderWidth: 2, borderColor: colors.border, ...shadows.bulletin },
    cardIcon: { marginBottom: 10 },
    cardTitle: { fontSize: isMobile ? 12 : 13, fontWeight: '900', color: colors.text, textTransform: 'uppercase' },
    cardSub: { fontSize: 10, fontWeight: '700', color: colors.muted, marginTop: 4, lineHeight: 14 },
    searchWrap: { padding: isMobile ? 12 : 16, marginTop: 10 },
    searchInput: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, paddingHorizontal: isMobile ? 12 : 16, paddingVertical: 12, fontSize: isMobile ? 13 : 14, color: colors.text, fontWeight: '700', ...shadows.bulletin },
    section: { paddingHorizontal: isMobile ? 12 : 16, gap: 8 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: colors.accent, letterSpacing: 1.5, marginBottom: 4 },
    accordionCard: { borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, ...shadows.bulletin },
    accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    accordionTitle: { fontSize: isMobile ? 12 : 13, fontWeight: '900', color: colors.text, textTransform: 'uppercase', flex: 1, paddingRight: 12 },
    accordionContent: { borderTopWidth: 2, borderTopColor: colors.border, borderStyle: 'dashed', padding: isMobile ? 12 : 16, backgroundColor: colors.surfaceSecondary },
    accordionText: { fontSize: 12, fontWeight: '700', color: colors.muted, lineHeight: 18 },
    emptyCard: { margin: 16, padding: 32, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', ...shadows.bulletin },
    emptyTitle: { fontSize: isMobile ? 13 : 14, fontWeight: '900', textTransform: 'uppercase', color: colors.text },
    emptySub: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 6 },
    institutionalCard: { margin: 16, marginTop: 24, padding: isMobile ? 12 : 16, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, ...shadows.bulletin },
    institutionalTitle: { fontSize: isMobile ? 12 : 13, fontWeight: '900', color: colors.text, marginBottom: 6 },
    institutionalText: { fontSize: 12, fontWeight: '700', color: colors.muted, lineHeight: 18 },
  }), [colors]);

  const openLink = (url: string) => Linking.openURL(url);
  const toggleAccordion = (id: string) => setExpandedId(expandedId === id ? null : id);

  const startAiChat = async () => {
    setLoadingAi(true);
    try {
      const res = await chatService.getAiUser();
      if (res.success && res.data?.userId) {
        const convRes = await chatService.getOrCreateConversation(res.data.userId);
        if (convRes.success && convRes.data?.conversation) {
          navigation.navigate('Chat', { conversationId: convRes.data.conversation._id, otherUser: { _id: res.data.userId, name: 'QUADS AI Assistant' } });
        }
      } else throw new Error('AI Support bot not configured on server');
    } catch {
      Alert.alert('AI Assistant Offline', 'Our smart support bot is busy assisting other students. Please try again or use email/WhatsApp support.');
    } finally { setLoadingAi(false); }
  };

  const isSearching = search.trim().length > 0;
  const getFiltered = (list: SupportArticle[]) => {
    if (!isSearching) return list;
    const q = search.toLowerCase();
    return list.filter(a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
  };

  const helpArticles = getFiltered(ARTICLES.help);
  const safetyArticles = getFiltered(ARTICLES.safety);
  const hasNoResults = helpArticles.length === 0 && safetyArticles.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader eyebrow="HELP CENTER" title="Support Desk" subtitle="Campus support guides, safe buying, and contact protocols." />

        <TouchableOpacity style={styles.aiCard} onPress={startAiChat} disabled={loadingAi}>
          <View style={styles.aiHeader}>
            <Ionicons name="desktop-outline" size={20} color={colors.accent} />
            <Text style={styles.aiTitle}>AI SUPPORT ASSISTANT</Text>
          </View>
          <Text style={styles.aiText}>Need help with escrow holdings, payment confirmations, or listing guidelines? Chat instantly with our institutional bot.</Text>
          <View style={styles.aiActionRow}>
            {loadingAi ? <ActivityIndicator color={colors.bg} size={16} /> : <Text style={styles.aiActionText}>START LIVE ASSISTANCE</Text>}
          </View>
        </TouchableOpacity>

        <View style={styles.quickContacts}>
          <TouchableOpacity style={[styles.contactCard, { backgroundColor: colors.surfaceSecondary }]} onPress={() => openLink('https://wa.me/233551500736')}>
            <Ionicons name="logo-whatsapp" size={28} color={colors.pinBlue} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>WhatsApp Support</Text>
            <Text style={styles.cardSub}>Quick support via WhatsApp chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactCard, { backgroundColor: colors.metric1Bg }]} onPress={() => openLink('mailto:support@quadsmarket.tech')}>
            <Ionicons name="mail-outline" size={28} color={colors.accent} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Email Support</Text>
            <Text style={styles.cardSub}>Official help ticket & queries</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search guides... (e.g. escrow, MoMo)"
            placeholderTextColor={colors.textDisabled}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {hasNoResults && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Guides Found</Text>
            <Text style={styles.emptySub}>Try searching for different keywords or reach out directly.</Text>
          </View>
        )}

        {helpArticles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MARKETPLACE GUIDES</Text>
            {helpArticles.map((art, idx) => {
              const id = `help-${idx}`;
              const open = expandedId === id;
              return (
                <View key={id} style={styles.accordionCard}>
                  <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleAccordion(id)}>
                    <Text style={styles.accordionTitle}>{art.title}</Text>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.text} />
                  </TouchableOpacity>
                  {open && (
                    <View style={styles.accordionContent}>
                      <Text style={styles.accordionText}>{art.content}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {safetyArticles.length > 0 && (
          <View style={[styles.section, { marginTop: 24 }]}>
            <Text style={styles.sectionLabel}>SAFETY PROTOCOLS</Text>
            {safetyArticles.map((art, idx) => {
              const id = `safety-${idx}`;
              const open = expandedId === id;
              return (
                <View key={id} style={styles.accordionCard}>
                  <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleAccordion(id)}>
                    <Text style={styles.accordionTitle}>{art.title}</Text>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.text} />
                  </TouchableOpacity>
                  {open && (
                    <View style={styles.accordionContent}>
                      <Text style={styles.accordionText}>{art.content}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.institutionalCard}>
          <Text style={styles.institutionalTitle}>UMaT CAMPUS SAFETY ZONES</Text>
          <Text style={styles.institutionalText}>Always meet campus sellers inside public nodes. Highly recommended places include the UMaT Library Foyer, Student Center Lobby, or Hall Common Rooms. Never meet off-campus or late at night.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SupportScreen;
