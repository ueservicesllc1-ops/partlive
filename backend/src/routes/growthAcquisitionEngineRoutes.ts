import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  trackUserAttribution,
  processQualifiedReferralEx,
  createGrowthCampaign,
  calculateGrowthAcquisitionMetrics,
  toggleGrowthCampaignKillSwitch,
} from '../services/growthAcquisitionEngineService';

export const growthAcquisitionEngineRoutes = Router();

// POST /api/growth-acq/attribution - Track Multi-Touch User Attribution
growthAcquisitionEngineRoutes.post('/attribution', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { firstTouchSource, lastTouchSource, referrerId, campaignId, country, platform } = req.body;

    const record = await trackUserAttribution(
      userId,
      firstTouchSource || 'Organic',
      lastTouchSource || 'Referral',
      referrerId,
      campaignId,
      country || 'CL',
      platform || 'android'
    );

    res.status(201).json({ success: true, attribution: record });
  } catch (error: any) {
    console.error('Error tracking attribution:', error);
    res.status(400).json({ error: error.message || 'Tracking attribution failed' });
  }
});

// POST /api/growth-acq/referral/qualify - Qualify Referral & Enforce Anti-Fraud Checks
growthAcquisitionEngineRoutes.post('/referral/qualify', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const refereeId = req.user.uid;
    const { referrerId, qualificationEvent, deviceId } = req.body;

    if (!referrerId || !qualificationEvent) {
      res.status(400).json({ error: 'referrerId and qualificationEvent are required.' });
      return;
    }

    const referral = await processQualifiedReferralEx(referrerId, refereeId, qualificationEvent, deviceId);
    res.status(201).json({ success: true, referral });
  } catch (error: any) {
    console.error('Error qualifying referral:', error);
    res.status(400).json({ error: error.message || 'Referral qualification failed' });
  }
});

// GET /api/growth-acq/metrics - Get Viral K-Factor & Acquisition Metrics
growthAcquisitionEngineRoutes.get('/metrics', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const metrics = await calculateGrowthAcquisitionMetrics();
    res.json({ success: true, metrics });
  } catch (error: any) {
    console.error('Error fetching growth acquisition metrics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/growth-acq/campaigns - Create Growth Campaign with Budget Cap
growthAcquisitionEngineRoutes.post('/campaigns', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { campaignId, budgetUsd, rewardCoinsPerReferral } = req.body;
    if (!campaignId || !budgetUsd) {
      res.status(400).json({ error: 'campaignId and budgetUsd are required.' });
      return;
    }

    const campaign = await createGrowthCampaign(campaignId, Number(budgetUsd), Number(rewardCoinsPerReferral || 100));
    res.status(201).json({ success: true, campaign });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    res.status(400).json({ error: error.message || 'Error creating campaign' });
  }
});

// POST /api/growth-acq/kill-switch - Toggle Campaign Kill Switch
growthAcquisitionEngineRoutes.post('/kill-switch', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { campaignId, enabled } = req.body;
    if (!campaignId) {
      res.status(400).json({ error: 'campaignId is required.' });
      return;
    }

    const campaign = await toggleGrowthCampaignKillSwitch(campaignId, Boolean(enabled));
    res.json({ success: true, campaign });
  } catch (error: any) {
    console.error('Error toggling campaign kill switch:', error);
    res.status(400).json({ error: error.message || 'Error toggling kill switch' });
  }
});
