import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getCreatorStudioDashboard,
  getCreatorContentCalendar,
  updateHostModerators,
} from '../services/creatorStudioService';

export const creatorStudioRoutes = Router();

// GET /api/creator/dashboard - Get Creator Studio dashboard
creatorStudioRoutes.get('/dashboard', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const dashboard = await getCreatorStudioDashboard(hostId);
    res.json({ success: true, dashboard });
  } catch (error: any) {
    console.error('Error fetching creator studio dashboard:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/creator/calendar - Get creator content calendar
creatorStudioRoutes.get('/calendar', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const calendar = await getCreatorContentCalendar(hostId);
    res.json({ success: true, calendar });
  } catch (error: any) {
    console.error('Error fetching content calendar:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/creator/moderators - Add or remove moderator
creatorStudioRoutes.post('/moderators', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const { moderatorId, action } = req.body;

    if (!moderatorId || !action) {
      res.status(400).json({ error: 'moderatorId and action are required.' });
      return;
    }

    const moderators = await updateHostModerators(hostId, moderatorId, action);
    res.json({ success: true, moderators });
  } catch (error: any) {
    console.error('Error updating host moderators:', error);
    res.status(400).json({ error: error.message || 'Error updating moderators' });
  }
});
