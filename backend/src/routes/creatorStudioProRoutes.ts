import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  createStreamGoal,
  getStreamHealth,
  scheduleLiveEvent,
  getAdvancedCreatorAnalytics,
  createStreamClip,
} from '../services/creatorStudioProService';

export const creatorStudioProRoutes = Router();

// POST /api/creator-pro/goals - Create Stream Goal
creatorStudioProRoutes.post('/goals', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const { liveId, type, targetAmount } = req.body;

    if (!liveId || !type || !targetAmount) {
      res.status(400).json({ error: 'liveId, type, and targetAmount are required.' });
      return;
    }

    const goal = await createStreamGoal(hostId, liveId, type, Number(targetAmount));
    res.status(201).json({ success: true, goal });
  } catch (error: any) {
    console.error('Error creating stream goal:', error);
    res.status(400).json({ error: error.message || 'Error creating stream goal' });
  }
});

// GET /api/creator-pro/health/:liveId - Get Stream Health
creatorStudioProRoutes.get('/health/:liveId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const liveId = req.params.liveId;
    const health = await getStreamHealth(liveId);
    res.json({ success: true, health });
  } catch (error: any) {
    console.error('Error fetching stream health:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/creator-pro/schedule - Schedule Live Event
creatorStudioProRoutes.post('/schedule', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const { title, category, startDate, coverUrl } = req.body;

    if (!title || !category || !startDate) {
      res.status(400).json({ error: 'title, category, and startDate are required.' });
      return;
    }

    const event = await scheduleLiveEvent(hostId, title, category, startDate, coverUrl);
    res.status(201).json({ success: true, event });
  } catch (error: any) {
    console.error('Error scheduling live event:', error);
    res.status(400).json({ error: error.message || 'Error scheduling event' });
  }
});

// GET /api/creator-pro/analytics - Get Advanced Creator Analytics
creatorStudioProRoutes.get('/analytics', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const period = (req.query.period as string) || '30d';

    const analytics = await getAdvancedCreatorAnalytics(hostId, period);
    res.json({ success: true, analytics });
  } catch (error: any) {
    console.error('Error fetching creator analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/creator-pro/clips - Create Video Clip
creatorStudioProRoutes.post('/clips', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const { liveId, title, durationSeconds } = req.body;

    if (!liveId || !title) {
      res.status(400).json({ error: 'liveId and title are required.' });
      return;
    }

    const clip = await createStreamClip(hostId, liveId, title, durationSeconds ? Number(durationSeconds) : 30);
    res.status(201).json({ success: true, clip });
  } catch (error: any) {
    console.error('Error creating clip:', error);
    res.status(400).json({ error: error.message || 'Error creating clip' });
  }
});
