import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { processTapBatch, setLiveGoal } from '../services/tapEngineService';

export const tapEngineRoutes = Router();

// POST /api/taps/batch - Process 👍 tap batch from client
tapEngineRoutes.post('/batch', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { liveId, tapCount } = req.body;

    if (!liveId || typeof tapCount !== 'number') {
      res.status(400).json({ error: 'liveId and tapCount number are required.' });
      return;
    }

    const result = await processTapBatch(userId, liveId, tapCount);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error processing tap batch:', error);
    res.status(400).json({ error: error.message || 'Error processing taps' });
  }
});

// POST /api/taps/goals - Set live tap goal (Host)
tapEngineRoutes.post('/goals', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const { liveId, targetTaps } = req.body;

    if (!liveId || typeof targetTaps !== 'number') {
      res.status(400).json({ error: 'liveId and targetTaps are required.' });
      return;
    }

    const goal = await setLiveGoal(liveId, targetTaps, hostId);
    res.json({ success: true, goal });
  } catch (error: any) {
    console.error('Error setting live goal:', error);
    res.status(400).json({ error: error.message || 'Error setting goal' });
  }
});
