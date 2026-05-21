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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import notificationService, { Notification } from '../services/notification.service';
import { useColors } from '../theme/ThemeContext';

const TYPE_LABELS: Record<string, string> = {
  order_placed: 'ORD',
  order_paid: 'PAY',
  order_confirmed: 'CNF',
  order_ready: 'RDY',
  order_completed: 'DONE',
  order_cancelled: 'CXL',
  new_message: 'MSG',
  new_review: 'REV',
  review_reply: 'REP',
  product_sold: 'SOLD',
  system: 'SYS',
};

// Per-type accent color key (maps to token name suffix)
const TYPE_ACCENT: Record<string, 'success' | 'primary' | 'danger' | 'accent' | 'pinBlue'> = {
  order_placed: 'primary',
  order_paid: 'success',
  order_confirmed: 'success',
  order_ready: 'success',
  order_completed: 'success',
  order_cancelled: 'danger',
  new_message: 'pinBlue',
  new_review: 'accent',
  review_reply: 'accent',
  product_sold: 'primary',
  system: 'primary',
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
  const colors = useColors();
  const { width: _sw } = Dimensions.get('window');
  const isMobile = _sw < 640;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      paddingTop: 14,
      paddingBottom: 16,
      paddingHorizontal: isMobile ? 12 : 16,
      borderBottomWidth: 3,
      borderBottomColor: colors.boardBorder,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    headerTitle: { fontSize: isMobile ? 20 : 24, fontWeight: '900', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
    unreadLabel: { fontSize: 11, color: colors.muted, marginTop: 2, fontWeight: '700', textTransform: 'uppercase' },
    markAllBtn: {
      backgroundColor: colors.pinYellow,
      borderWidth: 1.5,
      borderColor: colors.boardBorder,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderBottomWidth: 2,
      borderRightWidth: 2,
    },
    markAllText: { fontSize: 10, color: colors.text, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: 12 },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 12,
      borderWidth: 2,
      borderColor: colors.boardBorder,
      backgroundColor: colors.surface,
      marginBottom: 10,
      borderBottomWidth: 3,
      borderRightWidth: 3,
    },
    rowUnread: { backgroundColor: colors.metric1Bg },
    iconWrap: {
      width: 38,
      height: 38,
      borderWidth: 1.5,
      borderColor: colors.boardBorder,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    icon: { fontSize: 16 },
    rowContent: { flex: 1 },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: isMobile ? 12 : 13, color: colors.textSecondary, flex: 1, marginRight: 8, textTransform: 'uppercase', fontWeight: '700' },
    titleUnread: { fontWeight: '900', color: colors.text },
    time: { fontSize: 10, color: colors.muted, fontWeight: '800' },
    message: { marginTop: 4, fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.danger,
      borderWidth: 1,
      borderColor: colors.boardBorder,
      marginLeft: 8,
      marginTop: 6,
      flexShrink: 0,
    },
    emptyWrap: {
      padding: 40,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.boardBorder,
      backgroundColor: colors.surface,
      marginTop: 20,
      borderBottomWidth: 3,
      borderRightWidth: 3,
    },
    emptyIcon: { fontSize: 44, marginBottom: 12 },
    emptyText: { fontSize: isMobile ? 13 : 14, fontWeight: '900', color: colors.text, textTransform: 'uppercase' },
    emptySubtext: { marginTop: 4, fontSize: 11, color: colors.muted, textTransform: 'uppercase', fontWeight: '600' },
  }), [colors]);

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

  const renderItem = ({ item }: { item: Notification }) => {
    const accentKey = TYPE_ACCENT[item.type] ?? 'primary';
    const accentColor = (colors as any)[accentKey] ?? colors.primary;
    const label = TYPE_LABELS[item.type] ?? 'SYS';

    return (
      <TouchableOpacity
        style={[
          styles.row,
          !item.isRead && styles.rowUnread,
          { borderLeftColor: accentColor, borderLeftWidth: 4 }
        ]}
        onPress={() => !item.isRead && handleMarkOne(item._id)}
        activeOpacity={0.8}
      >
        {/* Type badge — colored square with 3-letter code */}
        <View style={[styles.iconWrap, { backgroundColor: accentColor + '22', borderColor: accentColor }]}>
          <Text style={[styles.icon, { color: accentColor, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }]}>{label}</Text>
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
  };

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
          <ActivityIndicator size="large" color={colors.text} />
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
              
              <Text style={styles.emptyText}>You're all caught up.</Text>
              <Text style={styles.emptySubtext}>No notifications yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;
