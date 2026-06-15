import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

const GAME_SESSIONS = 'gameSessions';
const GAME_INVITES = 'gameInvites';
const NOTIFICATIONS = 'notifications';
const USERS = 'users';

interface QuickMatchOptions {
  totalRounds?: number;
  region?: string;
  language?: string;
  skillLevel?: 'any' | 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Searches for a public waiting session and joins it.
 * If none exists, creates a new public session and joins it as host.
 */
export const quickMatchBackend = async (
  gameId: string,
  gameSlug: string,
  userProfile: { uid: string; displayName: string; photoURL?: string },
  options?: QuickMatchOptions
): Promise<string> => {
  const sessionsRef = db.collection(GAME_SESSIONS);
  const now = admin.firestore.FieldValue.serverTimestamp();

  // 1. Search for public waiting sessions
  let query = sessionsRef
    .where('gameId', '==', gameId)
    .where('status', '==', 'waiting')
    .where('visibility', '==', 'public')
    .where('matchmakingEnabled', '==', true);

  if (options?.region) query = query.where('region', '==', options.region);
  if (options?.language) query = query.where('language', '==', options.language);
  if (options?.skillLevel && options.skillLevel !== 'any') {
    query = query.where('skillLevel', '==', options.skillLevel);
  }

  const snapshot = await query.orderBy('createdAt', 'asc').limit(10).get();

  for (const doc of snapshot.docs) {
    const session = doc.data();
    const sessionId = doc.id;

    if (session.playerCount < session.maxPlayers) {
      // Verify user is not already joined
      const playerSnap = await doc.ref.collection('players').doc(userProfile.uid).get();
      if (!playerSnap.exists) {
        // Join the session
        const batch = db.batch();
        batch.set(doc.ref.collection('players').doc(userProfile.uid), {
          userId: userProfile.uid,
          username: userProfile.displayName || `User_${userProfile.uid.slice(0, 4)}`,
          avatarEmoji: '🎮',
          score: 0,
          roundsWon: 0,
          isReady: false,
          isHost: false,
          isOnline: true,
          joinedAt: now,
        });

        batch.update(doc.ref, {
          playerCount: admin.firestore.FieldValue.increment(1),
          updatedAt: now,
        });

        await batch.commit();
        
        // Track play_game action in background
        const { incrementMissionProgress } = await import('./missionService');
        await incrementMissionProgress(userProfile.uid, 'play_game', 1);

        return sessionId;
      }
    }
  }

  // 2. Create a new public session
  const newSessionRef = sessionsRef.doc();
  const sessionData = {
    gameId,
    gameSlug,
    hostId: userProfile.uid,
    status: 'waiting',
    currentRound: 0,
    totalRounds: options?.totalRounds || 3,
    minPlayers: 2, // Default fallback
    maxPlayers: 4, // Default fallback
    playerCount: 1,
    visibility: 'public',
    invitedUserIds: [],
    region: options?.region || null,
    language: options?.language || null,
    skillLevel: options?.skillLevel || 'any',
    matchmakingEnabled: true,
    gameState: {},
    createdAt: now,
    updatedAt: now,
  };

  const batch = db.batch();
  batch.set(newSessionRef, sessionData);
  batch.set(newSessionRef.collection('players').doc(userProfile.uid), {
    userId: userProfile.uid,
    username: userProfile.displayName || `User_${userProfile.uid.slice(0, 4)}`,
    avatarEmoji: '👑',
    score: 0,
    roundsWon: 0,
    isReady: false,
    isHost: true,
    isOnline: true,
    joinedAt: now,
  });

  await batch.commit();
  
  // Track play_game action in background
  const { incrementMissionProgress } = await import('./missionService');
  await incrementMissionProgress(userProfile.uid, 'play_game', 1);

  return newSessionRef.id;
};

/**
 * Creates a game invite from fromUserId to toUserId.
 */
export const inviteUserToSessionBackend = async (
  sessionId: string,
  fromUserId: string,
  toUserId: string,
  message?: string
): Promise<string> => {
  if (fromUserId === toUserId) {
    throw new Error('You cannot invite yourself');
  }

  const sessionRef = db.collection(GAME_SESSIONS).doc(sessionId);
  const sessionSnap = await sessionRef.get();
  
  if (!sessionSnap.exists) {
    throw new Error('Game session does not exist');
  }
  const session = sessionSnap.data()!;

  // Check if player is already in the session
  const playerSnap = await sessionRef.collection('players').doc(toUserId).get();
  if (playerSnap.exists) {
    throw new Error('User is already in this session');
  }

  // Fetch profiles
  const [fromUserSnap, toUserSnap] = await Promise.all([
    db.collection(USERS).doc(fromUserId).get(),
    db.collection(USERS).doc(toUserId).get(),
  ]);

  if (!fromUserSnap.exists || !toUserSnap.exists) {
    throw new Error('User profiles not found');
  }

  const fromUser = fromUserSnap.data()!;
  const toUser = toUserSnap.data()!;

  const inviteRef = db.collection(GAME_INVITES).doc();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)); // 10m

  await inviteRef.set({
    sessionId,
    gameId: session.gameId,
    gameTitle: session.gameSlug.toUpperCase(),
    fromUserId,
    fromDisplayName: fromUser.displayName || fromUser.username || 'Usuario',
    fromPhotoURL: fromUser.photoURL || null,
    toUserId,
    toDisplayName: toUser.displayName || toUser.username || 'Invitado',
    status: 'pending',
    message: message || '',
    expiresAt,
    createdAt: now,
    updatedAt: now,
  });

  // Update session invited list
  await sessionRef.update({
    invitedUserIds: admin.firestore.FieldValue.arrayUnion(toUserId),
    updatedAt: now,
  });

  // Create notification
  await db.collection(NOTIFICATIONS).add({
    userId: toUserId,
    type: 'game_invite',
    title: 'Invitación a jugar',
    body: `${fromUser.displayName || 'Alguien'} te ha invitado a jugar a ${session.gameSlug.toUpperCase()}`,
    isRead: false,
    data: {
      sessionId,
      inviteId: inviteRef.id,
      gameSlug: session.gameSlug,
    },
    createdAt: now,
  });

  // Increment missions progress safely in the background
  const { incrementMissionProgress } = await import('./missionService');
  await incrementMissionProgress(fromUserId, 'invite_friend', 1);

  return inviteRef.id;
};

