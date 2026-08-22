import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  subscribeUserToCreator,
  subscribeUserToFanClub,
  verifySubscriberContentAccess,
  getSubscriptionAnalytics,
  toggleSubscriptionKillSwitch,
} from '../services/subscriptionEngineService';

export const subscriptionEngineRoutes = Router();

// POST /api/subscriptions/creator/subscribe - Subscribe to Creator (Tier 1-3)
subscriptionEngineRoutes.post('/creator/subscribe', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { hostId, tierId, receiptToken, platform } = req.body;

    if (!hostId) {
      res.status(400).json({ error: 'hostId is required.' });
      return;
    }

    const sub = await subscribeUserToCreator(
      userId,
      hostId,
      tierId || 'tier_1',
      receiptToken || 'receipt_valid_token_123',
      platform || 'android'
    );

    res.status(201).json({ success: true, subscription: sub });
  } catch (error: any) {
    console.error('Error in creator subscription:', error);
    res.status(400).json({ error: error.message || 'Subscription failed' });
  }
});

// POST /api/subscriptions/fan-club - Subscribe to Fan Club
subscriptionEngineRoutes.post('/fan-club', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { hostId } = req.body;

    if (!hostId) {
      res.status(400).json({ error: 'hostId is required.' });
      return;
    }

    const membership = await subscribeUserToFanClub(userId, hostId);
    res.status(201).json({ success: true, membership });
  } catch (error: any) {
    console.error('Error joining fan club:', error);
    res.status(400).json({ error: error.message || 'Fan club joining failed' });
  }
});

// POST /api/subscriptions/access-check - Verify Content Gate Access
subscriptionEngineRoutes.post('/access-check', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { creatorId, contentId } = req.body;

    if (!creatorId || !contentId) {
      res.status(400).json({ error: 'creatorId and contentId are required.' });
      return;
    }

    const access = await verifySubscriberContentAccess(userId, creatorId, contentId);
    res.json({ success: true, ...access });
  } catch (error: any) {
    console.error('Error verifying subscriber access:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/subscriptions/analytics - Get Recurring Revenue Analytics (MRR, ARR, Churn)
subscriptionEngineRoutes.get('/analytics', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const analytics = await getSubscriptionAnalytics();
    res.json({ success: true, analytics });
  } catch (error: any) {
    console.error('Error fetching subscription analytics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/subscriptions/kill-switch - Toggle Subscription Purchases Kill Switch
subscriptionEngineRoutes.post('/kill-switch', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { enabled, reason } = req.body;

    const killSwitch = await toggleSubscriptionKillSwitch(Boolean(enabled), reason, adminId);
    res.json({ success: true, killSwitch });
  } catch (error: any) {
    console.error('Error toggling subscription kill switch:', error);
    res.status(400).json({ error: error.message || 'Error toggling kill switch' });
  }
});
