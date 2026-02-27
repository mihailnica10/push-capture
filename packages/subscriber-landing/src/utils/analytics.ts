/**
 * Comprehensive Analytics Tracking Library
 * Tracks user behavior, performance, errors, and device capabilities
 */

const API_BASE = '/api';

// Generate a unique session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate a device fingerprint (basic)
export function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const text = 'fingerprint';
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText(text, 2, 2);
  }

  const fingerprintData = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join('|');

  // Simple hash
  let hash = 0;
  for (let i = 0; i < fingerprintData.length; i++) {
    const char = fingerprintData.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16);
}

// Get device capabilities and features
export function getDeviceCapabilities() {
  // biome-ignore lint/suspicious/noExplicitAny: Experimental browser APIs not in TypeScript types
  const connection =
    (navigator as any).connection ||
    // biome-ignore lint/suspicious/noExplicitAny: Experimental browser APIs not in TypeScript types
    (navigator as any).mozConnection ||
    // biome-ignore lint/suspicious/noExplicitAny: Experimental browser APIs not in TypeScript types
    (navigator as any).webkitConnection;

  return {
    // Screen & Viewport
    screenResolution: `${screen.width}x${screen.height}`,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio?.toString() || '1',
    colorDepth: screen.colorDepth,
    screenOrientation: screen.orientation?.type || 'unknown',

    // Network
    networkType: connection?.effectiveType || 'unknown',
    connectionDownlink: connection?.downlink?.toString() || null,
    connectionRtt: connection?.rtt || null,
    saveData: connection?.saveData || false,

    // Device
    // biome-ignore lint/suspicious/noExplicitAny: Experimental browser API not in TypeScript types
    deviceMemory: (navigator as any).deviceMemory?.toString() || null,
    cpuCores: navigator.hardwareConcurrency || null,
    platform: navigator.platform,

    // Timezone & Locale
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    locale: navigator.language,
    languages: [...navigator.languages],

    // Feature detection
    supportsWebP: supportsWebP(),
    supportsAVIF: supportsAVIF(),
    supportsWebGL: supportsWebGL(),
    supportsWebGL2: supportsWebGL2(),
    supportsWebGPU: supportsWebGPU(),
    supportsWebRTC: supportsWebRTC(),
    supportsWebSockets: 'WebSocket' in window,
    supportsServiceWorker: 'serviceWorker' in navigator,
    supportsBackgroundSync: 'serviceWorker' in navigator && 'SyncManager' in window,
    supportsPeriodicSync: 'serviceWorker' in navigator && 'PeriodicSyncManager' in window,
    supportsNotifications: 'Notification' in window,
    supportsPushManager: 'PushManager' in window,
    supportsBluetooth: 'bluetooth' in navigator,
    supportsUSB: 'USB' in navigator,
    supportsSerial: 'Serial' in navigator,
    supportsHID: 'HID' in navigator,
    supportsSensorAPIs: 'Sensor' in window,
    supportsGeolocation: 'geolocation' in navigator,
    supportsMediaDevices: 'mediaDevices' in navigator,
  };
}

// Helper: Check WebP support
function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

// Helper: Check AVIF support
function supportsAVIF(): boolean {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
}

// Helper: Check WebGL support
function supportsWebGL(): boolean {
  const canvas = document.createElement('canvas');
  return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
}

// Helper: Check WebGL2 support
function supportsWebGL2(): boolean {
  const canvas = document.createElement('canvas');
  return !!canvas.getContext('webgl2');
}

// Helper: Check WebGPU support
function supportsWebGPU(): boolean {
  return 'GPU' in window;
}

// Helper: Check WebRTC support
function supportsWebRTC(): boolean {
  return 'RTCPeerConnection' in window;
}

