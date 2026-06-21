import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

// Check if user is banned from the voice room
export const isUserBannedFromRoom = async (userId: string, roomId: string): Promise<{ banned: boolean; reason?: string }> => {
  const bansSnap = await db.collection('roomBans')
    .where('roomId', '==', roomId)
    .where('userId', '==', userId)
    .get();

  if (bansSnap.empty) {
    return { banned: false };
  }

  // Check if any active ban exists (permanent or not expired)
  const now = admin.firestore.Timestamp.now();
  for (const doc of bansSnap.docs) {
    const data = doc.data();
    if (data.type === 'ban') {
      if (data.isPermanent) {
        return { banned: true, reason: data.reason || 'Baneo Permanente' };
      }
      if (data.expiresAt) {
        const expiresAt = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
        if (expiresAt > new Date()) {
          return { banned: true, reason: data.reason || 'Baneo Temporal' };
        }
      }
    }
  }

  return { banned: false };
};

// Check if user can enter the room and return status code reasons
export const canEnterRoom = async (userId: string, roomId: string, password?: string): Promise<{ canEnter: boolean; reason?: string; message?: string }> => {
  // 1. Check bans first
  const banCheck = await isUserBannedFromRoom(userId, roomId);
  if (banCheck.banned) {
    return { canEnter: false, reason: 'banned', message: 'Estás bloqueado de esta sala.' };
  }

  const roomDoc = await db.collection('rooms').doc(roomId).get();
  if (!roomDoc.exists) {
    return { canEnter: false, reason: 'not_found', message: 'La sala no existe.' };
  }

  const room = roomDoc.data() as any;

  // Hosts / creators bypass all privacy limits
  if (room.ownerId === userId || (room.hostIds && room.hostIds.includes(userId))) {
    return { canEnter: true };
  }

  // 2. Process Visibility and Access Type checks
  if (room.visibility === 'public') {
    return { canEnter: true };
  }

  if (room.accessType === 'password') {
    if (!password) {
      return { canEnter: false, reason: 'password_required' };
    }
    // Simple validation for MVP. Ideally hashed.
    if (room.passwordHash !== password) {
      return { canEnter: false, reason: 'wrong_password', message: 'Contraseña de sala incorrecta.' };
    }
    return { canEnter: true };
  }

  if (room.accessType === 'approval') {
    // Check if there's an approved request
    const reqSnap = await db.collection('roomAccessRequests')
      .where('roomId', '==', roomId)
      .where('userId', '==', userId)
      .where('status', '==', 'approved')
      .get();

    if (reqSnap.empty) {
      return { canEnter: false, reason: 'approval_required' };
    }
    return { canEnter: true };
  }

  if (room.accessType === 'invite_only') {
    // Check if there's an active invite
    const inviteSnap = await db.collection('roomInvites')
      .where('roomId', '==', roomId)
      .where('invitedUserId', '==', userId)
      .where('status', '==', 'accepted')
      .get();

    if (inviteSnap.empty) {
      return { canEnter: false, reason: 'invite_only' };
    }
    return { canEnter: true };
  }

  return { canEnter: true };
};

// Create a room access request
export const requestRoomAccess = async (userId: string, roomId: string, userName: string, userPhotoURL?: string) => {
  const reqRef = db.collection('roomAccessRequests').doc();
  const requestData = {
    id: reqRef.id,
    roomId,
    userId,
    userName,
    userPhotoURL: userPhotoURL || '',
    status: 'pending',
    requestedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await reqRef.set(requestData);
  return requestData;
};

// Approve access request
export const approveRoomAccess = async (actorId: string, requestId: string) => {
  const reqRef = db.collection('roomAccessRequests').doc(requestId);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) throw new Error('Request not found');

  await reqRef.update({
    status: 'approved',
    reviewedBy: actorId,
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

// Reject access request
export const rejectRoomAccess = async (actorId: string, requestId: string) => {
  const reqRef = db.collection('roomAccessRequests').doc(requestId);
  await reqRef.update({
    status: 'rejected',
    reviewedBy: actorId,
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

// Invite user to room
export const inviteUserToRoom = async (actorId: string, roomId: string, invitedUserId: string) => {
  const inviteRef = db.collection('roomInvites').doc();
  const inviteData = {
    id: inviteRef.id,
    roomId,
    invitedUserId,
    invitedBy: actorId,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await inviteRef.set(inviteData);
  return inviteData;
};

// Accept room invite
export const acceptRoomInvite = async (inviteId: string) => {
  const inviteRef = db.collection('roomInvites').doc(inviteId);
  await inviteRef.update({
    status: 'accepted',
  });
};

// Reject room invite
export const rejectRoomInvite = async (inviteId: string) => {
  const inviteRef = db.collection('roomInvites').doc(inviteId);
  await inviteRef.update({
    status: 'rejected',
  });
};

// Kick a user out of the room members collection
export const kickUserFromRoom = async (actorId: string, roomId: string, targetUserId: string, reason?: string) => {
  // For safety, log as a short duration ban (type kick)
  const banRef = db.collection('roomBans').doc();
  await banRef.set({
    id: banRef.id,
    roomId,
    userId: targetUserId,
    bannedBy: actorId,
    reason: reason || 'Expulsado de la sala',
    type: 'kick',
    isPermanent: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Delete from members subcollection
  await db.collection('rooms').doc(roomId).collection('members').doc(targetUserId).delete();
};

// Ban user permanently or temporarily
export const banUserFromRoom = async (
  actorId: string,
  roomId: string,
  targetUserId: string,
  isPermanent: boolean,
  durationMinutes?: number,
  reason?: string
) => {
  const banRef = db.collection('roomBans').doc();
  let expiresAt = null;
  if (!isPermanent && durationMinutes) {
    const expiresDate = new Date();
    expiresDate.setMinutes(expiresDate.getMinutes() + durationMinutes);
    expiresAt = admin.firestore.Timestamp.fromDate(expiresDate);
  }

  await banRef.set({
    id: banRef.id,
    roomId,
    userId: targetUserId,
    bannedBy: actorId,
    reason: reason || 'Bloqueado de la sala',
    type: 'ban',
    expiresAt,
    isPermanent,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Delete from members subcollection to immediately boot them out
  await db.collection('rooms').doc(roomId).collection('members').doc(targetUserId).delete();
};

// Unban user
export const unbanUserFromRoom = async (roomId: string, targetUserId: string) => {
  const bansSnap = await db.collection('roomBans')
    .where('roomId', '==', roomId)
    .where('userId', '==', targetUserId)
    .get();

  const batch = db.batch();
  bansSnap.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
};
