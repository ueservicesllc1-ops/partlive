import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  createStory,
  recordStoryView,
  getActiveStoriesFeed,
} from '../services/storyService';

export const storyRoutes = Router();

// POST /api/stories/create - Create a 24-hour story
storyRoutes.post('/create', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const authorId = req.user.uid;
    const { mediaUrl, type } = req.body;

    if (!mediaUrl) {
      res.status(400).json({ error: 'mediaUrl is required.' });
      return;
    }

    const story = await createStory(authorId, mediaUrl, type);
    res.status(201).json({ success: true, story });
  } catch (error: any) {
    console.error('Error creating story:', error);
    res.status(400).json({ error: error.message || 'Error creating story' });
  }
});

// POST /api/stories/:id/view - Record story view
storyRoutes.post('/:id/view', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    await recordStoryView(userId, id as string);
    res.json({ success: true, message: 'Vista registrada.' });
  } catch (error: any) {
    console.error('Error recording story view:', error);
    res.status(400).json({ error: error.message || 'Error recording view' });
  }
});

// GET /api/stories/feed - Get active 24h stories
storyRoutes.get('/feed', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const stories = await getActiveStoriesFeed(userId);
    res.json({ success: true, stories });
  } catch (error: any) {
    console.error('Error fetching stories feed:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
