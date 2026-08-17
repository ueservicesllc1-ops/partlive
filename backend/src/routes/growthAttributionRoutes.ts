import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  trackAcquisitionEvent,
  getAttributionFunnelReport,
} from '../services/growthAttributionService';

export const growthAttributionRoutes = Router();

// POST /api/growth/track - Track user acquisition event
growthAttributionRoutes.post('/track', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { source, campaignId, affiliateId, referrerId, contentId, platform } = req.body;

    const event = await trackAcquisitionEvent(userId, source, campaignId, affiliateId, referrerId, contentId, platform);
    res.status(201).json({ success: true, event });
  } catch (error: any) {
    console.error('Error tracking acquisition event:', error);
    res.status(400).json({ error: error.message || 'Error tracking event' });
  }
});

// GET /api/growth/funnel-report - Get attribution funnel analytics
growthAttributionRoutes.get('/funnel-report', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { campaignId } = req.query;
    const report = await getAttributionFunnelReport(campaignId as string);
    res.json({ success: true, report });
  } catch (error: any) {
    console.error('Error getting funnel report:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
