import { Router, Request, Response } from 'express';
import { searchHelpArticles, recordArticleFeedback } from '../services/helpCenterService';

export const helpCenterRoutes = Router();

// GET /api/help/articles - Search help articles
helpCenterRoutes.get('/articles', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, category, language } = req.query;
    const articles = await searchHelpArticles(
      query as string,
      category as string,
      (language as string) || 'ES'
    );
    res.json({ success: true, articles });
  } catch (error: any) {
    console.error('Error fetching help articles:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/help/feedback - Submit article feedback (helpful/not helpful)
helpCenterRoutes.post('/feedback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { articleId, helpful } = req.body;
    if (!articleId || typeof helpful !== 'boolean') {
      res.status(400).json({ error: 'articleId and helpful boolean are required.' });
      return;
    }

    await recordArticleFeedback(articleId, helpful);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    res.status(400).json({ error: error.message || 'Error submitting feedback' });
  }
});
