import firestore from '@react-native-firebase/firestore';
import { GameInvite, GameSession, GamePlayer } from '../../../types/game';
import { FirestoreCollections, getGameSessionPlayersPath } from '../../../constants/firestoreCollections';
import { joinGameSession } from './gameSessionsService';
import { createNotification } from './notificationsService';

const db = firestore;

/**
 * Creates a game invite from one user to another.
 * Prevents self-invitation and inviting users who are already in the session.
 */
export const createGameInvite = async (
  session: GameSession,
  fromUserProfile: { uid: string; displayName: string; photoURL?: string },
  toUserProfile: { uid: string; displayName: string; photoURL?: string },
  message?: string,
): Promise<string> => {
  if (fromUserProfile.uid === toUserProfile.uid) {
    throw new Error('No puedes invitarte a ti mismo.');
  }

  // Check if player is already in the session
  const playerSnap = await db()
    .collection(getGameSessionPlayersPath(session.id))
    .doc(toUserProfile.uid)
    .get();

  if (playerSnap.exists()) {
    throw new Error('El usuario ya está en esta partida.');
  }

  const inviteRef = db().collection(FirestoreCollections.GAME_INVITES).doc();
  const now = firestore.FieldValue.serverTimestamp();
  const expiresAt = firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes

  const inviteData: Omit<GameInvite, 'id'> = {
    sessionId: session.id,
    gameId: session.gameId,
    gameTitle: session.gameSlug.toUpperCase(), // fallback or game title
    fromUserId: fromUserProfile.uid,
    fromDisplayName: fromUserProfile.displayName,
    fromPhotoURL: fromUserProfile.photoURL,
    toUserId: toUserProfile.uid,
    toDisplayName: toUserProfile.displayName,
    status: 'pending',
    message: message || '',
    expiresAt,
    createdAt: now,
    updatedAt: now,
  };

  await inviteRef.set(inviteData);

  // Also add to the session's invitedUserIds if not already there
  const updatedInvitedUserIds = [...(session.invitedUserIds || [])];
  if (!updatedInvitedUserIds.includes(toUserProfile.uid)) {
    updatedInvitedUserIds.push(toUserProfile.uid);
    await db()
      .collection(FirestoreCollections.GAME_SESSIONS)
      .doc(session.id)
      .update({ invitedUserIds: updatedInvitedUserIds });
  }

  // Send in-app notification
  try {
    await createNotification(toUserProfile.uid, {
      type: 'game_invite',
      title: 'Invitación a jugar',
      body: `${fromUserProfile.displayName} te ha invitado a jugar a ${session.gameSlug.toUpperCase()}`,
      data: {
        sessionId: session.id,
        inviteId: inviteRef.id,
        gameSlug: session.gameSlug,
      },
    });
  } catch (error) {
    console.error('Failed to create game invite notification:', error);
  }

  return inviteRef.id;
};

/**
 * Gets all pending game invites for the current user.
 */
export const getMyPendingGameInvites = async (userId: string): Promise<GameInvite[]> => {
  const now = new Date();
  const snapshot = await db()
    .collection(FirestoreCollections.GAME_INVITES)
    .where('toUserId', '==', userId)
    .where('status', '==', 'pending')
    .where('expiresAt', '>', firestore.Timestamp.fromDate(now))
    .orderBy('expiresAt', 'asc')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameInvite));
};

/**
 * Listens to active pending game invites in real-time.
 */
export const listenToMyPendingGameInvites = (
  userId: string,
  onUpdate: (invites: GameInvite[]) => void,
  onError?: (error: Error) => void,
) => {
  const now = new Date();
  return db()
    .collection(FirestoreCollections.GAME_INVITES)
    .where('toUserId', '==', userId)
    .where('status', '==', 'pending')
    .where('expiresAt', '>', firestore.Timestamp.fromDate(now))
    .onSnapshot(
      snapshot => {
        const invites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameInvite));
        onUpdate(invites);
      },
      err => onError?.(err),
    );
};

/**
 * Accepts a game invite, updates status to 'accepted', and joins the game session.
 */
