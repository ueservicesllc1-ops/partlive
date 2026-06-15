import { Response, Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  quickMatchBackend,
  inviteUserToSessionBackend,
  acceptGameInviteBackend,
  declineGameInviteBackend,
  getMyPendingGameInvitesBackend,
} from '../services/gameMatchmakingService';
import { db } from '../config/firebase';

export const gameMatchmakingRoutes = Router();

// POST /api/games/:gameId/quick-match
gameMatchmakingRoutes.post('/:gameId/quick-match', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const gameId = req.params.gameId as string;
    const { gameSlug, options } = req.body;
    const userId = req.user.uid;

    if (!gameId || !gameSlug) {
      res.status(400).json({ error: 'Missing parameters: gameId and gameSlug are required' });
      return;
    }

    // Get user details
    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists) {
      res.status(404).json({ error: 'User profile not found' });
      return;
    }
    const userData = userSnap.data()!;

    const sessionId = await quickMatchBackend(
      gameId,
      gameSlug,
      {
        uid: userId,
        displayName: userData.displayName || userData.username || 'Usuario',
        photoURL: userData.photoURL || undefined,
      },
      options
    );

    res.json({
      success: true,
      sessionId,
    });
  } catch (error: any) {
    console.error('Error in quick match backend endpoint:', error);
    res.status(400).json({ error: error?.message || 'Error processing quick match' });
  }
});

// POST /api/games/sessions/:sessionId/invite
gameMatchmakingRoutes.post('/sessions/:sessionId/invite', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessionId = req.params.sessionId as string;
    const { toUserId, message } = req.body;
    const fromUserId = req.user.uid;

    if (!sessionId || !toUserId) {
      res.status(400).json({ error: 'Missing parameters: sessionId and toUserId are required' });
      return;
    }

    const inviteId = await inviteUserToSessionBackend(sessionId, fromUserId, toUserId, message);

    res.json({
      success: true,
      inviteId,
    });
  } catch (error: any) {
    console.error('Error in session invite backend endpoint:', error);
    res.status(400).json({ error: error?.message || 'Error sending invitation' });
  }
});

// POST /api/games/invites/:inviteId/accept
gameMatchmakingRoutes.post('/invites/:inviteId/accept', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const inviteId = req.params.inviteId as string;
    const userId = req.user.uid;

    if (!inviteId) {
      res.status(400).json({ error: 'Missing parameter: inviteId is required' });
      return;
    }

    const sessionId = await acceptGameInviteBackend(inviteId, userId);

    res.json({
      success: true,
      sessionId,
    });
  } catch (error: any) {
    console.error('Error in accept invite backend endpoint:', error);
    res.status(400).json({ error: error?.message || 'Error accepting invitation' });
  }
});

// POST /api/games/invites/:inviteId/decline
gameMatchmakingRoutes.post('/invites/:inviteId/decline', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const inviteId = req.params.inviteId as string;
    const userId = req.user.uid;

    if (!inviteId) {
      res.status(400).json({ error: 'Missing parameter: inviteId is required' });
      return;
    }

    await declineGameInviteBackend(inviteId, userId);

    res.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error in decline invite backend endpoint:', error);
    res.status(400).json({ error: error?.message || 'Error declining invitation' });
  }
});

// GET /api/games/invites/my
gameMatchmakingRoutes.get('/invites/my', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const invites = await getMyPendingGameInvitesBackend(userId);
    
    res.json({
      success: true,
      invites,
    });
  } catch (error: any) {
    console.error('Error fetching user invites backend endpoint:', error);
    res.status(400).json({ error: error?.message || 'Error getting invitations' });
  }
});
