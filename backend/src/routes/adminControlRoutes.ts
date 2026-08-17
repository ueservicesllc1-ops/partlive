import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';
import {
  getAdminOverviewMetrics,
  requestTwoPersonApproval,
  approveTwoPersonAction,
} from '../services/adminControlService';

export const adminControlRoutes = Router();

// GET /api/admin-control/overview - Operational & BI metrics overview
adminControlRoutes.get('/overview', requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const metrics = await getAdminOverviewMetrics();
    res.json({ success: true, metrics });
  } catch (error: any) {
    console.error('Error fetching admin overview metrics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/admin-control/two-person-request - Request maker/checker approval
adminControlRoutes.post('/two-person-request', requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const makerId = req.user.uid;
    const { actionType, payloadUsd, targetId } = req.body;

    const request = await requestTwoPersonApproval(makerId, actionType, payloadUsd || 0, targetId || '');
    res.status(201).json({ success: true, request });
  } catch (error: any) {
    console.error('Error requesting two person approval:', error);
    res.status(400).json({ error: error.message || 'Error creating request' });
  }
});

// POST /api/admin-control/two-person-approve - Approve maker/checker request
adminControlRoutes.post('/two-person-approve', requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const checkerId = req.user.uid;
    const { approvalId } = req.body;

    if (!approvalId) {
      res.status(400).json({ error: 'approvalId is required.' });
      return;
    }

    await approveTwoPersonAction(checkerId, approvalId);
    res.json({ success: true, message: 'Operación aprobada por el segundo administrador.' });
  } catch (error: any) {
    console.error('Error approving two person action:', error);
    res.status(400).json({ error: error.message || 'Error approving action' });
  }
});
