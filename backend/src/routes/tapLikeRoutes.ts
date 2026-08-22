import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { recordTapLikeBatch, getLiveTapLikeStats } from '../services/tapLikeService';

export const tapLikeRoutes = Router();

// POST /api/lives/:id/tap-like/batch - Record batched taps
tapLikeRoutes.post('/:id/tap-like/batch', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { id: liveId } = req.params;
    const { tapCount } = req.body;

    if (!tapCount || typeof tapCount !== 'number') {
      res.status(400).json({ error: 'tapCount must be a positive number.' });
      return;
    }

    const result = await recordTapLikeBatch(liveId as string, userId, tapCount);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error recording tap like batch:', error);
    res.status(400).json({ error: error.message || 'Error recording taps' });
  }
});

// GET /api/lives/:id/tap-like/stats - Get live tap stats
tapLikeRoutes.get('/:id/tap-like/stats', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: liveId } = req.params;
    const stats = await getLiveTapLikeStats(liveId as string);
    res.json({ success: true, stats });
  } catch (error: any) {
    console.error('Error fetching tap like stats:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
