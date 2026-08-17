import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { createClub, joinClub, getClubLeaderboard } from '../services/clubService';

export const clubRoutes = Router();

// POST /api/clubs/create - Create a new VIP or Host Fan Club
clubRoutes.post('/create', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user.uid;
    const { name, description, isHostFanClub, hostId, privacy } = req.body;

    if (!name) {
      res.status(400).json({ error: 'name is required.' });
      return;
    }

    const club = await createClub(ownerId, name, description || '', isHostFanClub, hostId, privacy);
    res.status(201).json({ success: true, club });
  } catch (error: any) {
    console.error('Error creating club:', error);
    res.status(400).json({ error: error.message || 'Error creating club' });
  }
});

// POST /api/clubs/join - Join a Club
clubRoutes.post('/join', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { clubId } = req.body;

    if (!clubId) {
      res.status(400).json({ error: 'clubId is required.' });
      return;
    }

    await joinClub(userId, clubId);
    res.json({ success: true, message: 'Joined club successfully.' });
  } catch (error: any) {
    console.error('Error joining club:', error);
    res.status(400).json({ error: error.message || 'Error joining club' });
  }
});

// GET /api/clubs/leaderboard/:clubId - Get Club Top Members Leaderboard
clubRoutes.get('/leaderboard/:clubId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clubId } = req.params;
    const leaderboard = await getClubLeaderboard(clubId as string);
    res.json({ success: true, leaderboard });
  } catch (error: any) {
    console.error('Error fetching club leaderboard:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
