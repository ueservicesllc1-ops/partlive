import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  createBetaInviteCode,
  validateBetaInviteCode,
  submitBetaFeedback,
  checkAppVersionGate,
  setCanaryRolloutPercentage,
  getLaunchReadinessScore,
} from '../services/betaRolloutService';

export const betaRolloutRoutes = Router();

// POST /api/beta/invites - Create Beta Invite Code (Admin)
betaRolloutRoutes.post('/invites', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, maxUses, campaignId } = req.body;
    if (!code) {
      res.status(400).json({ error: 'code is required.' });
      return;
    }

    const invite = await createBetaInviteCode(code, maxUses || 10, campaignId || 'closed_beta');
    res.status(201).json({ success: true, invite });
  } catch (error: any) {
    console.error('Error creating invite code:', error);
    res.status(400).json({ error: error.message || 'Error creating invite code' });
  }
});

// POST /api/beta/invites/redeem - Redeem Beta Invite Code
betaRolloutRoutes.post('/invites/redeem', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ error: 'code is required.' });
      return;
    }

    const result = await validateBetaInviteCode(code, userId);
    if (!result.valid) {
      res.status(400).json({ success: false, reason: result.reason });
      return;
    }

    res.json({ success: true, message: 'Código de invitación canjeado con éxito.' });
  } catch (error: any) {
    console.error('Error redeeming invite code:', error);
    res.status(400).json({ error: error.message || 'Error redeeming invite code' });
  }
});

// POST /api/beta/feedback - Submit Beta Feedback / Bug Report
betaRolloutRoutes.post('/feedback', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { category, description, appVersion, device } = req.body;

    if (!category || !description) {
      res.status(400).json({ error: 'category and description are required.' });
      return;
    }

    const feedback = await submitBetaFeedback(userId, category, description, appVersion || '1.0.0', device || 'unknown');
    res.status(201).json({ success: true, feedback });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    res.status(400).json({ error: error.message || 'Error submitting feedback' });
  }
});

// GET /api/beta/version-gate - Check App Version Gate
betaRolloutRoutes.get('/version-gate', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clientVersion = (req.query.version as string) || '1.0.0';
    const platform = (req.query.platform as any) || 'android';

    const gate = checkAppVersionGate(clientVersion, platform);
    res.json({ success: true, gate });
  } catch (error: any) {
    console.error('Error checking version gate:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/beta/canary - Update Canary Rollout Percentage (Admin)
betaRolloutRoutes.post('/canary', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { percentage } = req.body;
    if (percentage === undefined) {
      res.status(400).json({ error: 'percentage is required.' });
      return;
    }

    const state = await setCanaryRolloutPercentage(Number(percentage));
    res.json({ success: true, state });
  } catch (error: any) {
    console.error('Error updating canary rollout:', error);
    res.status(400).json({ error: error.message || 'Error updating canary' });
  }
});

// GET /api/beta/readiness - Get Launch Readiness Scores
betaRolloutRoutes.get('/readiness', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const report = await getLaunchReadinessScore();
    res.json({ success: true, report });
  } catch (error: any) {
    console.error('Error fetching launch readiness:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
