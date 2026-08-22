import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getForYouFeed,
  getTrendingLives,
  getRisingCreatorsFeed,
  getPKDiscoveryFeed,
} from '../services/discoveryService';
import { hideCreator, markNotInterested } from '../services/userPreferenceService';

export const discoveryRoutes = Router();

// GET /api/discovery/feed - Personalized For You feed
discoveryRoutes.get('/feed', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.query.userId as string) || 'guest';
    const feed = await getForYouFeed(userId);
    res.json({ success: true, feed });
  } catch (error: any) {
    console.error('Error fetching discovery feed:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/discovery/rising - Rising Creators feed
discoveryRoutes.get('/rising', async (req: Request, res: Response): Promise<void> => {
  try {
    const feed = await getRisingCreatorsFeed();
    res.json({ success: true, feed });
  } catch (error: any) {
    console.error('Error fetching rising creators feed:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/discovery/pk - Live PK Battles feed
discoveryRoutes.get('/pk', async (req: Request, res: Response): Promise<void> => {
  try {
    const pkFeed = await getPKDiscoveryFeed();
    res.json({ success: true, pkFeed });
  } catch (error: any) {
    console.error('Error fetching PK discovery feed:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/discovery/feedback - User feed feedback (Not Interested / Hide Creator)
discoveryRoutes.post('/feedback', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { action, targetHostId, targetContentId } = req.body;

    if (!action || !targetHostId) {
      res.status(400).json({ error: 'action and targetHostId are required.' });
      return;
    }

    if (action === 'HIDE_CREATOR') {
      await hideCreator(userId, targetHostId);
    } else {
      await markNotInterested(userId, targetHostId, targetContentId);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error recording discovery feedback:', error);
    res.status(400).json({ error: error.message || 'Error recording feedback' });
  }
});
