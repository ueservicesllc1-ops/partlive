import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  inviteHostToPk,
  acceptPkInvite,
  rejectPkInvite,
  cancelPkInvite,
  finishPkBattle,
  cancelPkBattle,
  getActivePkBattleByLive,
  getHostPkHistory
} from '../services/pkBattleService';

export const pkBattleRoutes = Router();

// POST /api/pk/invite - Invite another host to PK
pkBattleRoutes.post('/invite', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fromHostId = req.user.uid;
    const { toHostId, fromLiveId, message } = req.body;

    if (!toHostId || !fromLiveId) {
      res.status(400).json({ error: 'toHostId and fromLiveId are required.' });
      return;
    }

    const invite = await inviteHostToPk(fromHostId, toHostId, fromLiveId, message);
    res.status(201).json({ success: true, invite });
  } catch (error: any) {
    console.error('Error inviting host to PK:', error);
    res.status(400).json({ error: error.message || 'Error inviting host' });
  }
});

// POST /api/pk/accept - Accept a PK invite
pkBattleRoutes.post('/accept', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const toHostId = req.user.uid;
    const { inviteId, toLiveId } = req.body;

    if (!inviteId || !toLiveId) {
      res.status(400).json({ error: 'inviteId and toLiveId are required.' });
      return;
    }

    const battle = await acceptPkInvite(toHostId, inviteId, toLiveId);
    res.json({ success: true, battle });
  } catch (error: any) {
    console.error('Error accepting PK invite:', error);
    res.status(400).json({ error: error.message || 'Error accepting invite' });
  }
});

// POST /api/pk/reject - Reject a PK invite
pkBattleRoutes.post('/reject', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const toHostId = req.user.uid;
    const { inviteId, reason } = req.body;

    if (!inviteId) {
      res.status(400).json({ error: 'inviteId is required.' });
      return;
    }

    await rejectPkInvite(toHostId, inviteId, reason);
    res.json({ success: true, message: 'PK invite rejected.' });
  } catch (error: any) {
    console.error('Error rejecting PK invite:', error);
    res.status(400).json({ error: error.message || 'Error rejecting invite' });
  }
});

// POST /api/pk/cancel - Cancel a sent PK invite
pkBattleRoutes.post('/cancel', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fromHostId = req.user.uid;
    const { inviteId } = req.body;

    if (!inviteId) {
      res.status(400).json({ error: 'inviteId is required.' });
      return;
    }

    await cancelPkInvite(fromHostId, inviteId);
    res.json({ success: true, message: 'PK invite cancelled.' });
  } catch (error: any) {
    console.error('Error cancelling PK invite:', error);
    res.status(400).json({ error: error.message || 'Error cancelling invite' });
  }
});

// POST /api/pk/finish - Complete/Finish a PK battle
pkBattleRoutes.post('/finish', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pkBattleId, reason } = req.body;

    if (!pkBattleId) {
      res.status(400).json({ error: 'pkBattleId is required.' });
      return;
    }

    const battle = await finishPkBattle(pkBattleId, reason);
    res.json({ success: true, battle });
  } catch (error: any) {
    console.error('Error finishing PK battle:', error);
    res.status(400).json({ error: error.message || 'Error finishing battle' });
  }
});

// POST /api/pk/cancel-battle - Cancel an active battle (admin or participant)
pkBattleRoutes.post('/cancel-battle', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const actorId = req.user.uid;
    const { pkBattleId, reason } = req.body;

    if (!pkBattleId) {
      res.status(400).json({ error: 'pkBattleId is required.' });
      return;
    }

    await cancelPkBattle(actorId, pkBattleId, reason);
    res.json({ success: true, message: 'PK battle cancelled successfully.' });
  } catch (error: any) {
    console.error('Error cancelling PK battle:', error);
    res.status(400).json({ error: error.message || 'Error cancelling battle' });
  }
});

// GET /api/pk/active/:liveId - Get active PK battle by live ID
pkBattleRoutes.get('/active/:liveId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { liveId } = req.params;
    const battle = await getActivePkBattleByLive(liveId as string);
    res.json({ success: true, battle });
  } catch (error: any) {
    console.error('Error fetching active PK battle:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/pk/history/:hostId - Get host PK battle history
pkBattleRoutes.get('/history/:hostId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hostId } = req.params;
    const limitCount = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const history = await getHostPkHistory(hostId as string, limitCount);
    res.json({ success: true, history });
  } catch (error: any) {
    console.error('Error fetching PK history:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
