import { desc, eq } from 'drizzle-orm';
import { PushSubscription } from 'web-push';
import { db, type Subscription, subscriptions } from '../db/index.js';

interface CreateSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export const subscriptionService = {
  getAll: async (): Promise<Subscription[]> => {
    const result = await db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
    return result;
  },

  getById: async (id: string): Promise<Subscription | undefined> => {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
    return result[0];
  },

  create: async (data: CreateSubscriptionInput): Promise<Subscription> => {
    const newSubscription = {
      id: crypto.randomUUID(),
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
      userAgent: data.userAgent,
      metadata: data.metadata,
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.insert(subscriptions).values(newSubscription).returning();

    return result[0];
  },

  delete: async (id: string): Promise<boolean> => {
    const result = await db.delete(subscriptions).where(eq(subscriptions.id, id)).returning();
    return result.length > 0;
  },

  updateStatus: async (
    id: string,
    status: Subscription['status']
  ): Promise<Subscription | undefined> => {
    const result = await db
      .update(subscriptions)
      .set({ status, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();

    return result[0];
  },

  getActive: async (): Promise<Subscription[]> => {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.status, 'active'));
    return result;
  },

  toWebPushSubscription: (subscription: Subscription): PushSubscription => ({
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  }),
};
