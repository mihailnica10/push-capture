import { desc, eq, sql } from 'drizzle-orm';
import { UAParser } from 'ua-parser-js';
import { db } from '../db/index.js';
import { devices, type NewDevice } from '../db/schema.js';

export interface DeviceInfo {
  userAgent: string;
  platform?: 'ios' | 'android' | 'desktop' | 'tablet';
  deviceType?: 'mobile' | 'desktop' | 'tablet' | 'wearable';
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceModel?: string;
  deviceVendor?: string;
  screenResolution?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  pixelRatio?: number;
  networkType?: string;
  connectionDownlink?: number;
  connectionRtt?: number;
  saveData?: boolean;
  deviceMemory?: number;
  cpuCores?: number;
  gpuVendor?: string;
  batteryLevel?: number;
  isCharging?: boolean;
  timezone?: string;
  timezoneOffset?: number;
  supportsVibrate?: boolean;
}

function parseDeviceInfo(deviceInfo: DeviceInfo) {
  const parser = new UAParser(deviceInfo.userAgent);
  const result = parser.getResult();

  const rawDeviceType = result.device.type || deviceInfo.deviceType || 'desktop';
  const deviceType: 'mobile' | 'desktop' | 'tablet' | 'wearable' =
    rawDeviceType === 'mobile' || rawDeviceType === 'tablet' || rawDeviceType === 'wearable'
      ? rawDeviceType
      : 'desktop';

  return {
    platform: getPlatform(result, deviceInfo.platform, deviceType),
    deviceType,
    browserName: result.browser.name,
    browserVersion: result.browser.version,
    osName: result.os.name,
    osVersion: result.os.version,
    deviceModel: result.device.model,
    deviceVendor: result.device.vendor,
  };
}

function getPlatform(
  result: UAParser.IResult,
  providedPlatform?: string,
  deviceType?: string
): 'ios' | 'android' | 'desktop' | 'tablet' {
  if (
    providedPlatform === 'ios' ||
    providedPlatform === 'android' ||
    providedPlatform === 'desktop' ||
    providedPlatform === 'tablet'
  ) {
    return providedPlatform;
  }
  const os = result.os.name?.toLowerCase() || '';
  if (os === 'ios') return 'ios';
  if (os === 'android') return 'android';
  if (deviceType === 'tablet') return 'tablet';
  return 'desktop';
}

function generateFingerprint(info: DeviceInfo): string {
  const data = `${info.userAgent}|${info.screenResolution}|${info.timezone}`;
  // Simple hash - in production use crypto.subtle.digest
  return Buffer.from(data).toString('base64').replace(/[/+=]/g, '').substring(0, 32);
}

function detectActionsSupport(platform: string, browserName?: string): boolean {
  // iOS Safari doesn't support actions
  return platform !== 'ios' && browserName !== 'Safari';
}

function detectImageSupport(platform: string): boolean {
  // iOS Safari doesn't support image in notifications
  return platform !== 'ios';
}

function detectSilentSupport(platform: string): boolean {
  // iOS doesn't support silent notifications
  return platform !== 'ios';
}

function detectVibrateSupport(platform: string, supportsVibrate?: boolean): boolean {
  // iOS Safari doesn't support vibrate
  return platform !== 'ios' && supportsVibrate === true;
}

function detectBadgeSupport(platform: string): boolean {
  // iOS Safari doesn't support badge
  return platform !== 'ios';
}

export const deviceService = {
  async registerDevice(subscriptionId: string, deviceInfo: DeviceInfo) {
    const parsed = parseDeviceInfo(deviceInfo);
    const fingerprint = generateFingerprint(deviceInfo);

    // Check if device already exists for this subscription
    const existing = await db
      .select()
      .from(devices)
      .where(eq(devices.subscriptionId, subscriptionId))
      .limit(1);

    const deviceData: NewDevice = {
      id: crypto.randomUUID(),
      subscriptionId,
      deviceFingerprint: fingerprint,
      userAgent: deviceInfo.userAgent,
      platform: parsed.platform,
      deviceType: parsed.deviceType,
      browserName: parsed.browserName,
      browserVersion: parsed.browserVersion,
      osName: parsed.osName,
      osVersion: parsed.osVersion,
      deviceModel: parsed.deviceModel,
      deviceVendor: parsed.deviceVendor,
      screenResolution: deviceInfo.screenResolution,
      viewportWidth: deviceInfo.viewportWidth,
      viewportHeight: deviceInfo.viewportHeight,
      pixelRatio: deviceInfo.pixelRatio?.toString(),
      networkType: deviceInfo.networkType,
      connectionDownlink: deviceInfo.connectionDownlink?.toString(),
      connectionRtt: deviceInfo.connectionRtt,
      saveData: deviceInfo.saveData,
      deviceMemory: deviceInfo.deviceMemory?.toString(),
      cpuCores: deviceInfo.cpuCores,
      gpuVendor: deviceInfo.gpuVendor,
      batteryLevel: deviceInfo.batteryLevel?.toString(),
      isCharging: deviceInfo.isCharging,
      timezone: deviceInfo.timezone,
      timezoneOffset: deviceInfo.timezoneOffset,
      supportsActions: detectActionsSupport(parsed.platform, parsed.browserName),
      supportsImages: detectImageSupport(parsed.platform),
      supportsSilent: detectSilentSupport(parsed.platform),
      supportsVibrate: detectVibrateSupport(parsed.platform, deviceInfo.supportsVibrate),
      supportsBadge: detectBadgeSupport(parsed.platform),
      firstSeen: new Date(),
      lastSeen: new Date(),
    };

    if (existing.length > 0) {
      // Update existing device
      await db
        .update(devices)
        .set({
          ...deviceData,
          id: existing[0].id,
          firstSeen: existing[0].firstSeen,
          updatedAt: new Date(),
        })
        .where(eq(devices.id, existing[0].id));
      return { ...deviceData, id: existing[0].id };
    }

    await db.insert(devices).values(deviceData);
    return deviceData;
  },

  async updateLastSeen(deviceId: string) {
    await db
      .update(devices)
      .set({ lastSeen: new Date(), updatedAt: new Date() })
      .where(eq(devices.id, deviceId));
  },

  async getBySubscription(subscriptionId: string) {
    return await db
      .select()
      .from(devices)
      .where(eq(devices.subscriptionId, subscriptionId))
      .limit(1);
  },

  async getStats() {
    // Get counts by platform
    const platformStats = await db
      .select({
        platform: devices.platform,
        count: sql<number>`COUNT(*)`,
      })
      .from(devices)
      .groupBy(devices.platform);

    // Get counts by browser
    const browserStats = await db
      .select({
        browserName: devices.browserName,
        count: sql<number>`COUNT(*)`,
      })
      .from(devices)
      .groupBy(devices.browserName)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10);

    // Get total devices
    const totalResult = await db.select({ count: sql<number>`COUNT(*)` }).from(devices);

    return {
      total: totalResult[0]?.count || 0,
      byPlatform: platformStats,
      byBrowser: browserStats,
    };
  },

  async getDeviceFingerprint(subscriptionId: string): Promise<string | null> {
    const device = await db
      .select({ deviceFingerprint: devices.deviceFingerprint })
      .from(devices)
      .where(eq(devices.subscriptionId, subscriptionId))
      .limit(1);

    return device[0]?.deviceFingerprint || null;
  },
};
