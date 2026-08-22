import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  createCampaign,
  recordAttribution,
  createPromoCode,
  validatePromoCode,
  applyCreatorProgram,
  calculateGrowthMetrics,
} from '../services/growthEngineService';

export const growthEngineRoutes = Router();

// POST /api/growth/campaigns - Create Marketing Campaign (Admin)
growthEngineRoutes.post('/campaigns', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, channel, budgetUsd, targetCacUsd } = req.body;
    if (!name || !channel || !budgetUsd) {
      res.status(400).json({ error: 'name, channel, and budgetUsd are required.' });
      return;
    }

    const campaign = await createCampaign(name, channel, budgetUsd, targetCacUsd || 1.50);
    res.status(201).json({ success: true, campaign });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    res.status(400).json({ error: error.message || 'Error creating campaign' });
  }
});

// POST /api/growth/attribution - Record Attribution
growthEngineRoutes.post('/attribution', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { campaignId, source, medium } = req.body;

    await recordAttribution(userId, campaignId || 'organic', source || 'direct', medium || 'none');
    res.json({ success: true, message: 'Attribution recorded.' });
  } catch (error: any) {
    console.error('Error recording attribution:', error);
    res.status(400).json({ error: error.message || 'Error recording attribution' });
  }
});

// POST /api/growth/promos - Create Promo Code (Admin)
growthEngineRoutes.post('/promos', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, rewardCoins, maxUses } = req.body;
    if (!code) {
      res.status(400).json({ error: 'code is required.' });
      return;
    }

    const promo = await createPromoCode(code, rewardCoins || 50, maxUses || 100);
    res.status(201).json({ success: true, promo });
  } catch (error: any) {
    console.error('Error creating promo code:', error);
    res.status(400).json({ error: error.message || 'Error creating promo code' });
  }
});

// POST /api/growth/promos/redeem - Redeem Promo Code
growthEngineRoutes.post('/promos/redeem', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ error: 'code is required.' });
      return;
    }

    const result = await validatePromoCode(code, userId);
    if (!result.valid) {
      res.status(400).json({ success: false, reason: result.reason });
      return;
    }

    res.json({ success: true, rewardCoins: result.rewardCoins, message: 'Código promocional canjeado.' });
  } catch (error: any) {
    console.error('Error redeeming promo code:', error);
    res.status(400).json({ error: error.message || 'Error redeeming promo code' });
  }
});

// POST /api/growth/creators/apply - Apply for Creator Program
growthEngineRoutes.post('/creators/apply', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { category, country, socialHandle } = req.body;

    if (!category || !country || !socialHandle) {
      res.status(400).json({ error: 'category, country, and socialHandle are required.' });
      return;
    }

    const application = await applyCreatorProgram(userId, category, country, socialHandle);
    res.status(201).json({ success: true, application });
  } catch (error: any) {
    console.error('Error submitting creator application:', error);
    res.status(400).json({ error: error.message || 'Error submitting application' });
  }
});

// GET /api/growth/metrics - Get Advanced Growth Metrics (Admin)
growthEngineRoutes.get('/metrics', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const metrics = await calculateGrowthMetrics();
    res.json({ success: true, metrics });
  } catch (error: any) {
    console.error('Error fetching growth metrics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
