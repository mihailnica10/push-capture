import { Hono } from 'hono';
import { subscriptionService } from '../services/subscription.js';

export const subscriptionsRouter = new Hono();

// Get all subscriptions (admin)
subscriptionsRouter.get('/', async (c) => {
  const subscriptions = await subscriptionService.getAll();
  return c.json({ subscriptions });
});

// Get subscription by ID
subscriptionsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const subscription = await subscriptionService.getById(id);
  if (!subscription) {
    return c.json({ error: 'Subscription not found' }, 404);
  }
  return c.json({ subscription });
});

// Create new subscription
subscriptionsRouter.post('/', async (c) => {
  const { endpoint, keys, userAgent, metadata } = await c.req.json();

  if (!endpoint || !keys) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  const subscription = await subscriptionService.create({
    endpoint,
    keys: {
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    userAgent,
    metadata,
  });

  return c.json({ subscription }, 201);
});

// Delete subscription
subscriptionsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const deleted = await subscriptionService.delete(id);
  if (!deleted) {
    return c.json({ error: 'Subscription not found' }, 404);
  }
  return c.json({ success: true });
});

// Update subscription status (active/inactive)
subscriptionsRouter.patch('/:id/status', async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();

  const subscription = await subscriptionService.updateStatus(id, status);
  if (!subscription) {
    return c.json({ error: 'Subscription not found' }, 404);
  }

  return c.json({ subscription });
});
