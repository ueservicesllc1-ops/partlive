import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  generateShareLink,
  processQualifiedReferral,
  generateCreatorRecruitmentLink,
  calculateViralityMetrics,
  getGrowthExperimentConfig,
} from '../services/viralGrowthEngineService';

export const viralGrowthEngineRoutes = Router();

// POST /api/viral/share-link - Generate Universal Deep Link
viralGrowthEngineRoutes.post('/share-link', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, targetId, referrerId, source } = req.body;
    if (!type || !targetId) {
      res.status(400).json({ error: 'type and targetId are required.' });
      return;
    }

    const link = await generateShareLink(type, targetId, referrerId, source);
    res.status(201).json({ success: true, link });
  } catch (error: any) {
    console.error('Error generating share link:', error);
    res.status(400).json({ error: error.message || 'Error generating link' });
  }
});

// POST /api/viral/referral/qualify - Qualify Referral Trigger
viralGrowthEngineRoutes.post('/referral/qualify', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const refereeId = req.user.uid;
    const { referrerId, eventType, deviceId } = req.body;

    if (!referrerId || !eventType) {
      res.status(400).json({ error: 'referrerId and eventType are required.' });
      return;
    }

    const referral = await processQualifiedReferral(referrerId, refereeId, eventType, deviceId);
    res.status(201).json({ success: true, referral });
  } catch (error: any) {
    console.error('Error qualifying referral:', error);
    res.status(400).json({ error: error.message || 'Error qualifying referral' });
  }
});

// POST /api/viral/recruitment-link - Generate Creator / Agency Recruitment Link
viralGrowthEngineRoutes.post('/recruitment-link', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hostId, agencyId } = req.body;
    const result = await generateCreatorRecruitmentLink(hostId, agencyId);
    res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error generating recruitment link:', error);
    res.status(400).json({ error: error.message || 'Error generating recruitment link' });
  }
});

// GET /api/viral/metrics - Get Virality & K-Factor Metrics (Admin)
viralGrowthEngineRoutes.get('/metrics', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const metrics = await calculateViralityMetrics();
    res.json({ success: true, metrics });
  } catch (error: any) {
    console.error('Error fetching virality metrics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/viral/experiments - Get Growth Experiment Variant
viralGrowthEngineRoutes.get('/experiments', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const key = (req.query.key as string) || 'onboarding_v2';
    const config = getGrowthExperimentConfig(key);
    res.json({ success: true, config });
  } catch (error: any) {
    console.error('Error fetching experiment config:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
