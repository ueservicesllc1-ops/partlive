import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import * as missionService from '../services/missionService';

const router = Router();

// Retrieve all active missions
router.get('/active', requireAuth, async (req: any, res: Response) => {
  try {
    const missions = await missionService.getActiveMissions();
    res.json(missions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve current user progress
router.get('/my-progress', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user.uid;
    const progress = await missionService.getUserMissionProgress(userId);
    res.json(progress);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Claim a completed mission reward
router.post('/:progressId/claim', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user.uid;
    const { progressId } = req.params;
    const reward = await missionService.claimMissionReward(userId, progressId);
    res.json({ success: true, reward });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Developer/Test tracking endpoint (only usable in development environment)
router.post('/track', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user.uid;
    const { actionType, amount, metadata } = req.body;

    if (!actionType) {
      res.status(400).json({ error: 'actionType is required' });
      return;
    }

    // Secure check: Allow devs to manually trigger increments
    const isDev = process.env.NODE_ENV === 'development' || req.user.role === 'admin';
    if (!isDev) {
      res.status(403).json({ error: 'Tracking endpoint restricted to development' });
      return;
    }

    await missionService.incrementMissionProgress(userId, actionType, amount || 1, metadata);
    res.json({ success: true, message: `Progress incremented for action: ${actionType}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
