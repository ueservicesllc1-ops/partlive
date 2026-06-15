import firestore from '@react-native-firebase/firestore';
import { MatchmakingRequest, GameSession, GameType } from '../../../types/game';
import { FirestoreCollections, getGameSessionPlayersPath } from '../../../constants/firestoreCollections';
import { createPublicSession, joinGameSession } from './gameSessionsService';

const db = firestore;

/**
 * Searches for an available public game session.
 * Filters: status is 'waiting', visibility is 'public', matchmaking is enabled, and session is not full.
 * Also performs client-side filtering to avoid joining a session where the user is already joined.
 */
export const findAvailablePublicSession = async (
  gameId: string,
  userProfile: { uid: string },
  options?: { region?: string; language?: string; skillLevel?: 'any' | 'beginner' | 'intermediate' | 'advanced' },
): Promise<GameSession | null> => {
  const query = db()
    .collection(FirestoreCollections.GAME_SESSIONS)
    .where('gameId', '==', gameId)
    .where('status', '==', 'waiting')
    .where('visibility', '==', 'public')
    .where('matchmakingEnabled', '==', true);

  // We can filter by region or language if specified
  let finalQuery = query;
  if (options?.region) {
    finalQuery = finalQuery.where('region', '==', options.region);
  }
  if (options?.language) {
    finalQuery = finalQuery.where('language', '==', options.language);
  }
  if (options?.skillLevel && options.skillLevel !== 'any') {
    finalQuery = finalQuery.where('skillLevel', '==', options.skillLevel);
  }

  const snapshot = await finalQuery.orderBy('createdAt', 'asc').limit(10).get();

  for (const doc of snapshot.docs) {
    const session = { id: doc.id, ...doc.data() } as GameSession;
    
    // Client-side filtering for player count limits
    if (session.playerCount < session.maxPlayers) {
      // Check if user is already a player in this session
      const playerSnap = await db()
        .collection(getGameSessionPlayersPath(session.id))
        .doc(userProfile.uid)
        .get();

      if (!playerSnap.exists) {
        return session;
      }
    }
  }

  return null;
};

/**
 * Quick Match: Searches for an available session. If found, joins it.
 * If not found, creates a new public session and joins as host.
 */
export const quickMatch = async (
  game: { id: string; slug: GameType; minPlayers: number; maxPlayers: number },
  userProfile: { uid: string; displayName?: string; photoURL?: string },
  options?: { totalRounds?: number; region?: string; language?: string; skillLevel?: 'any' | 'beginner' | 'intermediate' | 'advanced' },
): Promise<string> => {
  const availableSession = await findAvailablePublicSession(game.id, userProfile, options);
  
  if (availableSession) {
    await joinGameSession(availableSession.id, {
      userId: userProfile.uid,
      username: userProfile.displayName || `User_${userProfile.uid.slice(0, 4)}`,
      avatarEmoji: '🎮',
      isHost: false,
      isOnline: true,
    });
    return availableSession.id;
  }

  // No session found, create a new public session
  const newSession = await createPublicSession(game, userProfile, options);
  
  // Explicitly join the newly created session
  await joinGameSession(newSession.id, {
    userId: userProfile.uid,
    username: userProfile.displayName || `User_${userProfile.uid.slice(0, 4)}`,
    avatarEmoji: '🎮',
    isHost: true,
    isOnline: true,
  });

  return newSession.id;
};

/**
 * Creates a MatchmakingRequest document in Firestore.
 * We use the userId as documentId to prevent duplicate active requests.
 */
export const createMatchmakingRequest = async (
  game: { id: string; slug: GameType },
  userProfile: { uid: string },
  options?: { preferredPlayers?: number; region?: string; language?: string; skillLevel?: 'any' | 'beginner' | 'intermediate' | 'advanced' },
): Promise<string> => {
  const requestId = userProfile.uid;
  const requestRef = db().collection(FirestoreCollections.MATCHMAKING_REQUESTS).doc(requestId);
  const now = firestore.FieldValue.serverTimestamp();
  const expiresAt = firestore.Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)); // 5 minutes

  const requestData: Omit<MatchmakingRequest, 'id'> = {
    userId: userProfile.uid,
    gameId: game.id,
    gameType: game.slug,
    status: 'searching',
    preferredPlayers: options?.preferredPlayers || 2,
    region: options?.region,
    language: options?.language,
    skillLevel: options?.skillLevel || 'any',
    createdAt: now,
    updatedAt: now,
    expiresAt,
  };

  await requestRef.set(requestData);
  return requestId;
};

/**
 * Cancels a matchmaking request by setting status to 'cancelled'.
 */
export const cancelMatchmakingRequest = async (requestId: string, userId: string): Promise<void> => {
  const requestDoc = await db().collection(FirestoreCollections.MATCHMAKING_REQUESTS).doc(requestId).get();
  if (!requestDoc.exists) return;

  const data = requestDoc.data() as MatchmakingRequest;
  if (data.userId !== userId) {
    throw new Error('No tienes permiso para cancelar esta búsqueda.');
  }

  await db()
    .collection(FirestoreCollections.MATCHMAKING_REQUESTS)
    .doc(requestId)
    .update({
      status: 'cancelled',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
};

/**
 * Subscribes to matchmaking request changes.
 */
export const listenToMatchmakingRequest = (
  requestId: string,
  onUpdate: (request: MatchmakingRequest) => void,
  onError?: (error: Error) => void,
) => {
  return db()
    .collection(FirestoreCollections.MATCHMAKING_REQUESTS)
    .doc(requestId)
    .onSnapshot(
      doc => {
        if (doc.exists()) {
          onUpdate({ id: doc.id, ...doc.data() } as MatchmakingRequest);
        }
      },
      err => onError?.(err),
    );
};

/**
 * Expires matchmaking requests that have passed their expiration date.
 */
export const expireOldMatchmakingRequests = async (): Promise<number> => {
  const now = new Date();
  const snapshot = await db()
    .collection(FirestoreCollections.MATCHMAKING_REQUESTS)
    .where('status', '==', 'searching')
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
