import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  searchAllBackend,
  getRecentSearchesBackend,
  clearRecentSearchesBackend,
  getTrendingSearchesBackend,
} from '../services/searchService';

export const searchRoutes = Router();

// Search with filter and query
searchRoutes.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: User ID not found in token' });
      return;
    }

    const filters = req.body;
    const results = await searchAllBackend(userId, filters);
    res.json(results);
  } catch (error) {
    console.error('Error in POST /api/search:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get recent searches
searchRoutes.get('/recent', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: User ID not found in token' });
      return;
    }

    const recents = await getRecentSearchesBackend(userId);
    res.json(recents);
  } catch (error) {
    console.error('Error in GET /api/search/recent:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Clear recent searches
searchRoutes.delete('/recent', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: User ID not found in token' });
      return;
    }

    await clearRecentSearchesBackend(userId);
    res.json({ success: true, message: 'Recent searches cleared' });
  } catch (error) {
    console.error('Error in DELETE /api/search/recent:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get trending searches
searchRoutes.get('/trending', async (req, res): Promise<void> => {
  try {
    const country = req.query.country as string | undefined;
    const language = req.query.language as string | undefined;

    const trendings = await getTrendingSearchesBackend(country, language);
    res.json(trendings);
  } catch (error) {
    console.error('Error in GET /api/search/trending:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
export default searchRoutes;
