import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE = '/api';

interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  viewportWidth: number;
  viewportHeight: number;
  pixelRatio: number;
  networkType?: string;
  connectionDownlink?: number;
  connectionRtt?: number;
  saveData?: boolean;
  deviceMemory?: number;
  cpuCores?: number;
  batteryLevel?: number;
  isCharging?: boolean;
  timezone: string;
  timezoneOffset: number;
  supportsVibrate: boolean;
}

async function collectDeviceInfo(): Promise<DeviceInfo> {
  const connection = (navigator as any).connection;

  // Get battery info if available
  let batteryLevel: number | undefined;
  let isCharging: boolean | undefined;
  try {
    const battery = await (navigator as any).getBattery?.();
    if (battery) {
      batteryLevel = battery.level;
      isCharging = battery.charging;
    }
  } catch {
    // Battery API might not be available or permission denied
  }

  return {
    userAgent: navigator.userAgent,
    screenResolution: `${screen.width}x${screen.height}`,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio,
    networkType: connection?.effectiveType,
    connectionDownlink: connection?.downlink,
    connectionRtt: connection?.rtt,
    saveData: connection?.saveData,
    deviceMemory: (navigator as any).deviceMemory,
    cpuCores: navigator.hardwareConcurrency,
    batteryLevel,
    isCharging,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    supportsVibrate: 'vibrate' in navigator,
  };
}

export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const vapidKeyRef = useRef<string | null>(null);

  // Function to check current subscription status
  const checkSubscriptionStatus = useCallback(async (registration: ServiceWorkerRegistration) => {
    try {
      const subscription = await registration.pushManager.getSubscription();
      const subscribed = !!subscription;
      setIsSubscribed(subscribed);
      return subscribed;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (!supported) {
      setError('Push notifications are not supported in your browser');
      setIsLoading(false);
      return;
    }

    // Register service worker and get VAPID key
    const init = async () => {
      try {
        setIsLoading(true);

        // Get VAPID key from server
        const vapidRes = await fetch(`${API_BASE}/push/vapid-key`);
        if (vapidRes.ok) {
          const { vapidKey: key } = await vapidRes.json();
          vapidKeyRef.current = key;
        }

        // Get existing or register new service worker
        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          registration = await navigator.serviceWorker.register('/sw.js');
        }

        swRegistrationRef.current = registration;

        // Wait for SW to be ready
        await navigator.serviceWorker.ready;

        // Check existing subscription
        await checkSubscriptionStatus(registration);

        // Check permission
        const permission = Notification.permission;
        setIsPermissionDenied(permission === 'denied');

        // Clear any previous errors
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize push notifications');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [checkSubscriptionStatus]);

  const subscribe = useCallback(async () => {
    const registration = swRegistrationRef.current;
    const vapidKey = vapidKeyRef.current;

    if (!registration || !vapidKey) {
      setError('Service worker not ready. Please refresh the page.');
      return false;
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Permission denied. Please allow notifications in your browser settings.');
        setIsPermissionDenied(true);
        return false;
      }

      setIsPermissionDenied(false);

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Send subscription to server
      const { keys, endpoint } = subscription.toJSON();
      const response = await fetch(`${API_BASE}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          keys,
          userAgent: navigator.userAgent,
          metadata: { timestamp: new Date().toISOString() },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription on server');
      }

      const { subscription: newSubscription } = await response.json();
      setSubscriptionId(newSubscription.id);

      // After successful subscription, send device info
      try {
        const deviceInfo = await collectDeviceInfo();
        await fetch(`${API_BASE}/devices/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriptionId: newSubscription.id,
            ...deviceInfo,
          }),
        });
      } catch (deviceError) {
        console.warn('Failed to register device:', deviceError);
        // Don't fail subscription if device registration fails
      }

      setIsSubscribed(true);
      setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(errorMessage);
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    const registration = swRegistrationRef.current;

    if (!registration) {
      setError('Service worker not ready');
      return false;
    }

    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        setSubscriptionId(null);
        setError(null);
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
      return false;
    }
  }, []);

  // Function to manually refresh subscription status
  const refreshStatus = useCallback(async () => {
    const registration = swRegistrationRef.current;
    if (registration) {
      await checkSubscriptionStatus(registration);
    }
  }, [checkSubscriptionStatus]);

  return {
    isSupported,
    isSubscribed,
    isPermissionDenied,
    isLoading,
    subscribe,
    unsubscribe,
    refreshStatus,
    error,
    subscriptionId,
  };
}

// Helper to convert URL base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}
