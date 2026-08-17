import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { getSystemFeatureFlags } from '../services/featureFlagService';
import { reconcileDailyFinancials } from '../services/financialIntegrityService';
import { calculateUserFraudRiskScore } from '../services/fraudDetectionService';

export const productionSecurityRoutes = Router();

// GET /api/security/features - Get system feature flags
productionSecurityRoutes.get('/features', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const flags = await getSystemFeatureFlags();
    res.json({ success: true, flags });
  } catch (error: any) {
    console.error('Error fetching feature flags:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/security/reconcile - Run daily financial reconciliation audit
productionSecurityRoutes.get('/reconcile', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const report = await reconcileDailyFinancials();
    res.json({ success: true, report });
  } catch (error: any) {
    console.error('Error running financial reconciliation:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/security/fraud-score/:userId - Get fraud risk score for user
productionSecurityRoutes.get('/fraud-score/:userId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const evaluation = await calculateUserFraudRiskScore(userId as string);
    res.json({ success: true, evaluation });
  } catch (error: any) {
    console.error('Error calculating fraud score:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
