import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import chatService, { Conversation } from '../services/chat.service';
import { useAuth } from '../context/AuthContext';
import { shadows } from '../theme';
import { useColors } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import EmptyState from '../components/EmptyState';

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const ConversationListScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(c => {
      const other = c.participants.find((p: any) => p._id !== user?._id) ?? c.participants[0];
      return (
        other?.name?.toLowerCase().includes(q) ||
        c.product?.title?.toLowerCase().includes(q) ||
        c.lastMessage?.content?.toLowerCase().includes(q)
      );
    });
  }, [conversations, search, user?._id]);

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: isMobile ? 12 : 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
    },
    avatarWrap: { marginRight: 12 },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    avatarPlaceholder: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: colors.surfaceSecondary, justifyContent: 'center', alignItems: 'center',
    },
    avatarInitial: { fontSize: isMobile ? 17 : 20, fontWeight: '700', color: colors.muted },
    rowContent: { flex: 1 },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontSize: isMobile ? 13 : 14, color: colors.text, flex: 1, marginRight: 8, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' },
    nameBold: { fontWeight: '700', color: colors.text },
    time: { fontSize: 12, color: colors.muted },
    productLabel: { fontSize: 10, color: colors.muted, marginTop: 1, textTransform: 'uppercase', letterSpacing: 1 },
    rowBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
    lastMsg: { fontSize: isMobile ? 12 : 13, color: colors.muted, flex: 1 },
    lastMsgBold: { fontWeight: '600', color: colors.text },
    badge: {
      backgroundColor: colors.success, borderRadius: 10,
      minWidth: 20, paddingHorizontal: 5, paddingVertical: 2,
      justifyContent: 'center', alignItems: 'center', marginLeft: 8,
    },
    badgeText: { color: colors.successContent, fontSize: 11, fontWeight: '700' },
    separator: { height: 1, backgroundColor: colors.border, marginLeft: 76 },
    searchWrap: {
      paddingHorizontal: isMobile ? 12 : 16, paddingVertical: 10,
      backgroundColor: colors.surface,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    searchInput: {
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 14, paddingVertical: 10,
      fontSize: isMobile ? 12 : 13, color: colors.text, fontWeight: '600',
    },
    emptyWrap: { padding: 40, alignItems: 'center' },
    emptyText: { fontSize: isMobile ? 14 : 16, fontWeight: '600', color: colors.text },
    emptySubtext: { marginTop: 8, fontSize: isMobile ? 12 : 13, color: colors.muted, textAlign: 'center' },
  }), [colors]);

  const fetchConversations = useCallback(async (withLoader = true) => {
    if (withLoader) setLoading(true);
    try {
      const res = await chatService.getUserConversations();
      if (res.success) setConversations(res.data.conversations);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchConversations(false);
    }, [fetchConversations])
  );

  useEffect(() => {
    fetchConversations(true);
  }, []);

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participants.find((p) => p._id !== user?._id) ?? conv.participants[0];
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const other = getOtherParticipant(item);
    const hasUnread = (item.unreadCount ?? 0) > 0;

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: item._id,
            otherUser: other,
            productTitle: item.product?.title,
          })
        }
      >
        <View style={styles.avatarWrap}>
          {other.avatar ? (
            <Image source={{ uri: other.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{other.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={[styles.name, hasUnread && styles.nameBold]} numberOfLines={1}>
              {other.name}
            </Text>
            <Text style={styles.time}>
              {item.lastMessage ? formatTime(item.lastMessage.createdAt) : ''}
            </Text>
          </View>
          {item.product && (
            <Text style={styles.productLabel} numberOfLines={1}>
              Product: {item.product.title}
            </Text>
          )}
          <View style={styles.rowBottom}>
            <Text
              style={[styles.lastMsg, hasUnread && styles.lastMsgBold]}
              numberOfLines={1}
            >
              {item.lastMessage?.content ?? 'No messages yet'}
            </Text>
            {hasUnread && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader eyebrow="Inbox" title="Messages" subtitle="Offers, negotiations, and deal chats." />

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchConversations(false);
              }}
            />
          }
          ListEmptyComponent={<EmptyState title="No messages yet" subtitle="Start a conversation from any product listing." />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
};

export default ConversationListScreen;
