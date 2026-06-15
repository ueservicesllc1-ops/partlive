import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { getVipPlans, subscribeUserToVip, checkVipStatus } from '../services/vipService';

export const vipRoutes = Router();

// GET /api/vip/plans - Get all VIP plans
vipRoutes.get('/plans', (req, res) => {
  try {
    const plans = getVipPlans();
    res.json(plans);
  } catch (error: any) {
    console.error('Error fetching VIP plans:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/vip/status - Check current user VIP status
vipRoutes.get('/status', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user.uid;
    const isVip = await checkVipStatus(uid);
    res.json({ isVip });
  } catch (error: any) {
    console.error('Error checking VIP status:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/vip/subscribe - Subscribe to a VIP plan (Android purchase verification)
vipRoutes.post('/subscribe', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user.uid;
    const { planId, purchaseToken } = req.body;

    if (!planId) {
      res.status(400).json({ error: 'planId is required.' });
      return;
    }

    // Call service to process subscription (we default to android platform verification if purchaseToken is provided)
    const subscriptionId = await subscribeUserToVip(
      uid,
      planId,
      purchaseToken,
      purchaseToken ? 'android' : 'manual'
    );

    res.json({
      success: true,
      subscriptionId,
      message: 'VIP subscription activated successfully.'
    });
  } catch (error: any) {
    console.error('Error subscribing to VIP:', error);
    res.status(400).json({ error: error.message || 'Error subscribing to VIP' });
  }
});
