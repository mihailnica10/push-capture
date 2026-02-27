import { eq } from 'drizzle-orm';
import * as webpush from 'web-push';
import { db } from '../db/index.js';
import { vapidConfig } from '../db/schema.js';

const VAPID_KEY_ROTATION_DAYS = 90; // Rotate keys every 90 days
const VAPID_MIN_VALIDITY_DAYS = 7; // Minimum days before considering rotation

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

export interface VapidConfigWithMeta extends VapidKeys {
  id: string;
  subject: string;
  createdAt: Date;
  updatedAt: Date;
  daysUntilRotation: number;
  needsRotation: boolean;
}

/**
 * Service for managing VAPID key rotation
 */
export const vapidRotationService = {
  /**
   * Get current VAPID keys from database
   */
  async getCurrentKeys(): Promise<VapidKeys | null> {
    const result = await db.select().from(vapidConfig).limit(1);
    if (result.length === 0) return null;

    return {
      publicKey: result[0].publicKey,
      privateKey: result[0].privateKey,
    };
  },

  /**
   * Get full VAPID config with metadata
   */
  async getConfigWithMeta(): Promise<VapidConfigWithMeta | null> {
    const result = await db.select().from(vapidConfig).limit(1);
    if (result.length === 0) return null;

    const config = result[0];
    const now = new Date();
    const createdAt = new Date(config.createdAt);
    const daysSinceCreation = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      publicKey: config.publicKey,
      privateKey: config.privateKey,
      id: config.id,
      subject: config.subject,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      daysUntilRotation: Math.max(0, VAPID_KEY_ROTATION_DAYS - daysSinceCreation),
      needsRotation: daysSinceCreation >= VAPID_KEY_ROTATION_DAYS,
    };
  },

  /**
   * Check if keys should be rotated
   */
  async shouldRotateKeys(): Promise<boolean> {
    const config = await this.getConfigWithMeta();
    if (!config) return true; // No keys exist, need to create
    return config.needsRotation;
  },

  /**
   * Check if keys are approaching rotation time
   */
  async needsRotationSoon(daysThreshold: number = VAPID_MIN_VALIDITY_DAYS): Promise<boolean> {
    const config = await this.getConfigWithMeta();
    if (!config) return true;
    return config.daysUntilRotation <= daysThreshold;
  },

  /**
   * Generate new VAPID keys
   */
  generateKeys(): VapidKeys {
    return webpush.generateVAPIDKeys();
  },

  /**
   * Rotate VAPID keys - generate new ones and update database
   */
  async rotateKeys(subject?: string): Promise<VapidKeys> {
    const current = await this.getCurrentKeys();

    // Generate new keys
    const newKeys = this.generateKeys();

    // Get existing subject or use provided one
    let vapidSubject = subject;
    if (!vapidSubject) {
      const existingConfig = await db.select().from(vapidConfig).limit(1);
      vapidSubject = existingConfig[0]?.subject;
      if (!vapidSubject) {
        throw new Error('No VAPID subject found in database and none provided');
      }
    }

    if (current) {
      // Update existing
      await db
        .update(vapidConfig)
        .set({
          publicKey: newKeys.publicKey,
          privateKey: newKeys.privateKey,
          subject: vapidSubject,
          updatedAt: new Date(),
        })
        .where(eq(vapidConfig.id, 'default'));
    } else {
      // Create new
      await db.insert(vapidConfig).values({
        id: 'default',
        publicKey: newKeys.publicKey,
        privateKey: newKeys.privateKey,
        subject: vapidSubject,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return newKeys;
  },

  /**
   * Get current keys or rotate if needed
   */
  async getOrRotateKeys(forceRotation: boolean = false): Promise<VapidKeys> {
    if (forceRotation || (await this.shouldRotateKeys())) {
      return await this.rotateKeys();
    }
    const keys = await this.getCurrentKeys();
    if (!keys) {
      return await this.rotateKeys();
    }
    return keys;
  },

  /**
   * Get public key (for sending to clients)
   */
  async getPublicKey(): Promise<string> {
    const keys = await this.getCurrentKeys();
    if (!keys) {
      const newKeys = await this.rotateKeys();
      return newKeys.publicKey;
    }
    return keys.publicKey;
  },

  /**
   * Validate VAPID keys format
   */
  validateKeys(keys: VapidKeys): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if keys are base64url strings
    const base64urlRegex = /^[a-zA-Z0-9_-]+$/;

    if (!keys.publicKey || !base64urlRegex.test(keys.publicKey)) {
      errors.push('Public key must be a valid base64url-encoded string');
    }

    if (!keys.privateKey || !base64urlRegex.test(keys.privateKey)) {
      errors.push('Private key must be a valid base64url-encoded string');
    }

    // Check lengths (VAPID keys are typically 65 and 32 bytes respectively)
    // Base64url encoding would be approximately 87 and 43 characters
    if (keys.publicKey && keys.publicKey.length < 80) {
      errors.push('Public key appears too short');
    }

    if (keys.privateKey && keys.privateKey.length < 40) {
      errors.push('Private key appears too short');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Initialize VAPID keys if they don't exist
   */
  async initialize(subject?: string): Promise<VapidKeys> {
    const existing = await this.getCurrentKeys();
    if (existing) {
      return existing;
    }

    return await this.rotateKeys(subject);
  },

  /**
   * Get rotation schedule info
   */
  async getRotationSchedule(): Promise<{
    lastRotation: Date | null;
    nextRotation: Date | null;
    daysUntilRotation: number;
    needsRotation: boolean;
  }> {
    const config = await db.select().from(vapidConfig).limit(1);

    if (config.length === 0) {
      return {
        lastRotation: null,
        nextRotation: null,
        daysUntilRotation: 0,
        needsRotation: true,
      };
    }

    const lastRotation = new Date(config[0].createdAt);
    const nextRotation = new Date(lastRotation);
    nextRotation.setDate(nextRotation.getDate() + VAPID_KEY_ROTATION_DAYS);

    const now = new Date();
    const daysUntilRotation = Math.max(
      0,
      Math.ceil((nextRotation.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
      lastRotation,
      nextRotation,
      daysUntilRotation,
      needsRotation: daysUntilRotation === 0,
    };
  },
};

/**
 * Middleware to ensure VAPID keys are initialized before handling requests
 */
export async function ensureVapidKeys(): Promise<void> {
  await vapidRotationService.initialize();
}

export default vapidRotationService;
