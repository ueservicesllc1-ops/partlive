import firestore from '@react-native-firebase/firestore';
import {
  GameSession,
  GamePlayer,
  GameMove,
  GameSessionStatus,
  GameType,
  GameSessionVisibility,
} from '../../../types/game';
import {
  FirestoreCollections,
  getGameSessionPlayersPath,
  getGameSessionMovesPath,
} from '../../../constants/firestoreCollections';
import { generateInviteCode } from '../../../utils/inviteCode';

const db = firestore;

// ─── Session CRUD ──────────────────────────────────────────────────────────────

export const createGameSession = async (
  gameId: string,
  gameSlug: GameType,
  hostId: string,
  options: {
    minPlayers: number;
    maxPlayers: number;
    totalRounds: number;
    visibility?: GameSessionVisibility;
    inviteCode?: string;
    invitedUserIds?: string[];
    region?: string;
    language?: string;
    skillLevel?: 'any' | 'beginner' | 'intermediate' | 'advanced';
    matchmakingEnabled?: boolean;
    expiresAt?: any;
  },
): Promise<GameSession> => {
  const sessionRef = db().collection(FirestoreCollections.GAME_SESSIONS).doc();
  const now = firestore.FieldValue.serverTimestamp();

  const session: Omit<GameSession, 'id'> = {
    gameId,
    gameSlug,
    hostId,
    status: 'waiting',
    currentRound: 0,
    totalRounds: options.totalRounds,
    minPlayers: options.minPlayers,
    maxPlayers: options.maxPlayers,
    playerCount: 0,
    visibility: options.visibility || 'public',
    inviteCode: options.inviteCode,
    invitedUserIds: options.invitedUserIds || [],
    region: options.region,
    language: options.language,
    skillLevel: options.skillLevel || 'any',
    matchmakingEnabled: options.matchmakingEnabled !== undefined ? options.matchmakingEnabled : true,
    expiresAt: options.expiresAt || null,
    gameState: {},
    createdAt: now,
  };

  await sessionRef.set(session);
  return { id: sessionRef.id, ...session };
};

export const getGameSession = async (sessionId: string): Promise<GameSession | null> => {
  const doc = await db().collection(FirestoreCollections.GAME_SESSIONS).doc(sessionId).get();
  if (!doc.exists()) return null;
  return { id: doc.id, ...doc.data() } as GameSession;
};

export const updateSessionStatus = async (
  sessionId: string,
  status: GameSessionStatus,
  extra?: Record<string, any>,
) => {
  const now = firestore.FieldValue.serverTimestamp();
  const update: Record<string, any> = { status, updatedAt: now, ...extra };
  if (status === 'playing') update.startedAt = now;
  if (status === 'finished' || status === 'cancelled') update.finishedAt = now;
  await db().collection(FirestoreCollections.GAME_SESSIONS).doc(sessionId).update(update);
};

export const updateSessionGameState = async (
  sessionId: string,
  gameState: Record<string, any>,
) => {
  await db().collection(FirestoreCollections.GAME_SESSIONS).doc(sessionId).update({ gameState });
};

// ─── Players ──────────────────────────────────────────────────────────────────

export const joinGameSession = async (
  sessionId: string,
  player: Omit<GamePlayer, 'score' | 'roundsWon' | 'isReady' | 'joinedAt'>,
) => {
  const playerRef = db().collection(getGameSessionPlayersPath(sessionId)).doc(player.userId);

  const playerData: GamePlayer = {
    ...player,
    score: 0,
    roundsWon: 0,
    isReady: false,
    joinedAt: firestore.FieldValue.serverTimestamp(),
  };

  await playerRef.set(playerData);
  await db()
    .collection(FirestoreCollections.GAME_SESSIONS)
    .doc(sessionId)
    .update({ playerCount: firestore.FieldValue.increment(1) });
};

