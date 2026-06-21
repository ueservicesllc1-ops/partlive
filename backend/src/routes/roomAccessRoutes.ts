import { Router } from 'express';
import {
  canEnterRoom,
  requestRoomAccess,
  approveRoomAccess,
  rejectRoomAccess,
  inviteUserToRoom,
  acceptRoomInvite,
  rejectRoomInvite,
  kickUserFromRoom,
  banUserFromRoom,
  unbanUserFromRoom
} from '../services/roomAccessService';
import { db } from '../config/firebase';

const router = Router();

// Endpoint 1: Can Enter Room Check
router.post('/:roomId/can-enter', async (req: any, res: any) => {
  const { roomId } = req.params;
  const { userId, password } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const access = await canEnterRoom(userId, roomId, password);
    res.json(access);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 2: Request Access
router.post('/:roomId/access/request', async (req: any, res: any) => {
  const { roomId } = req.params;
  const { userId, userName, userPhotoURL } = req.body;

  try {
    const request = await requestRoomAccess(userId, roomId, userName, userPhotoURL);
    res.status(201).json(request);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 3: Approve Request
router.post('/access/:requestId/approve', async (req: any, res: any) => {
  const { requestId } = req.params;
  const { actorId } = req.body; // Host/Moderator ID

  try {
    await approveRoomAccess(actorId, requestId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 4: Reject Request
router.post('/access/:requestId/reject', async (req: any, res: any) => {
  const { requestId } = req.params;
  const { actorId } = req.body;

  try {
    await rejectRoomAccess(actorId, requestId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 5: Invite User
router.post('/:roomId/invite', async (req: any, res: any) => {
  const { roomId } = req.params;
  const { actorId, invitedUserId } = req.body;

  try {
    const invite = await inviteUserToRoom(actorId, roomId, invitedUserId);
    res.status(201).json(invite);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 6: Accept Invite
router.post('/invites/:inviteId/accept', async (req: any, res: any) => {
  const { inviteId } = req.params;

  try {
    await acceptRoomInvite(inviteId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 7: Reject Invite
router.post('/invites/:inviteId/reject', async (req: any, res: any) => {
  const { inviteId } = req.params;

  try {
    await rejectRoomInvite(inviteId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 8: Kick User
router.post('/:roomId/kick', async (req: any, res: any) => {
  const { roomId } = req.params;
  const { actorId, targetUserId, reason } = req.body;

  try {
    await kickUserFromRoom(actorId, roomId, targetUserId, reason);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 9: Ban User
router.post('/:roomId/ban', async (req: any, res: any) => {
  const { roomId } = req.params;
  const { actorId, targetUserId, isPermanent, durationMinutes, reason } = req.body;

  try {
    await banUserFromRoom(actorId, roomId, targetUserId, isPermanent, durationMinutes, reason);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 10: Unban User
router.post('/:roomId/unban', async (req: any, res: any) => {
  const { roomId } = req.params;
  const { targetUserId } = req.body;

  try {
    await unbanUserFromRoom(roomId, targetUserId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 11: Get active Room Bans
router.get('/:roomId/bans', async (req: any, res: any) => {
  const { roomId } = req.params;
  try {
    const bansSnap = await db.collection('roomBans').where('roomId', '==', roomId).get();
    const bans = bansSnap.docs.map(doc => doc.data());
    res.json(bans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 12: Get Room Access Requests
router.get('/:roomId/access-requests', async (req: any, res: any) => {
  const { roomId } = req.params;
  try {
    const reqsSnap = await db.collection('roomAccessRequests').where('roomId', '==', roomId).get();
    const requests = reqsSnap.docs.map(doc => doc.data());
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const roomAccessRoutes = router;
