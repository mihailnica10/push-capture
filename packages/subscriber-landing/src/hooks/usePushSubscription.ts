import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (!supported) {
      setError('Push notifications are not supported in your browser');
      return;
    }

    // Register service worker and get VAPID key
    const init = async () => {
      try {
        // Get VAPID key from server
        const vapidRes = await fetch(`${API_BASE}/push/vapid-key`);
        if (vapidRes.ok) {
          const { vapidKey: key } = await vapidRes.json();
          setVapidKey(key);
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        setSwRegistration(registration);

        // Check existing subscription
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);

        // Check permission
        const permission = await Notification.permission;
        setIsPermissionDenied(permission === 'denied');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize push notifications');
      }
    };

    init();
  }, []);

  const subscribe = useCallback(async () => {
    if (!swRegistration || !vapidKey) {
      setError('Service worker not ready');
      return false;
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Permission denied');
        setIsPermissionDenied(true);
        return false;
      }

      // Subscribe to push
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Send subscription to server
      const { keys, endpoint } = subscription.toJSON();
      await fetch(`${API_BASE}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          keys,
          userAgent: navigator.userAgent,
          metadata: { timestamp: new Date().toISOString() },
        }),
      });

      setIsSubscribed(true);
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
      return false;
    }
  }, [swRegistration, vapidKey]);

  const unsubscribe = useCallback(async () => {
    if (!swRegistration) {
      setError('Service worker not ready');
      return false;
    }

    try {
      const subscription = await swRegistration.pushManager.getSubscription();
      if (subscription) {
        // Delete from server (we'd need to store subscription ID for this)
        await subscription.unsubscribe();
        setIsSubscribed(false);
        setError(null);
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
      return false;
    }
  }, [swRegistration]);

  return {
    isSupported,
    isSubscribed,
    isPermissionDenied,
    subscribe,
    unsubscribe,
    error,
  };
}

// Helper to convert URL base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64String);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
