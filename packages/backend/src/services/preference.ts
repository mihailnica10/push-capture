import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import type { NewNotificationPreference } from '../db/schema.js';
import { devices, notificationPreferences } from '../db/schema.js';

export interface PreferenceUpdate {
  optInStatus?: boolean;
  preferredTimezones?: string[];
  preferredHours?: number[];
  preferredDays?: number[];
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  quietHoursTimezone?: string;
  maxPerHour?: number;
  maxPerDay?: number;
  maxPerWeek?: number;
  categoriesEnabled?: string[];
  categoriesDisabled?: string[];
  enableSound?: boolean;
  enableVibration?: boolean;
  enableBadge?: boolean;
  enableImages?: boolean;
  dndUntil?: Date;
  dndReason?: string;
  autoOptimize?: boolean;
}

export const preferenceService = {
  async getBySubscription(subscriptionId: string) {
    const result = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.subscriptionId, subscriptionId))
      .limit(1);

    return result[0] || null;
  },

  async getByDeviceFingerprint(fingerprint: string) {
    const result = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.deviceFingerprint, fingerprint))
      .limit(1);

    return result[0] || null;
  },

  async create(subscriptionId: string, deviceFingerprint?: string) {
    const preference: NewNotificationPreference = {
      id: crypto.randomUUID(),
      subscriptionId,
      deviceFingerprint,
      optInStatus: true,
      createdAt: new Date(),
    };

    await db.insert(notificationPreferences).values(preference);
    return preference;
  },

  async getOrCreate(subscriptionId: string) {
    const existing = await this.getBySubscription(subscriptionId);
    if (existing) return existing;

    // Get device fingerprint
    const device = await db
      .select({ deviceFingerprint: devices.deviceFingerprint })
      .from(devices)
      .where(eq(devices.subscriptionId, subscriptionId))
      .limit(1);

    return await this.create(subscriptionId, device[0]?.deviceFingerprint ?? undefined);
  },

  async update(subscriptionId: string, updates: PreferenceUpdate) {
    const existing = await this.getBySubscription(subscriptionId);

    if (!existing) {
      // Create if doesn't exist
      const _preference = await this.create(subscriptionId);
      // Perform the update after creation
      return await this.performUpdate(subscriptionId, updates);
    }

    return await this.performUpdate(subscriptionId, updates);
  },

  async performUpdate(subscriptionId: string, updates: PreferenceUpdate) {
    const updateData: Partial<NewNotificationPreference> = {
      ...updates,
      updatedAt: new Date(),
    };

    if (updates.optInStatus !== undefined) {
      updateData.optInChangedAt = new Date();
    }

    const result = await db
      .update(notificationPreferences)
      .set(updateData)
      .where(eq(notificationPreferences.subscriptionId, subscriptionId))
      .returning();

    return result[0] || null;
  },

  async setDnd(subscriptionId: string, until: Date, reason?: string) {
    return await this.update(subscriptionId, {
      dndUntil: until,
      dndReason: reason,
    });
  },

  async clearDnd(subscriptionId: string) {
    return await this.update(subscriptionId, {
      dndUntil: undefined,
      dndReason: undefined,
    });
  },

  async toggleOptIn(subscriptionId: string, optIn: boolean) {
    return await this.update(subscriptionId, {
      optInStatus: optIn,
    });
  },

  async updateCategories(subscriptionId: string, enabled: string[], disabled: string[]) {
    return await this.update(subscriptionId, {
      categoriesEnabled: enabled,
      categoriesDisabled: disabled,
    });
  },

  async updateQuietHours(
    subscriptionId: string,
    enabled: boolean,
    start: string,
    end: string,
    timezone?: string
  ) {
    return await this.update(subscriptionId, {
      quietHoursEnabled: enabled,
      quietHoursStart: start,
      quietHoursEnd: end,
      quietHoursTimezone: timezone,
    });
  },

  async updateFrequencyCaps(
    subscriptionId: string,
    maxPerHour?: number,
    maxPerDay?: number,
    maxPerWeek?: number
  ) {
    return await this.update(subscriptionId, {
      maxPerHour,
      maxPerDay,
      maxPerWeek,
    });
  },
};
