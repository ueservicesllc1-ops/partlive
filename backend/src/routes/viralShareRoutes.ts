import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { generateShareLink, recordShareClick, getViralAnalyticsSummary } from '../services/viralShareService';

export const viralShareRoutes = Router();

// POST /api/viral/share - Generate viral deep link
viralShareRoutes.post('/share', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const referrerId = req.user.uid;
    const { type, targetId } = req.body;

    if (!type || !targetId) {
      res.status(400).json({ error: 'type and targetId are required.' });
      return;
    }

    const link = await generateShareLink(type, targetId, referrerId);
    res.status(201).json({ success: true, link });
  } catch (error: any) {
    console.error('Error generating share link:', error);
    res.status(400).json({ error: error.message || 'Error generating link' });
  }
});

// POST /api/viral/click - Record share link click
viralShareRoutes.post('/click', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    if (!code) {
      res.status(400).json({ error: 'code is required.' });
      return;
    }

    const result = await recordShareClick(code, ipAddress, userAgent);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error recording share click:', error);
    res.status(400).json({ error: error.message || 'Error recording click' });
  }
});

// GET /api/viral/analytics - Get viral growth analytics (Admin)
viralShareRoutes.get('/analytics', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await getViralAnalyticsSummary();
    res.json({ success: true, stats });
  } catch (error: any) {
    console.error('Error fetching viral analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
