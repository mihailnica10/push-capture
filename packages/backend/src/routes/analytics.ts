import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { db } from '../db/index.js';
import { logger } from '../lib/logger.js';
import {
  clipboardEvents,
  deviceOrientationEvents,
  devices,
  errorTracking,
  featureUsage,
  formInteractions,
  networkEvents,
  pageViews,
  storageEvents,
  userBehaviorEvents,
  userSessions,
  visibilityEvents,
  webVitals,
} from '../db/schema.js';
import { analyticsService } from '../services/analytics.js';

export const analyticsRouter = new Hono();

// Track event
analyticsRouter.post('/track', async (c) => {
  try {
    const data = await c.req.json();
    await analyticsService.trackEvent(data);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to track event' }, 500);
  }
});

// Get campaign statistics
analyticsRouter.get('/campaign/:id/stats', async (c) => {
  try {
    const campaignId = c.req.param('id');
    const stats = await analyticsService.getCampaignStats(campaignId);
    return c.json({ stats });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get campaign stats' },
      500
    );
  }
});

// Get overall statistics
analyticsRouter.get('/stats', async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30', 10);
    const stats = await analyticsService.getOverallStats(days);
    return c.json({ stats });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get overall stats' },
      500
    );
  }
});

// Get optimal send times
analyticsRouter.get('/optimal-times', async (c) => {
  try {
    const subscriptionId = c.req.query('subscriptionId');
    const limit = parseInt(c.req.query('limit') || '5', 10);
    const times = await analyticsService.getOptimalSendTimes(subscriptionId, limit);
    return c.json({ optimalHours: times });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get optimal times' },
      500
    );
  }
});

// Get platform breakdown
analyticsRouter.get('/platform-breakdown', async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30', 10);
    const breakdown = await analyticsService.getPlatformBreakdown(days);
    return c.json({ breakdown });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get platform breakdown' },
      500
    );
  }
});

// Get hourly activity
analyticsRouter.get('/hourly-activity', async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '7', 10);
    const activity = await analyticsService.getHourlyActivity(days);
    return c.json({ activity });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get hourly activity' },
      500
    );
  }
});

// Get delivery timeline for a campaign
analyticsRouter.get('/campaign/:id/timeline', async (c) => {
  try {
    const campaignId = c.req.param('id');
    const timeline = await analyticsService.getDeliveryTimeline(campaignId);
    return c.json({ timeline });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get delivery timeline' },
      500
    );
  }
});

// Batch event tracking (for service worker sync)
analyticsRouter.post('/batch', async (c) => {
  try {
    const { events } = await c.req.json();
    if (!Array.isArray(events)) {
      return c.json({ error: 'Events must be an array' }, 400);
    }
    await analyticsService.trackBatch(events);
    return c.json({ received: events.length });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to track batch events' },
      500
    );
  }
});

// Permission tracking endpoints
analyticsRouter.post('/permission-requested', async (c) => {
  try {
    const { subscriptionId, deviceId } = await c.req.json();
    await analyticsService.trackPermissionRequested(subscriptionId, deviceId);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to track' }, 500);
  }
});

analyticsRouter.post('/permission-granted', async (c) => {
  try {
    const { subscriptionId, deviceId } = await c.req.json();
    await analyticsService.trackPermissionGranted(subscriptionId, deviceId);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to track' }, 500);
  }
});

analyticsRouter.post('/permission-denied', async (c) => {
  try {
    const { subscriptionId, deviceId, reason } = await c.req.json();
    await analyticsService.trackPermissionDenied(subscriptionId, deviceId, reason);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to track' }, 500);
  }
});

// ==================== Enhanced Analytics Endpoints ====================