export const leaveGameSession = async (sessionId: string, userId: string) => {
  await db().collection(getGameSessionPlayersPath(sessionId)).doc(userId).delete();
  await db()
    .collection(FirestoreCollections.GAME_SESSIONS)
    .doc(sessionId)
    .update({ playerCount: firestore.FieldValue.increment(-1) });
};

export const setPlayerReady = async (sessionId: string, userId: string, isReady: boolean) => {
  await db()
    .collection(getGameSessionPlayersPath(sessionId))
    .doc(userId)
    .update({ isReady });
};

export const updatePlayerScore = async (
  sessionId: string,
  userId: string,
  scoreIncrement: number,
  roundsWonIncrement = 0,
) => {
  await db()
    .collection(getGameSessionPlayersPath(sessionId))
    .doc(userId)
    .update({
      score: firestore.FieldValue.increment(scoreIncrement),
      roundsWon: firestore.FieldValue.increment(roundsWonIncrement),
    });
};

// ─── Moves ────────────────────────────────────────────────────────────────────

export const submitMove = async (
  sessionId: string,
  userId: string,
  round: number,
  moveType: string,
  payload: Record<string, any>,
): Promise<string> => {
  const moveRef = db().collection(getGameSessionMovesPath(sessionId)).doc();
  const move: Omit<GameMove, 'id'> = {
    sessionId,
    userId,
    round,
    moveType,
    payload,
    createdAt: firestore.FieldValue.serverTimestamp(),
  };
  await moveRef.set(move);
  return moveRef.id;
};

// ─── Listeners ────────────────────────────────────────────────────────────────

export const listenToSession = (
  sessionId: string,
  onUpdate: (session: GameSession) => void,
  onError?: (err: Error) => void,
) => {
  return db()
    .collection(FirestoreCollections.GAME_SESSIONS)
    .doc(sessionId)
    .onSnapshot(
      doc => {
        if (doc.exists()) {
          onUpdate({ id: doc.id, ...doc.data() } as GameSession);
        }
      },
      err => onError?.(err),
    );
};

export const listenToPlayers = (
  sessionId: string,
  onUpdate: (players: GamePlayer[]) => void,
  onError?: (err: Error) => void,
) => {
  return db()
    .collection(getGameSessionPlayersPath(sessionId))
    .onSnapshot(
      snapshot => {
        const players = snapshot.docs.map(doc => doc.data() as GamePlayer);
        onUpdate(players);
      },
      err => onError?.(err),
    );
};

export const listenToMoves = (
  sessionId: string,
  round: number,
  onUpdate: (moves: GameMove[]) => void,
  onError?: (err: Error) => void,
) => {
  return db()
    .collection(getGameSessionMovesPath(sessionId))
    .where('round', '==', round)
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      snapshot => {
        const moves = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameMove));
        onUpdate(moves);
      },
      err => onError?.(err),
    );
};

// ─── Active sessions for a game ───────────────────────────────────────────────

export const getActiveSessionsForGame = async (gameId: string): Promise<GameSession[]> => {
  const snapshot = await db()
    .collection(FirestoreCollections.GAME_SESSIONS)
    .where('gameId', '==', gameId)
    .where('status', 'in', ['waiting', 'ready'])
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameSession));
};

export const createPublicSession = async (
  game: { id: string; slug: GameType; minPlayers: number; maxPlayers: number },
  hostProfile: { uid: string; displayName?: string; photoURL?: string },
  options?: { totalRounds?: number; region?: string; language?: string; skillLevel?: 'any' | 'beginner' | 'intermediate' | 'advanced' },
): Promise<GameSession> => {
  return createGameSession(game.id, game.slug, hostProfile.uid, {
    minPlayers: game.minPlayers,
    maxPlayers: game.maxPlayers,
    totalRounds: options?.totalRounds || 3,
    visibility: 'public',
    matchmakingEnabled: true,
    region: options?.region,
    language: options?.language,
    skillLevel: options?.skillLevel,
  });
};

