import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  createClip,
  getClipsFeed,
  interactWithClip,
  getClipCreatorAnalytics,
} from '../services/clipService';

export const clipRoutes = Router();

// POST /api/clips/create - Host creates clip
clipRoutes.post('/create', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const { liveId, title, description, videoUrl, thumbnailUrl, durationSeconds } = req.body;

    if (!title || !videoUrl) {
      res.status(400).json({ error: 'Title and videoUrl are required.' });
      return;
    }

    const clip = await createClip(hostId, liveId || '', title, description || '', videoUrl, thumbnailUrl || '', durationSeconds || 30);
    res.status(201).json({ success: true, clip });
  } catch (error: any) {
    console.error('Error creating clip:', error);
    res.status(400).json({ error: error.message || 'Error creating clip' });
  }
});

// GET /api/clips/feed - Get vertical clip feed
clipRoutes.get('/feed', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clips = await getClipsFeed(req.user?.uid, 20);
    res.json({ success: true, clips });
  } catch (error: any) {
    console.error('Error getting clips feed:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/clips/interact - Track like, share, join_live, view
clipRoutes.post('/interact', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { clipId, action } = req.body;

    if (!clipId || !action) {
      res.status(400).json({ error: 'clipId and action are required.' });
      return;
    }

    await interactWithClip(userId, clipId, action);
    res.json({ success: true, message: 'Interacción registrada.' });
  } catch (error: any) {
    console.error('Error interacting with clip:', error);
    res.status(400).json({ error: error.message || 'Error interacting with clip' });
  }
});

// GET /api/clips/analytics - Get host clip conversion analytics
clipRoutes.get('/analytics', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const analytics = await getClipCreatorAnalytics(hostId);
    res.json({ success: true, analytics });
  } catch (error: any) {
    console.error('Error getting clip analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
