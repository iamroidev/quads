import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import notificationService, { Notification } from '../services/notification.service';
import { colors, shadows } from '../theme';

const TYPE_ICONS: Record<string, string> = {
  order_placed: '🛒',
  order_paid: '💳',
  order_confirmed: '✅',
  order_ready: '📦',
  order_completed: '🎉',
  order_cancelled: '❌',
  new_message: '💬',
  new_review: '⭐',
  review_reply: '💬',
  product_sold: '🏷️',
  system: '🔔',
};

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (withLoader = true) => {
    if (withLoader) setLoading(true);
    try {
      const res = await notificationService.getNotifications({ limit: 50 });
      if (res.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.unreadCount);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAll = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleMarkOne = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.row, 
        !item.isRead && styles.rowUnread,
        { borderLeftColor: !item.isRead ? '#fbbf24' : '#1f1a14', borderLeftWidth: 5 }
      ]}
      onPress={() => !item.isRead && handleMarkOne(item._id)}
      activeOpacity={0.8}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{TYPE_ICONS[item.type] ?? '🔔'}</Text>
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 ? (
            <Text style={styles.unreadLabel}>{unreadCount} unread update{unreadCount > 1 ? 's' : ''}</Text>
          ) : (
            <Text style={styles.unreadLabel}>All caught up</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAll}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1f1a14" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchNotifications(false);
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>You're all caught up.</Text>
              <Text style={styles.emptySubtext}>No notifications yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: '#1f1a14',
    backgroundColor: '#efe5d6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1f1a14', textTransform: 'uppercase', letterSpacing: 0.5 },
  unreadLabel: { fontSize: 11, color: '#7b6f61', marginTop: 2, fontWeight: '700', textTransform: 'uppercase' },
  markAllBtn: { 
    backgroundColor: '#fbbf24', 
    borderWidth: 1.5, 
    borderColor: '#1f1a14', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    ...Platform.select({
      ios: {
        shadowColor: '#1f1a14',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  markAllText: { fontSize: 10, color: '#1f1a14', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: {
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderWidth: 2,
    borderColor: '#1f1a14',
    backgroundColor: '#fff',
    marginBottom: 10,
    ...shadows.bulletin,
  },
  rowUnread: { backgroundColor: '#fff8eb' },
  iconWrap: {
    width: 38,
    height: 38,
    borderWidth: 1.5,
    borderColor: '#1f1a14',
    backgroundColor: '#efe5d6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  icon: { fontSize: 16 },
  rowContent: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 13, color: '#374151', flex: 1, marginRight: 8, textTransform: 'uppercase', fontWeight: '700' },
  titleUnread: { fontWeight: '900', color: '#1f1a14' },
  time: { fontSize: 10, color: '#7b6f61', fontWeight: '800' },
  message: { marginTop: 4, fontSize: 12, color: '#4b5563', lineHeight: 16 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#1f1a14',
    marginLeft: 8,
    marginTop: 6,
    flexShrink: 0,
  },
  emptyWrap: { 
    padding: 40, 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1f1a14',
    backgroundColor: '#fff',
    marginTop: 20,
    ...shadows.bulletin,
  },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyText: { fontSize: 14, fontWeight: '900', color: '#1f1a14', textTransform: 'uppercase' },
  emptySubtext: { marginTop: 4, fontSize: 11, color: '#7b6f61', textTransform: 'uppercase', fontWeight: '600' },
});

export default NotificationsScreen;
