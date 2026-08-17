import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  createAffiliate,
  getAffiliateDashboard,
} from '../services/affiliateService';

export const affiliateRoutes = Router();

// POST /api/affiliates/apply - Apply/Create affiliate account
affiliateRoutes.post('/apply', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user.uid;
    const { name, trackingCode, commissionModel, commissionRate } = req.body;

    if (!name || !trackingCode) {
      res.status(400).json({ error: 'name and trackingCode are required.' });
      return;
    }

    const affiliate = await createAffiliate(name, ownerId, trackingCode, commissionModel, commissionRate);
    res.status(201).json({ success: true, affiliate });
  } catch (error: any) {
    console.error('Error creating affiliate:', error);
    res.status(400).json({ error: error.message || 'Error creating affiliate' });
  }
});

// GET /api/affiliates/dashboard/:affiliateId - Get affiliate dashboard
affiliateRoutes.get('/dashboard/:affiliateId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { affiliateId } = req.params;
    const dashboard = await getAffiliateDashboard(affiliateId as string);
    res.json({ success: true, ...dashboard });
  } catch (error: any) {
    console.error('Error fetching affiliate dashboard:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
