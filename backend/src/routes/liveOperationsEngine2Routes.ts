import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getExecutiveOperationsMetrics,
  createLiveOperationCampaign,
  getCreatorHealthScorecard,
  getRealtimeOperationsAlerts,
  toggleOperationEmergencySwitch,
  generateDailyExecutiveReport,
} from '../services/liveOperationsEngine2Service';

export const liveOperationsEngine2Routes = Router();

// GET /api/live-ops-2/executive-metrics - Get Executive & Revenue Dashboard Metrics
liveOperationsEngine2Routes.get('/executive-metrics', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const timeframe = (req.query.timeframe as any) || '30D';
    const metrics = await getExecutiveOperationsMetrics(timeframe);
    res.json({ success: true, metrics });
  } catch (error: any) {
    console.error('Error fetching executive metrics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/live-ops-2/campaigns - Create Live Operation Campaign
liveOperationsEngine2Routes.post('/campaigns', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, campaignType, budgetUsd, maxParticipants, couponCode } = req.body;
    if (!title || !campaignType) {
      res.status(400).json({ error: 'title and campaignType are required.' });
      return;
    }

    const campaign = await createLiveOperationCampaign(
      title,
      campaignType,
      Number(budgetUsd || 5000),
      Number(maxParticipants || 1000),
      couponCode
    );
    res.status(201).json({ success: true, campaign });
  } catch (error: any) {
    console.error('Error creating live operation campaign:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/live-ops-2/creator-health - Get Creator Health Scorecard
liveOperationsEngine2Routes.get('/creator-health', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = (req.query.creatorId as string) || req.user.uid;
    const scorecard = await getCreatorHealthScorecard(creatorId);
    res.json({ success: true, scorecard });
  } catch (error: any) {
    console.error('Error fetching creator health scorecard:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/live-ops-2/alerts - Get Real-time Operations Alerts Stream
liveOperationsEngine2Routes.get('/alerts', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const alerts = await getRealtimeOperationsAlerts();
    res.json({ success: true, alerts });
  } catch (error: any) {
    console.error('Error fetching operations alerts:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/live-ops-2/emergency-switch - Toggle Operation Emergency Control
liveOperationsEngine2Routes.post('/emergency-switch', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { switchType, enabled } = req.body;

    if (!switchType) {
      res.status(400).json({ error: 'switchType is required.' });
      return;
    }

    const updatedSwitches = await toggleOperationEmergencySwitch(switchType, Boolean(enabled), adminId);
    res.json({ success: true, emergencySwitches: updatedSwitches });
  } catch (error: any) {
    console.error('Error toggling emergency switch:', error);
    res.status(400).json({ error: error.message || 'Error toggling emergency switch' });
  }
});

// GET /api/live-ops-2/executive-report - Generate Daily Executive Report
liveOperationsEngine2Routes.get('/executive-report', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const report = await generateDailyExecutiveReport();
    res.json({ success: true, report });
  } catch (error: any) {
    console.error('Error generating daily executive report:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
