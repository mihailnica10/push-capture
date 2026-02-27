import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { campaignDeliveries, devices, notificationEvents } from '../db/schema.js';

export interface EventData {
  eventType: string;
  campaignId?: string;
  subscriptionId?: string;
  deviceId?: string;
  deliveryId?: string;
  title?: string;
  body?: string;
  category?: string;
  timeToClick?: number;
  timeToDismiss?: number;
  platform?: string;
  browser?: string;
  networkType?: string;
  batteryLevel?: number;
  userSegment?: string;
  abTestGroup?: string;
  experimentId?: string;
  variantId?: string;
  attributionSource?: string;
  attributionMedium?: string;
  attributionCampaign?: string;
  metadata?: Record<string, unknown>;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

export const analyticsService = {
  async trackEvent(data: EventData) {
    // Get device context if not provided
    let platform = data.platform;
    let browser = data.browser;
    let networkType = data.networkType;

    if (data.deviceId && !platform) {
      const device = await db
        .select({
          platform: devices.platform,
          browserName: devices.browserName,
          networkType: devices.networkType,
        })
        .from(devices)
        .where(eq(devices.id, data.deviceId))
        .limit(1);

      if (device[0]) {
        platform = device[0].platform;
        browser = device[0].browserName ?? undefined;
        networkType = device[0].networkType ?? undefined;
      }
    }

    // Get local hour from subscription's device
    const localHour = new Date().getHours();
    let timezone = data.platform;

    if (data.deviceId) {
      const device = await db
        .select({ timezone: devices.timezone })
        .from(devices)
        .where(eq(devices.id, data.deviceId))
        .limit(1);

      if (device[0]?.timezone) {
        timezone = device[0].timezone;
        // Calculate local hour based on timezone
        // This is a simplified version - in production use a proper timezone library
      }
    }

    const bodyHash = data.body ? hashString(data.body) : undefined;

    await db.insert(notificationEvents).values({
      id: crypto.randomUUID(),
      eventType: data.eventType,
      campaignId: data.campaignId,
      subscriptionId: data.subscriptionId,
      deviceId: data.deviceId,
      deliveryId: data.deliveryId,
      title: data.title,
      bodyHash,
      category: data.category,
      timeToClick: data.timeToClick,
      timeToDismiss: data.timeToDismiss,
      platform,
      browser,
      networkType,
      batteryLevel: data.batteryLevel?.toString(),
      userSegment: data.userSegment,
      abTestGroup: data.abTestGroup,
      experimentId: data.experimentId,
      variantId: data.variantId,
      attributionSource: data.attributionSource,
      attributionMedium: data.attributionMedium,
      attributionCampaign: data.attributionCampaign,
      timezone,
      localHour,
      dayOfWeek: new Date().getDay() + 1,
      metadata: data.metadata,
      createdAt: new Date(),
    });
  },

  async getCampaignStats(campaignId: string) {
    const stats = await db
      .select({
        sent: sql<number>`COUNT(*) FILTER (WHERE status = 'sent')`,
        delivered: sql<number>`COUNT(*) FILTER (WHERE status = 'delivered')`,
        opened: sql<number>`COUNT(*) FILTER (WHERE status = 'opened')`,
        clicked: sql<number>`COUNT(*) FILTER (WHERE status = 'clicked')`,
        failed: sql<number>`COUNT(*) FILTER (WHERE status = 'failed')`,
        total: sql<number>`COUNT(*)`,
      })
      .from(campaignDeliveries)
      .where(eq(campaignDeliveries.campaignId, campaignId));

    const result = stats[0] || {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
      total: 0,
    };

    // Calculate rates
    const deliveryRate = result.total > 0 ? (result.delivered / result.total) * 100 : 0;
    const openRate = result.sent > 0 ? (result.opened / result.sent) * 100 : 0;
    const clickRate = result.opened > 0 ? (result.clicked / result.opened) * 100 : 0;

    return {
      ...result,
      deliveryRate,
      openRate,
      clickRate,
    };
  },

  async getOverallStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await db
      .select({
        eventType: notificationEvents.eventType,
        count: sql<number>`COUNT(*)`,
        uniqueSubscriptions: sql<number>`COUNT(DISTINCT ${notificationEvents.subscriptionId})`,
      })
      .from(notificationEvents)
      .where(gte(notificationEvents.createdAt, startDate))
      .groupBy(notificationEvents.eventType);

    return stats.reduce<Record<string, { count: number; uniqueSubscriptions: number }>>(
      (acc, stat) => {
        acc[stat.eventType] = {
          count: stat.count,
          uniqueSubscriptions: stat.uniqueSubscriptions,
        };
        return acc;
      },
      {}
    );
  },

