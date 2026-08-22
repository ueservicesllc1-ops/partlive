import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { acceptPolicy, checkUserPolicyAcceptances } from '../services/legalComplianceService';

export const legalRoutes = Router();

// GET /api/legal/policies - Get active legal policies & user acceptance status
legalRoutes.get('/policies', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const result = await checkUserPolicyAcceptances(userId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error fetching legal policies:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/legal/accept - Accept a legal policy version
legalRoutes.post('/accept', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { policyId, version } = req.body;

    if (!policyId || !version) {
      res.status(400).json({ error: 'policyId and version are required.' });
      return;
    }

    const record = await acceptPolicy(userId, policyId, version);
    res.json({ success: true, record });
  } catch (error: any) {
    console.error('Error accepting policy:', error);
    res.status(400).json({ error: error.message || 'Error accepting policy' });
  }
});
