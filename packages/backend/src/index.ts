import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { subscriptionsRouter } from './routes/subscriptions.js';
import { trafficRouter } from './routes/traffic.js';
import { pushRouter } from './routes/push.js';
import { healthRouter } from './routes/health.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));

// Routes
app.route('/', healthRouter);
app.route('/api/subscriptions', subscriptionsRouter);
app.route('/api/traffic', trafficRouter);
app.route('/api/push', pushRouter);

const port = parseInt(process.env.PORT || '3001');

console.log(`🚀 Server starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