// Get GPU info
export async function getGPUInfo(): Promise<{ vendor?: string; renderer?: string }> {
  const canvas = document.createElement('canvas');
  const gl =
    canvas.getContext('webgl') ||
    (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
  if (!gl) return {};

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (!debugInfo) return {};

  return {
    vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
    renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
  };
}

// Get storage estimate
export async function getStorageEstimate(): Promise<{
  usage?: number;
  quota?: number;
  // biome-ignore lint/suspicious/noExplicitAny: Storage API returns unknown shape
  usageDetails?: any;
  // biome-ignore lint/suspicious/noExplicitAny: Storage API returns unknown shape
  quotaManaged?: any;
}> {
  // biome-ignore lint/suspicious/noExplicitAny: Experimental storage API
  if ('storage' in navigator && 'estimate' in (navigator as any).storage) {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: Experimental storage API
      return await (navigator as any).storage.estimate();
    } catch {
      return {};
    }
  }
  return {};
}

// Get media devices
export async function getMediaDevices(): Promise<{
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasSpeakers: boolean;
  devices: Array<{ kind: string; label: string }>;
}> {
  if (!('mediaDevices' in navigator)) {
    return { hasCamera: false, hasMicrophone: false, hasSpeakers: false, devices: [] };
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      hasCamera: devices.some((d) => d.kind === 'videoinput'),
      hasMicrophone: devices.some((d) => d.kind === 'audioinput'),
      hasSpeakers: devices.some((d) => d.kind === 'audiooutput'),
      devices: devices.map((d) => ({ kind: d.kind, label: d.label || 'Unnamed' })),
    };
  } catch {
    return { hasCamera: false, hasMicrophone: false, hasSpeakers: false, devices: [] };
  }
}

// Get battery info
export async function getBatteryInfo(): Promise<{
  level?: number;
  charging?: boolean;
  chargingTime?: number;
}> {
  if ('getBattery' in navigator) {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: Experimental Battery API
      const battery = await (navigator as any).getBattery();
      return {
        level: battery.level,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
      };
    } catch {
      return {};
    }
  }
  return {};
}

// ==================== Analytics Queue ====================

const ANALYTICS_QUEUE_DB_NAME = 'PushCaptureAnalytics';
const ANALYTICS_QUEUE_DB_VERSION = 1;
const ANALYTICS_QUEUE_STORE = 'events';

let analyticsDB: IDBDatabase | null = null;

// Open IndexedDB
function openAnalyticsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ANALYTICS_QUEUE_DB_NAME, ANALYTICS_QUEUE_DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      analyticsDB = request.result;
      resolve(analyticsDB);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(ANALYTICS_QUEUE_STORE)) {
        const store = db.createObjectStore(ANALYTICS_QUEUE_STORE, { autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('eventType', 'eventType', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };
  });
}

// Add event to queue
async function addToQueue(event: AnalyticsEvent): Promise<void> {
  try {
    if (!analyticsDB) await openAnalyticsDB();

    const tx = analyticsDB?.transaction(ANALYTICS_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(ANALYTICS_QUEUE_STORE);

    const record = {
      ...event,
      timestamp: Date.now(),
      synced: false,
    };

    store.add(record);
  } catch (error) {
    console.error('[Analytics] Failed to queue event:', error);
  }
}

// Get queue size
async function getQueueSize(): Promise<number> {
  try {
    if (!analyticsDB) await openAnalyticsDB();

    const tx = analyticsDB?.transaction(ANALYTICS_QUEUE_STORE, 'readonly');
    const store = tx.objectStore(ANALYTICS_QUEUE_STORE);
    const count = await new Promise<number>((resolve) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });

    return count;
  } catch {
    return 0;
  }
}