  async getOptimalSendTimes(subscriptionId?: string, limit: number = 5) {
    const baseConditions = subscriptionId
      ? and(
          eq(notificationEvents.eventType, 'opened'),
          eq(notificationEvents.subscriptionId, subscriptionId)
        )
      : eq(notificationEvents.eventType, 'opened');

    const result = await db
      .select({
        hour: notificationEvents.localHour,
        count: sql<number>`COUNT(*)`,
      })
      .from(notificationEvents)
      .where(baseConditions)
      .groupBy(notificationEvents.localHour)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(limit);

    return result.map((r) => r.hour ?? 0).filter((h): h is number => typeof h === 'number');
  },

  async getPlatformBreakdown(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await db
      .select({
        platform: notificationEvents.platform,
        eventType: notificationEvents.eventType,
        count: sql<number>`COUNT(*)`,
      })
      .from(notificationEvents)
      .where(gte(notificationEvents.createdAt, startDate))
      .groupBy(notificationEvents.platform, notificationEvents.eventType);

    return stats;
  },

  async getHourlyActivity(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await db
      .select({
        hour: notificationEvents.localHour,
        eventType: notificationEvents.eventType,
        count: sql<number>`COUNT(*)`,
      })
      .from(notificationEvents)
      .where(gte(notificationEvents.createdAt, startDate))
      .groupBy(notificationEvents.localHour, notificationEvents.eventType)
      .orderBy(notificationEvents.localHour);

    return stats;
  },

  async getDeliveryTimeline(campaignId: string) {
    const deliveries = await db
      .select({
        status: campaignDeliveries.status,
        createdAt: campaignDeliveries.createdAt,
        sentAt: campaignDeliveries.sentAt,
        openedAt: campaignDeliveries.openedAt,
        clickedAt: campaignDeliveries.clickedAt,
      })
      .from(campaignDeliveries)
      .where(eq(campaignDeliveries.campaignId, campaignId))
      .orderBy(desc(campaignDeliveries.createdAt))
      .limit(100);

    return deliveries;
  },

  // Permission lifecycle tracking
  async trackPermissionRequested(subscriptionId?: string, deviceId?: string) {
    return await this.trackEvent({
      eventType: 'permission_requested',
      subscriptionId,
      deviceId,
    });
  },

  async trackPermissionGranted(subscriptionId: string, deviceId?: string) {
    return await this.trackEvent({
      eventType: 'permission_granted',
      subscriptionId,
      deviceId,
    });
  },

  async trackPermissionDenied(subscriptionId?: string, deviceId?: string, reason?: string) {
    return await this.trackEvent({
      eventType: 'permission_denied',
      subscriptionId,
      deviceId,
      metadata: { reason },
    });
  },

  // Notification lifecycle tracking
  async trackNotificationShow(
    subscriptionId: string,
    deliveryId: string,
    data: {
      title: string;
      hasActions: boolean;
      hasImage: boolean;
      platform: string;
    }
  ) {
    return await this.trackEvent({
      eventType: 'notification_shown',
      subscriptionId,
      deliveryId,
      title: data.title,
      metadata: {
        hasActions: data.hasActions,
        hasImage: data.hasImage,
        platform: data.platform,
      },
    });
  },

  async trackNotificationClick(subscriptionId: string, deliveryId: string, action?: string) {
    return await this.trackEvent({
      eventType: 'notification_clicked',
      subscriptionId,
      deliveryId,
      metadata: { action },
    });
  },

  async trackNotificationDismiss(
    subscriptionId: string,
    deliveryId: string,
    timeToDismiss: number
  ) {
    return await this.trackEvent({
      eventType: 'notification_dismissed',
      subscriptionId,
      deliveryId,
      timeToDismiss,
    });
  },

  async trackSubscriptionRefresh(oldEndpoint: string, newEndpoint: string) {
    return await this.trackEvent({
      eventType: 'subscription_refreshed',
      metadata: { oldEndpoint, newEndpoint },
    });
  },

  async trackPushReceived(
    subscriptionId?: string,
    deliveryId?: string,
    data?: {
      hasActions?: boolean;
      hasImage?: boolean;
    }
  ) {
    return await this.trackEvent({
      eventType: 'push_received',
      subscriptionId,
      deliveryId,
      metadata: data,
    });
  },

  async trackNotificationFailed(subscriptionId: string, error: string, deliveryId?: string) {
    return await this.trackEvent({
      eventType: 'notification_failed',
      subscriptionId,
      deliveryId,
      metadata: { error },
    });
  },

  async trackDeliveryAttempt(deliveryId: string, attempt: number, success: boolean) {
    return await this.trackEvent({
      eventType: success ? 'delivery_success' : 'delivery_failed',
      deliveryId,
      metadata: { attempt },
    });
  },

  // Batch event tracking for service worker sync
  async trackBatch(
    events: Array<{ type: string; data?: Record<string, unknown>; timestamp?: number }>
  ) {
    for (const event of events) {
      const data = event.data || {};
      await this.trackEvent({
        eventType: event.type,
        ...data,
        metadata: {
          ...(data.metadata as Record<string, unknown> | undefined),
          clientTimestamp: event.timestamp,
        },
      });
    }
  },
};
