import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  recordRevenueEvent,
  processRefundReversal,
  getPlatformRevenueDashboard,
} from '../services/revenueService';

export const revenueRoutes = Router();

// POST /api/revenue/refund - Process refund reversal
revenueRoutes.post('/refund', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { revenueId, reason } = req.body;

    if (!revenueId) {
      res.status(400).json({ error: 'revenueId is required.' });
      return;
    }

    await processRefundReversal(revenueId, reason);
    res.json({ success: true, message: 'Reembolso procesado correctamente.' });
  } catch (error: any) {
    console.error('Error processing refund:', error);
    res.status(400).json({ error: error.message || 'Error processing refund' });
  }
});

// GET /api/revenue/dashboard - Get platform financial dashboard
revenueRoutes.get('/dashboard', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dashboard = await getPlatformRevenueDashboard();
    res.json({ success: true, dashboard });
  } catch (error: any) {
    console.error('Error getting revenue dashboard:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