export const createPrivateSession = async (
  game: { id: string; slug: GameType; minPlayers: number; maxPlayers: number },
  hostProfile: { uid: string; displayName?: string; photoURL?: string },
  options?: { totalRounds?: number; region?: string; language?: string; skillLevel?: 'any' | 'beginner' | 'intermediate' | 'advanced' },
): Promise<GameSession> => {
  const code = generateInviteCode(6);
  return createGameSession(game.id, game.slug, hostProfile.uid, {
    minPlayers: game.minPlayers,
    maxPlayers: game.maxPlayers,
    totalRounds: options?.totalRounds || 3,
    visibility: 'private',
    matchmakingEnabled: false,
    inviteCode: code,
    region: options?.region,
    language: options?.language,
    skillLevel: options?.skillLevel,
  });
};

export const getPublicWaitingSessions = async (
  gameId: string,
  limitCount = 20,
): Promise<GameSession[]> => {
  const snapshot = await db()
    .collection(FirestoreCollections.GAME_SESSIONS)
    .where('gameId', '==', gameId)
    .where('status', '==', 'waiting')
    .where('visibility', '==', 'public')
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameSession));
};

export const getMyActiveGameSessions = async (userId: string): Promise<GameSession[]> => {
  try {
    const playersSnap = await db()
      .collectionGroup('players')
      .where('userId', '==', userId)
      .get();
    
    const sessionIds = playersSnap.docs.map(doc => doc.ref.parent.parent?.id).filter(Boolean) as string[];
    
    if (sessionIds.length === 0) return [];
    
    const sessions: GameSession[] = [];
    const targetIds = sessionIds.slice(0, 10);
    const sessionsSnap = await db()
      .collection(FirestoreCollections.GAME_SESSIONS)
      .where(firestore.FieldPath.documentId(), 'in', targetIds)
      .get();
      
    for (const doc of sessionsSnap.docs) {
      const data = doc.data();
      if (data && ['waiting', 'ready', 'playing'].includes(data.status)) {
        sessions.push({ ...data, id: doc.id } as GameSession);
      }
    }
    return sessions;
  } catch (error) {
    console.error('Error getting active game sessions, falling back:', error);
    const snapshot = await db()
      .collection(FirestoreCollections.GAME_SESSIONS)
      .where('hostId', '==', userId)
      .where('status', 'in', ['waiting', 'ready', 'playing'])
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameSession));
  }
};

export const joinSessionByInviteCode = async (
  inviteCode: string,
  userProfile: { uid: string; displayName?: string; photoURL?: string },
): Promise<string> => {
  const normalized = inviteCode.trim().toUpperCase();
  const snapshot = await db()
    .collection(FirestoreCollections.GAME_SESSIONS)
    .where('inviteCode', '==', normalized)
    .where('status', '==', 'waiting')
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error('Código de invitación inválido o la partida ya comenzó.');
  }

  const sessionDoc = snapshot.docs[0];
  const session = { id: sessionDoc.id, ...sessionDoc.data() } as GameSession;

  if (session.playerCount >= session.maxPlayers) {
    throw new Error('La partida está llena.');
  }

  await joinGameSession(session.id, {
    userId: userProfile.uid,
    username: userProfile.displayName || `User_${userProfile.uid.slice(0, 4)}`,
    avatarEmoji: '🎮',
    isHost: session.hostId === userProfile.uid,
    isOnline: true,
  });

  return session.id;
};

export const updateSessionVisibility = async (
  sessionId: string,
  visibility: GameSessionVisibility,
  actorUserId: string,
) => {
  const session = await getGameSession(sessionId);
  if (!session) throw new Error('Sesión no encontrada.');
  if (session.hostId !== actorUserId) {
    throw new Error('Solo el anfitrión puede cambiar la visibilidad de la sesión.');
  }

  await db()
    .collection(FirestoreCollections.GAME_SESSIONS)
    .doc(sessionId)
    .update({
      visibility,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
};
