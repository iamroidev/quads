import Constants from 'expo-constants';
import { navigationRef } from '../navigation/navigationRef';

const isExpoGo = Constants.appOwnership === 'expo';

let Notifications: any = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
  } catch (e) {
    console.warn('Failed to load expo-notifications:', e);
  }
}
if (!Notifications) {
  Notifications = { getLastNotificationResponseAsync: async () => null };
}

const getIdFromUrl = (url: string | undefined, resource: string): string | null => {
  if (!url) return null;
  const match = url.match(new RegExp(`/${resource}/([a-f0-9]{24})`, 'i'));
  return match?.[1] || null;
};

/**
 * Determines where to navigate based on notification payload data.
 *
 * Data fields (sent by server):
 *   conversationId / chatId  → opens Chat screen (message from seller/buyer/AI)
 *   orderId                  → opens OrderDetail
 *   productId                → opens ProductDetail
 *   type: 'promotion'        → opens HomeTab (broadcast promotions)
 *   type: 'system'           → opens Alerts
 *   (fallback)               → opens Alerts
 */
const routeFromData = (data: any): {
  type: 'product' | 'order' | 'chat' | 'home' | 'alerts';
  id?: string;
  extra?: any;
} => {
  const url = typeof data?.url === 'string' ? data.url : undefined;
  const notifType = data?.type as string | undefined;

  const conversationId = data?.conversationId || data?.chatId || getIdFromUrl(url, 'messages');
  if (conversationId) return { type: 'chat', id: conversationId, extra: data };

  const orderId = data?.orderId || getIdFromUrl(url, 'orders');
  if (orderId) return { type: 'order', id: orderId };

  const productId = data?.productId || getIdFromUrl(url, 'products');
  if (productId) return { type: 'product', id: productId };

  if (notifType === 'promotion') return { type: 'home' };

  return { type: 'alerts' };
};

export const openNotificationTarget = (response: any) => {
  const data = response?.notification?.request?.content?.data || {};
  const target = routeFromData(data);

  if (!navigationRef.isReady()) return;

  switch (target.type) {
    case 'chat':
      navigationRef.navigate('MessagesTab', {
        screen: 'Chat',
        params: {
          conversationId: target.id,
          otherUser: data?.otherUser || null,
          productTitle: data?.productTitle,
        },
      });
      break;
    case 'order':
      navigationRef.navigate('OrdersTab', {
        screen: 'OrderDetail',
        params: { orderId: target.id },
      });
      break;
    case 'product':
      navigationRef.navigate('ProductsTab', {
        screen: 'ProductDetail',
        params: { productId: target.id },
      });
      break;
    case 'home':
      navigationRef.navigate('HomeTab');
      break;
    case 'alerts':
    default:
      // 'Alerts' is the correct name for NotificationsScreen inside ProfileStack
      navigationRef.navigate('ProfileTab', { screen: 'Alerts' });
      break;
  }
};

export const handleInitialNotificationOpen = async () => {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return;

  let attempts = 0;
  const tryNavigate = () => {
    if (navigationRef.isReady()) {
      openNotificationTarget(response);
      return;
    }
    if (++attempts < 20) setTimeout(tryNavigate, 150);
  };
  tryNavigate();
};
