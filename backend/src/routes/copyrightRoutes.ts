import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  submitCopyrightClaim,
  processTakedownAction,
  fileCopyrightAppeal,
  issueCopyrightStrike,
} from '../services/copyrightService';

export const copyrightRoutes = Router();

// POST /api/copyright/claim - Submit copyright claim
copyrightRoutes.post('/claim', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const claimantId = req.user.uid;
    const { contentId, contentType, reason } = req.body;

    if (!contentId || !contentType || !reason) {
      res.status(400).json({ error: 'contentId, contentType, and reason are required.' });
      return;
    }

    const claim = await submitCopyrightClaim(contentId, contentType, claimantId, reason);
    res.status(201).json({ success: true, claim });
  } catch (error: any) {
    console.error('Error submitting copyright claim:', error);
    res.status(400).json({ error: error.message || 'Error submitting claim' });
  }
});

// POST /api/copyright/takedown - Process takedown action (Admin)
copyrightRoutes.post('/takedown', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user.uid;
    const { claimId, action } = req.body;

    if (!claimId || !action) {
      res.status(400).json({ error: 'claimId and action are required.' });
      return;
    }

    const claim = await processTakedownAction(claimId, action, adminId);
    res.json({ success: true, claim });
  } catch (error: any) {
    console.error('Error processing takedown action:', error);
    res.status(400).json({ error: error.message || 'Error processing takedown' });
  }
});

// POST /api/copyright/appeal - File copyright appeal
copyrightRoutes.post('/appeal', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.user.uid;
    const { claimId, appealReason } = req.body;

    if (!claimId || !appealReason) {
      res.status(400).json({ error: 'claimId and appealReason are required.' });
      return;
    }

    await fileCopyrightAppeal(claimId, creatorId, appealReason);
    res.json({ success: true, message: 'Apelación registrada exitosamente.' });
  } catch (error: any) {
    console.error('Error filing copyright appeal:', error);
    res.status(400).json({ error: error.message || 'Error filing appeal' });
  }
});

// POST /api/copyright/strike - Issue copyright strike (Admin)
copyrightRoutes.post('/strike', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, contentId, reason } = req.body;

    if (!userId || !reason) {
      res.status(400).json({ error: 'userId and reason are required.' });
      return;
    }

    const result = await issueCopyrightStrike(userId, contentId || '', reason);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error issuing strike:', error);
    res.status(400).json({ error: error.message || 'Error issuing strike' });
  }
});
