import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getExecutiveOverview,
  toggleKillSwitch,
  updateGlobalConfig,
  submitMakerCheckerRequest,
  approveMakerCheckerRequest,
} from '../services/superAdminService';

export const superAdminRoutes = Router();

// GET /api/admin/super/overview - Get Executive Summary & System Health
superAdminRoutes.get('/overview', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const overview = await getExecutiveOverview();
    res.json({ success: true, overview });
  } catch (error: any) {
    console.error('Error fetching executive overview:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/admin/super/kill-switch - Toggle emergency kill switch
superAdminRoutes.post('/kill-switch', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { featureKey, enabled, reason } = req.body;

    if (!featureKey || typeof enabled !== 'boolean' || !reason) {
      res.status(400).json({ error: 'featureKey, enabled boolean, and reason are required.' });
      return;
    }

    const switchRes = await toggleKillSwitch(featureKey, enabled, reason, adminId);
    res.json({ success: true, switch: switchRes });
  } catch (error: any) {
    console.error('Error toggling kill switch:', error);
    res.status(400).json({ error: error.message || 'Error toggling kill switch' });
  }
});

// POST /api/admin/super/config - Update versioned global config
superAdminRoutes.post('/config', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { moduleKey, changes, effectiveAt, reason } = req.body;

    if (!moduleKey || !changes || !reason) {
      res.status(400).json({ error: 'moduleKey, changes object, and reason are required.' });
      return;
    }

    const configRes = await updateGlobalConfig(moduleKey, changes, effectiveAt, reason, adminId);
    res.json({ success: true, ...configRes });
  } catch (error: any) {
    console.error('Error updating config:', error);
    res.status(400).json({ error: error.message || 'Error updating config' });
  }
});

// POST /api/admin/super/maker-checker - Submit dual control request
superAdminRoutes.post('/maker-checker', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user.uid;
    const { actionType, payload, justification } = req.body;

    if (!actionType || !payload || !justification) {
      res.status(400).json({ error: 'actionType, payload, and justification are required.' });
      return;
    }

    const request = await submitMakerCheckerRequest(requesterId, actionType, payload, justification);
    res.status(201).json({ success: true, request });
  } catch (error: any) {
    console.error('Error submitting maker-checker request:', error);
    res.status(400).json({ error: error.message || 'Error submitting request' });
  }
});

// POST /api/admin/super/maker-checker/:id/approve - Approve dual control request
superAdminRoutes.post('/maker-checker/:id/approve', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const approverId = req.user.uid;
    const { id } = req.params;

    const request = await approveMakerCheckerRequest(id as string, approverId);
    res.json({ success: true, request });
  } catch (error: any) {
    console.error('Error approving maker-checker request:', error);
    res.status(400).json({ error: error.message || 'Error approving request' });
  }
});
