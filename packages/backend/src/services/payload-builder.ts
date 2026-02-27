import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { devices } from '../db/schema.js';

export interface PushPayload {
  // Required
  title: string;

  // Content
  body?: string;
  icon?: string;
  image?: string;
  badge?: string;
  sound?: string;

  // Behavior
  tag?: string; // Prevents duplicate notifications
  renotify?: boolean; // Replace existing notification with same tag
  requireInteraction?: boolean; // Keep notification until user interacts
  silent?: boolean; // No sound/vibration
  timestamp?: number; // Custom timestamp

  // Display
  dir?: 'auto' | 'ltr' | 'rtl';
  lang?: string;
  vibrate?: number[]; // Vibration pattern [200, 100, 200]

  // Actions
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
    placeholder?: string; // For reply actions
  }>;

  // Data payload
  data?: {
    url?: string;
    deliveryId?: string;
    campaignId?: string;
    [key: string]: unknown;
  };

  // TTL
  ttl?: number; // Time to live in seconds
}

export interface PayloadContext {
  platform: 'ios' | 'android' | 'desktop' | 'tablet';
  browserName?: string;
  browserVersion?: string;
  osVersion?: string;
  supportsActions: boolean;
  supportsImages: boolean;
  supportsSilent: boolean;
  supportsVibrate: boolean;
  supportsBadge: boolean;
  supportsRenotify: boolean;
  supportsRequireInteraction: boolean;
  supportsTimestamp: boolean;
}

// Platform-specific character limits
const PLATFORM_LIMITS: Record<string, { title: number; body: number }> = {
  ios: { title: 30, body: 100 },
  android: { title: 50, body: 120 },
  desktop: { title: 50, body: 120 },
  tablet: { title: 50, body: 120 },
};

const BROWSER_LIMITS: Record<string, { title: number; body: number }> = {
  Safari: { title: 30, body: 100 },
  'Mobile Safari': { title: 30, body: 100 },
  Chrome: { title: 50, body: 120 },
  Firefox: { title: 50, body: 120 },
  Edge: { title: 50, body: 120 },
  Opera: { title: 50, body: 120 },
};

