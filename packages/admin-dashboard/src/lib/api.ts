const API_BASE = '/api';

interface Subscription {
  id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
  metadata?: Record<string, unknown>;
  status: 'active' | 'inactive' | 'failed';
  createdAt: string;
  updatedAt: string;
}

interface TrafficEvent {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
  source: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface TrafficStats {
  total: number;
  byMethod: Record<string, number>;
  bySource: Record<string, number>;
  topUrls: Array<{ url: string; count: number }>;
}

export const api = {
  async getSubscriptions() {
    const res = await fetch(`${API_BASE}/subscriptions`);
    if (!res.ok) throw new Error('Failed to fetch subscriptions');
    return res.json() as Promise<{ subscriptions: Subscription[] }>;
  },

  async deleteSubscription(id: string) {
    const res = await fetch(`${API_BASE}/subscriptions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete subscription');
    return res.json();
  },

  async getTraffic(limit = 100, offset = 0) {
    const res = await fetch(`${API_BASE}/traffic?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error('Failed to fetch traffic');
    return res.json() as Promise<{ traffic: TrafficEvent[] }>;
  },

  async getTrafficStats() {
    const res = await fetch(`${API_BASE}/traffic/stats/summary`);
    if (!res.ok) throw new Error('Failed to fetch traffic stats');
    return res.json() as Promise<{ stats: TrafficStats }>;
  },

  async sendPush(subscriptionId: string, data: { title: string; body?: string; url?: string }) {
    const res = await fetch(`${API_BASE}/push/send/${subscriptionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send push');
    return res.json();
  },

  async broadcastPush(data: { title: string; body?: string; url?: string }) {
    const res = await fetch(`${API_BASE}/push/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to broadcast');
    return res.json();
  },

  async getVapidKey() {
    const res = await fetch(`${API_BASE}/push/vapid-key`);
    if (!res.ok) throw new Error('Failed to get VAPID key');
    return res.json() as Promise<{ vapidKey: string }>;
  },
};