export const acceptGameInvite = async (
  inviteId: string,
  userProfile: { uid: string; displayName?: string; photoURL?: string },
): Promise<string> => {
  const inviteDoc = await db().collection(FirestoreCollections.GAME_INVITES).doc(inviteId).get();
  if (!inviteDoc.exists()) {
    throw new Error('La invitación no existe.');
  }

  const invite = { id: inviteDoc.id, ...inviteDoc.data() } as GameInvite;
  
  if (invite.status !== 'pending') {
    throw new Error(`Esta invitación ya no está pendiente (estado: ${invite.status})`);
  }

  // Check if expired
  const nowMillis = Date.now();
  const expiresMillis = invite.expiresAt?.toMillis ? invite.expiresAt.toMillis() : new Date(invite.expiresAt).getTime();
  if (expiresMillis < nowMillis) {
    // Update to expired
    await db().collection(FirestoreCollections.GAME_INVITES).doc(inviteId).update({
      status: 'expired',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    throw new Error('La invitación ha expirado.');
  }

  // Fetch target session
  const sessionDoc = await db()
    .collection(FirestoreCollections.GAME_SESSIONS)
    .doc(invite.sessionId)
    .get();

  if (!sessionDoc.exists()) {
    throw new Error('La partida asociada a esta invitación ya no existe.');
  }

  const session = { id: sessionDoc.id, ...sessionDoc.data() } as GameSession;
  if (session.status !== 'waiting') {
    throw new Error('La partida ya ha comenzado o se ha cancelado.');
  }

  if (session.playerCount >= session.maxPlayers) {
    throw new Error('La partida está llena.');
  }

  const now = firestore.FieldValue.serverTimestamp();

  // Accept invite
  await db().collection(FirestoreCollections.GAME_INVITES).doc(inviteId).update({
    status: 'accepted',
    respondedAt: now,
    updatedAt: now,
  });

  // Join the session
  await joinGameSession(invite.sessionId, {
    userId: userProfile.uid,
    username: userProfile.displayName || `User_${userProfile.uid.slice(0, 4)}`,
    avatarEmoji: '🎮',
    isHost: false,
    isOnline: true,
  });

  return invite.sessionId;
};

/**
 * Declines a game invite.
 */
export const declineGameInvite = async (inviteId: string, userId: string): Promise<void> => {
  const inviteDoc = await db().collection(FirestoreCollections.GAME_INVITES).doc(inviteId).get();
  if (!inviteDoc.exists()) throw new Error('La invitación no existe.');
  
  const invite = inviteDoc.data() as GameInvite;
  if (invite.toUserId !== userId) {
    throw new Error('No tienes permiso para declinar esta invitación.');
  }

  const now = firestore.FieldValue.serverTimestamp();
  await db().collection(FirestoreCollections.GAME_INVITES).doc(inviteId).update({
    status: 'declined',
    respondedAt: now,
    updatedAt: now,
  });
};

/**
 * Cancels a game invite (only allowed by the sender).
 */
export const cancelGameInvite = async (inviteId: string, userId: string): Promise<void> => {
  const inviteDoc = await db().collection(FirestoreCollections.GAME_INVITES).doc(inviteId).get();
  if (!inviteDoc.exists()) throw new Error('La invitación no existe.');
  
  const invite = inviteDoc.data() as GameInvite;
  if (invite.fromUserId !== userId) {
    throw new Error('No tienes permiso para cancelar esta invitación.');
  }

  const now = firestore.FieldValue.serverTimestamp();
  await db().collection(FirestoreCollections.GAME_INVITES).doc(inviteId).update({
    status: 'cancelled',
    updatedAt: now,
  });
};

/**
 * Manually expires invitations that have passed their expiration date.
 */
export const expireOldInvites = async (): Promise<number> => {
  const now = new Date();
  const snapshot = await db()
    .collection(FirestoreCollections.GAME_INVITES)
    .where('status', '==', 'pending')
    .where('expiresAt', '<=', firestore.Timestamp.fromDate(now))
    .limit(100)
    .get();

  if (snapshot.empty) return 0;

  const batch = db().batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      status: 'expired',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
  return snapshot.size;
};