// Device info endpoint - receives device capabilities
analyticsRouter.post('/device-info', async (c) => {
  const { fingerprint, capabilities } = await c.req.json();

  try {
    // Check if device exists
    const existing = await db
      .select()
      .from(devices)
      .where(eq(devices.deviceFingerprint, fingerprint))
      .limit(1);

    if (existing.length === 0) {
      // Create new device record
      await db.insert(devices).values({
        id: nanoid(),
        deviceFingerprint: fingerprint,
        userAgent: capabilities.userAgent || 'unknown',
        platform: capabilities.platform || 'unknown',
        deviceType: capabilities.deviceType || 'unknown',
        browserName: capabilities.browserName,
        browserVersion: capabilities.browserVersion,
        osName: capabilities.osName,
        osVersion: capabilities.osVersion,
        deviceModel: capabilities.deviceModel,
        deviceVendor: capabilities.deviceVendor,
        screenResolution: capabilities.screenResolution,
        viewportWidth: capabilities.viewportWidth,
        viewportHeight: capabilities.viewportHeight,
        pixelRatio: capabilities.pixelRatio,
        colorDepth: capabilities.colorDepth,
        screenOrientation: capabilities.screenOrientation,
        networkType: capabilities.networkType,
        connectionDownlink: capabilities.connectionDownlink?.toString(),
        connectionRtt: capabilities.connectionRtt,
        saveData: capabilities.saveData,
        deviceMemory: capabilities.deviceMemory,
        cpuCores: capabilities.cpuCores,
        gpuVendor: capabilities.gpuVendor,
        supportsWebP: capabilities.supportsWebP,
        supportsAVIF: capabilities.supportsAVIF,
        supportsWebGL: capabilities.supportsWebGL,
        supportsWebGL2: capabilities.supportsWebGL2,
        supportsWebGPU: capabilities.supportsWebGPU,
        supportsWebRTC: capabilities.supportsWebRTC,
        supportsWebSockets: capabilities.supportsWebSockets,
        supportsServiceWorker: capabilities.supportsServiceWorker,
        supportsBackgroundSync: capabilities.supportsBackgroundSync,
        supportsNotifications: capabilities.supportsNotifications,
        supportsPushManager: capabilities.supportsPushManager,
        timezone: capabilities.timezone,
        timezoneOffset: capabilities.timezoneOffset,
        locale: capabilities.locale,
        languages: capabilities.languages,
        firstSeen: new Date(),
        lastSeen: new Date(),
      });
    } else {
      // Update last seen
      await db
        .update(devices)
        .set({ lastSeen: new Date() })
        .where(eq(devices.deviceFingerprint, fingerprint));
    }

    return c.json({ success: true });
  } catch (error) {
    logger.error({ error }, '[Analytics] Error saving device info');
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

// Subscription state tracking
analyticsRouter.post('/subscription-state', async (c) => {
  // Store subscription state event for tracking opt-in/opt-out rates
  await c.req.json(); // Consume the body
  return c.json({ success: true });
});

// Enhanced batch analytics endpoint - handles all event types
analyticsRouter.post('/batch', async (c) => {
  const { events } = await c.req.json();

  if (!Array.isArray(events) || events.length === 0) {
    return c.json({ syncedIds: [], received: 0 });
  }

  const syncedIds: string[] = [];
  let receivedCount = 0;

  try {
    // Process events by type
    for (const event of events) {
      receivedCount++;
      const eventType = event.eventType || 'unknown';

      // Track ID for marking as synced
      if (event.id || event.__rowid__) {
        syncedIds.push(String(event.id || event.__rowid__));
      }

      // Skip processing for non-tracked event types
      if (['subscription_change', 'sw_lifecycle', 'sw_error', 'sw_heartbeat'].includes(eventType)) {
        continue;
      }

      // Route to appropriate table based on event type
      switch (eventType) {
        case 'session_start': {
          // Handle session start
          const existingSession = await db
            .select()
            .from(userSessions)
            .where(eq(userSessions.sessionId, event.sessionId))
            .limit(1);

          if (existingSession.length === 0) {
            await db.insert(userSessions).values({
              id: nanoid(),
              sessionId: event.sessionId,
              deviceFingerprint: event.deviceFingerprint,
              referrer: event.referrer,
              utmSource: event.utmSource,
              utmMedium: event.utmMedium,
              utmCampaign: event.utmCampaign,
              utmTerm: event.utmTerm,
              utmContent: event.utmContent,
              startedAt: new Date(event.timestamp),
              metadata: event.metadata,
            });
          }
          break;
        }

        case 'page_view':
          await db.insert(pageViews).values({
            id: nanoid(),
            sessionId: event.sessionId,
            deviceFingerprint: event.deviceFingerprint,
            url: event.url,
            pageTitle: event.pageTitle,
            path: event.path,
            referrer: event.referrer,
            viewedAt: new Date(event.timestamp),
          });
          break;

        case 'web_vital':
          await db.insert(webVitals).values({
            id: nanoid(),
            sessionId: event.sessionId,
            deviceFingerprint: event.deviceFingerprint,
            url: event.url,
            metricType: event.metricType,
            value: event.value,
            rating: event.rating,
            navigationType: event.navigationType,
            timestamp: new Date(event.timestamp),
          });
          break;

        case 'user_behavior':
          await db.insert(userBehaviorEvents).values({
            id: nanoid(),
            sessionId: event.sessionId,
            deviceFingerprint: event.deviceFingerprint,
            url: event.url,
            eventType: event.action,
            eventCategory: event.category,
            targetSelector: event.targetSelector,
            targetTag: event.targetTag,
            targetId: event.targetId,
            x: event.x,
            y: event.y,
            scrollY: event.scrollY,
            scrollPercentage: event.scrollPercentage,
            key: event.key,
            code: event.code,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            metaKey: event.metaKey,
            timestamp: new Date(event.timestamp),
            metadata: event.metadata,
          });
          break;

        case 'error':
          await db.insert(errorTracking).values({
            id: nanoid(),
            sessionId: event.sessionId,
            deviceFingerprint: event.deviceFingerprint,
            url: event.url,
            pageTitle: event.pageTitle,
            errorType: event.errorType,
            errorCategory: event.errorCategory,
            severity: event.severity,
            message: event.message,
            name: event.name,
            stack: event.stack,
            fileName: event.fileName,
            lineNumber: event.lineNumber,
            columnNumber: event.columnNumber,
            timestamp: new Date(event.timestamp),
          });
          break;

        case 'visibility_change':
          await db.insert(visibilityEvents).values({
            id: nanoid(),
            sessionId: event.sessionId,
            deviceFingerprint: event.deviceFingerprint,
            fromState: event.fromState,
            toState: event.toState,
            visibilityState: event.toState || 'hidden',
            hiddenDuration: event.hiddenDuration,
            timestamp: new Date(event.timestamp),
          });
          break;

        case 'clipboard':
          await db.insert(clipboardEvents).values({
            id: nanoid(),
            sessionId: event.sessionId,
            deviceFingerprint: event.deviceFingerprint,
            action: event.action,
            dataLength: event.dataLength,
            dataPreview: event.dataPreview,
            isPasswordField: event.isPasswordField,
            timestamp: new Date(event.timestamp),
          });
          break;

        case 'form_interaction':
          await db.insert(formInteractions).values({
            id: nanoid(),
            sessionId: event.sessionId,
            deviceFingerprint: event.deviceFingerprint,
            interactionType: event.interactionType,
            formId: event.formId,
            fieldName: event.fieldName,
            fieldType: event.fieldType,
            fieldId: event.targetId,
            valueLength: event.valueLength,
            isValid: event.isValid,
            timestamp: new Date(event.timestamp),
            url: event.url,
          });
          break;

        case 'network':
          await db.insert(networkEvents).values({
            id: nanoid(),
            sessionId: event.sessionId,
            deviceFingerprint: event.deviceFingerprint,
            requestId: event.requestId,
            requestType: event.requestType,
            method: event.method,
            url: event.url,
            domain: event.domain,
            status: event.status,
            success: event.success,
            duration: event.duration,
            fromCache: event.fromCache,
            timestamp: new Date(event.timestamp),
          });
          break;

        case 'storage':
          await db.insert(storageEvents).values({
            id: nanoid(),
            sessionId: event.sessionId,
            deviceFingerprint: event.deviceFingerprint,
            storageType: event.storageType,
            action: event.action,
            key: event.key,
            keyLength: event.keyLength,
            valueLength: event.valueLength,
            valueType: event.valueType,
            url: event.url,
            timestamp: new Date(event.timestamp),
          });
          break;

        case 'device_orientation':
          await db.insert(deviceOrientationEvents).values({
            id: nanoid(),
            sessionId: event.sessionId,
            deviceFingerprint: event.deviceFingerprint,
            eventType: event.orientationType,
            alpha: event.alpha,
            beta: event.beta,
            gamma: event.gamma,
            accelX: event.accelX,
            accelY: event.accelY,
            accelZ: event.accelZ,
            screenOrientation: event.screenOrientation,
            url: event.url,
            timestamp: new Date(event.timestamp),
          });
          break;

        case 'feature_usage':
          await db.insert(featureUsage).values({
            id: nanoid(),
            sessionId: event.sessionId,
            deviceFingerprint: event.deviceFingerprint,
            featureName: event.featureName,
            featureCategory: event.featureCategory,
            accessType: event.accessType,
            permissionStatus: event.permissionStatus,
            url: event.url,
            timestamp: new Date(event.timestamp),
          });
          break;

        // Push notification events - handle separately or via notification service
        case 'push_received':
        case 'notification_shown':
        case 'notification_failed':
        case 'notification_clicked':
        case 'notification_dismissed':
          // These are typically handled by the notification service
          break;

        default:
          logger.debug({ eventType }, '[Analytics] Unknown event type');
      }
    }

    return c.json({
      synced: true,
      received: receivedCount,
      syncedIds,
      message: `Processed ${receivedCount} events`,
    });
  } catch (error) {
    logger.error({ error }, '[Analytics] Error processing batch');
    return c.json(
      { synced: false, error: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});
