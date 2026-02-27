import { Hono } from 'hono';
import { trafficService } from '../services/traffic.js';

export const trafficRouter = new Hono();

// Capture traffic event
trafficRouter.post('/capture', async (c) => {
  const { url, method, headers, body, source, metadata } = await c.req.json();

  const event = await trafficService.capture({
    url,
    method,
    headers,
    body,
    source: source || 'unknown',
    metadata,
  });

  return c.json({ event }, 201);
});

// Get all captured traffic (admin)
trafficRouter.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') || '100', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);
  const traffic = await trafficService.getAll(limit, offset);
  return c.json({ traffic });
});

// Get traffic by ID
trafficRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const event = await trafficService.getById(id);
  if (!event) {
    return c.json({ error: 'Traffic event not found' }, 404);
  }
  return c.json({ event });
});

// Get traffic stats
trafficRouter.get('/stats/summary', async (c) => {
  const stats = await trafficService.getStats();
  return c.json({ stats });
});
