import { desc, eq, sql } from 'drizzle-orm';
import * as webpush from 'web-push';
import { db } from '../db/index.js';
import { subscriptionHealthChecks, subscriptions } from '../db/schema.js';
import { retryManager } from './retry.js';
import { logger } from '../lib/logger.js';

export interface SubscriptionHealthResult {
  valid: boolean;
  issues: string[];
  recommendation?: string;
  statusCode?: number;
  responseTime?: number;
}

export interface BatchHealthResult {
  healthy: string[];
  unhealthy: Array<{ id: string; issue: string; statusCode?: number }>;
  unknown: Array<{ id: string; issue: string }>;
}

/**
 * Service for checking subscription health and validating endpoints
 */
export const subscriptionHealthService = {
  /**
   * Validate a single subscription by making a test request to its endpoint
   */
  async validateSubscription(subscriptionId: string): Promise<SubscriptionHealthResult> {
    // Get subscription
    const subResult = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (subResult.length === 0) {
      return {
        valid: false,
        issues: ['Subscription not found'],
        recommendation: 'Remove from database',
      };
    }

    const subscription = subResult[0];
    const issues: string[] = [];
    const startTime = Date.now();
    let statusCode: number | undefined;
    let responseTime: number | undefined;

    // Check if status is already failed/inactive
    if (subscription.status === 'inactive' || subscription.status === 'failed') {
      return {
        valid: false,
        issues: [`Subscription is ${subscription.status}`],
        recommendation: 'Request re-subscription',
        statusCode: 410,
      };
    }

    // Test the endpoint with a minimal payload
    try {
      // Create web-push subscription object
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      // Try to send a minimal test notification (TTL: 0 so it doesn't actually deliver)
      const result = await retryManager.withRetry(
        async () => {
          return await webpush.sendNotification(pushSubscription, JSON.stringify({ test: true }), {
            TTL: 0,
            urgency: 'very-low',
          });
        },
        { maxAttempts: 1 }
      );

      responseTime = Date.now() - startTime;

      if (result.success) {
        // Subscription is healthy - record the health check
        await this.recordHealthCheck(subscriptionId, 'healthy', 200, responseTime);
        return {
          valid: true,
          issues: [],
          responseTime,
        };
      } else if (result.error) {
        statusCode = this.extractStatusCode(result.error);
        issues.push(this.getErrorMessage(statusCode ?? 500, result.error.message));
        await this.recordHealthCheck(
          subscriptionId,
          'unhealthy',
          statusCode ?? 500,
          responseTime,
          result.error.message
        );
      }
    } catch (error) {
      responseTime = Date.now() - startTime;
      const err = error as Error;
      statusCode = this.extractStatusCode(err) || 500;

      if (statusCode === 410) {
        issues.push('Subscription expired (410 Gone)');
        issues.push('Endpoint no longer valid');
        await this.recordHealthCheck(
          subscriptionId,
          'expired',
          statusCode,
          responseTime,
          err.message
        );

        // Mark subscription as inactive
        await db
          .update(subscriptions)
          .set({ status: 'inactive', updatedAt: new Date() })
          .where(eq(subscriptions.id, subscriptionId));

        return {
          valid: false,
          issues,
          recommendation: 'Request re-subscription',
          statusCode,
          responseTime,
        };
      } else if (statusCode === 404 || statusCode === 413) {
        issues.push(`Invalid endpoint (${statusCode})`);
        await this.recordHealthCheck(
          subscriptionId,
          'unhealthy',
          statusCode,
          responseTime,
          err.message
        );
      } else if (statusCode === 429) {
        issues.push('Rate limited - endpoint may be valid but throttled');
        await this.recordHealthCheck(
          subscriptionId,
          'unhealthy',
          statusCode,
          responseTime,
          err.message
        );
      } else if (statusCode === 403 || statusCode === 401) {
        issues.push(`Authentication failed (${statusCode})`);
        issues.push('Keys may be invalid or expired');
        await this.recordHealthCheck(
          subscriptionId,
          'unhealthy',
          statusCode,
          responseTime,
          err.message
        );
      } else if (err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND')) {
        issues.push('Endpoint unreachable (network error)');
        await this.recordHealthCheck(
          subscriptionId,
          'unhealthy',
          statusCode,
          responseTime,
          err.message
        );
      } else {
        issues.push(`Unknown error: ${err.message}`);
        await this.recordHealthCheck(
          subscriptionId,
          'unknown',
          statusCode,
          responseTime,
          err.message
        );
      }
    }

    // Determine recommendation based on issues
    let recommendation: string | undefined;
    if (statusCode === 410) {
      recommendation = 'Request re-subscription';
    } else if (issues.length > 2) {
      recommendation = 'Remove subscription - too many errors';
    } else if (statusCode === 429) {
      recommendation = 'Retry later - rate limited';
    } else if (statusCode === 403 || statusCode === 401) {
      recommendation = 'Remove subscription - authentication failed';
    } else {
      recommendation = 'Retry later - transient error';
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendation,
      statusCode,
      responseTime,
    };
  },

  /**
   * Validate multiple subscriptions in parallel
   */
  async healthCheckBatch(subscriptionIds: string[]): Promise<BatchHealthResult> {
    // Process in batches of 10 to avoid overwhelming the system
    const batchSize = 10;
    const results: BatchHealthResult = {
      healthy: [],
      unhealthy: [],
      unknown: [],
    };

    for (let i = 0; i < subscriptionIds.length; i += batchSize) {
      const batch = subscriptionIds.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(async (id) => {
          const health = await this.validateSubscription(id);
          return { id, health };
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          const { id, health } = result.value;
          if (health.valid) {
            results.healthy.push(id);
          } else if (health.statusCode) {
            results.unhealthy.push({
              id,
              issue: health.issues.join(', '),
              statusCode: health.statusCode,
            });
          } else {
            results.unknown.push({
              id,
              issue: health.issues.join(', '),
            });
          }
        }
      }
    }

    return results;
  },

  /**
   * Run health check on all active subscriptions
   */
  async healthCheckAllActive(): Promise<BatchHealthResult> {
    const activeSubs = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    const subscriptionIds = activeSubs.map((s) => s.id);
    return await this.healthCheckBatch(subscriptionIds);
  },

  /**
   * Record health check result to database
   */
  async recordHealthCheck(
    subscriptionId: string,
    status: 'healthy' | 'unhealthy' | 'expired' | 'unknown',
    statusCode: number | undefined,
    responseTime: number | undefined,
    errorMessage?: string
  ): Promise<void> {
    try {
      await db.insert(subscriptionHealthChecks).values({
        id: crypto.randomUUID(),
        subscriptionId,
        status,
        statusCode,
        responseTime,
        errorMessage,
        checkedAt: new Date(),
      });
    } catch (error) {
      logger.error({ error }, 'Failed to record health check');
    }
  },

  /**
   * Get recent health check history for a subscription
   */
  async getHealthHistory(subscriptionId: string, limit: number = 10) {
    return await db
      .select()
      .from(subscriptionHealthChecks)
      .where(eq(subscriptionHealthChecks.subscriptionId, subscriptionId))
      .orderBy(desc(subscriptionHealthChecks.checkedAt))
      .limit(limit);
  },

  /**
   * Get health statistics across all subscriptions
   */
  async getHealthStats(): Promise<{
    total: number;
    healthy: number;
    unhealthy: number;
    expired: number;
    unknown: number;
    avgResponseTime: number;
  }> {
    const stats = await db
      .select({
        status: subscriptionHealthChecks.status,
        count: sql<number>`COUNT(*)`,
        avgResponseTime: sql<number>`AVG(${subscriptionHealthChecks.responseTime})`,
      })
      .from(subscriptionHealthChecks)
      .where(sql`${subscriptionHealthChecks.checkedAt} >= NOW() - INTERVAL '7 days'`)
      .groupBy(subscriptionHealthChecks.status);

    const result = {
      total: 0,
      healthy: 0,
      unhealthy: 0,
      expired: 0,
      unknown: 0,
      avgResponseTime: 0,
    };

    for (const stat of stats) {
      result.total += stat.count;
      if (stat.status === 'healthy') {
        result.healthy = stat.count;
      } else if (stat.status === 'unhealthy') {
        result.unhealthy = stat.count;
      } else if (stat.status === 'expired') {
        result.expired = stat.count;
      } else if (stat.status === 'unknown') {
        result.unknown = stat.count;
      }
      if (stat.avgResponseTime) {
        result.avgResponseTime += stat.avgResponseTime;
      }
    }

    // Average the response times
    const statusCount = stats.filter((s) => s.avgResponseTime !== null).length;
    if (statusCount > 0) {
      result.avgResponseTime = Math.round(result.avgResponseTime / statusCount);
    }

    return result;
  },

  /**
   * Extract HTTP status code from error message
   */
  extractStatusCode(error: Error): number | undefined {
    const message = error.message;

    // Try to extract status code from common patterns
    const statusMatch = message.match(/status\s+(\d{3})/i);
    if (statusMatch) {
      return parseInt(statusMatch[1], 10);
    }

    // Check for specific error codes in message
    if (message.includes('410') || message.toLowerCase().includes('gone')) return 410;
    if (message.includes('404') || message.toLowerCase().includes('not found')) return 404;
    if (message.includes('413') || message.toLowerCase().includes('payload too large')) return 413;
    if (
      message.includes('429') ||
      message.toLowerCase().includes('rate limit') ||
      message.toLowerCase().includes('too many requests')
    )
      return 429;
    if (message.includes('403') || message.toLowerCase().includes('forbidden')) return 403;
    if (message.includes('401') || message.toLowerCase().includes('unauthorized')) return 401;
    if (message.includes('400') || message.toLowerCase().includes('bad request')) return 400;
    if (message.includes('500') || message.toLowerCase().includes('internal')) return 500;
    if (message.includes('503') || message.toLowerCase().includes('unavailable')) return 503;

    return undefined;
  },

  /**
   * Get human-readable error message for status code
   */
  getErrorMessage(statusCode: number, fallbackMessage: string): string {
    const messages: Record<number, string> = {
      400: 'Bad Request - Invalid payload',
      401: 'Unauthorized - Authentication failed',
      403: 'Forbidden - Permission denied',
      404: 'Not Found - Endpoint invalid',
      410: 'Gone - Subscription expired',
      413: 'Payload Too Large',
      429: 'Too Many Requests - Rate limited',
      500: 'Internal Server Error',
      503: 'Service Unavailable',
    };

    return messages[statusCode] || fallbackMessage;
  },

  /**
   * Clean up old health check records
   */
  async cleanupOldHealthChecks(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deleted = await db
      .delete(subscriptionHealthChecks)
      .where(sql`${subscriptionHealthChecks.checkedAt} < ${cutoffDate}`)
      .returning({ id: subscriptionHealthChecks.id });

    return deleted.length;
  },
};

export default subscriptionHealthService;
