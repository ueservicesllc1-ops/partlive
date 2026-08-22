import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  evaluateUserRiskScore2,
  submitUserReport,
  getModerationQueue,
  applyEnforcementAction,
  processModerationAppeal,
  filterBotEngagement,
  getSafetyCenterMetrics,
} from '../services/trustSafetyEngine2Service';

export const trustSafetyEngine2Routes = Router();

// POST /api/trust-safety-2/risk-evaluate - Multi-Signal Risk Evaluation
trustSafetyEngine2Routes.post('/risk-evaluate', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { hasSpamFlag, isNewDevice, reportCount, highVelocityGifts } = req.body;

    const evaluation = await evaluateUserRiskScore2(userId, {
      hasSpamFlag: Boolean(hasSpamFlag),
      isNewDevice: Boolean(isNewDevice),
      reportCount: Number(reportCount || 0),
      highVelocityGifts: Boolean(highVelocityGifts),
    });

    res.json({ success: true, evaluation });
  } catch (error: any) {
    console.error('Error evaluating risk score:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/trust-safety-2/reports - Submit User/Content Report
trustSafetyEngine2Routes.post('/reports', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reporterId = req.user.uid;
    const { targetId, targetType, reportType, evidence } = req.body;

    if (!targetId || !targetType || !reportType) {
      res.status(400).json({ error: 'targetId, targetType, and reportType are required.' });
      return;
    }

    const report = await submitUserReport(reporterId, targetId, targetType, reportType, evidence);
    res.status(201).json({ success: true, report });
  } catch (error: any) {
    console.error('Error submitting report:', error);
    res.status(400).json({ error: error.message || 'Error submitting report' });
  }
});

// GET /api/trust-safety-2/queue - Get Moderation Queue (For Moderators)
trustSafetyEngine2Routes.get('/queue', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const queue = await getModerationQueue();
    res.json({ success: true, queue });
  } catch (error: any) {
    console.error('Error fetching moderation queue:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/trust-safety-2/enforce - Apply Enforcement Action
trustSafetyEngine2Routes.post('/enforce', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const appliedBy = req.user.uid;
    const { targetId, actionType, durationMinutes, reason } = req.body;

    if (!targetId || !actionType) {
      res.status(400).json({ error: 'targetId and actionType are required.' });
      return;
    }

    const enforcement = await applyEnforcementAction(
      targetId,
      actionType,
      Number(durationMinutes || 60),
      reason || 'Violación comunitaria',
      appliedBy
    );

    res.status(201).json({ success: true, enforcement });
  } catch (error: any) {
    console.error('Error applying enforcement:', error);
    res.status(400).json({ error: error.message || 'Error applying enforcement' });
  }
});

// POST /api/trust-safety-2/appeal - Review Moderation Appeal
trustSafetyEngine2Routes.post('/appeal', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviewerId = req.user.uid;
    const { caseId, userId, userExplanation, decision } = req.body;

    if (!caseId || !userId || !userExplanation) {
      res.status(400).json({ error: 'caseId, userId, and userExplanation are required.' });
      return;
    }

    const appeal = await processModerationAppeal(caseId, userId, userExplanation, decision || 'REVERSED', reviewerId);
    res.status(201).json({ success: true, appeal });
  } catch (error: any) {
    console.error('Error reviewing appeal:', error);
    res.status(400).json({ error: error.message || 'Error reviewing appeal' });
  }
});

// POST /api/trust-safety-2/bot-filter - Filter Bot Engagement
trustSafetyEngine2Routes.post('/bot-filter', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { liveId, rawTaps } = req.body;
    if (!liveId) {
      res.status(400).json({ error: 'liveId is required.' });
      return;
    }

    const filterResult = await filterBotEngagement(liveId, Number(rawTaps || 0));
    res.json({ success: true, ...filterResult });
  } catch (error: any) {
    console.error('Error filtering bot engagement:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/trust-safety-2/metrics - Get Safety Intelligence Metrics
trustSafetyEngine2Routes.get('/metrics', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const metrics = await getSafetyCenterMetrics();
    res.json({ success: true, metrics });
  } catch (error: any) {
    console.error('Error fetching safety metrics:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
