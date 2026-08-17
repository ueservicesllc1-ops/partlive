import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  generatePreLivePlan,
  generatePostLiveSummary,
  detectClipMoments,
  classifyModerationContent,
} from '../services/aiService';

export const aiRoutes = Router();

// POST /api/ai/pre-live-plan - Generate pre-live titles & topics
aiRoutes.post('/pre-live-plan', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, topicKeywords } = req.body;
    const plan = await generatePreLivePlan(category, topicKeywords);
    res.json({ success: true, plan });
  } catch (error: any) {
    console.error('Error generating pre-live plan:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/live-summary - Generate post-live performance summary
aiRoutes.post('/live-summary', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { peakViewers, averageViewers, newFollowers, totalDiamonds } = req.body;
    const summary = await generatePostLiveSummary(
      peakViewers || 0,
      averageViewers || 0,
      newFollowers || 0,
      totalDiamonds || 0
    );
    res.json({ success: true, summary });
  } catch (error: any) {
    console.error('Error generating post-live summary:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/clip-moments - Auto detect clip moments from events
aiRoutes.post('/clip-moments', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { liveId, events } = req.body;
    const moments = await detectClipMoments(liveId || '', events || []);
    res.json({ success: true, moments });
  } catch (error: any) {
    console.error('Error detecting clip moments:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/moderate - Classify moderation content
aiRoutes.post('/moderate', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    const result = classifyModerationContent(text || '');
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error classifying content:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
