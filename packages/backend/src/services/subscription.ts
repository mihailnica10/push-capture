import { PushSubscription } from 'web-push';

interface Subscription {
  id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  metadata?: Record<string, unknown>;
  status: 'active' | 'inactive' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage (replace with your preferred database)
const subscriptions = new Map<string, Subscription>();

export const subscriptionService = {
  getAll: async (): Promise<Subscription[]> => {
    return Array.from(subscriptions.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  },

  getById: async (id: string): Promise<Subscription | undefined> => {
    return subscriptions.get(id);
  },

  create: async (data: Omit<Subscription, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Subscription> => {
    const subscription: Subscription = {
      id: crypto.randomUUID(),
      ...data,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    subscriptions.set(subscription.id, subscription);
    return subscription;
  },

  delete: async (id: string): Promise<boolean> => {
    return subscriptions.delete(id);
  },

  updateStatus: async (id: string, status: Subscription['status']): Promise<Subscription | undefined> => {
    const subscription = subscriptions.get(id);
    if (!subscription) return undefined;

    subscription.status = status;
    subscription.updatedAt = new Date();
    subscriptions.set(id, subscription);
    return subscription;
  },

  getActive: async (): Promise<Subscription[]> => {
    return Array.from(subscriptions.values()).filter(s => s.status === 'active');
  },

  toWebPushSubscription: (subscription: Subscription): PushSubscription => ({
    endpoint: subscription.endpoint,
    keys: subscription.keys,
  }),
};
