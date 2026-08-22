import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getUserGamificationProfile,
  recordDailyStreak,
  awardPartyPoints,
} from '../services/gamificationService';

export const gamificationRoutes = Router();

// GET /api/gamification/profile - Get user gamification profile
gamificationRoutes.get('/profile', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const profile = await getUserGamificationProfile(userId);
    res.json({ success: true, profile });
  } catch (error: any) {
    console.error('Error fetching gamification profile:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/gamification/streak - Record daily streak check-in
gamificationRoutes.post('/streak', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const profile = await recordDailyStreak(userId);
    res.json({ success: true, profile });
  } catch (error: any) {
    console.error('Error recording streak:', error);
    res.status(400).json({ error: error.message || 'Error recording streak' });
  }
});

// POST /api/gamification/points/award - Award non-financial Party Points
gamificationRoutes.post('/points/award', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { points, reason } = req.body;

    if (typeof points !== 'number' || !reason) {
      res.status(400).json({ error: 'points number and reason string are required.' });
      return;
    }

    const result = await awardPartyPoints(userId, points, reason);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error awarding Party Points:', error);
    res.status(400).json({ error: error.message || 'Error awarding points' });
  }
});
