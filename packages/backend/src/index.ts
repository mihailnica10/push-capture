import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { analyticsRouter } from './routes/analytics.js';
import { analyticsAdvancedRoutes } from './routes/analytics-advanced.js';
import { campaignRouter } from './routes/campaigns.js';
import { deviceRouter } from './routes/devices.js';
import { healthRouter } from './routes/health.js';
import { preferenceRouter } from './routes/preferences.js';
import { pushRouter } from './routes/push.js';
import { settingsRoutes } from './routes/settings.js';
import { subscriptionsRouter } from './routes/subscriptions.js';
import { trafficRouter } from './routes/traffic.js';
import { metricsRouter } from './routes/metrics.js';
import { logger } from './lib/logger.js';
import { securityHeaders } from './middleware/security.js';
import { apiLimiter, subscriptionLimiter, pushLimiter } from './middleware/rate-limit.js';

const app = new Hono();

// Middleware
app.use('*', securityHeaders);
app.use('*', cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));

// Rate limiting for API routes
app.use('/api/*', apiLimiter);
// Stricter rate limiting for subscriptions
app.use('/api/subscriptions', subscriptionLimiter);
// Rate limiting for push notifications
app.use('/api/push/*', pushLimiter);

// Routes
app.route('/', healthRouter);
app.route('/api/subscriptions', subscriptionsRouter);
app.route('/api/traffic', trafficRouter);
app.route('/api/push', pushRouter);
app.route('/api/devices', deviceRouter);
app.route('/api/campaigns', campaignRouter);
app.route('/api/preferences', preferenceRouter);
app.route('/api/analytics', analyticsRouter);
app.route('/api/analytics', analyticsAdvancedRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api', metricsRouter);

const port = parseInt(process.env.PORT || '3001', 10);

logger.info({ port }, 'Server starting');

serve({
  fetch: app.fetch,
  port,
});

export default app;
