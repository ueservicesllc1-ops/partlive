import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  subscribeToHost,
  getUserActiveSubscriptions,
} from '../services/hostSubscriptionService';

export const hostSubscriptionRoutes = Router();

// POST /api/host-subscriptions/subscribe - Subscribe to Host
hostSubscriptionRoutes.post('/subscribe', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { hostId, tier, platform } = req.body;

    if (!hostId) {
      res.status(400).json({ error: 'hostId is required.' });
      return;
    }

    const subscription = await subscribeToHost(userId, hostId, tier, platform);
    res.status(201).json({ success: true, subscription });
  } catch (error: any) {
    console.error('Error subscribing to host:', error);
    res.status(400).json({ error: error.message || 'Error subscribing to host' });
  }
});

// GET /api/host-subscriptions/my-subscriptions - Get user active subscriptions
hostSubscriptionRoutes.get('/my-subscriptions', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const subs = await getUserActiveSubscriptions(userId);
    res.json({ success: true, ...subs });
  } catch (error: any) {
    console.error('Error getting active subscriptions:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
