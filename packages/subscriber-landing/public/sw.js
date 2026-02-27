/**
 * Push Capture Service Worker - Enhanced
 * Handles push notifications, analytics queue, offline support, and comprehensive tracking
 */

const CACHE_NAME = 'push-capture-v2';
const ANALYTICS_QUEUE_DB_NAME = 'PushCaptureAnalytics';
const ANALYTICS_QUEUE_DB_VERSION = 2;
const ANALYTICS_QUEUE_STORE = 'events';
const _MAX_QUEUE_SIZE = 500;

let analyticsDB = null;

// ==================== IndexedDB for Analytics Queue ====================

/**
 * Open IndexedDB for analytics queue
 */
function openAnalyticsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ANALYTICS_QUEUE_DB_NAME, ANALYTICS_QUEUE_DB_VERSION);

    request.onerror = () => {
      console.error('[SW] Failed to open analytics DB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      analyticsDB = request.result;
      resolve(analyticsDB);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(ANALYTICS_QUEUE_STORE)) {
        const store = db.createObjectStore(ANALYTICS_QUEUE_STORE, { autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('eventType', 'eventType', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('priority', 'priority', { unique: false });
      }
    };
  });
}

/**
 * Add event to analytics queue with priority
 */
async function addToAnalyticsQueue(event, priority = 'normal') {
  try {
    if (!analyticsDB) await openAnalyticsDB();

    return new Promise((resolve, reject) => {
      const tx = analyticsDB.transaction(ANALYTICS_QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(ANALYTICS_QUEUE_STORE);

      const record = {
        ...event,
        timestamp: Date.now(),
        synced: false,
        priority: priority === 'high' ? 1 : priority === 'low' ? 3 : 2,
      };

      const request = store.add(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[SW] Failed to add to analytics queue:', error);
  }
}

/**
 * Get all events from analytics queue
 */
async function getAnalyticsQueue() {
  try {
    if (!analyticsDB) await openAnalyticsDB();

    return new Promise((resolve, reject) => {
      const tx = analyticsDB.transaction(ANALYTICS_QUEUE_STORE, 'readonly');
      const store = tx.objectStore(ANALYTICS_QUEUE_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[SW] Failed to get analytics queue:', error);
    return [];
  }
}

/**
 * Clear analytics queue after successful sync
 */
async function clearAnalyticsQueue(eventIds = []) {
  try {
    if (!analyticsDB) await openAnalyticsDB();

    return new Promise((resolve, reject) => {
      const tx = analyticsDB.transaction(ANALYTICS_QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(ANALYTICS_QUEUE_STORE);

      if (eventIds.length > 0) {
        // Delete specific events
        eventIds.forEach((id) => {
          store.delete(id);
        });
      } else {
        // Clear all
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }
    });
  } catch (error) {
    console.error('[SW] Failed to clear analytics queue:', error);
  }
}

/**
 * Flush analytics queue to server
 */
async function flushAnalyticsQueue() {
  try {
    const events = await getAnalyticsQueue();

    if (events.length === 0) return { success: true, count: 0 };

    // Separate by event type for targeted endpoints
    const batched = {};
    for (const event of events) {
      const type = event.eventType || 'unknown';
      if (!batched[type]) batched[type] = [];
      batched[type].push(event);
    }

    let totalSent = 0;

    // Send to batch endpoint as primary
    const response = await fetch('/api/analytics/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: events.map((e) => ({
          ...e,
          synced: undefined,
          __rowid__: undefined,
        })),
        swTimestamp: Date.now(),
      }),
      keepalive: true, // Ensure it sends even if page is closing
    });

    if (response.ok) {
      const result = await response.json();
      totalSent = events.length;
      const syncedIds = result.syncedIds || [];
      await clearAnalyticsQueue(syncedIds);
      console.log(`[SW] Flushed ${totalSent} analytics events`);
      return { success: true, count: totalSent };
    } else {
      console.error('[SW] Failed to flush analytics:', response.status);
      return { success: false, count: 0, error: response.status };
    }
  } catch (error) {
    console.error('[SW] Error flushing analytics queue:', error);
    return { success: false, count: 0, error: error.message };
  }
}

// ==================== Service Worker Event Handlers ====================

/**
 * Handle push subscription change event
 */
self.addEventListener('pushsubscriptionchange', async (event) => {
  console.log('[SW] Subscription changed');

  const oldSubscription = event.oldSubscription;
  const newSubscription = event.newSubscription;

  try {
    await addToAnalyticsQueue(
      {
        eventType: 'subscription_change',
        hadOld: !!oldSubscription,
        hasNew: !!newSubscription,
        oldEndpoint: oldSubscription?.endpoint,
        newEndpoint: newSubscription?.endpoint,
      },
      'high'
    );

    const payload = {
      oldEndpoint: oldSubscription?.endpoint,
      newEndpoint: newSubscription?.endpoint,
      keys: newSubscription?.toJSON()?.keys,
    };

    await fetch('/api/subscriptions/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Flush immediately for subscription changes
    event.waitUntil(flushAnalyticsQueue());
  } catch (error) {
    console.error('[SW] Failed to handle subscription change:', error);
  }
});

/**
 * Handle push event - display notification
 */
self.addEventListener('push', async (event) => {
  console.log('[SW] Push received');

  let data;
  try {
    data = event.data?.json();
  } catch {
    data = { title: 'New Notification', body: '' };
  }

  const startTime = Date.now();

  await addToAnalyticsQueue(
    {
      eventType: 'push_received',
      hasActions: !!data?.actions?.length,
      hasImage: !!data?.image,
      hasData: !!data?.data,
      title: data?.title,
      deliveryId: data?.deliveryId,
    },
    'high'
  );

  let notificationShown = false;
  let error = null;

  try {
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      image: data.image,
      badge: data.badge || '/badge-72.png',
      vibrate: data.vibrate,
      tag: data.tag,
      renotify: data.renotify,
      requireInteraction: data.requireInteraction,
      silent: data.silent,
      data: {
        ...data.data,
        receivedAt: startTime,
        deliveryId: data.deliveryId,
        url: data.url || data.data?.url || '/',
      },
      timestamp: data.timestamp || Date.now(),
      actions: (data.actions || []).map((action) => ({
        action: action.action,
        title: action.title,
        icon: action.icon,
        placeholder: action.placeholder,
      })),
    };

    await self.registration.showNotification(data.title || 'Notification', options);
    notificationShown = true;

    console.log('[SW] Notification shown:', data.title);
  } catch (err) {
    error = err.message;
    console.error('[SW] Failed to show notification:', err);
  }

  await addToAnalyticsQueue(
    {
      eventType: notificationShown ? 'notification_shown' : 'notification_failed',
      titleLength: data.title?.length || 0,
      bodyLength: data.body?.length || 0,
      hasImage: !!data.image,
      hasActions: !!data?.actions?.length,
      error,
      duration: Date.now() - startTime,
      deliveryId: data?.deliveryId,
    },
    'high'
  );

  // Flush queue periodically (10% chance)
  if (Math.random() < 0.1) {
    event.waitUntil(flushAnalyticsQueue());
  }
});

/**
 * Handle notification click
 */
self.addEventListener('notificationclick', async (event) => {
  console.log('[SW] Notification clicked:', event.action);

  const notification = event.notification;
  const data = notification.data || {};
  const startTime = Date.now();

  notification.close();

  await addToAnalyticsQueue(
    {
      eventType: 'notification_clicked',
      action: event.action,
      url: data.url,
      deliveryId: data.deliveryId,
      timeSinceReceived: startTime - (data.receivedAt || startTime),
      actionButton: event.action || 'default',
    },
    'high'
  );

  const url = data.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window with same URL
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          const targetUrl = new URL(url, self.location.origin);

          if (clientUrl.pathname === targetUrl.pathname && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
      .then(() => flushAnalyticsQueue())
  );
});

/**
 * Handle notification close (dismissed)
 */
self.addEventListener('notificationclose', async (event) => {
  console.log('[SW] Notification dismissed');

  const data = event.notification.data || {};

  await addToAnalyticsQueue({
    eventType: 'notification_dismissed',
    deliveryId: data.deliveryId,
    timeSinceReceived: Date.now() - (data.receivedAt || Date.now()),
  });
});

/**
 * Handle messages from main thread
 */
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  console.log('[SW] Message received:', type);

  switch (type) {
    case 'FLUSH_ANALYTICS':
      await flushAnalyticsQueue();
      break;

    case 'TRACK_EVENT':
      await addToAnalyticsQueue(data);
      break;

    case 'GET_QUEUE_SIZE': {
      const events = await getAnalyticsQueue();
      event.ports[0]?.postMessage({ size: events.length });
      break;
    }

    case 'SW_CONTROLLER_MESSAGE':
      // Messages from SW Controller or devtools
      console.log('[SW] Controller message:', data);
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/**
 * Handle background sync
 */
self.addEventListener('sync', async (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'analytics-sync') {
    event.waitUntil(flushAnalyticsQueue());
  }

  if (event.tag === 'sync-analytics') {
    event.waitUntil(flushAnalyticsQueue());
  }

  if (event.tag === 'background-sync') {
    event.waitUntil(flushAnalyticsQueue());
  }
});

/**
 * Handle install event
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/icon-192.png',
        '/badge-72.png',
        '/icon-512.png',
      ]);
    })
  );

  self.skipWaiting();
});

/**
 * Handle activate event
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  event.waitUntil(clients.claim());

  // Start periodic queue flush
  setInterval(() => {
    flushAnalyticsQueue().catch(console.error);
  }, 30000); // Every 30 seconds
});

/**
 * Handle fetch events (network-first with cache fallback for offline support)
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip API requests - let them pass through
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        // Return from cache
        return response;
      }

      // Network fetch
      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return offline fallback for HTML pages
          if (request.mode === 'navigate') {
            return (
              caches.match('/') ||
              new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({ 'Content-Type': 'text/plain' }),
              })
            );
          }
          return new Response('Network error', { status: 408, statusText: 'Request Timeout' });
        });
    })
  );
});

/**
 * Detect platform
 */
function getPlatform() {
  const userAgent = navigator.userAgent || '';

  if (/iPhone|iPad|iPod/.test(userAgent)) return 'ios';
  if (/Android/.test(userAgent)) return 'android';
  return 'desktop';
}

/**
 * Track SW lifecycle events
 */
self.addEventListener('install', () => {
  addToAnalyticsQueue({
    eventType: 'sw_lifecycle',
    phase: 'install',
    platform: getPlatform(),
  });
});

self.addEventListener('activate', () => {
  addToAnalyticsQueue({
    eventType: 'sw_lifecycle',
    phase: 'activate',
    platform: getPlatform(),
  });
});

// Track SW errors
self.addEventListener('error', (event) => {
  addToAnalyticsQueue({
    eventType: 'sw_error',
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error?.toString(),
  });
});

// Periodic health check
setInterval(() => {
  addToAnalyticsQueue({
    eventType: 'sw_heartbeat',
    timestamp: Date.now(),
  });
}, 60000); // Every minute

console.log('[SW] Service Worker loaded');

// Export functions for testing
self.flushAnalytics = flushAnalyticsQueue;
self.getQueueSize = getAnalyticsQueue;
