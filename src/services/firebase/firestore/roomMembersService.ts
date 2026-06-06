import firestore from '@react-native-firebase/firestore';
import { RoomMember } from '../../../types';
import { getRoomMembersPath } from '../../../constants/firestoreCollections';
import { updateRoomCounts } from './roomsService';
import { hasRoomPermission, canManageRole, canPromoteToRole } from '../../../utils/roomPermissions';
import { logRoomModerationAction } from './moderationService';
import {
  sendUserMutedMessage,
  sendUserKickedMessage,
  sendMicApprovedMessage,
} from './roomSystemMessages';

// Internal helper to retrieve roles inside service
const getMemberDirect = async (roomId: string, userId: string): Promise<RoomMember | null> => {
  const doc = await firestore().collection(getRoomMembersPath(roomId)).doc(userId).get();
  return doc.exists() ? (doc.data() as RoomMember) : null;
};

export const getRoomMembers = async (roomId: string): Promise<RoomMember[]> => {
  const snap = await firestore()
    .collection(getRoomMembersPath(roomId))
    .orderBy('joinedAt', 'asc')
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoomMember));
};

export const listenToMembers = (roomId: string, callback: (members: RoomMember[]) => void) => {
  return firestore()
    .collection(getRoomMembersPath(roomId))
    .orderBy('joinedAt', 'asc')
    .onSnapshot(snap => {
      if (snap) {
        callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoomMember)));
      }
    });
};

export const updateMemberRole = async (
  roomId: string,
  targetUserId: string,
  newRole: RoomMember['role'],
  actorUserId: string
): Promise<void> => {
  const db = firestore();
  const actor = await getMemberDirect(roomId, actorUserId);
  const target = await getMemberDirect(roomId, targetUserId);

  if (!actor) throw new Error('Actor no encontrado en la sala.');
  if (!target) throw new Error('Usuario objetivo no encontrado en la sala.');

  // Validate Permissions
  if (!canPromoteToRole(actor.role, newRole) || !canManageRole(actor.role, target.role)) {
    throw new Error('No tienes permiso para cambiar el rol de este miembro.');
  }

  const memberRef = db.collection(getRoomMembersPath(roomId)).doc(targetUserId);

  await db.runTransaction(async transaction => {
    const data: Partial<RoomMember> = {
      role: newRole,
      promotedBy: actorUserId,
      promotedAt: firestore.FieldValue.serverTimestamp(),
      lastActiveAt: firestore.FieldValue.serverTimestamp(),
    };

    if (newRole === 'listener') {
      data.seatIndex = firestore.FieldValue.delete() as any;
    }

    transaction.update(memberRef, data);
  });

  // Log action
  let action: any = 'promote_speaker';
  if (newRole === 'host') action = 'promote_host';
  else if (newRole === 'moderator') action = 'promote_moderator';
  else if (newRole === 'listener' && target.role === 'host') action = 'remove_host';
  else if (newRole === 'listener' && target.role === 'moderator') action = 'remove_moderator';

  await logRoomModerationAction(roomId, {
    moderatorId: actorUserId,
    action,
    targetUserId,
    targetRoleBefore: target.role,
    targetRoleAfter: newRole,
  });

  await updateRoomCounts(roomId);
};

export const promoteToHost = async (roomId: string, targetUserId: string, actorUserId: string): Promise<void> => {
  const roomRef = firestore().collection('rooms').doc(roomId);
  
  await firestore().runTransaction(async transaction => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;
    const roomData = roomSnap.data();
    const hostIds: string[] = roomData?.hostIds || [];
    
    if (!hostIds.includes(targetUserId)) {
      transaction.update(roomRef, {
        hostIds: [...hostIds, targetUserId],
      });
    }
  });

  await updateMemberRole(roomId, targetUserId, 'host', actorUserId);
};

