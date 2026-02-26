import { Hono } from 'hono';

export const healthRouter = new Hono();

healthRouter.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'push-capture-backend',
  });
});

healthRouter.get('/', (c) => {
  return c.json({
    name: 'Push Capture API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      subscriptions: '/api/subscriptions',
      traffic: '/api/traffic',
      push: '/api/push',
    },
  });
});
