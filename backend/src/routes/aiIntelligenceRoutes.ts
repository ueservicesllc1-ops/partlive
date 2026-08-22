import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  analyzeTextModeration,
  generateCreatorSuggestions,
  translateChatText,
  verifyFinancialIsolation,
  getAICostReport,
  trackAIUsage,
} from '../services/aiIntelligenceService';

export const aiIntelligenceRoutes = Router();

// POST /api/ai/moderate - Analyze Text Moderation
aiIntelligenceRoutes.post('/moderate', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text, context } = req.body;
    if (!text) {
      res.status(400).json({ error: 'text is required.' });
      return;
    }

    const result = await analyzeTextModeration(text, context);
    await trackAIUsage('moderation', result.modelUsed, text.length, 100);
    res.json({ success: true, result });
  } catch (error: any) {
    console.error('Error analyzing moderation:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/creator/ideas - Get AI Creator Ideas
aiIntelligenceRoutes.post('/creator/ideas', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { topic } = req.body;
    const suggestions = await generateCreatorSuggestions(userId, topic);
    await trackAIUsage('creator_assistant', 'gpt-4o', 150, 300);
    res.json({ success: true, suggestions });
  } catch (error: any) {
    console.error('Error generating creator suggestions:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/translate - Real-Time Chat Translation
aiIntelligenceRoutes.post('/translate', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text) {
      res.status(400).json({ error: 'text is required.' });
      return;
    }

    const result = await translateChatText(text, targetLanguage || 'es');
    if (!result.isCacheHit) {
      await trackAIUsage('translation', 'gpt-4o-mini', text.length, text.length * 2);
    }
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error translating text:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ai/financial-guard-check - Financial Security Isolation Check
aiIntelligenceRoutes.post('/financial-guard-check', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { actionName } = req.body;
    if (!actionName) {
      res.status(400).json({ error: 'actionName is required.' });
      return;
    }

    const check = verifyFinancialIsolation(actionName);
    res.json({ success: true, ...check });
  } catch (error: any) {
    console.error('Error performing financial guard check:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/ai/costs - Get AI Usage & Cost Breakdown (Admin)
aiIntelligenceRoutes.get('/costs', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const costs = await getAICostReport();
    res.json({ success: true, costs });
  } catch (error: any) {
    console.error('Error fetching AI costs:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