export const removeHost = async (roomId: string, targetUserId: string, actorUserId: string): Promise<void> => {
  const roomRef = firestore().collection('rooms').doc(roomId);
  
  await firestore().runTransaction(async transaction => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;
    const roomData = roomSnap.data();
    const hostIds: string[] = roomData?.hostIds || [];
    
    transaction.update(roomRef, {
      hostIds: hostIds.filter(id => id !== targetUserId),
    });
  });

  await updateMemberRole(roomId, targetUserId, 'listener', actorUserId);
};

export const promoteToModerator = async (roomId: string, targetUserId: string, actorUserId: string): Promise<void> => {
  const roomRef = firestore().collection('rooms').doc(roomId);
  
  await firestore().runTransaction(async transaction => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;
    const roomData = roomSnap.data();
    const moderatorIds: string[] = roomData?.moderatorIds || [];
    
    if (!moderatorIds.includes(targetUserId)) {
      transaction.update(roomRef, {
        moderatorIds: [...moderatorIds, targetUserId],
      });
    }
  });

  await updateMemberRole(roomId, targetUserId, 'moderator', actorUserId);
};

export const removeModerator = async (roomId: string, targetUserId: string, actorUserId: string): Promise<void> => {
  const roomRef = firestore().collection('rooms').doc(roomId);
  
  await firestore().runTransaction(async transaction => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;
    const roomData = roomSnap.data();
    const moderatorIds: string[] = roomData?.moderatorIds || [];
    
    transaction.update(roomRef, {
      moderatorIds: moderatorIds.filter(id => id !== targetUserId),
    });
  });

  await updateMemberRole(roomId, targetUserId, 'listener', actorUserId);
};

export const assignSeat = async (
  roomId: string,
  targetUserId: string,
  seatIndex: number
): Promise<void> => {
  const db = firestore();
  const memberRef = db.collection(getRoomMembersPath(roomId)).doc(targetUserId);
  const target = await getMemberDirect(roomId, targetUserId);
  if (!target) throw new Error('Miembro no encontrado.');

  await db.runTransaction(async transaction => {
    transaction.update(memberRef, {
      seatIndex,
      role: target.role === 'listener' ? 'speaker' : target.role,
      isMuted: false,
      lastActiveAt: firestore.FieldValue.serverTimestamp(),
    });
  });

  await updateRoomCounts(roomId);
};

export const promoteToSpeaker = async (
  roomId: string,
  targetUserId: string,
  actorUserId: string,
  seatIndex?: number
): Promise<void> => {
  const actor = await getMemberDirect(roomId, actorUserId);
  const target = await getMemberDirect(roomId, targetUserId);

  if (!actor) throw new Error('Actor no encontrado en la sala.');
  if (!target) throw new Error('Miembro no encontrado en la sala.');

  if (!hasRoomPermission(actor.role, 'ASSIGN_SPEAKER') || !canManageRole(actor.role, target.role)) {
    throw new Error('No tienes permiso para asignar oradores.');
  }

  let finalSeat = seatIndex;
  if (finalSeat === undefined) {
    const db = firestore();
    const membersSnap = await db.collection(getRoomMembersPath(roomId)).get();
    const occupiedSeats = membersSnap.docs
      .map(d => d.data() as RoomMember)
      .filter(m => m.seatIndex !== undefined)
      .map(m => m.seatIndex!);

    const vacantSeat = [0, 1, 2, 3, 4, 5, 6, 7].find(idx => !occupiedSeats.includes(idx));
    if (vacantSeat === undefined) {
      throw new Error('No hay micrófonos libres.');
    }
    finalSeat = vacantSeat;
  }

  await assignSeat(roomId, targetUserId, finalSeat);

  // Update promotedBy / promotedAt fields
  await firestore()
    .collection(getRoomMembersPath(roomId))
    .doc(targetUserId)
    .update({
      promotedBy: actorUserId,
      promotedAt: firestore.FieldValue.serverTimestamp(),
    });

  await sendMicApprovedMessage(roomId, target.displayName);

  await logRoomModerationAction(roomId, {
    moderatorId: actorUserId,
    action: 'promote_speaker',
    targetUserId,
    metadata: { seatIndex: finalSeat },
  });
};

