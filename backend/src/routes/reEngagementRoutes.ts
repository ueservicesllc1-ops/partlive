import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { evaluateUserLifecycleState, runReEngagementScan } from '../services/reEngagementService';

export const reEngagementRoutes = Router();

// GET /api/re-engagement/lifecycle - Get or evaluate user lifecycle state
reEngagementRoutes.get('/lifecycle', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const profile = await evaluateUserLifecycleState(userId);
    res.json({ success: true, profile });
  } catch (error: any) {
    console.error('Error evaluating lifecycle state:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/re-engagement/scan - Trigger re-engagement scan (Admin)
reEngagementRoutes.post('/scan', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await runReEngagementScan();
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error running re-engagement scan:', error);
    res.status(400).json({ error: error.message || 'Error running scan' });
  }
});
