/**
 * Service Worker Registration Utility
 * Handles service worker registration and periodic sync
 */

export interface SWRegistrationOptions {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(
  options: SWRegistrationOptions = {}
): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service workers are not supported');
    return null;
  }

  const { onSuccess, onError, onUpdate } = options;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[SW] Service worker registered successfully');

    // Check for updates
    if (registration.waiting) {
      // New version available, waiting to activate
      onUpdate?.(registration);
    } else if (registration.installing) {
      // New version installing
      registration.installing.addEventListener('statechange', () => {
        if (registration.waiting) {
          onUpdate?.(registration);
        }
      });
    } else {
      // No update available
      onSuccess?.(registration);
    }

    // Listen for new updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            onUpdate?.(registration);
          }
        });
      }
    });

    // Request periodic sync if available
    if ('periodicSync' in registration && 'permissions' in navigator) {
      try {
        const status = await navigator.permissions.query({
          name: 'periodic-background-sync' as PermissionName,
        });

        if (status.state === 'granted') {
          const regWithPeriodicSync = registration as ServiceWorkerRegistration & {
            periodicSync: { register: (tag: string, options: { minInterval: number }) => Promise<void> };
          };
          await regWithPeriodicSync.periodicSync.register('analytics-sync', {
            minInterval: 24 * 60 * 60 * 1000, // Daily
          });
          console.log('[SW] Periodic sync registered');
        }
      } catch (err) {
        console.log('[SW] Periodic sync not available:', err);
      }
    }

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[SW] Message from service worker:', event.data);
    });

    return registration;
  } catch (error) {
    const err = error as Error;
    console.error('[SW] Service worker registration failed:', err);
    onError?.(err);
    return null;
  }
}

/**
 * Get current service worker registration
 */
export function getSWRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.getRegistration();
  }
  return Promise.resolve(undefined);
}

/**
 * Send message to service worker
 */
export async function sendToSW(type: string, data?: unknown): Promise<unknown> {
  const registration = await getSWRegistration();

  if (!registration || !registration.active) {
    console.warn('[SW] No active service worker');
    return null;
  }

  // Use message channel for response
  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    registration.active?.postMessage({ type, data }, [messageChannel.port2]);

    // Timeout after 5 seconds
    setTimeout(() => {
      reject(new Error('Service worker message timeout'));
    }, 5000);
  });
}

/**
 * Request analytics queue size from service worker
 */
export async function getAnalyticsQueueSize(): Promise<number> {
  try {
    const registration = await getSWRegistration();
    if (!registration) return 0;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        resolve((event.data as { size: number }).size || 0);
      };

      registration.active?.postMessage({ type: 'GET_QUEUE_SIZE' }, [messageChannel.port2]);
    });
  } catch {
    return 0;
  }
}

/**
 * Flush analytics queue in service worker
 */
export async function flushAnalyticsQueue(): Promise<boolean> {
  try {
    await sendToSW('FLUSH_ANALYTICS');
    return true;
  } catch {
    return false;
  }
}

/**
 * Track event via service worker
 */
export async function trackEvent(
  eventName: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  try {
    await sendToSW('TRACK_EVENT', { type: eventName, data });
    return true;
  } catch {
    return false;
  }
}

/**
 * Skip waiting and activate new service worker
 */
export async function skipWaiting(): Promise<void> {
  const registration = await getSWRegistration();

  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      await registration.unregister();
    }

    // Reload page to clear caches
    window.location.reload();
    return true;
  }
  return false;
}
