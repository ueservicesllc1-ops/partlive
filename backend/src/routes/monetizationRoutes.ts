import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getMonetizationStreams,
  calculateRevenueCommission,
  updateStreamCommission,
} from '../services/monetizationEngineService';

export const monetizationRoutes = Router();

// GET /api/monetization/streams - Get active monetization streams
monetizationRoutes.get('/streams', async (req: Request, res: Response): Promise<void> => {
  try {
    const country = (req.query.country as string) || 'US';
    const streams = await getMonetizationStreams(country);
    res.json({ success: true, streams });
  } catch (error: any) {
    console.error('Error fetching monetization streams:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/monetization/calculate - Calculate revenue commission split
monetizationRoutes.post('/calculate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { streamType, grossAmountUsd } = req.body;
    if (!streamType || typeof grossAmountUsd !== 'number') {
      res.status(400).json({ error: 'streamType and grossAmountUsd are required.' });
      return;
    }

    const split = await calculateRevenueCommission(streamType, grossAmountUsd);
    res.json({ success: true, split });
  } catch (error: any) {
    console.error('Error calculating commission:', error);
    res.status(400).json({ error: error.message || 'Error calculating split' });
  }
});

// PUT /api/monetization/streams/:id/commission - Update stream commission split (Admin)
monetizationRoutes.put('/streams/:id/commission', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { id } = req.params;
    const { hostSharePct, platformSharePct } = req.body;

    if (typeof hostSharePct !== 'number' || typeof platformSharePct !== 'number') {
      res.status(400).json({ error: 'hostSharePct and platformSharePct numbers are required.' });
      return;
    }

    const updated = await updateStreamCommission(id as string, hostSharePct, platformSharePct, adminId);
    res.json({ success: true, stream: updated });
  } catch (error: any) {
    console.error('Error updating stream commission:', error);
    res.status(400).json({ error: error.message || 'Error updating commission' });
  }
});
