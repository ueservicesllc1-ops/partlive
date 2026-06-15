import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { requireAdminOrModerator } from '../middleware/adminMiddleware';
import * as eventService from '../services/eventService';

const router = Router();

// --- USER ENDPOINTS ---

// Get all active events
router.get('/active', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const events = await eventService.getActiveEvents({
      type: req.query.type as string,
      target: req.query.target as string,
    });
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get detailed event by ID
router.get('/:eventId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const event = await eventService.getEventById(req.params.eventId as string);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(event);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get participants rank leaderboard
router.get('/:eventId/participants', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const participants = await eventService.getEventParticipants(req.params.eventId as string, limit);
    res.json(participants);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Join an active event
router.post('/:eventId/join', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const { displayName, username, photoURL, isHost, hostId, roomId, agencyId } = req.body;

    const participant = await eventService.joinEvent(req.params.eventId as string, {
      userId: isHost ? undefined : userId,
      hostId: isHost ? (hostId || userId) : undefined,
      roomId,
      agencyId,
      displayName: displayName || 'User',
      username,
      photoURL,
    });

    res.json({ success: true, participant });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Claim event rewards
router.post('/rewards/:rewardId/claim', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    await eventService.claimEventReward(req.params.rewardId as string, userId);
    res.json({ success: true, message: 'Reward successfully claimed' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- ADMIN / MODERATOR ENDPOINTS ---

// Get event management list (all statuses)
router.get('/admin/list', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const snap = await require('firebase-admin').firestore().collection('specialEvents').get();
    const list: any[] = [];
    snap.forEach((doc: any) => list.push(doc.data()));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new special event
router.post('/admin/create', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user.uid;
    const event = await eventService.createEvent(adminId, req.body);
    res.json({ success: true, event });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Edit event
router.patch('/admin/:eventId', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user.uid;
    const event = await eventService.updateEvent(req.params.eventId as string, adminId, req.body);
    res.json({ success: true, event });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Activate event
router.post('/admin/:eventId/activate', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user.uid;
    await eventService.activateEvent(req.params.eventId as string, adminId);
    res.json({ success: true, message: 'Event activated and notifications sent' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// End event
router.post('/admin/:eventId/end', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user.uid;
    await eventService.endEvent(req.params.eventId as string, adminId);
    res.json({ success: true, message: 'Event ended and rankings finalized' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Recalculate ranking positions
router.post('/admin/:eventId/recalculate', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    await eventService.recalculateEventRanking(req.params.eventId as string);
    res.json({ success: true, message: 'Rankings successfully recalculated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Manual Reward creation for top users
router.post('/admin/:eventId/rewards/add', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const { participantId, userId, rewardType, rewardAmount } = req.body;
    const reward = await eventService.createEventReward(req.params.eventId as string, participantId, {
      userId,
      rewardType,
      rewardAmount,
    });
    res.json({ success: true, reward });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Approve event rewards
router.post('/admin/rewards/:rewardId/approve', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user.uid;
    await eventService.approveEventReward(req.params.rewardId as string, adminId);
    res.json({ success: true, message: 'Reward approved' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reject event rewards
router.post('/admin/rewards/:rewardId/reject', requireAuth, requireAdminOrModerator, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user.uid;
    const { reason } = req.body;
    await eventService.rejectEventReward(req.params.rewardId as string, adminId, reason || 'Fraud detected');
    res.json({ success: true, message: 'Reward rejected' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
