import webpush from 'web-push';
import { subscriptionService } from './subscription.js';

interface PushPayload {
  title: string;
  body?: string;
  icon?: string;
  data?: unknown;
  url?: string;
}

// Configure VAPID keys (generate your own with: npx web-push generate-vapid-keys)
// For now, using placeholder keys - replace with your own
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib47JZv3f4NY_1Iq0ggB7c2ZPYY8vI5zDZbNLGvY3vFvqKVgB7qLw6RGkF8';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

interface SendResult {
  success: boolean;
  error?: string;
  sent?: number;
  failed?: number;
}

export const pushService = {
  getVapidPublicKey: (): string => {
    return VAPID_PUBLIC_KEY;
  },

  sendToSubscription: async (subscriptionId: string, payload: PushPayload): Promise<SendResult> => {
    const subscription = await subscriptionService.getById(subscriptionId);
    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    const webPushSubscription = subscriptionService.toWebPushSubscription(subscription);

    try {
      await webpush.sendNotification(webPushSubscription, JSON.stringify(payload));
      return { success: true };
    } catch (error) {
      await subscriptionService.updateStatus(subscriptionId, 'failed');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  broadcast: async (
    payload: PushPayload,
    filter?: (sub: { status: string; metadata?: Record<string, unknown> }) => boolean
  ): Promise<SendResult> => {
    const subscriptions = await subscriptionService.getActive();

    const filtered = filter
      ? subscriptions.filter(filter)
      : subscriptions;

    let sent = 0;
    let failed = 0;

    const results = await Promise.allSettled(
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

  triggerFromTraffic: async (trafficId: string, template?: Partial<PushPayload>): Promise<SendResult> => {
    // Get traffic event and convert to push notification
    // This would typically involve some business logic to determine
    // what traffic events should trigger notifications
    const payload: PushPayload = {
      title: template?.title || 'New Traffic Event',
      body: template?.body || 'A new traffic event has been captured',
      icon: template?.icon || '/icon.png',
      data: { trafficId },
      url: template?.url,
    };

    // Broadcast to all active subscriptions
    return pushService.broadcast(payload);
  },
};
