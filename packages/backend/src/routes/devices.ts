import { Hono } from 'hono';
import { deviceService } from '../services/device.js';

export const deviceRouter = new Hono();

// Register device with subscription
deviceRouter.post('/register', async (c) => {
  try {
    const { subscriptionId, ...deviceInfo } = await c.req.json();

    if (!subscriptionId) {
      return c.json({ error: 'subscriptionId is required' }, 400);
    }

    const device = await deviceService.registerDevice(subscriptionId, deviceInfo);
    return c.json({ device }, 201);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to register device' },
      500
    );
  }
});

// Update device heartbeat
deviceRouter.patch('/:id/heartbeat', async (c) => {
  try {
    const id = c.req.param('id');
    await deviceService.updateLastSeen(id);
    return c.json({ success: true });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to update heartbeat' },
      500
    );
  }
});

// Get device statistics
deviceRouter.get('/stats', async (c) => {
  try {
    const stats = await deviceService.getStats();
    return c.json({ stats });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to get stats' }, 500);
  }
});

// Get device by subscription
deviceRouter.get('/subscription/:subscriptionId', async (c) => {
  try {
    const subscriptionId = c.req.param('subscriptionId');
    const device = await deviceService.getBySubscription(subscriptionId);
    if (!device || device.length === 0) {
      return c.json({ error: 'Device not found' }, 404);
    }
    return c.json({ device: device[0] });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to get device' }, 500);
  }
});