// Get all unsynced events
// biome-ignore lint/suspicious/noExplicitAny: Events can have any shape
async function getUnsyncedEvents(): Promise<any[]> {
  try {
    if (!analyticsDB) await openAnalyticsDB();

    const tx = analyticsDB?.transaction(ANALYTICS_QUEUE_STORE, 'readonly');
    const store = tx.objectStore(ANALYTICS_QUEUE_STORE);
    const index = store.index('synced');

    return new Promise((resolve) => {
      const request = index.getAll(0);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// Mark events as synced
async function markEventsSynced(eventIds: number[]): Promise<void> {
  try {
    if (!analyticsDB) await openAnalyticsDB();

    const tx = analyticsDB?.transaction(ANALYTICS_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(ANALYTICS_QUEUE_STORE);

    for (const id of eventIds) {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.synced = true;
          store.put(record);
        }
      };
    }
  } catch (error) {
    console.error('[Analytics] Failed to mark events as synced:', error);
  }
}

// Flush queue to server
async function flushQueue(): Promise<{ success: boolean; count: number }> {
  try {
    const events = await getUnsyncedEvents();

    if (events.length === 0) return { success: true, count: 0 };

    // Batch events by type
    // biome-ignore lint/suspicious/noExplicitAny: Events can have any shape
    const batched: Record<string, any[]> = {};
    for (const event of events) {
      const type = event.eventType || 'unknown';
      if (!batched[type]) batched[type] = [];
      batched[type].push(event);
    }

    // Send each batch
    let totalSent = 0;
    for (const [type, batchEvents] of Object.entries(batched)) {
      try {
        const response = await fetch(`${API_BASE}/analytics/events/${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: batchEvents }),
        });

        if (response.ok) {
          const ids = batchEvents.map((e) => e.id || e.__id__).filter(Boolean);
          await markEventsSynced(ids);
          totalSent += batchEvents.length;
        }
      } catch (error) {
        console.error(`[Analytics] Failed to send ${type} batch:`, error);
      }
    }

    // Also send to batch endpoint as fallback
    if (totalSent < events.length) {
      const response = await fetch(`${API_BASE}/analytics/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: events.map((e) => ({ ...e, synced: undefined, __id__: undefined })),
        }),
      });

      if (response.ok) {
        totalSent = events.length;
        await clearSyncedEvents();
      }
    }

    console.log(`[Analytics] Flushed ${totalSent} events`);
    return { success: true, count: totalSent };
  } catch (error) {
    console.error('[Analytics] Flush failed:', error);
    return { success: false, count: 0 };
  }
}

// Clear synced events
async function clearSyncedEvents(): Promise<void> {
  try {
    if (!analyticsDB) await openAnalyticsDB();

    const tx = analyticsDB?.transaction(ANALYTICS_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(ANALYTICS_QUEUE_STORE);
    const index = store.index('synced');

    const request = index.openCursor(IDBKeyRange.only(true));
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch (error) {
    console.error('[Analytics] Failed to clear synced events:', error);
  }
}

// ==================== Analytics Event Types ====================

interface AnalyticsEvent {
  eventType: string;
  sessionId: string;
  deviceFingerprint: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

interface SessionStartEvent extends AnalyticsEvent {
  eventType: 'session_start';
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

interface PageViewEvent extends AnalyticsEvent {
  eventType: 'page_view';
  pageTitle?: string;
  path?: string;
  referrer?: string;
}

interface WebVitalEvent extends AnalyticsEvent {
  eventType: 'web_vital';
  metricType: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType?: string;
}

interface UserBehaviorEvent extends AnalyticsEvent {
  eventType: 'user_behavior';
  action: string;
  category: string;
  targetSelector?: string;
  targetTag?: string;
  targetId?: string;
  x?: number;
  y?: number;
  scrollY?: number;
  scrollPercentage?: number;
  key?: string;
  code?: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

interface ErrorEvent extends AnalyticsEvent {
  eventType: 'error';
  errorType: string;
  errorCategory: string;
  severity: string;
  message: string;
  name?: string;
  stack?: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  pageTitle?: string;
}

interface VisibilityEvent extends AnalyticsEvent {
  eventType: 'visibility_change';
  fromState: string;
  toState: string;
  hiddenDuration?: number;
}

interface ClipboardEvent extends AnalyticsEvent {
  eventType: 'clipboard';
  action: 'copy' | 'cut' | 'paste';
  dataLength?: number;
  dataPreview?: string;
  isPasswordField?: boolean;
}

interface FormInteractionEvent extends AnalyticsEvent {
  eventType: 'form_interaction';
  interactionType: string;
  formId?: string;
  fieldName?: string;
  fieldType?: string;
  valueLength?: number;
  isValid?: boolean;
  targetId?: string;
}

interface NetworkEvent extends AnalyticsEvent {
  eventType: 'network';
  requestId: string;
  requestType: string;
  method: string;
  url: string;
  domain?: string;
  status?: number;
  success?: boolean;
  duration?: number;
  fromCache?: boolean;
}

interface StorageEvent extends AnalyticsEvent {
  eventType: 'storage';
  storageType: 'local' | 'session' | 'indexeddb' | 'cache';
  action: 'set' | 'remove' | 'clear' | 'quota_exceeded';
  key?: string;
  keyLength?: number;
  valueLength?: number;
  valueType?: string;
  newValue?: string;
  oldValue?: string;
}

interface DeviceOrientationEvent extends AnalyticsEvent {
  eventType: 'device_orientation';
  orientationType: 'orientation' | 'motion' | 'devicemotion';
  alpha?: number;
  beta?: number;
  gamma?: number;
  accelX?: number;
  accelY?: number;
  accelZ?: number;
  screenOrientation?: string;
}

interface FeatureUsageEvent extends AnalyticsEvent {
  eventType: 'feature_usage';
  featureName: string;
  featureCategory: string;
  accessType: string;
  permissionStatus?: string;
}

// ==================== Tracking Functions ====================

// Initialize tracking
export async function initTracking() {
  // Get URL parameters for UTM tracking
  const urlParams = new URLSearchParams(window.location.search);
  const referrer = document.referrer;

  const sessionStart: SessionStartEvent = {
    eventType: 'session_start',
    sessionId: getSessionId(),
    deviceFingerprint: generateDeviceFingerprint(),
    referrer,
    utmSource: urlParams.get('utm_source') || undefined,
    utmMedium: urlParams.get('utm_medium') || undefined,
    utmCampaign: urlParams.get('utm_campaign') || undefined,
    utmTerm: urlParams.get('utm_term') || undefined,
    utmContent: urlParams.get('utm_content') || undefined,
    url: window.location.href,
    metadata: {
      capabilities: getDeviceCapabilities(),
      timestamp: Date.now(),
    },
  };

  await addToQueue(sessionStart);
  await flushQueue();

  // Set up periodic flush
  setInterval(flushQueue, 30000); // Every 30 seconds

  // Flush on page visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushQueue();
    }
  });

  // Flush before page unload
  window.addEventListener('beforeunload', () => {
    navigator.sendBeacon(
      `${API_BASE}/analytics/batch`,
      JSON.stringify({
        events: [],
        flush: true,
      })
    );
  });
}

// Get or create session ID
export function getSessionId(): string {
  let sessionId = sessionStorage.getItem('push_capture_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('push_capture_session_id', sessionId);
  }
  return sessionId;
}

// Track page view
export async function trackPageView() {
  const event: PageViewEvent = {
    eventType: 'page_view',
    sessionId: getSessionId(),
    deviceFingerprint: generateDeviceFingerprint(),
    pageTitle: document.title,
    path: window.location.pathname,
    referrer: document.referrer,
    url: window.location.href,
  };
  await addToQueue(event);
}

// Track web vital
export async function trackWebVital(
  metricType: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP',
  value: number,
  rating: 'good' | 'needs-improvement' | 'poor',
  navigationType?: string
) {
  const event: WebVitalEvent = {
    eventType: 'web_vital',
    sessionId: getSessionId(),
    deviceFingerprint: generateDeviceFingerprint(),
    metricType,
    value,
    rating,
    navigationType,
    url: window.location.href,
  };
  await addToQueue(event);
}

// Track user behavior (click, scroll, etc.)
export async function trackUserBehavior(
  data: Omit<UserBehaviorEvent, 'eventType' | 'sessionId' | 'deviceFingerprint'>
) {
  const event: UserBehaviorEvent = {
    eventType: 'user_behavior',
    sessionId: getSessionId(),
    deviceFingerprint: generateDeviceFingerprint(),
    url: window.location.href,
    ...data,
  };
  await addToQueue(event);
}

// Track error
export async function trackError(
  data: Omit<ErrorEvent, 'eventType' | 'sessionId' | 'deviceFingerprint'>
) {
  const event: ErrorEvent = {
    eventType: 'error',
    sessionId: getSessionId(),
    deviceFingerprint: generateDeviceFingerprint(),
    url: window.location.href,
    pageTitle: document.title,
    ...data,
  };
  await addToQueue(event);
}

// Track visibility change
export async function trackVisibilityChange(
  fromState: string,
  toState: string,
  hiddenDuration?: number
) {
  const event: VisibilityEvent = {
    eventType: 'visibility_change',
    sessionId: getSessionId(),
    deviceFingerprint: generateDeviceFingerprint(),
    fromState,
    toState,
    hiddenDuration,
    url: window.location.href,
  };
  await addToQueue(event);
}

// Track clipboard event
export async function trackClipboard(
  data: Omit<ClipboardEvent, 'eventType' | 'sessionId' | 'deviceFingerprint'>
) {
  // Sanitize sensitive data
  const dataPreview = data.dataPreview
    ? data.dataPreview
        .replace(/\d{16}/g, '****-****-****-****') // Credit card numbers
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***') // Emails
    : '';

  const event: ClipboardEvent = {
    eventType: 'clipboard',
    sessionId: getSessionId(),
    deviceFingerprint: generateDeviceFingerprint(),
    ...data,
    dataPreview,
    url: window.location.href,
  };
  await addToQueue(event);
}

// Track form interaction
export async function trackFormInteraction(
  data: Omit<FormInteractionEvent, 'eventType' | 'sessionId' | 'deviceFingerprint'>
) {
  // Sanitize password fields
  if (data.fieldType === 'password') {
    // biome-ignore lint/suspicious/noExplicitAny: Need to delete optional property from constrained type
    delete (data as any).valueLength; // Don't track value length for passwords
  }

  const event: FormInteractionEvent = {
    eventType: 'form_interaction',
    sessionId: getSessionId(),
    deviceFingerprint: generateDeviceFingerprint(),
    ...data,
    url: window.location.href,
  };
  await addToQueue(event);
}

// Track network event
export async function trackNetwork(
  data: Omit<NetworkEvent, 'eventType' | 'sessionId' | 'deviceFingerprint'>
) {
  const event: NetworkEvent = {
    eventType: 'network',
    sessionId: getSessionId(),
    deviceFingerprint: generateDeviceFingerprint(),
    ...data,
  };
  await addToQueue(event);
}

// Track storage event
export async function trackStorage(
  data: Omit<StorageEvent, 'eventType' | 'sessionId' | 'deviceFingerprint'>
) {
  const event: StorageEvent = {
    eventType: 'storage',
    sessionId: getSessionId(),
    deviceFingerprint: generateDeviceFingerprint(),
    ...data,
    url: window.location.href,
  };
  await addToQueue(event);
}

// Track device orientation
export async function trackDeviceOrientation(
  data: Omit<DeviceOrientationEvent, 'eventType' | 'sessionId' | 'deviceFingerprint'>
) {
  const event: DeviceOrientationEvent = {
    eventType: 'device_orientation',
    sessionId: getSessionId(),
    deviceFingerprint: generateDeviceFingerprint(),
    ...data,
    url: window.location.href,
  };
  await addToQueue(event);
}

// Track feature usage
export async function trackFeatureUsage(
  data: Omit<FeatureUsageEvent, 'eventType' | 'sessionId' | 'deviceFingerprint'>
) {
  const event: FeatureUsageEvent = {
    eventType: 'feature_usage',
    sessionId: getSessionId(),
    deviceFingerprint: generateDeviceFingerprint(),
    ...data,
    url: window.location.href,
  };
  await addToQueue(event);
}

// ==================== Auto-tracking Setup ====================

// Set up all event listeners for automatic tracking
export function setupAutoTracking() {
  // Set up without needing to capture unused variables

  // Click tracking
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as HTMLElement;
      trackUserBehavior({
        action: 'click',
        category: 'interaction',
        targetSelector: getSelector(target),
        targetTag: target.tagName.toLowerCase(),
        targetId: target.id,
        x: e.clientX,
        y: e.clientY,
        metadata: {
          href: (target as HTMLAnchorElement).href,
          className: target.className,
          textContent: target.textContent?.slice(0, 100),
        },
      });
    },
    { passive: true }
  );

  // Scroll tracking (throttled)
  let lastScrollY = 0;
  let scrollTimeout: NodeJS.Timeout;
  document.addEventListener(
    'scroll',
    () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollY = window.scrollY;
        const scrollPercentage = Math.round(
          (scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );

        // Track significant scroll milestones
        if (scrollPercentage >= 25 && lastScrollY < 25) {
          trackUserBehavior({
            action: 'scroll_milestone',
            category: 'engagement',
            scrollPercentage: 25,
          });
        }
        if (scrollPercentage >= 50 && lastScrollY < 50) {
          trackUserBehavior({
            action: 'scroll_milestone',
            category: 'engagement',
            scrollPercentage: 50,
          });
        }
        if (scrollPercentage >= 75 && lastScrollY < 75) {
          trackUserBehavior({
            action: 'scroll_milestone',
            category: 'engagement',
            scrollPercentage: 75,
          });
        }
        if (scrollPercentage >= 90 && lastScrollY < 90) {
          trackUserBehavior({
            action: 'scroll_milestone',
            category: 'engagement',
            scrollPercentage: 90,
          });
        }

        lastScrollY = scrollPercentage;
      }, 100);
    },
    { passive: true }
  );

  // Keyboard tracking
  document.addEventListener(
    'keydown',
    (e) => {
      trackUserBehavior({
        action: 'keydown',
        category: 'interaction',
        key: e.key,
        code: e.code,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
      });
    },
    { passive: true }
  );

  // Visibility change
  let visibilityHiddenTime = Date.now();
  document.addEventListener('visibilitychange', () => {
    const now = Date.now();
    if (document.visibilityState === 'hidden') {
      visibilityHiddenTime = now;
    } else {
      trackVisibilityChange('hidden', 'visible', now - visibilityHiddenTime);
    }
  });

  // Clipboard events
  document.addEventListener('copy', (e) => {
    const selection = window.getSelection();
    const text = selection?.toString() || '';
    trackClipboard({
      action: 'copy',
      dataLength: text.length,
      dataPreview: text.slice(0, 100),
      isPasswordField: (e.target as HTMLElement).getAttribute('type') === 'password',
    });
  });

  document.addEventListener('cut', () => {
    const selection = window.getSelection();
    const text = selection?.toString() || '';
    trackClipboard({
      action: 'cut',
      dataLength: text.length,
      dataPreview: text.slice(0, 100),
    });
  });

  document.addEventListener('paste', (e) => {
    const text = e.clipboardData?.getData('text') || '';
    trackClipboard({
      action: 'paste',
      dataLength: text.length,
      dataPreview: text.slice(0, 100),
      isPasswordField: (e.target as HTMLElement).getAttribute('type') === 'password',
    });
  });

  // Form tracking
  document.addEventListener(
    'focusin',
    (e) => {
      const target = e.target as HTMLInputElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        trackFormInteraction({
          interactionType: 'focus',
          formId: target.form?.id,
          fieldName: target.name,
          fieldType: target.type,
          targetId: target.id,
        });
      }
    },
    true
  );

  document.addEventListener(
    'change',
    (e) => {
      const target = e.target as HTMLInputElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        trackFormInteraction({
          interactionType: 'change',
          formId: target.form?.id,
          fieldName: target.name,
          fieldType: target.type,
          valueLength: target.value?.length || 0,
          isValid: target.checkValidity(),
        });
      }
    },
    true
  );

  // Print tracking
  window.addEventListener('beforeprint', () => {
    trackUserBehavior({
      action: 'print',
      category: 'system',
    });
  });

  // Context menu tracking
  document.addEventListener('contextmenu', (e) => {
    trackUserBehavior({
      action: 'context_menu',
      category: 'interaction',
      x: e.clientX,
      y: e.clientY,
      targetSelector: getSelector(e.target as HTMLElement),
    });
  });

  // Error tracking
  window.addEventListener('error', (e) => {
    trackError({
      errorType: 'javascript',
      errorCategory: 'unhandled',
      severity: 'error',
      message: e.message,
      name: e.error?.name,
      stack: e.error?.stack,
      fileName: e.filename,
      lineNumber: e.lineno,
      columnNumber: e.colno,
    });
  });

  // Promise rejection tracking
  window.addEventListener('unhandledrejection', (e) => {
    trackError({
      errorType: 'promise',
      errorCategory: 'unhandled',
      severity: 'error',
      message: e.reason?.toString() || 'Unhandled Promise Rejection',
      stack: e.reason?.stack,
    });
  });

  // Device orientation
  window.addEventListener(
    'deviceorientation',
    (e) => {
      trackDeviceOrientation({
        orientationType: 'orientation',
        alpha: e.alpha || undefined,
        beta: e.beta || undefined,
        gamma: e.gamma || undefined,
        screenOrientation: screen.orientation.type,
      });
    },
    { passive: true }
  );

  window.addEventListener(
    'devicemotion',
    (e) => {
      trackDeviceOrientation({
        orientationType: 'motion',
        accelX: e.acceleration?.x || undefined,
        accelY: e.acceleration?.y || undefined,
        accelZ: e.acceleration?.z || undefined,
      });
    },
    { passive: true }
  );

  // Screen orientation change
  screen.orientation.addEventListener('change', () => {
    trackUserBehavior({
      action: 'orientation_change',
      category: 'system',
      metadata: { orientation: screen.orientation.type },
    });
  });

  // Storage events (from other tabs)
  window.addEventListener('storage', (e) => {
    trackStorage({
      storageType: 'local',
      action: 'set',
      key: e.key || undefined,
      keyLength: e.key?.length || 0,
      valueType: typeof e.newValue,
      newValue: e.newValue || undefined,
      oldValue: e.oldValue || undefined,
    });
  });

  // Network connection change
  if ('connection' in navigator) {
    // biome-ignore lint/suspicious/noExplicitAny: Experimental browser API not in TypeScript types
    const connection = (navigator as any).connection;
    connection.addEventListener('change', () => {
      trackUserBehavior({
        action: 'network_change',
        category: 'system',
        metadata: {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        },
      });
    });
  }
}

// Helper: Get CSS selector for an element
function getSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const parts: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector = `#${current.id}`;
      parts.unshift(selector);
      break;
    }

    if (current.className) {
      const classes = current.className
        .split(' ')
        .filter((c) => c)
        .slice(0, 2);
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`;
      }
    }

    // Add nth-child if needed
    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children);
      const index = siblings.indexOf(current) + 1;
      if (siblings.length > 1) {
        selector += `:nth-child(${index})`;
      }
    }

    parts.unshift(selector);
    current = current.parentElement;

    if (parts.length > 3) break; // Limit selector depth
  }

  return parts.join(' > ');
}

// Send queued events manually
export { flushQueue as sendAnalytics };

// Get queue size
export { getQueueSize };
