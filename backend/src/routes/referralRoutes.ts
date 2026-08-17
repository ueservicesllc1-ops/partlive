import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  generateUserReferralCode,
  registerReferral,
  qualifyReferral,
  getReferralDashboard,
} from '../services/referralService';

export const referralRoutes = Router();

// GET /api/referrals/my-code - Get user's referral code and link
referralRoutes.get('/my-code', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const dashboard = await getReferralDashboard(userId);
    res.json({ success: true, ...dashboard });
  } catch (error: any) {
    console.error('Error fetching referral dashboard:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/referrals/register - Register referral during signup
referralRoutes.post('/register', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { referrerCode } = req.body;

    if (!referrerCode) {
      res.status(400).json({ error: 'referrerCode is required.' });
      return;
    }

    const record = await registerReferral(referrerCode, userId);
    res.status(201).json({ success: true, record });
  } catch (error: any) {
    console.error('Error registering referral:', error);
    res.status(400).json({ error: error.message || 'Error registering referral' });
  }
});

// POST /api/referrals/qualify - Qualify referral
referralRoutes.post('/qualify', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { referredUserId } = req.body;
    await qualifyReferral(referredUserId);
    res.json({ success: true, message: 'Referido calificado exitosamente.' });
  } catch (error: any) {
    console.error('Error qualifying referral:', error);
    res.status(400).json({ error: error.message || 'Error qualifying referral' });
  }
});