export const payloadBuilder = {
  /**
   * Get payload context from device ID
   */
  async getContextFromDevice(deviceId: string): Promise<PayloadContext | null> {
    const device = await db.select().from(devices).where(eq(devices.id, deviceId)).limit(1);

    if (device.length === 0) return null;

    const d = device[0];
    return {
      platform: d.platform as 'ios' | 'android' | 'desktop' | 'tablet',
      browserName: d.browserName ?? undefined,
      browserVersion: d.browserVersion ?? undefined,
      osVersion: d.osVersion ?? undefined,
      supportsActions: d.supportsActions ?? false,
      supportsImages: d.supportsImages ?? false,
      supportsSilent: d.supportsSilent ?? false,
      supportsVibrate: d.supportsVibrate ?? false,
      supportsBadge: d.supportsBadge ?? false,
      supportsRenotify: d.platform !== 'ios', // iOS doesn't support renotify
      supportsRequireInteraction: d.platform !== 'ios', // iOS doesn't support requireInteraction
      supportsTimestamp: d.platform !== 'ios', // iOS doesn't support custom timestamp
    };
  },

  /**
   * Trim title/body to platform-specific limits
   */
  trimForPlatform(payload: PushPayload, context: PayloadContext): PushPayload {
    // Get browser-specific limits first, then fall back to platform limits
    let limits = BROWSER_LIMITS[context.browserName || ''];
    if (!limits) {
      limits = PLATFORM_LIMITS[context.platform] || { title: 50, body: 120 };
    }

    const trimmed: PushPayload = {
      ...payload,
      title: payload.title?.substring(0, limits.title),
      body: payload.body?.substring(0, limits.body),
    };

    // Remove unsupported options based on device capabilities
    if (!context.supportsActions || context.platform === 'ios') {
      trimmed.actions = undefined;
    }

    if (!context.supportsImages || context.platform === 'ios') {
      trimmed.image = undefined;
    }

    if (!context.supportsSilent || context.platform === 'ios') {
      trimmed.silent = undefined;
    }

    if (!context.supportsVibrate || context.platform === 'ios') {
      trimmed.vibrate = undefined;
    }

    if (!context.supportsBadge) {
      trimmed.badge = undefined;
    }

    if (!context.supportsRenotify) {
      trimmed.renotify = undefined;
    }

    if (!context.supportsRequireInteraction) {
      trimmed.requireInteraction = undefined;
    }

    if (!context.supportsTimestamp) {
      trimmed.timestamp = undefined;
    }

    // Remove placeholder from actions for browsers that don't support reply
    if (trimmed.actions && context.platform === 'ios') {
      trimmed.actions = trimmed.actions.map((action) => ({
        ...action,
        placeholder: undefined,
      }));
    }

    return trimmed;
  },

  /**
   * Generate platform-optimized vibrate patterns
   */
  getVibratePattern(context: PayloadContext): number[] | undefined {
    if (context.platform === 'ios' || !context.supportsVibrate) {
      return undefined;
    }
    if (context.platform === 'android') {
      return [0, 200, 100, 200];
    }
    // Default pattern for desktop
    return [200, 100, 200];
  },

  /**
   * Add urgency-based priority for Web Push
   */
  getUrgencyHeader(priority?: 'low' | 'normal' | 'high'): string {
    switch (priority) {
      case 'low':
        return 'very-low';
      case 'high':
        return 'high';
      default:
        return 'normal';
    }
  },

  /**
   * Calculate TTL based on priority
   */
  getTTL(priority?: 'low' | 'normal' | 'high'): number {
    switch (priority) {
      case 'low':
        return 24 * 60 * 60; // 24 hours
      case 'high':
        return 30 * 60; // 30 minutes
      default:
        return 4 * 60 * 60; // 4 hours
    }
  },

  /**
   * Validate payload size (Web Push has a 4KB limit)
   */
  validatePayloadSize(payload: PushPayload): { valid: boolean; size: number; error?: string } {
    // Create a copy with only the data that will be sent
    const dataToSend = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon,
      image: payload.image,
      badge: payload.badge,
      vibrate: payload.vibrate,
      tag: payload.tag,
      renotify: payload.renotify,
      requireInteraction: payload.requireInteraction,
      silent: payload.silent,
      timestamp: payload.timestamp,
      actions: payload.actions?.map((a) => ({
        action: a.action,
        title: a.title,
        icon: a.icon,
      })),
      data: payload.data,
    };

    const jsonSize = JSON.stringify(dataToSend).length;
    const maxSize = 4096; // 4KB

    if (jsonSize > maxSize) {
      return {
        valid: false,
        size: jsonSize,
        error: `Payload size (${jsonSize} bytes) exceeds Web Push limit (${maxSize} bytes)`,
      };
    }

    return { valid: true, size: jsonSize };
  },

  /**
   * Build complete payload optimized for a specific device
   */
  async buildForDevice(
    deviceId: string,
    basePayload: Omit<PushPayload, 'data'> & { data?: PushPayload['data'] }
  ): Promise<{
    payload: PushPayload;
    headers: Record<string, string>;
    valid: boolean;
    issues: string[];
  }> {
    const context = await this.getContextFromDevice(deviceId);
    const issues: string[] = [];

    if (!context) {
      return {
        payload: basePayload as PushPayload,
        headers: {},
        valid: false,
        issues: ['Device not found'],
      };
    }

    // Trim for platform
    let payload = this.trimForPlatform(basePayload as PushPayload, context);

    // Add vibrate pattern if not set
    if (!payload.vibrate && context.supportsVibrate) {
      payload.vibrate = this.getVibratePattern(context);
    }

    // Validate size
    const sizeCheck = this.validatePayloadSize(payload);
    if (!sizeCheck.valid) {
      issues.push(sizeCheck.error || 'Payload too large');

      // Try to fix by removing optional fields
      if (payload.image) {
        payload = { ...payload, image: undefined };
        const retryCheck = this.validatePayloadSize(payload);
        if (retryCheck.valid) {
          issues.pop();
        }
      }

      if (payload.actions && payload.actions.length > 0) {
        payload = { ...payload, actions: undefined };
        const retryCheck = this.validatePayloadSize(payload);
        if (retryCheck.valid) {
          issues.pop();
        }
      }
    }

    // Build headers
    const headers: Record<string, string> = {
      TTL: String(payload.ttl || this.getTTL(basePayload.data?.priority as any)),
      Urgency: this.getUrgencyHeader(basePayload.data?.priority as any),
      Topic: payload.tag || '',
    };

    // Clean up empty headers
    if (!headers.Topic) {
      delete headers.Topic;
    }

    return {
      payload,
      headers,
      valid: issues.length === 0,
      issues,
    };
  },
};

export default payloadBuilder;
