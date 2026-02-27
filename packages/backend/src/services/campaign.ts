import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  campaignDeliveries,
  campaigns,
  devices,
  notificationPreferences,
  subscriptions,
} from '../db/schema.js';
import { analyticsService } from './analytics.js';
import { pushService } from './push.js';

export interface CampaignOptions {
  name: string;
  description?: string;
  titleTemplate: string;
  bodyTemplate?: string;
  iconUrl?: string;
  imageUrl?: string;
  badgeUrl?: string;
  soundUrl?: string;
  vibratePattern?: number[];
  actions?: Array<{ action: string; title: string; icon?: string }>;
  clickUrl?: string;
  targetSegment?: {
    platforms?: string[];
    browsers?: string[];
    timezones?: string[];
  };
  scheduledAt?: Date;
  timezone?: string;
  maxPerHour?: number;
  maxPerDay?: number;
  ttlSeconds?: number;
  priority?: 'low' | 'normal' | 'high';
  urgency?: 'very-low' | 'low' | 'normal' | 'high';
  campaignType?: 'broadcast' | 'segmented' | 'transactional' | 'ab_test';
  createdBy?: string;
  status?: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
}

export const campaignService = {
  async createCampaign(options: CampaignOptions) {
    const campaign = {
      id: crypto.randomUUID(),
      name: options.name,
      description: options.description,
      titleTemplate: options.titleTemplate,
      bodyTemplate: options.bodyTemplate,
      iconUrl: options.iconUrl,
      imageUrl: options.imageUrl,
      badgeUrl: options.badgeUrl,
      soundUrl: options.soundUrl,
      vibratePattern: options.vibratePattern,
      actions: options.actions,
      clickUrl: options.clickUrl,
      targetSegment: options.targetSegment,
      scheduledAt: options.scheduledAt,
      timezone: options.timezone,
      maxPerHour: options.maxPerHour,
      maxPerDay: options.maxPerDay,
      ttlSeconds: options.ttlSeconds,
      priority: options.priority,
      urgency: options.urgency,
      campaignType: options.campaignType,
      status: 'draft' as const,
      createdBy: options.createdBy,
      createdAt: new Date(),
    };

    await db.insert(campaigns).values(campaign);
    return campaign;
  },

  async getCampaign(campaignId: string) {
    const result = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    return result[0] || null;
  },

  async listCampaigns() {
    return await db
      .select()
      .from(campaigns)
      .where(sql`${campaigns.deletedAt} IS NULL`)
      .orderBy(desc(campaigns.createdAt));
  },

  async updateCampaign(
    campaignId: string,
    updates: Partial<
      CampaignOptions & { status?: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' }
    >
  ) {
    // Only include valid fields
    const validUpdates: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        validUpdates[key] = value;
      }
    }

    const result = await db
      .update(campaigns)
      .set(validUpdates)
      .where(eq(campaigns.id, campaignId))
      .returning();
    return result[0] || null;
  },

  async deleteCampaign(campaignId: string) {
    await db.update(campaigns).set({ deletedAt: new Date() }).where(eq(campaigns.id, campaignId));
  },

  async sendCampaign(campaignId: string) {
    const campaignResult = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);
    const campaign = campaignResult[0];

    if (!campaign) throw new Error('Campaign not found');

    // Update status to sending
    await db.update(campaigns).set({ status: 'sending' }).where(eq(campaigns.id, campaignId));

    // Get target subscriptions based on segment
    const targetSubscriptions = await this.getTargetSubscriptions(campaign.targetSegment);

    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    for (const subscription of targetSubscriptions) {
      try {
        // Check user preferences
        const canSend = await this.checkCanSend(subscription.id);
        if (!canSend) {
          results.skipped++;
          continue;
        }

        // Create delivery record
        const deliveryId = crypto.randomUUID();
        const deviceId = await this.getDeviceId(subscription.id);

        await db.insert(campaignDeliveries).values({
          id: deliveryId,
          campaignId,
          subscriptionId: subscription.id,
          deviceId: deviceId ?? undefined,
          status: 'pending',
          title: campaign.titleTemplate,
          body: campaign.bodyTemplate ?? undefined,
          payload: {
            icon: campaign.iconUrl ?? undefined,
            image: campaign.imageUrl ?? undefined,
            badge: campaign.badgeUrl ?? undefined,
            sound: campaign.soundUrl ?? undefined,
            vibrate: campaign.vibratePattern,
            actions: campaign.actions,
            data: { url: campaign.clickUrl, campaignId },
          },
          createdAt: new Date(),
        });

        // Send push notification
        const result = await pushService.sendToSubscription(subscription.id, {
          title: campaign.titleTemplate,
          body: campaign.bodyTemplate ?? undefined,
          icon: campaign.iconUrl ?? undefined,
          image: campaign.imageUrl ?? undefined,
          badge: campaign.badgeUrl ?? undefined,
          data: {
            url: campaign.clickUrl ?? undefined,
            campaignId,
            deliveryId,
          },
        });

        if (result.success) {
          // Update delivery status
          await db
            .update(campaignDeliveries)
            .set({ status: 'sent', sentAt: new Date() })
            .where(eq(campaignDeliveries.id, deliveryId));

          // Track delivery event
          await analyticsService.trackEvent({
            eventType: 'delivered',
            campaignId,
            subscriptionId: subscription.id,
            deviceId: deviceId ?? undefined,
            deliveryId,
            title: campaign.titleTemplate,
          });

          results.sent++;
        } else {
          results.failed++;
          await db
            .update(campaignDeliveries)
            .set({ status: 'failed', failedAt: new Date(), errorMessage: result.error })
            .where(eq(campaignDeliveries.id, deliveryId));
        }
      } catch (_error) {
        results.failed++;
      }
    }

    // Update campaign status
    await db.update(campaigns).set({ status: 'completed' }).where(eq(campaigns.id, campaignId));

    return results;
  },

  async getTargetSubscriptions(segment: any) {
    // Build query based on segment
    let subscriptionsQuery = db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    if (segment?.platforms?.length) {
      // Get device IDs for targeted platforms
      const targetDevices = await db
        .select({ subscriptionId: devices.subscriptionId })
        .from(devices)
        .where(inArray(devices.platform, segment.platforms));

      const subscriptionIds = targetDevices
        .map((d) => d.subscriptionId)
        .filter((id): id is string => id !== null);

      if (subscriptionIds.length > 0) {
        subscriptionsQuery = db
          .select()
          .from(subscriptions)
          .where(
            and(eq(subscriptions.status, 'active'), inArray(subscriptions.id, subscriptionIds))
          );
      } else {
        // No matching subscriptions
        return [];
      }
    }

    return await subscriptionsQuery;
  },

  async checkCanSend(subscriptionId: string) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get user preferences
    const prefsResult = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.subscriptionId, subscriptionId))
      .limit(1);

    if (prefsResult.length > 0) {
      const prefs = prefsResult[0];

      // Check opt-in status
      if (!prefs.optInStatus) return false;

      // Check DND
      if (prefs.dndUntil && prefs.dndUntil > now) return false;

      // Check quiet hours
      if (prefs.quietHoursEnabled && prefs.quietHoursStart && prefs.quietHoursEnd) {
        const userHour = now.getHours();
        const userMinute = now.getMinutes();
        const currentTime = userHour * 60 + userMinute;

        const [startHour, startMin] = prefs.quietHoursStart.split(':').map(Number);
        const [endHour, endMin] = prefs.quietHoursEnd.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        // Check if current time is within quiet hours
        if (startTime < endTime) {
          // Normal case: e.g., 22:00 to 08:00 (same day)
          if (currentTime >= startTime && currentTime < endTime) return false;
        } else {
          // Overnight case: e.g., 22:00 to 08:00 (next day)
          if (currentTime >= startTime || currentTime < endTime) return false;
        }
      }

      // Check frequency caps from preferences
      const hourlyCountResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(campaignDeliveries)
        .where(
          and(
            eq(campaignDeliveries.subscriptionId, subscriptionId),
            gte(campaignDeliveries.sentAt!, oneHourAgo)
          )
        );

      if (prefs.maxPerHour !== null && hourlyCountResult[0]?.count >= prefs.maxPerHour)
        return false;

      const dailyCountResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(campaignDeliveries)
        .where(
          and(
            eq(campaignDeliveries.subscriptionId, subscriptionId),
            gte(campaignDeliveries.sentAt!, oneDayAgo)
          )
        );

      if (prefs.maxPerDay !== null && dailyCountResult[0]?.count >= prefs.maxPerDay) return false;

      return true;
    }

    // No preferences found, use default limits
    const hourlyCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(campaignDeliveries)
      .where(
        and(
          eq(campaignDeliveries.subscriptionId, subscriptionId),
          gte(campaignDeliveries.sentAt!, oneHourAgo)
        )
      );

    if (hourlyCount[0].count >= 3) return false;

    const dailyCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(campaignDeliveries)
      .where(
        and(
          eq(campaignDeliveries.subscriptionId, subscriptionId),
          gte(campaignDeliveries.sentAt!, oneDayAgo)
        )
      );

    if (dailyCount[0].count >= 10) return false;

    return true;
  },

  async getCampaignStats(campaignId: string) {
    const stats = await db
      .select({
        sent: sql<number>`COUNT(*) FILTER (WHERE status = 'sent')`,
        delivered: sql<number>`COUNT(*) FILTER (WHERE status = 'delivered')`,
        opened: sql<number>`COUNT(*) FILTER (WHERE status = 'opened')`,
        clicked: sql<number>`COUNT(*) FILTER (WHERE status = 'clicked')`,
        failed: sql<number>`COUNT(*) FILTER (WHERE status = 'failed')`,
      })
      .from(campaignDeliveries)
      .where(eq(campaignDeliveries.campaignId, campaignId));

    return stats[0] || { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 };
  },

  async getDeviceId(subscriptionId: string): Promise<string | null> {
    const device = await db
      .select({ id: devices.id })
      .from(devices)
      .where(eq(devices.subscriptionId, subscriptionId))
      .limit(1);

    return device[0]?.id || null;
  },
};
