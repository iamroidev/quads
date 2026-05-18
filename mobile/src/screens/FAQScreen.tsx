import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadows } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  label: string;
  accent: string;
  items: FAQItem[];
}

const FAQ_DATA: FAQCategory[] = [
  {
    id: 'general',
    label: 'General',
    accent: '#ff6b6b',
    items: [
      {
        id: 'what-is-quads',
        question: 'What is QUADS?',
        answer: 'QUADS is the official campus marketplace for students of the University of Mines and Technology (UMaT), Ghana. It lets you buy, sell, and trade campus items securely within the UMaT student community. Every transaction is backed by our escrow payment system so your money is always protected.',
      },
      {
        id: 'who-can-join',
        question: 'Who can join?',
        answer: 'QUADS is exclusively for verified UMaT students. You must have an active UMaT institutional email address (@student.umat.edu.gh) to register. Non-institutional emails are rejected to keep the marketplace safe.',
      },
    ],
  },
  {
    id: 'buying',
    label: 'Buying',
    accent: '#0284c7',
    items: [
      {
        id: 'is-payment-secure',
        question: 'Is payment secure?',
        answer: 'Absolutely. When you pay, funds are held by our escrow system and are NOT released to the seller until you confirm that you have received the item and that it matches the description. Payments are securely processed via Paystack.',
      },
      {
        id: 'where-to-meet',
        question: 'Where should we meet?',
        answer: 'Always meet at a designated campus safety zone. Recommended spots include the Library Foyer, the Student Center, or other busy public campus spaces. Never meet off-campus or in isolated areas.',
      },
    ],
  },
  {
    id: 'selling',
    label: 'Selling',
    accent: '#10b981',
    items: [
      {
        id: 'seller-fees',
        question: 'Are there any seller fees?',
        answer: 'None! QUADS charges 0% trading fees, 0% listing fees, and takes zero commission cuts. Every cedi you make is entirely yours.',
      },
      {
        id: 'how-to-list',
        question: 'How do I list an item?',
        answer: 'Ensure your student ID is verified. Then tap the "+ Sell Something" button in the menu or dashboard, enter details, upload photos, and post it immediately to the board.',
      },
    ],
  },
];

const FAQScreen = () => {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('general');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const isSearching = search.trim().length > 0;

  const getFilteredItems = () => {
    if (isSearching) {
      const q = search.toLowerCase();
      const list: FAQItem[] = [];
      FAQ_DATA.forEach(cat => {
        cat.items.forEach(item => {
          if (item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)) {
            list.push(item);
          }
        });
      });
      return list;
    }
    return FAQ_DATA.find(c => c.id === activeCat)?.items || [];
  };

  const items = getFilteredItems();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow="SUPPORT"
          title="FAQ Center"
          subtitle="Common questions & helpful articles."
        />

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search questions... (e.g. escrow, momo)"
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Categories (hidden when searching) */}
        {!isSearching && (
          <View style={styles.tabsRow}>
            {FAQ_DATA.map(cat => {
              const active = cat.id === activeCat;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.tab,
                    active && { backgroundColor: cat.accent, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    setActiveCat(cat.id);
                    setExpandedId(null);
                  }}
                >
                  <Text style={[styles.tabText, active && styles.activeTabText]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Accordions */}
        <View style={styles.list}>
          {items.map((item, index) => {
            const open = expandedId === item.id;
            return (
              <View key={item.id} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.headerRow}
                  onPress={() => toggleExpand(item.id)}
                >
                  <View style={styles.indexBox}>
                    <Text style={styles.indexText}>{String(index + 1).padStart(2, '0')}</Text>
                  </View>
                  <Text style={styles.questionText}>{item.question}</Text>
                  <Text style={styles.toggleIcon}>{open ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {open && (
                  <View style={styles.answerWrap}>
                    <View style={styles.accentBar} />
                    <Text style={styles.answerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {items.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No matching FAQs</Text>
              <Text style={styles.emptySub}>Try searching for something else or browse categories.</Text>
            </View>
          )}
        </View>

        {/* Still need help CTA */}
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Still Need Help?</Text>
          <Text style={styles.helpText}>
            Our support desk is active from 8:00 AM – 6:00 PM (GMT). Feel free to submit a support ticket!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
    ...shadows.bulletin,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.bulletin,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: colors.text,
    letterSpacing: 1,
  },
  activeTabText: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  faqCard: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.bulletin,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  indexBox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  indexText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.muted,
  },
  questionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: colors.text,
  },
  toggleIcon: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.muted,
  },
  answerWrap: {
    borderTopWidth: 2,
    borderTopColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
  },
  accentBar: {
    width: 4,
    backgroundColor: '#ff6b6b',
  },
  answerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.7)',
    lineHeight: 18,
  },
  emptyCard: {
    padding: 32,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    ...shadows.bulletin,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  helpCard: {
    margin: 16,
    marginTop: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#fffacd',
    ...shadows.bulletin,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
    textTransform: 'uppercase',
  },
  helpText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.7)',
    marginTop: 6,
    lineHeight: 18,
  },
});

export default FAQScreen;
