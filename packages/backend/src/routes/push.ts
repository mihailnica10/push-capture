import { Hono } from 'hono';
import { pushService } from '../services/push.js';

export const pushRouter = new Hono();

// Send push notification to a specific subscription
pushRouter.post('/send/:subscriptionId', async (c) => {
  const subscriptionId = c.req.param('subscriptionId');
  const { title, body, icon, data, url } = await c.req.json();

  if (!title) {
    return c.json({ error: 'Title is required' }, 400);
  }

  const result = await pushService.sendToSubscription(subscriptionId, {
    title,
    body,
    icon,
    data,
    url,
  });

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({ success: true });
});

// Broadcast push notification to all active subscriptions
pushRouter.post('/broadcast', async (c) => {
  const { title, body, icon, data, url, filter } = await c.req.json();

  if (!title) {
    return c.json({ error: 'Title is required' }, 400);
  }

  const result = await pushService.broadcast({
    title,
    body,
    icon,
    data,
    url,
    filter,
  });

  return c.json({
    success: true,
    sent: result.sent,
    failed: result.failed,
  });
});

// Send notification based on traffic capture
pushRouter.post('/trigger/:trafficId', async (c) => {
  const trafficId = c.req.param('trafficId');
  const { template } = await c.req.json();

  const result = await pushService.triggerFromTraffic(trafficId, template);

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({
    success: true,
    sent: result.sent,
  });
});

// Get VAPID public key
pushRouter.get('/vapid-key', (c) => {
  const vapidKey = pushService.getVapidPublicKey();
  return c.json({ vapidKey });
});
