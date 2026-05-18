import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import chatService from '../services/chat.service';
import { colors, shadows } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const STORAGE_KEY = 'quads_lost_found';

interface LostFoundItem {
  id: string;
  type: 'lost' | 'found';
  title: string;
  category: string;
  date: string;
  location: string;
  description: string;
  contactName: string;
  contactInfo: string;
  imageUrl?: string;
  createdAt: string;
  userId?: string;
}

const CATEGORY_OPTIONS = [
  { label: '🔑 Keys', value: 'keys' },
  { label: '🪪 Student ID', value: 'id_card' },
  { label: '💻 Electronics', value: 'laptop' },
  { label: '📱 Smartphone', value: 'phone' },
  { label: '🎒 Bag', value: 'bag' },
  { label: '📚 Books', value: 'books' },
  { label: '📦 Other', value: 'other' },
];

const CATEGORY_LABELS: Record<string, string> = {
  keys: '🔑 Keys',
  id_card: '🪪 Student ID',
  laptop: '💻 Electronics',
  phone: '📱 Smartphone',
  bag: '🎒 Bag',
  books: '📚 Books',
  other: '📦 Other',
};

const LostFoundScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [detail, setDetail] = useState<LostFoundItem | null>(null);
  const [form, setForm] = useState({
    type: 'lost' as 'lost' | 'found',
    title: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0],
    location: '',
    description: '',
    contactName: user?.name || '',
    contactInfo: '',
  });

  const loadItems = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: LostFoundItem[] = JSON.parse(raw);
      setItems(parsed.filter((i) => i.id && i.id.length > 8));
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const saveItems = async (next: LostFoundItem[]) => {
    setItems(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.location.trim() || !form.description.trim() || !form.contactInfo.trim()) {
      Alert.alert('Missing fields', 'Title, location, description, and contact info are required.');
      return;
    }
    const newItem: LostFoundItem = {
      id: `lf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      ...form,
      createdAt: new Date().toISOString(),
      userId: user?._id,
    };
    await saveItems([newItem, ...items]);
    setShowAdd(false);
    setForm({
      type: 'lost',
      title: '',
      category: 'other',
      date: new Date().toISOString().split('T')[0],
      location: '',
      description: '',
      contactName: user?.name || '',
      contactInfo: '',
    });
    Alert.alert('Pinned!', 'Your item has been posted to the Lost & Found board.');
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remove Pin', 'Remove this item from the board?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => saveItems(items.filter((i) => i.id !== id)),
      },
    ]);
  };

  const handleChat = async (item: LostFoundItem) => {
    if (!user) {
      Alert.alert('Login required', 'Please log in to message the poster.');
      return;
    }
    if (item.userId === user._id) {
      Alert.alert('Your own pin', "This is your item — you can't chat with yourself.");
      return;
    }
    try {
      const targetUserId = item.userId;
      if (!targetUserId) {
        Alert.alert('Unavailable', 'Cannot message — poster information is unavailable.');
        return;
      }
      const res = await chatService.getOrCreateConversation(targetUserId);
      if (res.success) {
        try {
          await chatService.sendMessage(
            res.data.conversation._id,
            `Hi! I'm inquiring about the item on the Lost & Found Board: "${item.title}" (${item.type === 'lost' ? 'Lost' : 'Found'} at ${item.location}).`
          );
        } catch {}
        setDetail(null);
        navigation.navigate('Chat', {
          conversationId: res.data.conversation._id,
          otherUser: { _id: targetUserId, name: item.contactName },
          productTitle: item.title,
        });
      }
    } catch {
      Alert.alert('Error', 'Could not start a conversation.');
    }
  };

  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter);

  const renderItem = ({ item }: { item: LostFoundItem }) => (
    <TouchableOpacity style={styles.card} onPress={() => setDetail(item)}>
      <View style={[styles.typeBadge, item.type === 'lost' ? styles.lostBadge : styles.foundBadge]}>
        <Text style={[styles.typeBadgeText, item.type === 'lost' ? styles.lostText : styles.foundText]}>
          {item.type.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.cardMeta}>📍 {item.location}</Text>
      <Text style={styles.cardMeta}>📅 {new Date(item.date).toLocaleDateString()}</Text>
      <Text style={styles.cardCategory}>{CATEGORY_LABELS[item.category] || '📦 Other'}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        eyebrow="Campus Board"
        title="Lost & Found"
        subtitle="Pin lost items or report found belongings."
      />

      {/* Filters + Add */}
      <View style={styles.toolbar}>
        <View style={styles.filterRow}>
          {(['all', 'lost', 'found'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f === 'all' ? 'ALL' : f.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ PIN ITEM</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.grid}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📌</Text>
            <Text style={styles.emptyText}>No pins on the board yet</Text>
            <Text style={styles.emptySub}>Tap "PIN ITEM" above to post a lost or found item.</Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal visible={!!detail} transparent animationType="fade" onRequestClose={() => setDetail(null)}>
        <Pressable style={styles.backdrop} onPress={() => setDetail(null)}>
          <Pressable style={styles.detailCard} onPress={() => {}}>
            {detail && (
              <>
                <View style={[styles.typeBadge, detail.type === 'lost' ? styles.lostBadge : styles.foundBadge]}>
                  <Text style={[styles.typeBadgeText, detail.type === 'lost' ? styles.lostText : styles.foundText]}>
                    {detail.type.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.detailTitle}>{detail.title}</Text>
                <Text style={styles.detailMeta}>{CATEGORY_LABELS[detail.category]}</Text>
                <Text style={styles.detailMeta}>📍 {detail.location}</Text>
                <Text style={styles.detailMeta}>📅 {new Date(detail.date).toLocaleDateString()}</Text>
                <View style={styles.detailDivider} />
                <Text style={styles.detailDesc}>{detail.description}</Text>
                <View style={styles.detailDivider} />
                <Text style={styles.detailContact}>👤 {detail.contactName}</Text>
                <Text style={styles.detailContact}>📞 {detail.contactInfo}</Text>
                <View style={styles.detailActions}>
                  <TouchableOpacity style={styles.chatBtn} onPress={() => handleChat(detail)}>
                    <Text style={styles.chatBtnText}>MESSAGE POSTER</Text>
                  </TouchableOpacity>
                  {detail.userId === user?._id && (
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => { handleDelete(detail.id); setDetail(null); }}>
                      <Text style={styles.deleteBtnText}>REMOVE</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setDetail(null)}>
                  <Text style={styles.closeBtnText}>CLOSE</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.backdrop} onPress={() => setShowAdd(false)}>
            <Pressable style={styles.formCard} onPress={() => {}}>
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.formTitle}>📌 PIN AN ITEM</Text>

                <View style={styles.typeRow}>
                  {(['lost', 'found'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeBtn, form.type === t && (t === 'lost' ? styles.lostBadge : styles.foundBadge)]}
                      onPress={() => setForm({ ...form, type: t })}
                    >
                      <Text style={[styles.typeBtnText, form.type === t && { color: t === 'lost' ? '#9f3d34' : '#065f46' }]}>
                        {t.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Title *</Text>
                <TextInput style={styles.input} placeholder="e.g. Black Samsung Earbuds" placeholderTextColor="#9a8e7f" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />

                <Text style={styles.fieldLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
                  {CATEGORY_OPTIONS.map((c) => (
                    <TouchableOpacity key={c.value} style={[styles.catChip, form.category === c.value && styles.catChipActive]} onPress={() => setForm({ ...form, category: c.value })}>
                      <Text style={[styles.catChipText, form.category === c.value && styles.catChipTextActive]}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.fieldLabel}>Location *</Text>
                <TextInput style={styles.input} placeholder="e.g. Library 2nd Floor" placeholderTextColor="#9a8e7f" value={form.location} onChangeText={(v) => setForm({ ...form, location: v })} />

                <Text style={styles.fieldLabel}>Description *</Text>
                <TextInput style={[styles.input, styles.textarea]} placeholder="Describe the item and circumstances..." placeholderTextColor="#9a8e7f" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline numberOfLines={4} />

                <Text style={styles.fieldLabel}>Your Name</Text>
                <TextInput style={styles.input} placeholder="Your name" placeholderTextColor="#9a8e7f" value={form.contactName} onChangeText={(v) => setForm({ ...form, contactName: v })} />

                <Text style={styles.fieldLabel}>Contact Info *</Text>
                <TextInput style={styles.input} placeholder="Phone number or email" placeholderTextColor="#9a8e7f" value={form.contactInfo} onChangeText={(v) => setForm({ ...form, contactInfo: v })} />

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                  <Text style={styles.submitBtnText}>📌 PIN TO BOARD</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                  <Text style={styles.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  toolbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#fff' },
  filterChipActive: { backgroundColor: colors.text, borderColor: colors.text },
  filterChipText: { fontSize: 10, fontWeight: '800', color: '#6f6559', letterSpacing: 1.1 },
  filterChipTextActive: { color: '#fff' },
  addBtn: { backgroundColor: colors.text, paddingHorizontal: 14, paddingVertical: 10, ...shadows.bulletin },
  addBtnText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  listContent: { padding: 10, paddingBottom: 20 },
  grid: { gap: 10, marginBottom: 10 },
  card: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    padding: 12, ...shadows.bulletin,
  },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, marginBottom: 8 },
  lostBadge: { borderColor: '#d6b8b4', backgroundColor: '#fde8e6' },
  foundBadge: { borderColor: colors.accent, backgroundColor: '#d6ede7' },
  typeBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  lostText: { color: '#9f3d34' },
  foundText: { color: '#065f46' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.text, textTransform: 'uppercase' },
  cardMeta: { fontSize: 11, color: '#7b6f61', marginTop: 4 },
  cardCategory: { fontSize: 10, color: colors.muted, marginTop: 6, fontWeight: '700' },
  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '800', color: colors.text, textTransform: 'uppercase' },
  emptySub: { fontSize: 12, color: colors.muted, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },

  // Detail modal
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  detailCard: { backgroundColor: colors.surface, borderWidth: 2, borderColor: '#000', padding: 20, ...shadows.bulletin },
  detailTitle: { fontSize: 18, fontWeight: '900', color: colors.text, textTransform: 'uppercase', marginTop: 4 },
  detailMeta: { fontSize: 12, color: '#7b6f61', marginTop: 4 },
  detailDivider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  detailDesc: { fontSize: 14, lineHeight: 22, color: '#2e2820' },
  detailContact: { fontSize: 13, color: colors.text, fontWeight: '600', marginTop: 4 },
  detailActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  chatBtn: { flex: 1, backgroundColor: colors.text, paddingVertical: 13, alignItems: 'center', ...shadows.bulletin },
  chatBtnText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  deleteBtn: { borderWidth: 1, borderColor: '#d6b8b4', backgroundColor: '#fde8e6', paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center' },
  deleteBtnText: { color: '#9f3d34', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  closeBtn: { borderWidth: 1, borderColor: colors.border, paddingVertical: 10, alignItems: 'center', marginTop: 10, backgroundColor: '#fff' },
  closeBtnText: { color: '#463d31', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },

  // Add form modal
  formCard: { backgroundColor: colors.surface, borderWidth: 2, borderColor: '#000', padding: 20, maxHeight: '85%', ...shadows.bulletin },
  formTitle: { fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  typeBtnText: { fontSize: 12, fontWeight: '900', color: '#6f6559', letterSpacing: 1.2 },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: '#7c6f60', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  catRow: { gap: 8 },
  catChip: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#fff' },
  catChipActive: { backgroundColor: colors.text, borderColor: colors.text },
  catChipText: { fontSize: 10, fontWeight: '800', color: '#6f6559' },
  catChipTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: colors.text, paddingVertical: 14, alignItems: 'center', marginTop: 20, ...shadows.bulletin },
  submitBtnText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  cancelBtn: { borderWidth: 1, borderColor: colors.border, paddingVertical: 12, alignItems: 'center', marginTop: 10, backgroundColor: '#fff' },
  cancelBtnText: { color: '#463d31', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
});

export default LostFoundScreen;
