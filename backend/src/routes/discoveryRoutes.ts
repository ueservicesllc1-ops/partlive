import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getForYouFeed,
  getTrendingLives,
  getNewHostsFeed,
  recordWatchTime,
} from '../services/discoveryService';

export const discoveryRoutes = Router();

// GET /api/discovery/for-you - Get personalized For You feed
discoveryRoutes.get('/for-you', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const feed = await getForYouFeed(userId, 20);
    res.json({ success: true, feed });
  } catch (error: any) {
    console.error('Error getting For You feed:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/discovery/trending - Get Trending Lives
discoveryRoutes.get('/trending', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const feed = await getTrendingLives(20);
    res.json({ success: true, feed });
  } catch (error: any) {
    console.error('Error getting Trending feed:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/discovery/new-hosts - Get New Hosts feed
discoveryRoutes.get('/new-hosts', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hosts = await getNewHostsFeed(20);
    res.json({ success: true, hosts });
  } catch (error: any) {
    console.error('Error getting New Hosts feed:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/discovery/watch-time - Batch log watch duration
discoveryRoutes.post('/watch-time', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { contentId, contentType, watchDurationSeconds } = req.body;

    if (!contentId || !contentType || !watchDurationSeconds) {
      res.status(400).json({ error: 'contentId, contentType, and watchDurationSeconds are required.' });
      return;
    }

    await recordWatchTime(userId, contentId, contentType, watchDurationSeconds);
    res.json({ success: true, message: 'Tiempo de visualización registrado.' });
  } catch (error: any) {
    console.error('Error recording watch time:', error);
    res.status(400).json({ error: error.message || 'Error recording watch time' });
  }
});
