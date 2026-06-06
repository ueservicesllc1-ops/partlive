import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/authMiddleware';
import { db } from '../config/firebase';
import { createLiveKitRoomToken } from '../services/livekitTokenService';

const router = Router();

router.post('/token', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomId, liveId } = req.body;
    const uid = req.user.uid;
    const displayName = req.user.name || req.user.email?.split('@')[0] || 'User';

    if (!roomId && !liveId) {
      res.status(400).json({ error: 'roomId or liveId is required' });
      return;
    }

    if (liveId) {
      // 1. Fetch Live metadata from Firestore
      const liveRef = db.collection('lives').doc(liveId);
      const liveSnap = await liveRef.get();

      if (!liveSnap.exists) {
        res.status(404).json({ error: 'Live stream not found' });
        return;
      }

      const liveData = liveSnap.data();
      if (!liveData || liveData.status !== 'live') {
        res.status(400).json({ error: 'Live stream is not active' });
        return;
      }

      // Check if user is host
      const isHost = liveData.hostId === uid;
      const canPublish = isHost;

      // Generate room name and identity
      const roomName = `live_${liveId}`;
      const identity = uid;

      // Generate secure LiveKit token
      const token = await createLiveKitRoomToken({
        identity,
        name: displayName,
        roomName,
        canPublish,
        canSubscribe: true,
        canPublishData: true,
        metadata: {
          uid,
          displayName,
          role: isHost ? 'host' : 'viewer',
          liveId,
        },
      });

      res.json({
        token,
        url: process.env.LIVEKIT_WS_URL || 'ws://localhost:7880',
        roomName,
        identity,
        canPublish,
        expiresIn: parseInt(process.env.LIVEKIT_TOKEN_EXPIRE_SECONDS || '3600', 10),
      });
      return;
    }

    // Existing roomId logic
    // 1. Fetch Room metadata from Firestore
    const roomRef = db.collection('rooms').doc(roomId);
    const roomSnap = await roomRef.get();


    if (!roomSnap.exists) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const roomData = roomSnap.data();
    if (!roomData || roomData.status !== 'active') {
      res.status(400).json({ error: 'Room is not active' });
      return;
    }

    // 2. Fetch User Membership from subcollection
    const memberRef = roomRef.collection('members').doc(uid);
    const memberSnap = await memberRef.get();

    if (!memberSnap.exists) {
      res.status(403).json({ error: 'User is not a member of this room' });
      return;
    }

    const memberData = memberSnap.data();
    const role = memberData?.role || 'listener';

    // 3. Determine permissions based on Firestore role
    const isPrivileged = ['owner', 'host', 'moderator', 'speaker'].includes(role);
    const canPublish = isPrivileged;

    // 4. Generate room name and identity
    const roomName = `room_${roomId}`;
    const identity = uid;

    // 5. Generate secure LiveKit token
    const token = await createLiveKitRoomToken({
      identity,
      name: displayName,
      roomName,
      canPublish,
      canSubscribe: true,
      canPublishData: true,
      metadata: {
        uid,
        displayName,
        role,
        roomId,
      },
    });

    res.json({
      token,
      url: process.env.LIVEKIT_WS_URL || 'ws://localhost:7880',
      roomName,
      identity,
      canPublish,
      expiresIn: parseInt(process.env.LIVEKIT_TOKEN_EXPIRE_SECONDS || '3600', 10),
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const livekitRoutes = router;
