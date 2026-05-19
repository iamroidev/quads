import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import chatService, { Message } from '../services/chat.service';
import verificationService from '../services/verification.service';
import { useAuth } from '../context/AuthContext';
import { useColors } from '../theme/ThemeContext';

const API_BASE = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:5000';

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ChatScreen = ({ route, navigation }: any) => {
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const { conversationId, otherUser, productTitle } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [showOfferPanel, setShowOfferPanel] = useState(false);
  const [quickReplyMode, setQuickReplyMode] = useState(false);
  const [counterAmounts, setCounterAmounts] = useState<Record<string, string>>({});
  const [respondingOffer, setRespondingOffer] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);
  const insets = useSafeAreaInsets();

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    productBanner: {
      backgroundColor: colors.surfaceSecondary, paddingHorizontal: isMobile ? 12 : 16, paddingVertical: 8,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    productBannerText: { fontSize: 11, color: colors.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.1 },
    messagesList: { paddingHorizontal: 12, paddingVertical: 16, gap: 6 },
    systemMsg: { alignItems: 'center', marginVertical: 8 },
    systemMsgText: { fontSize: 11, color: colors.muted, backgroundColor: colors.surfaceSecondary, paddingHorizontal: 10, paddingVertical: 4, fontStyle: 'italic' },

    bubbleWrap: { marginBottom: 4 },
    bubbleWrapMe: { alignItems: 'flex-end' },
    bubbleWrapThem: { alignItems: 'flex-start' },
    bubble: { maxWidth: '80%', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 0 },
    bubbleMe: { backgroundColor: colors.text, borderBottomRightRadius: 2 },
    bubbleThem: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 2 },
    bubbleText: { fontSize: isMobile ? 13 : 14, lineHeight: 20 },
    bubbleTextMe: { color: colors.bg },
    bubbleTextThem: { color: colors.text },
    bubbleTime: { fontSize: 10, marginTop: 4 },
    bubbleTimeMe: { color: colors.textDisabled, textAlign: 'right' },
    bubbleTimeThem: { color: colors.muted, textAlign: 'left' },
    quickTag: { fontSize: 9, marginTop: 4, color: colors.textDisabled, textTransform: 'uppercase', letterSpacing: 1 },
    quickTagMe: { color: colors.textDisabled },

    // Offer block
    offerBlock: { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, gap: 8 },
    offerBlockMe: { borderTopColor: colors.border },
    offerAmountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    offerAmount: { fontSize: isMobile ? 13 : 15, fontWeight: '900', color: colors.bg },
    offerAmountMe: { color: colors.bg },
    offerBadge: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, paddingVertical: 2 },
    offerBadgeAccepted: { borderColor: colors.accent, backgroundColor: colors.successTint },
    offerBadgeRejected: { borderColor: colors.danger, backgroundColor: colors.dangerTint },
    offerBadgeCountered: { borderColor: colors.primary, backgroundColor: colors.metric1Bg },
    offerBadgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.text },

    offerActions: { gap: 6 },
    offerBtnsRow: { flexDirection: 'row', gap: 6 },
    offerActionBtn: { flex: 1, borderWidth: 1, paddingVertical: 8, alignItems: 'center' },
    offerAcceptBtn: { borderColor: colors.accent, backgroundColor: colors.successTint },
    offerDeclineBtn: { borderColor: colors.danger, backgroundColor: colors.dangerTint },
    offerActionBtnText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.text },
    offerCounterRow: { flexDirection: 'row', gap: 6 },
    offerCounterInput: {
      flex: 1, borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.surfaceSecondary, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, borderRadius: 0,
      color: colors.text,
    },
    offerCounterBtn: {
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
      justifyContent: 'center', paddingHorizontal: 12,
    },

    // Input area
    inputRow: {
      paddingHorizontal: 12, paddingVertical: 8, paddingBottom: 8,
      backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
      gap: 8,
    },
    quickReplyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    quickChip: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: colors.surfaceSecondary },
    quickChipText: { fontSize: 10, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },

    offerPanel: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, padding: 10, gap: 8 },
    offerPanelLabel: { fontSize: 10, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1.2 },
    offerPanelRow: { flexDirection: 'row', gap: 8 },
    offerPanelInput: { flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, paddingHorizontal: 10, paddingVertical: 8, fontSize: isMobile ? 13 : 14, fontWeight: '700', borderRadius: 0, color: colors.text },
    offerSendBtn: { backgroundColor: colors.text, justifyContent: 'center', paddingHorizontal: 14 },
    offerSendBtnText: { color: colors.bg, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

    toolRow: { flexDirection: 'row', gap: 8 },
    toolBtn: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, paddingHorizontal: 12, paddingVertical: 8 },
    toolBtnActive: { backgroundColor: colors.text, borderColor: colors.text },
    toolBtnText: { fontSize: 10, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
    toolBtnTextActive: { color: colors.bg },

    messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    input: {
      flex: 1, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border,
      borderRadius: 0, paddingHorizontal: 14, paddingVertical: 10,
      fontSize: isMobile ? 13 : 14, maxHeight: 100, color: colors.text,
    },
    sendBtn: { backgroundColor: colors.text, borderRadius: 0, paddingHorizontal: 18, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },
    sendBtnDisabled: { backgroundColor: colors.textDisabled },
    sendBtnText: { color: colors.bg, fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
    emptyText: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  }), [colors]);

  const scrollToEnd = () => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await chatService.getMessages(conversationId);
      if (res.success) {
        setMessages(res.data.messages);
        chatService.markAsRead(conversationId).catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Socket.io real-time connection
  useEffect(() => {
    let socket: Socket;
    SecureStore.getItemAsync('token').then((token) => {
      socket = io(API_BASE, {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 5,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('conversation:join', conversationId);
      });

      socket.on('message:new', (message: Message) => {
        if (message.conversation === conversationId) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === message._id)) return prev;
            return [...prev, message];
          });
          scrollToEnd();
          chatService.markAsRead(conversationId).catch(() => {});
        }
      });

      socket.on('message:read', ({ userId }: { conversationId: string; userId: string }) => {
        setMessages((prev) =>
          prev.map((m) =>
            !m.isRead && m.sender._id !== userId ? { ...m, isRead: true } : m
          )
        );
      });
    });

    return () => {
      socketRef.current?.emit('conversation:leave', conversationId);
      socketRef.current?.disconnect();
    };
  }, [conversationId]);

  useEffect(() => {
    navigation.setOptions({
      title: otherUser?.name ?? 'Chat',
      headerShown: true,
      headerBackTitle: 'Back',
    });
    fetchMessages();
  }, [fetchMessages, navigation, otherUser]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      const res = await chatService.sendMessage(conversationId, trimmed);
      if (res.success) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data.message._id)) return prev;
          return [...prev, res.data.message];
        });
        scrollToEnd();
      }
    } finally {
      setSending(false);
    }
  };

  const sendQuickReply = async (label: string) => {
    if (sending) return;
    setSending(true);
    try {
      const res = await chatService.sendMessage(conversationId, label, 'text', { quickReplyLabel: label });
      if (res.success) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data.message._id)) return prev;
          return [...prev, res.data.message];
        });
        scrollToEnd();
      }
    } finally { setSending(false); setQuickReplyMode(false); }
  };

  const sendOffer = async () => {
    const amount = Number(offerAmount);
    if (!Number.isFinite(amount) || amount <= 0 || sending) return;
    setSending(true);
    try {
      const res = await chatService.sendMessage(
        conversationId,
        `Offer: GHS ${amount.toFixed(2)}`,
        'text',
        { offer: { amount, status: 'pending' } }
      );
      if (res.success) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data.message._id)) return prev;
          return [...prev, res.data.message];
        });
        scrollToEnd();
      }
      setOfferAmount('');
      setShowOfferPanel(false);
    } finally { setSending(false); }
  };

  const handleRespondToOffer = async (msgId: string, status: 'accepted' | 'rejected' | 'countered') => {
    if (respondingOffer) return;
    const counterAmount = status === 'countered' ? Number(counterAmounts[msgId] || 0) : undefined;
    if (status === 'countered' && (!counterAmount || counterAmount <= 0)) {
      return;
    }
    setRespondingOffer(msgId);
    try {
      await verificationService.respondToOffer(conversationId, msgId, status, counterAmount);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === msgId && m.offer ? { ...m, offer: { ...m.offer, status } } : m
        )
      );
      setCounterAmounts((prev) => { const n = { ...prev }; delete n[msgId]; return n; });
      if (status === 'countered') await fetchMessages();
    } finally {
      setRespondingOffer(null);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender._id === user?._id;
    const isSystem = item.type === 'system';

    if (isSystem) {
      return (
        <View style={styles.systemMsg}>
          <Text style={styles.systemMsgText}>{item.content}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.bubbleWrap, isMe ? styles.bubbleWrapMe : styles.bubbleWrapThem]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
            {item.content}
          </Text>

          {/* Offer section */}
          {item.offer && (
            <View style={[styles.offerBlock, isMe && styles.offerBlockMe]}>
              <View style={styles.offerAmountRow}>
                <Text style={[styles.offerAmount, isMe && styles.offerAmountMe]}>
                  GHS {item.offer.amount.toFixed(2)}
                </Text>
                <View style={[
                  styles.offerBadge,
                  item.offer.status === 'accepted' && styles.offerBadgeAccepted,
                  item.offer.status === 'rejected' && styles.offerBadgeRejected,
                  item.offer.status === 'countered' && styles.offerBadgeCountered,
                ]}>
                  <Text style={styles.offerBadgeText}>{item.offer.status}</Text>
                </View>
              </View>

              {/* Accept/Decline/Counter — only for recipient, only when pending */}
              {!isMe && item.offer.status === 'pending' && (
                <View style={styles.offerActions}>
                  <View style={styles.offerBtnsRow}>
                    <TouchableOpacity
                      style={[styles.offerActionBtn, styles.offerAcceptBtn]}
                      onPress={() => handleRespondToOffer(item._id, 'accepted')}
                      disabled={!!respondingOffer}
                    >
                      <Text style={styles.offerActionBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.offerActionBtn, styles.offerDeclineBtn]}
                      onPress={() => handleRespondToOffer(item._id, 'rejected')}
                      disabled={!!respondingOffer}
                    >
                      <Text style={styles.offerActionBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.offerCounterRow}>
                    <TextInput
                      style={styles.offerCounterInput}
                      placeholder="Counter (GHS)"
                      placeholderTextColor={colors.muted}
                      keyboardType="numeric"
                      value={counterAmounts[item._id] || ''}
                      onChangeText={(v) => setCounterAmounts((prev) => ({ ...prev, [item._id]: v }))}
                    />
                    <TouchableOpacity
                      style={styles.offerCounterBtn}
                      onPress={() => handleRespondToOffer(item._id, 'countered')}
                      disabled={!!respondingOffer}
                    >
                      <Text style={styles.offerActionBtnText}>Counter</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Quick reply tag */}
          {item.quickReplyLabel && (
            <Text style={[styles.quickTag, isMe && styles.quickTagMe]}>Quick reply</Text>
          )}

          <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeThem]}>
            {formatTime(item.createdAt)}
            {''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {productTitle && (
        <View style={styles.productBanner}>
          <Text style={styles.productBannerText} numberOfLines={1}>Re: {productTitle}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onLayout={scrollToEnd}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Send a message to start the conversation.</Text>
          }
        />
      )}

      <View style={styles.inputRow}>
        {/* Quick reply chips */}
        {quickReplyMode && (
          <View style={styles.quickReplyRow}>
            {['Is this still available?', 'Can we meet on campus?', 'What is your best price?'].map((q) => (
              <TouchableOpacity key={q} style={styles.quickChip} onPress={() => sendQuickReply(q)}>
                <Text style={styles.quickChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Offer panel */}
        {showOfferPanel && (
          <View style={styles.offerPanel}>
            <Text style={styles.offerPanelLabel}>Offer amount (GHS)</Text>
            <View style={styles.offerPanelRow}>
              <TextInput
                style={styles.offerPanelInput}
                placeholder="e.g. 80.00"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                value={offerAmount}
                onChangeText={setOfferAmount}
              />
              <TouchableOpacity
                style={[styles.offerSendBtn, (!offerAmount || Number(offerAmount) <= 0) && { opacity: 0.4 }]}
                onPress={sendOffer}
                disabled={!offerAmount || Number(offerAmount) <= 0}
              >
                <Text style={styles.offerSendBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Toolbar row */}
        <View style={styles.toolRow}>
          <TouchableOpacity style={[styles.toolBtn, showOfferPanel && styles.toolBtnActive]} onPress={() => { setShowOfferPanel((v) => !v); setQuickReplyMode(false); }}>
            <Text style={[styles.toolBtnText, showOfferPanel && styles.toolBtnTextActive]}>GHS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toolBtn, quickReplyMode && styles.toolBtnActive]} onPress={() => { setQuickReplyMode((v) => !v); setShowOfferPanel(false); }}>
            <Text style={[styles.toolBtnText, quickReplyMode && styles.toolBtnTextActive]}>Quick</Text>
          </TouchableOpacity>
        </View>

        {/* Message row */}
        <View style={styles.messageRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            multiline
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? <ActivityIndicator size="small" color={colors.bg} /> : <Text style={styles.sendBtnText}>Send</Text>}
          </TouchableOpacity>
        </View>
        <View style={{ height: Math.max(insets.bottom - 8, 0) }} />
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
