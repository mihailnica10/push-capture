import { eq } from 'drizzle-orm';
import webpush from 'web-push';
import { db, vapidConfig } from '../db/index.js';
import { devices } from '../db/schema.js';
import { deadLetterService } from './dead-letter.js';
import { type PushPayload, payloadBuilder } from './payload-builder.js';
import { extractErrorCode, retryManager } from './retry.js';
import { subscriptionService } from './subscription.js';
import { logger } from '../lib/logger.js';

let vapidKeys: {
  publicKey: string;
  privateKey: string;
  subject: string;
} | null = null;

// Initialize VAPID keys from database or environment
async function initVapidKeys(): Promise<void> {
  // Try to load from database first
  const config = await db.select().from(vapidConfig).where(eq(vapidConfig.id, 'default')).limit(1);

  if (config.length > 0) {
    vapidKeys = {
      publicKey: config[0].publicKey,
      privateKey: config[0].privateKey,
      subject: config[0].subject,
    };
  } else {
    // Get from environment variables (required in production)
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;

    if (!publicKey || !privateKey || !subject) {
      throw new Error(
        'Missing required VAPID environment variables. Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT.'
      );
    }

    vapidKeys = { publicKey, privateKey, subject };
  }

  webpush.setVapidDetails(vapidKeys.subject, vapidKeys.publicKey, vapidKeys.privateKey);
}

// Initialize on module load
initVapidKeys().catch((error) => {
  logger.error({ error }, 'Failed to initialize VAPID keys');
});

interface SendResult {
  success: boolean;
  error?: string;
  sent?: number;
  failed?: number;
}

export const pushService = {
  getVapidPublicKey: async (): Promise<string> => {
    if (!vapidKeys) {
      await initVapidKeys();
    }
    return vapidKeys?.publicKey || process.env.VAPID_PUBLIC_KEY || '';
  },

  // Synchronous version for routes that don't await
  getVapidPublicKeySync: (): string => {
    return vapidKeys?.publicKey || process.env.VAPID_PUBLIC_KEY || '';
  },

  sendToSubscription: async (subscriptionId: string, payload: PushPayload): Promise<SendResult> => {
    const subscription = await subscriptionService.getById(subscriptionId);
    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    if (subscription.status !== 'active') {
      return { success: false, error: `Subscription is ${subscription.status}` };
    }

    const webPushSubscription = subscriptionService.toWebPushSubscription(subscription);

    // Get device info for payload optimization
    const deviceInfo = await db
      .select()
      .from(devices)
      .where(eq(devices.subscriptionId, subscriptionId))
      .limit(1);

    // Build optimized payload if device info is available
    let optimizedPayload = payload;
    if (deviceInfo.length > 0) {
      const deviceId = deviceInfo[0].id;
      const buildResult = await payloadBuilder.buildForDevice(deviceId, payload);
      if (!buildResult.valid) {
        logger.warn({ issues: buildResult.issues }, '[PushService] Payload validation issues');
      }
      optimizedPayload = buildResult.payload as PushPayload;
    }

    // Use retry manager for sending with exponential backoff
    const result = await retryManager.withRetry(
      async () => {
        const result = await webpush.sendNotification(
          webPushSubscription,
          JSON.stringify(optimizedPayload),
          {
            TTL: payload.data?.ttl ? Number(payload.data.ttl) : 86400,
            urgency: (payload.data?.urgency as any) || 'normal',
          }
        );
        return result;
      },
      {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        jitter: true,
      }
    );

    if (result.success) {
      return { success: true };
    } else {
      const error = result.error!;
      const errorCode = extractErrorCode(error);

      // Handle specific error codes
      if (
        errorCode === 'EXPIRED' ||
        errorCode === 'PERMISSION_DENIED' ||
        errorCode === 'NOT_FOUND'
      ) {
        // Mark subscription as inactive
        await subscriptionService.updateStatus(subscriptionId, 'inactive');
      } else {
        // Mark as failed but keep for retry
        await subscriptionService.updateStatus(subscriptionId, 'failed');
      }

      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Send with delivery tracking - records to dead letter queue on failure
   */
  sendWithTracking: async (
    deliveryId: string,
    subscriptionId: string,
    payload: PushPayload
  ): Promise<SendResult> => {
    const result = await pushService.sendToSubscription(subscriptionId, payload);

    if (!result.success) {
      // Record to dead letter queue for potential retry
      await deadLetterService.recordFailure({
        deliveryId,
        subscriptionId,
        error: new Error(result.error || 'Unknown error'),
        attempt: 1,
      });
    }

    return result;
  },

  broadcast: async (
    payload: PushPayload,
    filter?: (sub: { status: string; metadata?: Record<string, unknown> | null }) => boolean
  ): Promise<SendResult> => {
    const subscriptions = await subscriptionService.getActive();

    const filtered = filter ? subscriptions.filter(filter) : subscriptions;

    let sent = 0;
    let failed = 0;

    await Promise.allSettled(
      filtered.map(async (subscription) => {
        const result = await pushService.sendToSubscription(subscription.id, payload);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      })
    );

    return { success: true, sent, failed };
  },

  triggerFromTraffic: async (
    trafficId: string,
    template?: Partial<PushPayload>
  ): Promise<SendResult> => {
    // Get traffic event and convert to push notification
    // This would typically involve some business logic to determine
    // what traffic events should trigger notifications
    const payload: PushPayload = {
      title: template?.title || 'New Traffic Event',
      body: template?.body || 'A new traffic event has been captured',
      icon: template?.icon || '/icon.png',
      data: {
        trafficId,
        url: template?.data?.url,
      },
    };

    // Broadcast to all active subscriptions
    return pushService.broadcast(payload);
  },
};
