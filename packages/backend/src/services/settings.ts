import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { systemSettings } from '../db/schema.js';

interface SettingValue {
  [key: string]: unknown;
}

export const settingsService = {
  async get(key: string): Promise<SettingValue | null> {
    const result = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);
    return (result[0]?.value as SettingValue) || null;
  },

  async getByCategory(category: string): Promise<Record<string, SettingValue>> {
    const results = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.category, category));
    const settings: Record<string, SettingValue> = {};
    for (const row of results) {
      settings[row.key] = row.value as SettingValue;
    }
    return settings;
  },

  async getAll(): Promise<Record<string, SettingValue>> {
    const results = await db.select().from(systemSettings);
    const settings: Record<string, SettingValue> = {};
    for (const row of results) {
      settings[row.key] = row.value as SettingValue;
    }
    return settings;
  },

  async set(
    key: string,
    value: SettingValue,
    options: { category?: string; description?: string } = {}
  ): Promise<void> {
    const { category = 'general', description } = options;
    await db
      .insert(systemSettings)
      .values({
        key,
        value: value as never,
        category,
        description,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: value as never,
          category,
          description,
          updatedAt: new Date(),
        },
      });
  },

  async setMany(
    settings: Array<{ key: string; value: SettingValue; category?: string; description?: string }>
  ): Promise<void> {
    for (const setting of settings) {
      await this.set(setting.key, setting.value, {
        category: setting.category,
        description: setting.description,
      });
    }
  },

  async delete(key: string): Promise<boolean> {
    const result = await db.delete(systemSettings).where(eq(systemSettings.key, key));
    return (result.rowCount || 0) > 0;
  },

  async initializeDefaults(): Promise<void> {
    const defaults = [
      {
        key: 'app.name',
        value: 'Push Capture',
        category: 'general',
        description: 'Application name',
      },
      { key: 'app.timezone', value: 'UTC', category: 'general', description: 'Default timezone' },
      { key: 'app.language', value: 'en', category: 'general', description: 'Default language' },
      {
        key: 'limits.maxDailyNotifications',
        value: 10,
        category: 'limits',
        description: 'Max daily notifications per subscriber',
      },
      {
        key: 'limits.maxHourlyNotifications',
        value: 3,
        category: 'limits',
        description: 'Max hourly notifications per subscriber',
      },
      {
        key: 'limits.maxCampaignPerHour',
        value: 1000,
        category: 'limits',
        description: 'Max campaign sends per hour',
      },
      {
        key: 'retention.eventsDays',
        value: 90,
        category: 'retention',
        description: 'Days to keep notification events',
      },
      {
        key: 'retention.trafficDays',
        value: 30,
        category: 'retention',
        description: 'Days to keep traffic captures',
      },
      {
        key: 'retention.analyticsDays',
        value: 365,
        category: 'retention',
        description: 'Days to keep analytics data',
      },
      {
        key: 'analytics.enabled',
        value: true,
        category: 'analytics',
        description: 'Enable analytics tracking',
      },
      {
        key: 'analytics.sampleRate',
        value: 1.0,
        category: 'analytics',
        description: 'Analytics sampling rate (0-1)',
      },
      { key: 'ui.theme', value: 'light', category: 'ui', description: 'Default UI theme' },
      { key: 'ui.timezone', value: 'UTC', category: 'ui', description: 'Default UI timezone' },
      {
        key: 'ui.dateFormat',
        value: 'MM/DD/YYYY',
        category: 'ui',
        description: 'Date format for display',
      },
    ];
    for (const setting of defaults) {
      const existing = await this.get(setting.key);
      if (!existing) {
        await this.set(setting.key, setting.value as SettingValue, {
          category: setting.category,
          description: setting.description,
        });
      }
    }
  },

  async getGrouped(): Promise<Record<string, Record<string, SettingValue>>> {
    const results = await db.select().from(systemSettings);
    const grouped: Record<string, Record<string, SettingValue>> = {};
    for (const row of results) {
      if (!grouped[row.category]) grouped[row.category] = {};
      grouped[row.category][row.key] = row.value as SettingValue;
    }
    return grouped;
  },

  validate(key: string, value: SettingValue): boolean {
    switch (key) {
      case 'app.timezone':
        try {
          Intl.DateTimeFormat(undefined, { timeZone: value as string });
          return true;
        } catch {
          return false;
        }
      case 'limits.maxDailyNotifications':
      case 'limits.maxHourlyNotifications':
      case 'limits.maxCampaignPerHour':
        return typeof value === 'number' && value > 0;
      case 'analytics.sampleRate':
        return typeof value === 'number' && value >= 0 && value <= 1;
      case 'ui.theme':
        return ['light', 'dark', 'system'].includes(value as string);
      default:
        return true;
    }
  },
};
