import { Hono } from 'hono';
import { preferenceService } from '../services/preference.js';

export const preferenceRouter = new Hono();

// Get preferences by subscription ID
preferenceRouter.get('/subscription/:subscriptionId', async (c) => {
  try {
    const subscriptionId = c.req.param('subscriptionId');
    const prefs = await preferenceService.getBySubscription(subscriptionId);
    if (!prefs) {
      // Return default preferences
      return c.json({
        preferences: {
          optInStatus: true,
          maxPerHour: 3,
          maxPerDay: 10,
          maxPerWeek: 50,
          enableSound: true,
          enableVibration: true,
          enableBadge: true,
          enableImages: true,
          quietHoursEnabled: false,
        },
      });
    }
    return c.json({ preferences: prefs });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get preferences' },
      500
    );
  }
});

// Get or create preferences
preferenceRouter.get('/subscription/:subscriptionId/or-create', async (c) => {
  try {
    const subscriptionId = c.req.param('subscriptionId');
    const prefs = await preferenceService.getOrCreate(subscriptionId);
    return c.json({ preferences: prefs });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get preferences' },
      500
    );
  }
});

// Update preferences
preferenceRouter.patch('/subscription/:subscriptionId', async (c) => {
  try {
    const subscriptionId = c.req.param('subscriptionId');
    const updates = await c.req.json();
    const prefs = await preferenceService.update(subscriptionId, updates);
    return c.json({ preferences: prefs });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to update preferences' },
      500
    );
  }
});

// Set DND (Do Not Disturb)
preferenceRouter.post('/subscription/:subscriptionId/dnd', async (c) => {
  try {
    const subscriptionId = c.req.param('subscriptionId');
    const { until, reason } = await c.req.json();
    if (!until) {
      return c.json({ error: 'until is required' }, 400);
    }
    const prefs = await preferenceService.setDnd(subscriptionId, new Date(until), reason);
    return c.json({ preferences: prefs });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to set DND' }, 500);
  }
});

// Clear DND
preferenceRouter.delete('/subscription/:subscriptionId/dnd', async (c) => {
  try {
    const subscriptionId = c.req.param('subscriptionId');
    const prefs = await preferenceService.clearDnd(subscriptionId);
    return c.json({ preferences: prefs });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to clear DND' }, 500);
  }
});

// Toggle opt-in status
preferenceRouter.post('/subscription/:subscriptionId/opt-in', async (c) => {
  try {
    const subscriptionId = c.req.param('subscriptionId');
    const { optIn } = await c.req.json();
    if (typeof optIn !== 'boolean') {
      return c.json({ error: 'optIn boolean is required' }, 400);
    }
    const prefs = await preferenceService.toggleOptIn(subscriptionId, optIn);
    return c.json({ preferences: prefs });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle opt-in' },
      500
    );
  }
});

// Update quiet hours
preferenceRouter.patch('/subscription/:subscriptionId/quiet-hours', async (c) => {
  try {
    const subscriptionId = c.req.param('subscriptionId');
    const { enabled, start, end, timezone } = await c.req.json();
    const prefs = await preferenceService.updateQuietHours(
      subscriptionId,
      enabled,
      start,
      end,
      timezone
    );
    return c.json({ preferences: prefs });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to update quiet hours' },
      500
    );
  }
});

// Update frequency caps
preferenceRouter.patch('/subscription/:subscriptionId/frequency-caps', async (c) => {
  try {
    const subscriptionId = c.req.param('subscriptionId');
    const { maxPerHour, maxPerDay, maxPerWeek } = await c.req.json();
    const prefs = await preferenceService.updateFrequencyCaps(
      subscriptionId,
      maxPerHour,
      maxPerDay,
      maxPerWeek
    );
    return c.json({ preferences: prefs });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to update frequency caps' },
      500
    );
  }
});
