import { Hono } from 'hono';
import { campaignService } from '../services/campaign.js';

export const campaignRouter = new Hono();

// List all campaigns
campaignRouter.get('/', async (c) => {
  try {
    const campaigns = await campaignService.listCampaigns();
    return c.json({ campaigns });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to list campaigns' },
      500
    );
  }
});

// Get campaign by ID
campaignRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const campaign = await campaignService.getCampaign(id);
    if (!campaign) {
      return c.json({ error: 'Campaign not found' }, 404);
    }
    return c.json({ campaign });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get campaign' },
      500
    );
  }
});

// Create new campaign
campaignRouter.post('/', async (c) => {
  try {
    const options = await c.req.json();
    const campaign = await campaignService.createCampaign(options);
    return c.json({ campaign }, 201);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to create campaign' },
      500
    );
  }
});

// Update campaign
campaignRouter.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const campaign = await campaignService.updateCampaign(id, updates);
    if (!campaign) {
      return c.json({ error: 'Campaign not found' }, 404);
    }
    return c.json({ campaign });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to update campaign' },
      500
    );
  }
});

// Delete campaign (soft delete)
campaignRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await campaignService.deleteCampaign(id);
    return c.json({ success: true });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to delete campaign' },
      500
    );
  }
});

// Send campaign
campaignRouter.post('/:id/send', async (c) => {
  try {
    const id = c.req.param('id');
    const results = await campaignService.sendCampaign(id);
    return c.json({ results });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to send campaign' },
      500
    );
  }
});

// Get campaign statistics
campaignRouter.get('/:id/stats', async (c) => {
  try {
    const id = c.req.param('id');
    const stats = await campaignService.getCampaignStats(id);
    return c.json({ stats });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get campaign stats' },
      500
    );
  }
});
