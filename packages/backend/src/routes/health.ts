import { Hono } from 'hono';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import { subscriptions } from '../db/schema.js';

export const healthRouter = new Hono();

/**
 * Basic health check - returns service status
 */
healthRouter.get('/health', async (c) => {
  const checks = {
    database: false,
  };

  try {
    // Check database connectivity with a simple query
    await db.select({ count: sql`1` }).from(subscriptions).limit(1);
    checks.database = true;
  } catch (error) {
    // Database check failed
  }

  const isHealthy = Object.values(checks).every(Boolean);

  return c.json(
    {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'push-capture-backend',
      version: '1.0.0',
      uptime: process.uptime(),
      checks,
    },
    isHealthy ? 200 : 503
  );
});

/**
 * Readiness check - for Kubernetes/container orchestration
 * Indicates if the service is ready to accept traffic
 */
healthRouter.get('/ready', async (c) => {
  const checks: Record<string, boolean> = {};

  // Check database
  try {
    await db.select({ count: sql`1` }).from(subscriptions).limit(1);
    checks.database = true;
  } catch {
    checks.database = false;
  }

  const allReady = Object.values(checks).every(Boolean);

  return c.json(
    {
      ready: allReady,
      checks,
      timestamp: new Date().toISOString(),
    },
    allReady ? 200 : 503
  );
});

/**
 * Liveness check - for Kubernetes/container orchestration
 * Indicates if the container is still running
 */
healthRouter.get('/live', (c) => {
  return c.json({
    alive: true,
    timestamp: new Date().toISOString(),
  });
});

/**
 * API info - lists available endpoints
 */
healthRouter.get('/', (c) => {
  return c.json({
    name: 'Push Capture API',
    version: '1.0.0',
    description: 'Web Push Notification Management API',
    endpoints: {
      health: {
        health: 'GET /health',
        ready: 'GET /ready',
        live: 'GET /live',
      },
      subscriptions: 'GET /api/subscriptions',
      traffic: 'GET /api/traffic',
      push: 'POST /api/push/send',
      campaigns: 'GET /api/campaigns',
      analytics: 'GET /api/analytics',
      metrics: 'GET /api/metrics',
    },
    documentation: 'See DEPLOYMENT.md for deployment details',
  });
});
