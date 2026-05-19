// QUADS Push Notification Service Worker
// Handles push events and notification clicks with deep-link navigation

self.addEventListener('push', function (event) {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'QUADS', body: event.data.text() };
  }

  const title = data.title || 'QUADS';
  const body = data.body || data.message || 'You have a new notification';

  // Derive target URL from deep-link data
  let targetUrl = data.url || data.data?.url || '/notifications';
  if (data.data?.conversationId || data.conversationId) {
    targetUrl = `/messages/${data.data?.conversationId || data.conversationId}`;
  } else if (data.data?.orderId || data.orderId) {
    targetUrl = `/orders/${data.data?.orderId || data.orderId}`;
  } else if (data.data?.productId || data.productId) {
    targetUrl = `/products/${data.data?.productId || data.productId}`;
  }

  const options = {
    body,
    icon: '/pwa-192x192.png',  // QUADS logo
    badge: '/favicon.ico',     // small badge icon in notification bar
    image: data.image || undefined,
    tag: data.tag || data.type || 'quads-notification', // groups same-type notifications
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    silent: data.type === 'promotion', // promotions are silent
    vibrate: data.type === 'promotion' ? [100] : [200, 100, 200],
    data: {
      url: targetUrl,
      type: data.type,
      // preserve all deep-link ids
      conversationId: data.data?.conversationId || data.conversationId,
      orderId: data.data?.orderId || data.orderId,
      productId: data.data?.productId || data.productId,
    },
    actions: buildActions(data.type),
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

function buildActions(type) {
  if (type === 'new_message') {
    return [
      { action: 'reply', title: 'Open Chat' },
      { action: 'dismiss', title: 'Dismiss' },
    ];
  }
  if (type && type.startsWith('order_')) {
    return [
      { action: 'view', title: 'View Order' },
      { action: 'dismiss', title: 'Dismiss' },
    ];
  }
  return [];
}

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const data = event.notification.data || {};
  const url = data.url || '/notifications';

  // Handle action button clicks
  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if already open
      const existingClient = windowClients.find(
        (client) => client.url.includes(self.location.origin)
      );
      if (existingClient && 'focus' in existingClient) {
        existingClient.focus();
        // Post message so the React app can navigate to the correct route
        existingClient.postMessage({
          type: 'NOTIFICATION_CLICK',
          url,
          notificationData: data,
        });
        return;
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('notificationclose', function (event) {
  // Optional: track dismissals for analytics
});
