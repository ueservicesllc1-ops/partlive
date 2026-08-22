import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  createSafetyReport,
  getModerationQueue,
  submitCaseAppeal,
  reviewCaseAppeal,
} from '../services/platformSafetyService';

export const platformSafetyRoutes = Router();

// POST /api/safety/reports - Create safety report
platformSafetyRoutes.post('/reports', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reporterId = req.user.uid;
    const { targetUserId, targetContentId, category, description } = req.body;

    if (!targetUserId || !category || !description) {
      res.status(400).json({ error: 'targetUserId, category, and description are required.' });
      return;
    }

    const caseItem = await createSafetyReport(reporterId, { targetUserId, targetContentId, category, description });
    res.status(201).json({ success: true, case: caseItem });
  } catch (error: any) {
    console.error('Error creating safety report:', error);
    res.status(400).json({ error: error.message || 'Error creating report' });
  }
});

// GET /api/safety/queue - Get moderation queue (Admin)
platformSafetyRoutes.get('/queue', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const cases = await getModerationQueue((status as string) || 'OPEN');
    res.json({ success: true, cases });
  } catch (error: any) {
    console.error('Error fetching moderation queue:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/safety/appeals - Submit case appeal
platformSafetyRoutes.post('/appeals', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { caseId, reason } = req.body;

    if (!caseId || !reason) {
      res.status(400).json({ error: 'caseId and reason are required.' });
      return;
    }

    const appeal = await submitCaseAppeal(userId, caseId, reason);
    res.status(201).json({ success: true, appeal });
  } catch (error: any) {
    console.error('Error submitting appeal:', error);
    res.status(400).json({ error: error.message || 'Error submitting appeal' });
  }
});

// POST /api/safety/appeals/:id/review - Review case appeal (Admin)
platformSafetyRoutes.post('/appeals/:id/review', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    if (!status || (status !== 'UPHELD' && status !== 'REVERSED')) {
      res.status(400).json({ error: 'status MUST be UPHELD or REVERSED.' });
      return;
    }

    const appeal = await reviewCaseAppeal(id as string, status, resolutionNotes || '', adminId);
    res.json({ success: true, appeal });
  } catch (error: any) {
    console.error('Error reviewing appeal:', error);
    res.status(400).json({ error: error.message || 'Error reviewing appeal' });
  }
});
