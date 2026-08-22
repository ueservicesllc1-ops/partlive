import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { declareUserAge, canUserAccessAgeRestrictedContent } from '../services/ageSafetyService';
import { createSafetyCase, getTrustSafetyQueue, resolveSafetyCase } from '../services/trustSafetyService';
import { requestAccountDeletion, exportUserData } from '../services/privacyService';

export const trustSafetyRoutes = Router();

// POST /api/trust-safety/age/declare - Declare date of birth
trustSafetyRoutes.post('/age/declare', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { dateOfBirth } = req.body;

    if (!dateOfBirth) {
      res.status(400).json({ error: 'dateOfBirth (YYYY-MM-DD) is required.' });
      return;
    }

    const profile = await declareUserAge(userId, dateOfBirth);
    res.json({ success: true, profile });
  } catch (error: any) {
    console.error('Error declaring age:', error);
    res.status(400).json({ error: error.message || 'Error declaring age' });
  }
});

// GET /api/trust-safety/queue - Get Trust & Safety queue (Admin)
trustSafetyRoutes.get('/queue', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { severity, status } = req.query;
    const cases = await getTrustSafetyQueue(severity as string, (status as string) || 'OPEN');
    res.json({ success: true, cases });
  } catch (error: any) {
    console.error('Error fetching safety queue:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/trust-safety/cases/resolve - Resolve safety case (Admin)
trustSafetyRoutes.post('/cases/resolve', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { caseId, action, resolutionNotes } = req.body;

    if (!caseId || !action) {
      res.status(400).json({ error: 'caseId and action are required.' });
      return;
    }

    const resolved = await resolveSafetyCase(caseId, action, resolutionNotes || '', adminId);
    res.json({ success: true, case: resolved });
  } catch (error: any) {
    console.error('Error resolving safety case:', error);
    res.status(400).json({ error: error.message || 'Error resolving case' });
  }
});

// POST /api/trust-safety/privacy/delete - Request account deletion
trustSafetyRoutes.post('/privacy/delete', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const result = await requestAccountDeletion(userId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error requesting deletion:', error);
    res.status(400).json({ error: error.message || 'Error requesting deletion' });
  }
});

// GET /api/trust-safety/privacy/export - Export my data
trustSafetyRoutes.get('/privacy/export', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const data = await exportUserData(userId);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error exporting user data:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
