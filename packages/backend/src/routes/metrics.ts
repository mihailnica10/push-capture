import { Hono } from 'hono';
import { db } from '../db/index.js';
import { count, sql } from 'drizzle-orm';
import { subscriptions, trafficEvents, campaignDeliveries, failedDeliveries } from '../db/schema.js';
import { logger } from '../lib/logger.js';

export const metricsRouter = new Hono();

/**
 * Get application metrics
 * Provides aggregated statistics about subscriptions, traffic, and delivery status
 */
metricsRouter.get('/metrics', async (c) => {
  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Run queries in parallel
    const [
      totalSubsResult,
      activeSubsResult,
      totalTrafficResult,
      dailyTrafficResult,
      totalDeliveriesResult,
      successfulDeliveriesResult,
      failedDeliveriesResult,
      recentCampaignsResult,
    ] = await Promise.all([
      // Total subscriptions
      db.select({ count: count() }).from(subscriptions),

      // Active subscriptions
      db.select({ count: count() }).from(subscriptions).where(sql`${subscriptions.status} = 'active'`),

      // Total traffic events
      db.select({ count: count() }).from(trafficEvents),

      // Traffic events in last 24 hours
      db.select({ count: count() })
        .from(trafficEvents)
        .where(sql`${trafficEvents.createdAt} >= ${dayAgo}`),

      // Total campaign deliveries
      db.select({ count: count() }).from(campaignDeliveries),

      // Successful deliveries
      db.select({ count: count() })
        .from(campaignDeliveries)
        .where(sql`${campaignDeliveries.status} = 'sent'`),

      // Failed deliveries
      db.select({ count: count() }).from(failedDeliveries),

      // Recent campaigns (count from last week)
      db.select({ count: count() })
        .from(campaignDeliveries)
        .where(sql`${campaignDeliveries.createdAt} >= ${weekAgo}`),
    ]);

    const totalSubs = Number(totalSubsResult[0]?.count || 0);
    const activeSubs = Number(activeSubsResult[0]?.count || 0);
    const totalTraffic = Number(totalTrafficResult[0]?.count || 0);
    const dailyTraffic = Number(dailyTrafficResult[0]?.count || 0);
    const totalDeliveries = Number(totalDeliveriesResult[0]?.count || 0);
    const successfulDeliveries = Number(successfulDeliveriesResult[0]?.count || 0);
    const failedCount = Number(failedDeliveriesResult[0]?.count || 0);
    const recentCampaigns = Number(recentCampaignsResult[0]?.count || 0);

    // Calculate derived metrics
    const deliverySuccessRate = totalDeliveries > 0
      ? (successfulDeliveries / totalDeliveries) * 100
      : 0;

    const avgDeliveriesPerCampaign = recentCampaigns > 0
      ? totalDeliveries / recentCampaigns
      : 0;

    return c.json({
      subscriptions: {
        total: totalSubs,
        active: activeSubs,
        inactive: totalSubs - activeSubs,
        activeRate: totalSubs > 0 ? ((activeSubs / totalSubs) * 100).toFixed(1) : '0.0',
      },
      traffic: {
        totalEvents: totalTraffic,
        last24Hours: dailyTraffic,
        avgDaily: totalTraffic > 0 ? (totalTraffic / 30).toFixed(0) : '0', // Assume 30 days
      },
      campaigns: {
        totalDeliveries: totalDeliveries,
        successful: successfulDeliveries,
        failed: failedCount,
        successRate: `${deliverySuccessRate.toFixed(1)}%`,
        recentActivity: recentCampaigns,
        avgPerCampaign: avgDeliveriesPerCampaign.toFixed(0),
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: now.toISOString(),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Metrics fetch failed');
    return c.json(
      {
        error: 'Failed to fetch metrics',
        message: (error as Error).message,
      },
      500
    );
  }
});

/**
 * Get Prometheus-compatible metrics
 * Simple text format for monitoring systems
 */
metricsRouter.get('/metrics/prometheus', async (c) => {
  try {
    const [totalSubsResult, activeSubsResult, totalDeliveriesResult] = await Promise.all([
      db.select({ count: count() }).from(subscriptions),
      db.select({ count: count() }).from(subscriptions).where(sql`${subscriptions.status} = 'active'`),
      db.select({ count: count() }).from(campaignDeliveries),
    ]);

    const totalSubs = Number(totalSubsResult[0]?.count || 0);
    const activeSubs = Number(activeSubsResult[0]?.count || 0);
    const totalDeliveries = Number(totalDeliveriesResult[0]?.count || 0);

    const prometheusMetrics = `
# HELP push_capture_subscriptions_total Total number of subscriptions
# TYPE push_capture_subscriptions_total gauge
push_capture_subscriptions_total ${totalSubs}

# HELP push_capture_subscriptions_active Number of active subscriptions
# TYPE push_capture_subscriptions_active gauge
push_capture_subscriptions_active ${activeSubs}

# HELP push_capture_deliveries_total Total number of campaign deliveries
# TYPE push_capture_deliveries_total counter
push_capture_deliveries_total ${totalDeliveries}

# HELP push_capture_uptime_seconds Application uptime in seconds
# TYPE push_capture_uptime_seconds gauge
push_capture_uptime_seconds ${process.uptime().toFixed(2)}
`.trim();

    return c.text(prometheusMetrics, 200, {
      'Content-Type': 'text/plain; version=0.0.4',
    });
  } catch (error) {
    logger.error({ error }, 'Prometheus metrics fetch failed');
    return c.json({ error: 'Failed to fetch metrics' }, 500);
  }
});