/**
 * Accepts a game invite and registers user in the players subcollection.
 */
export const acceptGameInviteBackend = async (
  inviteId: string,
  userId: string
): Promise<string> => {
  const inviteRef = db.collection(GAME_INVITES).doc(inviteId);
  const inviteSnap = await inviteRef.get();
  
  if (!inviteSnap.exists) {
    throw new Error('Invite not found');
  }

  const invite = inviteSnap.data()!;
  if (invite.toUserId !== userId) {
    throw new Error('This invite was not sent to you');
  }

  if (invite.status !== 'pending') {
    throw new Error(`Invite is already ${invite.status}`);
  }

  // Check expiration
  if (invite.expiresAt.toMillis() < Date.now()) {
    await inviteRef.update({ status: 'expired', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    throw new Error('Invite has expired');
  }

  const sessionRef = db.collection(GAME_SESSIONS).doc(invite.sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    throw new Error('Session no longer exists');
  }

  const session = sessionSnap.data()!;
  if (session.status !== 'waiting') {
    throw new Error('Game session has already started or been cancelled');
  }

  if (session.playerCount >= session.maxPlayers) {
    throw new Error('Game session is full');
  }

  const userSnap = await db.collection(USERS).doc(userId).get();
  if (!userSnap.exists) {
    throw new Error('User profile not found');
  }
  const user = userSnap.data()!;

  const now = admin.firestore.FieldValue.serverTimestamp();

  const batch = db.batch();
  batch.update(inviteRef, {
    status: 'accepted',
    respondedAt: now,
    updatedAt: now,
  });

  batch.set(sessionRef.collection('players').doc(userId), {
    userId,
    username: user.displayName || user.username || `User_${userId.slice(0, 4)}`,
    avatarEmoji: '🎮',
    score: 0,
    roundsWon: 0,
    isReady: false,
    isHost: false,
    isOnline: true,
    joinedAt: now,
  });

  batch.update(sessionRef, {
    playerCount: admin.firestore.FieldValue.increment(1),
    updatedAt: now,
  });

  await batch.commit();

  // Track play_game action in background
  const { incrementMissionProgress } = await import('./missionService');
  await incrementMissionProgress(userId, 'play_game', 1);

  return invite.sessionId;
};

/**
 * Declines a game invite.
 */
export const declineGameInviteBackend = async (inviteId: string, userId: string): Promise<void> => {
  const inviteRef = db.collection(GAME_INVITES).doc(inviteId);
  const inviteSnap = await inviteRef.get();

  if (!inviteSnap.exists) {
    throw new Error('Invite not found');
  }

  const invite = inviteSnap.data()!;
  if (invite.toUserId !== userId) {
    throw new Error('Unauthorized');
  }

  await inviteRef.update({
    status: 'declined',
    respondedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

/**
 * Gets all pending game invites for the user.
 */
export const getMyPendingGameInvitesBackend = async (userId: string) => {
  const now = new Date();
  const snapshot = await db.collection(GAME_INVITES)
    .where('toUserId', '==', userId)
    .where('status', '==', 'pending')
    .where('expiresAt', '>', admin.firestore.Timestamp.fromDate(now))
    .orderBy('expiresAt', 'asc')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