export const removeSpeaker = async (roomId: string, targetUserId: string, actorUserId: string): Promise<void> => {
  const actor = await getMemberDirect(roomId, actorUserId);
  const target = await getMemberDirect(roomId, targetUserId);

  if (!actor) throw new Error('Actor no encontrado.');
  if (!target) throw new Error('Miembro no encontrado.');

  const isSelf = targetUserId === actorUserId;
  if (!isSelf && (!hasRoomPermission(actor.role, 'REMOVE_SPEAKER') || !canManageRole(actor.role, target.role))) {
    throw new Error('No tienes permiso para remover oradores.');
  }

  const db = firestore();
  const memberRef = db.collection(getRoomMembersPath(roomId)).doc(targetUserId);

  await db.runTransaction(async transaction => {
    const nextRole = ['owner', 'host', 'moderator'].includes(target.role) ? target.role : 'listener';
    transaction.update(memberRef, {
      seatIndex: firestore.FieldValue.delete(),
      role: nextRole,
      isMuted: true,
      lastActiveAt: firestore.FieldValue.serverTimestamp(),
    });
  });

  await logRoomModerationAction(roomId, {
    moderatorId: actorUserId,
    action: 'remove_speaker',
    targetUserId,
  });

  await updateRoomCounts(roomId);
};

export const muteMember = async (
  roomId: string,
  targetUserId: string,
  actorUserId: string,
  muted: boolean
): Promise<void> => {
  const actor = await getMemberDirect(roomId, actorUserId);
  const target = await getMemberDirect(roomId, targetUserId);

  if (!actor) throw new Error('Actor no encontrado.');
  if (!target) throw new Error('Miembro no encontrado.');

  if (!hasRoomPermission(actor.role, 'MUTE_MEMBER') || !canManageRole(actor.role, target.role)) {
    throw new Error('No tienes permiso para silenciar a este miembro.');
  }

  await firestore()
    .collection(getRoomMembersPath(roomId))
    .doc(targetUserId)
    .update({
      isMuted: muted,
      mutedBy: actorUserId,
      mutedAt: firestore.FieldValue.serverTimestamp(),
      lastActiveAt: firestore.FieldValue.serverTimestamp(),
    });

  if (muted) {
    await sendUserMutedMessage(roomId, target.displayName);
  }

  await logRoomModerationAction(roomId, {
    moderatorId: actorUserId,
    action: muted ? 'mute_member' : 'unmute_member',
    targetUserId,
  });
};

export const kickMember = async (roomId: string, targetUserId: string, actorUserId: string): Promise<void> => {
  const actor = await getMemberDirect(roomId, actorUserId);
  const target = await getMemberDirect(roomId, targetUserId);

  if (!actor) throw new Error('Actor no encontrado.');
  if (!target) throw new Error('Miembro no encontrado.');

  if (!hasRoomPermission(actor.role, 'KICK_MEMBER') || !canManageRole(actor.role, target.role)) {
    throw new Error('No tienes permiso para expulsar a este miembro.');
  }

  const db = firestore();
  const memberRef = db.collection(getRoomMembersPath(roomId)).doc(targetUserId);

  await db.runTransaction(async transaction => {
    transaction.update(memberRef, {
      role: 'listener',
      seatIndex: firestore.FieldValue.delete(),
      isKicked: true,
      kickedBy: actorUserId,
      kickedAt: firestore.FieldValue.serverTimestamp(),
    });
  });

  await sendUserKickedMessage(roomId, target.displayName);

  await logRoomModerationAction(roomId, {
    moderatorId: actorUserId,
    action: 'kick_member',
    targetUserId,
  });

  await updateRoomCounts(roomId);
};

export const getCurrentUserRoomRole = async (roomId: string, userId: string): Promise<RoomMember['role'] | null> => {
  const doc = await firestore().collection(getRoomMembersPath(roomId)).doc(userId).get();
  if (doc.exists()) {
    return (doc.data() as RoomMember).role;
  }
  return null;
};

export const removeFromSeat = removeSpeaker;

