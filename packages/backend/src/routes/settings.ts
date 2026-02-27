import { Hono } from 'hono';
import { settingsService } from '../services/settings.js';

export const settingsRoutes = new Hono();

/**
 * GET /api/settings - Get all settings
 */
settingsRoutes.get('/', async (c) => {
  const settings = await settingsService.getAll();
  return c.json({ settings });
});

/**
 * GET /api/settings/grouped - Get settings grouped by category
 */
settingsRoutes.get('/grouped', async (c) => {
  const settings = await settingsService.getGrouped();
  return c.json({ settings });
});

/**
 * GET /api/settings/:category - Get settings by category
 */
settingsRoutes.get('/:category', async (c) => {
  const category = c.req.param('category');
  const settings = await settingsService.getByCategory(category);
  return c.json({ settings, category });
});

/**
 * GET /api/settings/key/:key - Get a single setting by key
 */
settingsRoutes.get('/key/:key', async (c) => {
  const key = c.req.param('key');
  const value = await settingsService.get(key);

  if (!value) {
    return c.json({ error: 'Setting not found' }, 404);
  }

  return c.json({ key, value });
});

/**
 * PUT /api/settings/:key - Update a setting
 */
settingsRoutes.put('/:key', async (c) => {
  const key = c.req.param('key');
  const body = await c.req.json();
  const { value, category, description } = body as {
    value: unknown;
    category?: string;
    description?: string;
  };

  // Validate the setting
  if (!settingsService.validate(key, value)) {
    return c.json({ error: 'Invalid value for setting' }, 400);
  }

  await settingsService.set(key, value, { category, description });

  // Return updated setting
  const updated = await settingsService.get(key);
  return c.json({ key, value: updated });
});

/**
 * PUT /api/settings/batch - Update multiple settings
 */
settingsRoutes.put('/batch', async (c) => {
  const body = await c.req.json();
  const { settings } = body as {
    settings: Array<{
      key: string;
      value: unknown;
      category?: string;
      description?: string;
    }>;
  };

  // Validate all settings
  for (const setting of settings) {
    if (!settingsService.validate(setting.key, setting.value)) {
      return c.json({ error: `Invalid value for setting: ${setting.key}` }, 400);
    }
  }

  await settingsService.setMany(settings);

  return c.json({
    success: true,
    updated: settings.length,
  });
});

/**
 * DELETE /api/settings/:key - Delete a setting
 */
settingsRoutes.delete('/:key', async (c) => {
  const key = c.req.param('key');
  const deleted = await settingsService.delete(key);

  if (!deleted) {
    return c.json({ error: 'Setting not found' }, 404);
  }

  return c.json({ success: true, key });
});

/**
 * POST /api/settings/initialize - Initialize default settings
 */
settingsRoutes.post('/initialize', async (c) => {
  await settingsService.initializeDefaults();

  const settings = await settingsService.getAll();

  return c.json({
    success: true,
    settings,
  });
});

/**
 * GET /api/settings/defaults - Get default settings template
 */
settingsRoutes.get('/defaults', async (c) => {
  // Return the structure without actually initializing
  const defaults = {
    general: {
      'app.name': 'Push Capture',
      'app.timezone': 'UTC',
      'app.language': 'en',
    },
    limits: {
      'limits.maxDailyNotifications': 10,
      'limits.maxHourlyNotifications': 3,
      'limits.maxCampaignPerHour': 1000,
    },
    retention: {
      'retention.eventsDays': 90,
      'retention.trafficDays': 30,
      'retention.analyticsDays': 365,
    },
    analytics: {
      'analytics.enabled': true,
      'analytics.sampleRate': 1.0,
    },
    ui: {
      'ui.theme': 'light',
      'ui.timezone': 'UTC',
      'ui.dateFormat': 'MM/DD/YYYY',
    },
  };

  return c.json({ defaults });
});
