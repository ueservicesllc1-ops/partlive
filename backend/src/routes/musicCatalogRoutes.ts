import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { checkTrackAccess, getLicensedCatalog } from '../services/musicCatalogService';

export const musicCatalogRoutes = Router();

// GET /api/music/catalog - Get accessible music tracks for country
musicCatalogRoutes.get('/catalog', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const country = (req.query.country as string) || (req.user as any)?.country || 'US';
    const genre = req.query.genre as string;

    const tracks = await getLicensedCatalog(country, genre);
    res.json({ success: true, country, tracks });
  } catch (error: any) {
    console.error('Error fetching music catalog:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/music/tracks/:id/access - Check track access for user territory
musicCatalogRoutes.get('/tracks/:id/access', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const country = (req.query.country as string) || (req.user as any)?.country || 'US';

    const result = await checkTrackAccess(id as string, country);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error checking track access:', error);
    res.status(400).json({ error: error.message || 'Error checking track access' });
  }
});
