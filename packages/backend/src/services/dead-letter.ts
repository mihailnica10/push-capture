import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import type { FailedDelivery } from '../db/schema.js';
import { campaignDeliveries, failedDeliveries, subscriptions } from '../db/schema.js';
import { pushService } from './push.js';
import { extractErrorCode, getRetryConfigForError } from './retry.js';
import { logger } from '../lib/logger.js';

export type FailedDeliveryRecord = FailedDelivery;

export interface RetryResult {
  success: boolean;
  recovered: number;
  permanentlyFailed: number;
  stillPending: number;
}

/**
 * Dead letter queue service for handling failed push notification deliveries
 */
export const deadLetterService = {
  /**
   * Record a failed delivery attempt
   */
  async recordFailure(options: {
    deliveryId: string;
    campaignId?: string;
    subscriptionId?: string;
    error: Error;
    attempt: number;
    maxAttempts?: number;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const errorCode = extractErrorCode(options.error);
    const retryConfig = getRetryConfigForError(errorCode);
    const willRetry = options.attempt < (retryConfig.maxAttempts || options.maxAttempts || 3);

    // Calculate next retry time with exponential backoff
    let nextRetryAt: Date | null = null;
    if (willRetry) {
      const baseDelay = retryConfig.baseDelay || 1000;
      const delay = Math.min(baseDelay * 2 ** (options.attempt - 1), 60000);
      nextRetryAt = new Date(Date.now() + delay);
    }

    try {
      await db.insert(failedDeliveries).values({
        id: crypto.randomUUID(),
        deliveryId: options.deliveryId,
        campaignId: options.campaignId ?? null,
        subscriptionId: options.subscriptionId ?? null,
        errorCode,
        errorMessage: options.error.message,
        errorCategory: this.categorizeError(errorCode),
        attempt: options.attempt,
        maxAttempts: retryConfig.maxAttempts || options.maxAttempts || 3,
        willRetry,
        nextRetryAt,
        lastAttemptAt: new Date(),
        resolvedAt: null,
        metadata: options.metadata ?? null,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to record dead letter');
    }
  },

  /**
   * Categorize error code into high-level categories
   */
  categorizeError(errorCode: string): string {
    const categories: Record<string, string> = {
      EXPIRED: 'expired',
      PERMISSION_DENIED: 'permission',
      NOT_FOUND: 'endpoint_invalid',
      RATE_LIMITED: 'throttling',
      TIMEOUT: 'network',
      NETWORK: 'network',
      INVALID_PAYLOAD: 'payload_invalid',
      PAYLOAD_TOO_LARGE: 'payload_too_large',
      SERVER_ERROR: 'server_error',
      SERVICE_UNAVAILABLE: 'server_error',
      UNKNOWN: 'unknown',
    };

    return categories[errorCode] || 'unknown';
  },

  /**
   * Get deliveries that are ready for retry
   */
  async getRetryableDeliveries(limit: number = 100): Promise<FailedDelivery[]> {
    const now = new Date();

    return await db
      .select()
      .from(failedDeliveries)
      .where(
        and(eq(failedDeliveries.willRetry, true), sql`${failedDeliveries.nextRetryAt} <= ${now}`)
      )
      .orderBy(sql`${failedDeliveries.nextRetryAt} ASC`)
      .limit(limit);
  },

  /**
   * Get failed deliveries by category
   */
  async getByCategory(category: string, limit: number = 100): Promise<FailedDelivery[]> {
    return await db
      .select()
      .from(failedDeliveries)
      .where(eq(failedDeliveries.errorCategory, category))
      .orderBy(desc(failedDeliveries.lastAttemptAt))
      .limit(limit);
  },

  /**
   * Get failed deliveries for a specific campaign
   */
  async getByCampaign(campaignId: string): Promise<FailedDelivery[]> {
    return await db
      .select()
      .from(failedDeliveries)
      .where(eq(failedDeliveries.campaignId, campaignId))
      .orderBy(desc(failedDeliveries.lastAttemptAt));
  },

  /**
   * Get failed deliveries for a specific subscription
   */
  async getBySubscription(subscriptionId: string): Promise<FailedDelivery[]> {
    return await db
      .select()
      .from(failedDeliveries)
      .where(eq(failedDeliveries.subscriptionId, subscriptionId))
      .orderBy(desc(failedDeliveries.lastAttemptAt));
  },

  /**
   * Process retry queue - attempt to redeliver failed messages
   */
  async processRetryQueue(limit: number = 100): Promise<RetryResult> {
    const retryable = await this.getRetryableDeliveries(limit);

    const result: RetryResult = {
      success: false,
      recovered: 0,
      permanentlyFailed: 0,
      stillPending: 0,
    };

    for (const record of retryable) {
      try {
        // Get the original delivery details
        const delivery = await db
          .select()
          .from(campaignDeliveries)
          .where(eq(campaignDeliveries.id, record.deliveryId))
          .limit(1);

        if (delivery.length === 0) {
          // Delivery no longer exists, mark as resolved
          await this.markResolved(record.id, 'delivery_not_found');
          result.recovered++;
          continue;
        }

        const deliveryRecord = delivery[0];
        if (!deliveryRecord.subscriptionId) {
          await this.markResolved(record.id, 'no_subscription_id');
          result.permanentlyFailed++;
          continue;
        }

        // Get subscription
        const subscription = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.id, deliveryRecord.subscriptionId))
          .limit(1);

        if (subscription.length === 0) {
          await this.markResolved(record.id, 'subscription_not_found');
          result.permanentlyFailed++;
          continue;
        }

        // Attempt to resend
        const sendResult = await pushService.sendToSubscription(
          deliveryRecord.subscriptionId,
          deliveryRecord.payload as any
        );

        if (sendResult.success) {
          // Update delivery status
          await db
            .update(campaignDeliveries)
            .set({
              status: 'sent',
              sentAt: new Date(),
              retryCount: sql`${campaignDeliveries.retryCount} + 1`,
            })
            .where(eq(campaignDeliveries.id, record.deliveryId));

          // Mark failed delivery record as resolved
          await this.markResolved(record.id, 'recovered');
          result.recovered++;
        } else {
          // Still failing, update the record
          const newAttempt = record.attempt + 1;
          const maxAttempts = record.maxAttempts ?? 3;
          const willRetry = newAttempt < maxAttempts;

          await db
            .update(failedDeliveries)
            .set({
              attempt: newAttempt,
              willRetry,
              nextRetryAt: willRetry
                ? new Date(Date.now() + Math.min(1000 * 2 ** newAttempt, 60000))
                : null,
              lastAttemptAt: new Date(),
              errorMessage: sendResult.error || 'Unknown error',
            })
            .where(eq(failedDeliveries.id, record.id));

          if (willRetry) {
            result.stillPending++;
          } else {
            result.permanentlyFailed++;
            await this.markResolved(record.id, 'max_attempts_reached');
          }
        }
      } catch (error) {
        logger.error({ deliveryId: record.deliveryId, error }, 'Failed to retry delivery');

        const newAttempt = record.attempt + 1;
        const maxAttempts = record.maxAttempts ?? 3;
        const willRetry = newAttempt < maxAttempts;

        await db
          .update(failedDeliveries)
          .set({
            attempt: newAttempt,
            willRetry,
            nextRetryAt: willRetry
              ? new Date(Date.now() + Math.min(1000 * 2 ** newAttempt, 60000))
              : null,
            lastAttemptAt: new Date(),
            errorMessage: (error as Error).message,
          })
          .where(eq(failedDeliveries.id, record.id));

        if (!willRetry) {
          result.permanentlyFailed++;
        }
      }
    }

    result.success =
      result.recovered > 0 || result.permanentlyFailed > 0 || result.stillPending > 0;
    return result;
  },

  /**
   * Mark a failed delivery as resolved
   */
  async markResolved(recordId: string, reason: string): Promise<void> {
    await db
      .update(failedDeliveries)
      .set({
        willRetry: false,
        resolvedAt: new Date(),
        metadata: sql`COALESCE(${failedDeliveries.metadata}, '{}'::jsonb) || jsonb_build_object('resolutionReason', ${reason})`,
      })
      .where(eq(failedDeliveries.id, recordId));
  },

  /**
   * Mark a failed delivery as permanently failed (no retry)
   */
  async markPermanentlyFailed(recordId: string, reason: string): Promise<void> {
    await db
      .update(failedDeliveries)
      .set({
        willRetry: false,
        resolvedAt: new Date(),
        metadata: sql`COALESCE(${failedDeliveries.metadata}, '{}'::jsonb) || jsonb_build_object('permanentFailureReason', ${reason})`,
      })
      .where(eq(failedDeliveries.id, recordId));
  },

  /**
   * Get statistics about failed deliveries
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    resolved: number;
    byCategory: Record<string, number>;
    byErrorCode: Record<string, number>;
  }> {
    const total = await db.select({ count: sql<number>`COUNT(*)` }).from(failedDeliveries);

    const pending = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(failedDeliveries)
      .where(eq(failedDeliveries.willRetry, true));

    const resolved = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(failedDeliveries)
      .where(sql`${failedDeliveries.resolvedAt} IS NOT NULL`);

    const byCategoryResult = await db
      .select({
        category: failedDeliveries.errorCategory,
        count: sql<number>`COUNT(*)`,
      })
      .from(failedDeliveries)
      .groupBy(failedDeliveries.errorCategory);

    const byErrorCodeResult = await db
      .select({
        code: failedDeliveries.errorCode,
        count: sql<number>`COUNT(*)`,
      })
      .from(failedDeliveries)
      .groupBy(failedDeliveries.errorCode);

    return {
      total: total[0]?.count || 0,
      pending: pending[0]?.count || 0,
      resolved: resolved[0]?.count || 0,
      byCategory: byCategoryResult.reduce(
        (acc, row) => {
          acc[row.category || 'unknown'] = row.count;
          return acc;
        },
        {} as Record<string, number>
      ),
      byErrorCode: byErrorCodeResult.reduce(
        (acc, row) => {
          acc[row.code || 'unknown'] = row.count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  },

  /**
   * Clean up old resolved records
   */
  async cleanup(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deleted = await db
      .delete(failedDeliveries)
      .where(
        and(
          sql`${failedDeliveries.resolvedAt} IS NOT NULL`,
          sql`${failedDeliveries.resolvedAt} < ${cutoffDate}`
        )
      )
      .returning({ id: failedDeliveries.id });

    return deleted.length;
  },
};

export default deadLetterService;
