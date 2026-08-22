import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  getCreatorStudioDashboard,
  getCreatorAudienceIntelligence,
  generatePreLiveChecklist,
  getAICreatorCoachAdvice,
  generateCreatorMediaKit,
} from '../services/creatorStudioSuccessService';

export const creatorStudioSuccessRoutes = Router();

// GET /api/creator-studio/dashboard - Get Creator Home Dashboard
creatorStudioSuccessRoutes.get('/dashboard', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const dashboard = await getCreatorStudioDashboard(hostId);
    res.json({ success: true, dashboard });
  } catch (error: any) {
    console.error('Error fetching creator dashboard:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/creator-studio/audience - Get Audience Intelligence & Supporter CRM
creatorStudioSuccessRoutes.get('/audience', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const audience = await getCreatorAudienceIntelligence(hostId);
    res.json({ success: true, audience });
  } catch (error: any) {
    console.error('Error fetching audience intelligence:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/creator-studio/pre-live - Generate Pre-Live Checklist & AI Title Suggestions
creatorStudioSuccessRoutes.post('/pre-live', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const { title, category } = req.body;

    const checklist = await generatePreLiveChecklist(hostId, title, category || 'Karaoke');
    res.json({ success: true, checklist });
  } catch (error: any) {
    console.error('Error generating pre-live checklist:', error);
    res.status(400).json({ error: error.message || 'Error generating checklist' });
  }
});

// GET /api/creator-studio/coach - Get AI Creator Coach Advice & Action Plan
creatorStudioSuccessRoutes.get('/coach', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const coach = await getAICreatorCoachAdvice(hostId);
    res.json({ success: true, coach });
  } catch (error: any) {
    console.error('Error fetching AI coach advice:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/creator-studio/media-kit - Generate Creator Public Media Kit & QR Code
creatorStudioSuccessRoutes.get('/media-kit', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostId = req.user.uid;
    const mediaKit = await generateCreatorMediaKit(hostId);
    res.json({ success: true, mediaKit });
  } catch (error: any) {
    console.error('Error generating media kit:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
