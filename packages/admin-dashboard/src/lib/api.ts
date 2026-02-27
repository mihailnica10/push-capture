const API_BASE = '/api';

// Types
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

interface Device {
  id: string;
  platform: 'ios' | 'android' | 'desktop' | 'tablet';
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'wearable';
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceModel?: string;
  supportsActions: boolean;
  supportsImages: boolean;
  supportsVibrate: boolean;
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

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
  campaignType?: 'broadcast' | 'segmented' | 'transactional' | 'ab_test';
  titleTemplate: string;
  bodyTemplate?: string;
  iconUrl?: string;
  imageUrl?: string;
  badgeUrl?: string;
  soundUrl?: string;
  clickUrl?: string;
  tag?: string;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  targetSegment?: {
    platforms?: string[];
    browsers?: string[];
    deviceTypes?: string[];
  };
  scheduledAt?: string;
  timezone?: string;
  priority?: 'low' | 'normal' | 'high';
  urgency?: 'very-low' | 'low' | 'normal' | 'high';
  ttlSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  total: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

interface Segment {
  id: string;
  name: string;
  description?: string;
  criteria: Record<string, unknown>;
  estimatedReach: number;
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  title: string;
  body?: string;
  iconUrl?: string;
  imageUrl?: string;
  clickUrl?: string;
  tags?: string[];
  category?: string;
}

export const api = {
  async getSubscriptions() {
    const res = await fetch(`${API_BASE}/subscriptions`);
    if (!res.ok) throw new Error('Failed to fetch subscriptions');
    return res.json() as Promise<{ subscriptions: Subscription[] }>;
  },

  async getSubscription(id: string) {
    const res = await fetch(`${API_BASE}/subscriptions/${id}`);
    if (!res.ok) throw new Error('Failed to fetch subscription');
    return res.json() as Promise<{ subscription: Subscription }>;
  },

  async deleteSubscription(id: string) {
    const res = await fetch(`${API_BASE}/subscriptions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete subscription');
    return res.json();
  },

  async updateSubscriptionStatus(id: string, status: string) {
    const res = await fetch(`${API_BASE}/subscriptions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update subscription status');
    return res.json() as Promise<{ subscription: Subscription }>;
  },

  // Devices
  async getDevices() {
    const res = await fetch(`${API_BASE}/devices`);
    if (!res.ok) throw new Error('Failed to fetch devices');
    return res.json() as Promise<{ devices: Device[] }>;
  },

  async getDeviceStats() {
    const res = await fetch(`${API_BASE}/devices/stats`);
    if (!res.ok) throw new Error('Failed to fetch device stats');
    return res.json() as Promise<{
      stats: {
        total: number;
        byPlatform: Array<{ platform: string; count: number }>;
        byBrowser: Array<{ browserName: string; count: number }>;
      };
    }>;
  },

  async getDeviceBreakdown() {
    const res = await fetch(`${API_BASE}/devices/breakdown`);
    if (!res.ok) throw new Error('Failed to fetch device breakdown');
    return res.json() as Promise<{ breakdown: Record<string, number> }>;
  },

  // Traffic
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

  // Push Notifications
  async sendPush(
    subscriptionId: string,
    data: {
      title: string;
      body?: string;
      icon?: string;
      image?: string;
      badge?: string;
      url?: string;
      data?: Record<string, unknown>;
    }
  ) {
    const res = await fetch(`${API_BASE}/push/send/${subscriptionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send push');
    return res.json();
  },

  async broadcastPush(data: {
    title: string;
    body?: string;
    icon?: string;
    image?: string;
    url?: string;
    filter?: Record<string, unknown>;
  }) {
    const res = await fetch(`${API_BASE}/push/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to broadcast');
    return res.json() as Promise<{ success: boolean; sent: number; failed: number }>;
  },

  async getVapidKey() {
    const res = await fetch(`${API_BASE}/push/vapid-key`);
    if (!res.ok) throw new Error('Failed to get VAPID key');
    return res.json() as Promise<{ vapidKey: string }>;
  },

  // Campaigns
  async getCampaigns() {
    const res = await fetch(`${API_BASE}/campaigns`);
    if (!res.ok) throw new Error('Failed to fetch campaigns');
    const data = await res.json();
    return { campaigns: data.campaigns || [] };
  },

  async getCampaign(id: string) {
    const res = await fetch(`${API_BASE}/campaigns/${id}`);
    if (!res.ok) throw new Error('Failed to fetch campaign');
    return res.json() as Promise<{ campaign: Campaign }>;
  },

  async createCampaign(data: {
    name: string;
    description?: string;
    titleTemplate: string;
    bodyTemplate?: string;
    iconUrl?: string;
    imageUrl?: string;
    badgeUrl?: string;
    clickUrl?: string;
    tag?: string;
    actions?: Array<{ action: string; title: string; icon?: string }>;
    targetSegment?: {
      platforms?: string[];
      browsers?: string[];
      deviceTypes?: string[];
    };
    scheduledAt?: string;
    timezone?: string;
    priority?: 'low' | 'normal' | 'high';
    urgency?: 'very-low' | 'low' | 'normal' | 'high';
    ttlSeconds?: number;
    campaignType?: 'broadcast' | 'segmented' | 'transactional' | 'ab_test';
  }) {
    const res = await fetch(`${API_BASE}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create campaign');
    return res.json() as Promise<{ campaign: Campaign }>;
  },

  async updateCampaign(id: string, data: Partial<Campaign>) {
    const res = await fetch(`${API_BASE}/campaigns/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update campaign');
    return res.json() as Promise<{ campaign: Campaign }>;
  },

  async deleteCampaign(id: string) {
    const res = await fetch(`${API_BASE}/campaigns/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete campaign');
    return res.json();
  },

  async sendCampaign(id: string) {
    const res = await fetch(`${API_BASE}/campaigns/${id}/send`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to send campaign');
    return res.json() as Promise<{ results: { sent: number; failed: number; skipped: number } }>;
  },

  async scheduleCampaign(id: string, scheduledAt: string, timezone?: string) {
    const res = await fetch(`${API_BASE}/campaigns/${id}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledAt, timezone }),
    });
    if (!res.ok) throw new Error('Failed to schedule campaign');
    return res.json();
  },

  async pauseCampaign(id: string) {
    const res = await fetch(`${API_BASE}/campaigns/${id}/pause`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to pause campaign');
    return res.json();
  },

  async resumeCampaign(id: string) {
    const res = await fetch(`${API_BASE}/campaigns/${id}/resume`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to resume campaign');
    return res.json();
  },

  async getCampaignStats(id?: string) {
    const endpoint = id ? `${API_BASE}/campaigns/${id}/stats` : `${API_BASE}/campaigns/stats`;
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('Failed to fetch campaign stats');
    return res.json() as Promise<{ stats: CampaignStats }>;
  },

  async getCampaignTimeline(id: string) {
    const res = await fetch(`${API_BASE}/analytics/campaign/${id}/timeline`);
    if (!res.ok) throw new Error('Failed to fetch campaign timeline');
    // biome-ignore lint/suspicious/noExplicitAny: Timeline events have dynamic shape
    return res.json() as Promise<{ timeline: any[] }>;
  },

  async duplicateCampaign(id: string) {
    const res = await fetch(`${API_BASE}/campaigns/${id}/duplicate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to duplicate campaign');
    return res.json() as Promise<{ campaign: Campaign }>;
  },

  // Analytics
  async getOverallStats(days = 30) {
    const res = await fetch(`${API_BASE}/analytics/stats?days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch overall stats');
    const data = await res.json();
    return data.stats || {};
  },

  async getPlatformBreakdown(days = 30) {
    const res = await fetch(`${API_BASE}/analytics/platform-breakdown?days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch platform breakdown');
    const data = await res.json();
    return data.breakdown || [];
  },

  async getHourlyActivity(days = 7) {
    const res = await fetch(`${API_BASE}/analytics/hourly-activity?days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch hourly activity');
    const data = await res.json();
    return data.activity || [];
  },

  async getOptimalSendTimes(subscriptionId?: string, limit = 5) {
    const query = subscriptionId
      ? `?subscriptionId=${subscriptionId}&limit=${limit}`
      : `?limit=${limit}`;
    const res = await fetch(`${API_BASE}/analytics/optimal-times${query}`);
    if (!res.ok) throw new Error('Failed to fetch optimal send times');
    const data = await res.json();
    return data.optimalHours || [];
  },

  async getDailyStats(days = 30) {
    const res = await fetch(`${API_BASE}/analytics/daily-stats?days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch daily stats');
    return res.json();
  },

  async getCampaignPerformance(days = 30) {
    const res = await fetch(`${API_BASE}/analytics/campaign-performance?days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch campaign performance');
    return res.json();
  },

  // Segments
  async getSegments() {
    const res = await fetch(`${API_BASE}/segments`);
    if (!res.ok) throw new Error('Failed to fetch segments');
    const data = await res.json();
    return data.segments || [];
  },

  async createSegment(data: {
    name: string;
    description?: string;
    criteria: Record<string, unknown>;
  }) {
    const res = await fetch(`${API_BASE}/segments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create segment');
    return res.json() as Promise<{ segment: Segment }>;
  },

  async updateSegment(id: string, data: Partial<Segment>) {
    const res = await fetch(`${API_BASE}/segments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update segment');
    return res.json() as Promise<{ segment: Segment }>;
  },

  async deleteSegment(id: string) {
    const res = await fetch(`${API_BASE}/segments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete segment');
    return res.json();
  },

  async estimateReach(criteria: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/segments/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(criteria),
    });
    if (!res.ok) throw new Error('Failed to estimate reach');
    return res.json() as Promise<{ count: number }>;
  },

  // Templates
  async getTemplates() {
    const res = await fetch(`${API_BASE}/templates`);
    if (!res.ok) throw new Error('Failed to fetch templates');
    const data = await res.json();
    return data.templates || [];
  },

  async getTemplate(id: string) {
    const res = await fetch(`${API_BASE}/templates/${id}`);
    if (!res.ok) throw new Error('Failed to fetch template');
    return res.json() as Promise<{ template: Template }>;
  },

  async createTemplate(data: Omit<Template, 'id'>) {
    const res = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create template');
    return res.json() as Promise<{ template: Template }>;
  },

  async updateTemplate(id: string, data: Partial<Template>) {
    const res = await fetch(`${API_BASE}/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update template');
    return res.json() as Promise<{ template: Template }>;
  },

  async deleteTemplate(id: string) {
    const res = await fetch(`${API_BASE}/templates/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete template');
    return res.json();
  },

  // Health & Monitoring
  async getHealthStats() {
    const res = await fetch(`${API_BASE}/health/stats`);
    if (!res.ok) throw new Error('Failed to fetch health stats');
    return res.json();
  },

  async runHealthCheck(subscriptionIds?: string[]) {
    const res = await fetch(`${API_BASE}/health/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionIds }),
    });
    if (!res.ok) throw new Error('Failed to run health check');
    return res.json();
  },

  async getFailedDeliveries(limit = 100) {
    const res = await fetch(`${API_BASE}/deliveries/failed?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch failed deliveries');
    return res.json();
  },

  async retryDelivery(deliveryId: string) {
    const res = await fetch(`${API_BASE}/deliveries/${deliveryId}/retry`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to retry delivery');
    return res.json();
  },

  // Preferences
  async getPreferenceStats() {
    const res = await fetch(`${API_BASE}/preferences/stats`);
    if (!res.ok) throw new Error('Failed to fetch preference stats');
    return res.json();
  },

  // Settings
  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json() as Promise<{ settings: Record<string, unknown> }>;
  },

  async getSettingsGrouped() {
    const res = await fetch(`${API_BASE}/settings/grouped`);
    if (!res.ok) throw new Error('Failed to fetch settings grouped');
    return res.json() as Promise<{ settings: Record<string, Record<string, unknown>> }>;
  },

  async getSettingsCategory(category: string) {
    const res = await fetch(`${API_BASE}/settings/${category}`);
    if (!res.ok) throw new Error('Failed to fetch settings category');
    return res.json() as Promise<{ settings: Record<string, unknown>; category: string }>;
  },

  async updateSetting(key: string, value: unknown, category?: string) {
    const res = await fetch(`${API_BASE}/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value, category }),
    });
    if (!res.ok) throw new Error('Failed to update setting');
    return res.json();
  },

  async updateSettingsBatch(settings: Array<{ key: string; value: unknown; category?: string }>) {
    const res = await fetch(`${API_BASE}/settings/batch`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
    if (!res.ok) throw new Error('Failed to update settings batch');
    return res.json();
  },

  async initializeSettings() {
    const res = await fetch(`${API_BASE}/settings/initialize`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to initialize settings');
    return res.json();
  },

  async getSettingsDefaults() {
    const res = await fetch(`${API_BASE}/settings/defaults`);
    if (!res.ok) throw new Error('Failed to fetch settings defaults');
    return res.json();
  },
};

export type {
  Subscription,
  Device,
  TrafficEvent,
  TrafficStats,
  Campaign,
  CampaignStats,
  Segment,
  Template,
};
