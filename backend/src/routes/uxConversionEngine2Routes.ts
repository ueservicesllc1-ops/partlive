import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  saveUserInterests,
  recordTapBurstInteraction,
  processGiftConversionFlow,
  trackCreatorActivationMilestones,
  getConversionFunnelMetrics,
  getUxAuditTelemetry,
} from '../services/uxConversionEngine2Service';

export const uxConversionEngine2Routes = Router();

// POST /api/ux-conversion-2/interests - Save Progressive Onboarding User Interests
uxConversionEngine2Routes.post('/interests', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { interests } = req.body;

    const result = await saveUserInterests(userId, interests);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error saving user interests:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ux-conversion-2/tap-burst - Record Thumbs-Up 👍 Tap Burst Interaction
uxConversionEngine2Routes.post('/tap-burst', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { liveId, tapCount } = req.body;

    if (!liveId) {
      res.status(400).json({ error: 'liveId is required.' });
      return;
    }

    const tapResult = await recordTapBurstInteraction(userId, liveId, Number(tapCount || 10));
    res.json({ success: true, ...tapResult });
  } catch (error: any) {
    console.error('Error recording tap burst:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ux-conversion-2/gift-conversion - Process Gift Conversion & Low Balance Prompt
uxConversionEngine2Routes.post('/gift-conversion', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { liveId, giftId, currentCoins } = req.body;

    if (!liveId) {
      res.status(400).json({ error: 'liveId is required.' });
      return;
    }

    const conversion = await processGiftConversionFlow(userId, liveId, giftId, Number(currentCoins || 0));
    res.json({ success: true, conversion });
  } catch (error: any) {
    console.error('Error processing gift conversion:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/ux-conversion-2/creator-activation - Track Creator Activation Milestones
uxConversionEngine2Routes.get('/creator-activation', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = (req.query.creatorId as string) || req.user.uid;
    const activation = await trackCreatorActivationMilestones(creatorId);
    res.json({ success: true, activation });
  } catch (error: any) {
    console.error('Error tracking creator activation:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/ux-conversion-2/funnel - Get Conversion Funnel Metrics
uxConversionEngine2Routes.get('/funnel', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const funnel = await getConversionFunnelMetrics();
    res.json({ success: true, funnel });
  } catch (error: any) {
    console.error('Error fetching conversion funnel metrics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/ux-conversion-2/telemetry - Get UX Audit & Accessibility Telemetry
uxConversionEngine2Routes.get('/telemetry', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const telemetry = await getUxAuditTelemetry();
    res.json({ success: true, telemetry });
  } catch (error: any) {
    console.error('Error fetching UX audit telemetry:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
